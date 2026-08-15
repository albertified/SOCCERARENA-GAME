import express from 'express';
import http from 'http';
import path from 'path';
import { Server, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { PhysicsEngine } from './src/physics/engine';
import { STADIUMS } from './src/physics/stadiums';
import {
  ChatMessage,
  GameSnapshot,
  PlayerInput,
  PlayerState,
  RoomInfo,
  RoomSettings,
  Team,
} from './src/types/haxball';

const PORT = Number(process.env.PORT) || 3000;

interface ServerRoom {
  id: string;
  settings: RoomSettings;
  hostId: string;
  captainId?: string;
  redCaptainId?: string;
  blueCaptainId?: string;
  draftTurnTeam?: Team;
  players: Map<string, PlayerState>;
  physics: PhysicsEngine;
  tick: number;
  score: { red: number; blue: number };
  timeRemaining: number; // in seconds
  gameState: 'LOBBY' | 'COUNTDOWN' | 'PLAYING' | 'GOAL_SCORED' | 'GAME_OVER';
  countdownTimer: number; // in ticks
  goalPauseTimer: number; // in ticks
  scoringTeam?: Team;
  chatHistory: ChatMessage[];
  possession: { redTicks: number; blueTicks: number };
  isLocked: boolean;
  interval?: NodeJS.Timeout;
}

const rooms = new Map<string, ServerRoom>();

function createRoom(id: string, settings: RoomSettings, hostId: string): ServerRoom {
  const stadium = STADIUMS[settings.stadiumId] || STADIUMS.classic;
  const physics = new PhysicsEngine(stadium);

  const room: ServerRoom = {
    id,
    settings,
    hostId,
    players: new Map(),
    physics,
    tick: 0,
    score: { red: 0, blue: 0 },
    timeRemaining: settings.timeLimit * 60,
    gameState: 'LOBBY',
    countdownTimer: 0,
    goalPauseTimer: 0,
    chatHistory: [],
    possession: { redTicks: 0, blueTicks: 0 },
    isLocked: false,
  };

  rooms.set(id, room);
  return room;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  app.use(express.json());

  // API endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', activeRooms: rooms.size });
  });

  // Handle Socket.io connections
  io.on('connection', (socket: Socket) => {
    let currentRoomId: string | null = null;
    let playerName = 'Player ' + Math.floor(100 + Math.random() * 900);
    let playerAvatar = String(Math.floor(Math.random() * 99));

    // Send initial rooms list
    socket.emit('rooms_list', getRoomsList());

    socket.on('set_nickname', (name: string, avatar: string) => {
      if (name && name.trim()) {
        playerName = name.trim().substring(0, 15);
      }
      if (avatar !== undefined) {
        playerAvatar = avatar.toString().substring(0, 3);
      }
    });

    socket.on('get_rooms', () => {
      socket.emit('rooms_list', getRoomsList());
    });

    socket.on('create_room', (settings: RoomSettings) => {
      const roomId = 'room_' + Math.random().toString(36).substring(2, 9);
      const cleanSettings: RoomSettings = {
        name: settings.name ? settings.name.trim().substring(0, 24) : 'Custom Room',
        maxPlayers: Math.min(16, Math.max(2, settings.maxPlayers || 8)),
        scoreLimit: Math.min(10, Math.max(0, settings.scoreLimit || 3)),
        timeLimit: Math.min(15, Math.max(0, settings.timeLimit || 3)),
        stadiumId: STADIUMS[settings.stadiumId] ? settings.stadiumId : 'classic',
        isPublic: settings.isPublic !== false,
        password: settings.password || '',
      };

      const room = createRoom(roomId, cleanSettings, socket.id);
      joinRoomInternal(socket, room, playerName, playerAvatar);
      io.emit('rooms_list', getRoomsList());
    });

    socket.on('join_room', ({ roomId, password }: { roomId: string; password?: string }) => {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error_msg', 'Room not found.');
        return;
      }

      if (room.settings.password && room.settings.password !== password) {
        socket.emit('error_msg', 'Incorrect room password.');
        return;
      }

      if (room.players.size >= room.settings.maxPlayers) {
        socket.emit('error_msg', 'Room is full.');
        return;
      }

      joinRoomInternal(socket, room, playerName, playerAvatar);
      io.emit('rooms_list', getRoomsList());
    });

    socket.on('change_team', (team: Team) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      if (room.gameState !== 'LOBBY') {
        socket.emit('error_msg', 'Team changes are locked while a match is in progress.');
        return;
      }

      if (room.isLocked && room.hostId !== socket.id) {
        socket.emit('error_msg', 'Teams are locked by the host.');
        return;
      }

      const player = room.players.get(socket.id);
      if (!player) return;

      // Count players in teams
      const redCount = Array.from(room.players.values()).filter((p) => p.team === 'red').length;
      const blueCount = Array.from(room.players.values()).filter((p) => p.team === 'blue').length;

      if (team === 'red' && redCount >= Math.floor(room.settings.maxPlayers / 2)) {
        socket.emit('error_msg', 'Red team is full.');
        return;
      }
      if (team === 'blue' && blueCount >= Math.floor(room.settings.maxPlayers / 2)) {
        socket.emit('error_msg', 'Blue team is full.');
        return;
      }

      player.team = team;
      // Also update in physics engine
      const pDisc = room.physics.players.get(socket.id);
      if (pDisc) {
        pDisc.team = team;
      } else if (team !== 'spec') {
        room.physics.addPlayer(socket.id, player.name, team, player.avatar);
      }

      broadcastRoomState(room);
    });

    socket.on('move_player', ({ targetPlayerId, team }: { targetPlayerId: string; team: Team }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room || room.hostId !== socket.id) return;

      if (room.gameState !== 'LOBBY') {
        socket.emit('error_msg', 'Cannot move players while match is in progress.');
        return;
      }

      const player = room.players.get(targetPlayerId);
      if (!player) return;

      player.team = team;
      const pDisc = room.physics.players.get(targetPlayerId);
      if (pDisc) {
        pDisc.team = team;
      } else if (team !== 'spec') {
        room.physics.addPlayer(targetPlayerId, player.name, team, player.avatar);
      }

      broadcastRoomState(room);
    });

    socket.on('auto_teams', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room || room.hostId !== socket.id) return;

      if (room.gameState !== 'LOBBY') return;

      const allPlayers = Array.from(room.players.values());
      let redCount = 0;
      let blueCount = 0;

      allPlayers.forEach((p) => {
        if (p.team !== 'spec') {
          if (redCount <= blueCount) {
            p.team = 'red';
            redCount++;
          } else {
            p.team = 'blue';
            blueCount++;
          }
          const pDisc = room.physics.players.get(p.id);
          if (pDisc) pDisc.team = p.team;
          else room.physics.addPlayer(p.id, p.name, p.team, p.avatar);
        }
      });

      addSystemChat(room, 'Teams auto-balanced by host.');
      broadcastRoomState(room);
    });

    socket.on('rand_teams', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room || room.hostId !== socket.id) return;

      if (room.gameState !== 'LOBBY') return;

      const activePlayers = Array.from(room.players.values()).filter((p) => p.team !== 'spec');
      // Shuffle active players
      for (let i = activePlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [activePlayers[i], activePlayers[j]] = [activePlayers[j], activePlayers[i]];
      }

      activePlayers.forEach((p, idx) => {
        p.team = idx % 2 === 0 ? 'red' : 'blue';
        const pDisc = room.physics.players.get(p.id);
        if (pDisc) pDisc.team = p.team;
        else room.physics.addPlayer(p.id, p.name, p.team, p.avatar);
      });

      addSystemChat(room, 'Teams randomized by host.');
      broadcastRoomState(room);
    });

    socket.on('lock_teams', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room || room.hostId !== socket.id) return;

      room.isLocked = !room.isLocked;
      addSystemChat(room, `Teams are now ${room.isLocked ? 'LOCKED' : 'UNLOCKED'}.`);
      broadcastRoomState(room);
    });

    socket.on('reset_teams', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room || room.hostId !== socket.id) return;

      if (room.gameState !== 'LOBBY') return;

      room.players.forEach((p) => {
        p.team = 'spec';
        room.physics.removePlayer(p.id);
      });

      addSystemChat(room, 'All players moved to Spectators.');
      broadcastRoomState(room);
    });

    socket.on('equalize_teams', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room || room.gameState !== 'LOBBY') return;

      let redList = Array.from(room.players.values()).filter((p) => p.team === 'red');
      let blueList = Array.from(room.players.values()).filter((p) => p.team === 'blue');
      let specList = Array.from(room.players.values()).filter((p) => p.team === 'spec');

      if (specList.length === 0 && redList.length === blueList.length) return;

      specList.sort(() => Math.random() - 0.5);

      while (specList.length > 0) {
        if (redList.length < blueList.length) {
          const p = specList.pop()!;
          p.team = 'red';
          room.physics.addPlayer(p.id, p.name, 'red', p.avatar);
          redList.push(p);
        } else if (blueList.length < redList.length) {
          const p = specList.pop()!;
          p.team = 'blue';
          room.physics.addPlayer(p.id, p.name, 'blue', p.avatar);
          blueList.push(p);
        } else if (specList.length >= 2) {
          const p1 = specList.pop()!;
          p1.team = 'red';
          room.physics.addPlayer(p1.id, p1.name, 'red', p1.avatar);
          redList.push(p1);

          const p2 = specList.pop()!;
          p2.team = 'blue';
          room.physics.addPlayer(p2.id, p2.name, 'blue', p2.avatar);
          blueList.push(p2);
        } else {
          break;
        }
      }

      if (redList.length < blueList.length) room.draftTurnTeam = 'red';
      else if (blueList.length < redList.length) room.draftTurnTeam = 'blue';

      addSystemChat(room, `🎲 Teams randomly equalized! (Red: ${redList.length} vs Blue: ${blueList.length})`);
      broadcastRoomState(room);
    });

    socket.on('pick_player', ({ targetPlayerId }: { targetPlayerId: string }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room || room.gameState !== 'LOBBY') return;

      const isHost = socket.id === room.hostId;
      const isRedCap = socket.id === room.redCaptainId;
      const isBlueCap = socket.id === room.blueCaptainId;

      if (!isHost && !isRedCap && !isBlueCap) {
        socket.emit('error_msg', 'Only team captains or the host can draft players.');
        return;
      }

      const turn = room.draftTurnTeam || 'red';

      // Enforce strict turn order for captains
      if (!isHost) {
        if (turn === 'red' && !isRedCap) {
          socket.emit('error_msg', "It's Red Captain's turn to draft!");
          return;
        }
        if (turn === 'blue' && !isBlueCap) {
          socket.emit('error_msg', "It's Blue Captain's turn to draft!");
          return;
        }
      }

      const picker = room.players.get(socket.id);
      const target = room.players.get(targetPlayerId);
      if (!target) return;

      const draftingTeam: Team = isRedCap ? 'red' : isBlueCap ? 'blue' : turn;

      target.team = draftingTeam;
      const pDisc = room.physics.players.get(targetPlayerId);
      if (pDisc) {
        pDisc.team = draftingTeam;
      } else {
        room.physics.addPlayer(target.id, target.name, draftingTeam, target.avatar);
      }

      // Update turn to alternate or give to smaller team
      const redCount = Array.from(room.players.values()).filter((p) => p.team === 'red').length;
      const blueCount = Array.from(room.players.values()).filter((p) => p.team === 'blue').length;

      if (redCount < blueCount) {
        room.draftTurnTeam = 'red';
      } else if (blueCount < redCount) {
        room.draftTurnTeam = 'blue';
      } else {
        room.draftTurnTeam = draftingTeam === 'red' ? 'blue' : 'red';
      }

      room.captainId = room.draftTurnTeam === 'red' ? room.redCaptainId : room.blueCaptainId;

      const pickerName = picker ? picker.name : 'Host';
      addSystemChat(
        room,
        `👑 ${pickerName} drafted ${target.name} to ${draftingTeam.toUpperCase()} team! Next turn: ${room.draftTurnTeam.toUpperCase()} Captain.`
      );
      broadcastRoomState(room);
    });

    socket.on('player_input', (input: PlayerInput) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const didKick = room.physics.applyPlayerInput(socket.id, input);
      if (didKick) {
        io.to(room.id).emit('sound_event', 'kick');
      }
    });

    socket.on('start_match', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      if (room.hostId !== socket.id) {
        socket.emit('error_msg', 'Only the room host can start the match.');
        return;
      }

      startMatch(room);
    });

    socket.on('reset_match', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      if (room.hostId !== socket.id) {
        socket.emit('error_msg', 'Only the room host can stop/reset the match.');
        return;
      }

      stopMatch(room);
    });

    socket.on('change_settings', (newSettings: Partial<RoomSettings>) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room || (room.hostId !== socket.id && room.hostId !== 'system')) return;

      if (newSettings.stadiumId && STADIUMS[newSettings.stadiumId]) {
        room.settings.stadiumId = newSettings.stadiumId;
        room.physics.setStadium(STADIUMS[newSettings.stadiumId]);
      }
      if (newSettings.scoreLimit !== undefined) {
        room.settings.scoreLimit = Math.max(0, newSettings.scoreLimit);
      }
      if (newSettings.timeLimit !== undefined) {
        room.settings.timeLimit = Math.max(0, newSettings.timeLimit);
        room.timeRemaining = room.settings.timeLimit * 60;
      }

      addSystemChat(room, `Room settings updated by host.`);
      broadcastRoomState(room);
      io.emit('rooms_list', getRoomsList());
    });

    socket.on('send_chat', (text: string) => {
      if (!currentRoomId || !text || !text.trim()) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const player = room.players.get(socket.id);
      const cleanText = text.trim().substring(0, 100);

      const msg: ChatMessage = {
        id: 'msg_' + Math.random().toString(36).substring(2, 9),
        senderId: socket.id,
        senderName: player ? player.name : 'Unknown',
        senderTeam: player ? player.team : 'spec',
        text: cleanText,
        timestamp: Date.now(),
      };

      room.chatHistory.push(msg);
      if (room.chatHistory.length > 50) room.chatHistory.shift();

      io.to(room.id).emit('chat_message', msg);
    });

    socket.on('ping_check', (clientTimestamp: number) => {
      socket.emit('pong_check', clientTimestamp);
    });

    socket.on('leave_room', () => {
      leaveCurrentRoom(socket);
      io.emit('rooms_list', getRoomsList());
    });

    socket.on('disconnect', () => {
      leaveCurrentRoom(socket);
      io.emit('rooms_list', getRoomsList());
    });

    function joinRoomInternal(
      socket: Socket,
      room: ServerRoom,
      name: string,
      avatar: string
    ) {
      if (currentRoomId) {
        leaveCurrentRoom(socket);
      }

      currentRoomId = room.id;
      socket.join(room.id);

      // Determine initial team: auto-assign to balance red/blue or spec
      const redCount = Array.from(room.players.values()).filter((p) => p.team === 'red').length;
      const blueCount = Array.from(room.players.values()).filter((p) => p.team === 'blue').length;

      let initialTeam: Team = 'spec';
      if (redCount <= blueCount && redCount < Math.floor(room.settings.maxPlayers / 2)) {
        initialTeam = 'red';
      } else if (blueCount < Math.floor(room.settings.maxPlayers / 2)) {
        initialTeam = 'blue';
      }

      const isHost = room.players.size === 0 || room.hostId === socket.id;
      if (isHost) room.hostId = socket.id;

      const playerState: PlayerState = {
        id: socket.id,
        name,
        team: initialTeam,
        isHost,
        avatar,
        ping: 20,
        stats: { goals: 0, assists: 0, shots: 0, touches: 0 },
      };

      room.players.set(socket.id, playerState);
      room.physics.addPlayer(socket.id, name, initialTeam, avatar);

      // Start game loop if not already running
      ensureGameLoop(room);

      addSystemChat(room, `${name} joined the room.`);
      socket.emit('joined_room', {
        roomId: room.id,
        settings: room.settings,
        hostId: room.hostId,
        stadium: room.physics.stadium,
      });

      broadcastRoomState(room);
    }

    function leaveCurrentRoom(socket: Socket) {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (room) {
        const player = room.players.get(socket.id);
        const playerName = player ? player.name : 'A player';

        if (room.hostId === socket.id) {
          // Host left -> Close lobby entirely for everyone in this room
          io.to(room.id).emit('room_closed', `The room host (${playerName}) left. The lobby has been closed.`);
          if (room.interval) clearInterval(room.interval);
          rooms.delete(room.id);
        } else {
          room.players.delete(socket.id);
          room.physics.removePlayer(socket.id);
          socket.leave(room.id);

          addSystemChat(room, `${playerName} left the room.`);

          // Clean up empty room
          if (room.players.size === 0) {
            if (room.interval) clearInterval(room.interval);
            rooms.delete(room.id);
          } else {
            broadcastRoomState(room);
          }
        }
      }
      currentRoomId = null;
    }
  });

  function getRoomsList(): RoomInfo[] {
    const list: RoomInfo[] = [];
    rooms.forEach((room) => {
      if (room.settings.isPublic) {
        const hostPlayer = room.players.get(room.hostId);
        list.push({
          id: room.id,
          settings: room.settings,
          playerCount: room.players.size,
          hostName: hostPlayer ? hostPlayer.name : 'System Host',
          isPlaying: room.gameState === 'PLAYING' || room.gameState === 'COUNTDOWN',
          score: room.score,
        });
      }
    });
    return list;
  }

  function addSystemChat(room: ServerRoom, text: string) {
    const msg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      senderName: 'SYSTEM',
      text,
      timestamp: Date.now(),
      isSystem: true,
    };
    room.chatHistory.push(msg);
    if (room.chatHistory.length > 50) room.chatHistory.shift();
    io.to(room.id).emit('chat_message', msg);
  }

  function broadcastRoomState(room: ServerRoom) {
    io.to(room.id).emit('room_state', {
      players: Array.from(room.players.values()),
      settings: room.settings,
      hostId: room.hostId,
      captainId: room.captainId || room.redCaptainId || room.blueCaptainId,
      redCaptainId: room.redCaptainId,
      blueCaptainId: room.blueCaptainId,
      draftTurnTeam: room.draftTurnTeam || 'red',
      score: room.score,
      gameState: room.gameState,
      stadium: room.physics.stadium,
    });
  }

  function handleEndMatch(room: ServerRoom) {
    room.gameState = 'LOBBY';
    room.physics.resetBall();
    room.physics.resetPlayersToSpawns();

    // Determine winning and losing teams
    let winningTeam: Team | null = null;
    let losingTeam: Team | null = null;

    if (room.score.red > room.score.blue) {
      winningTeam = 'red';
      losingTeam = 'blue';
    } else if (room.score.blue > room.score.red) {
      winningTeam = 'blue';
      losingTeam = 'red';
    }

    if (losingTeam) {
      // Move all players on losing team to spectator
      room.players.forEach((p) => {
        if (p.team === losingTeam) {
          p.team = 'spec';
          room.physics.removePlayer(p.id);
        }
      });
      addSystemChat(room, `🏆 GAME OVER! ${winningTeam?.toUpperCase()} TEAM WINS (${room.score.red} - ${room.score.blue})! ${losingTeam.toUpperCase()} team moved to Spectators.`);
    } else {
      addSystemChat(room, `🏆 GAME OVER! Match ended in a DRAW (${room.score.red} - ${room.score.blue})!`);
    }

    // 1. Assign Captains for Red and Blue
    let redPlayers = Array.from(room.players.values()).filter((p) => p.team === 'red');
    let bluePlayers = Array.from(room.players.values()).filter((p) => p.team === 'blue');
    let specPlayers = Array.from(room.players.values()).filter((p) => p.team === 'spec');

    // Shuffle spec pool for random selections
    specPlayers.sort(() => Math.random() - 0.5);

    // If Red team is empty, assign a random spectator as Red Captain
    if (redPlayers.length === 0 && specPlayers.length > 0) {
      const redCap = specPlayers.pop()!;
      redCap.team = 'red';
      room.physics.addPlayer(redCap.id, redCap.name, 'red', redCap.avatar);
      redPlayers.push(redCap);
      room.redCaptainId = redCap.id;
    } else if (redPlayers.length > 0) {
      room.redCaptainId = redPlayers[0].id;
    }

    // If Blue team is empty, assign a random spectator as Blue Captain
    if (bluePlayers.length === 0 && specPlayers.length > 0) {
      const blueCap = specPlayers.pop()!;
      blueCap.team = 'blue';
      room.physics.addPlayer(blueCap.id, blueCap.name, 'blue', blueCap.avatar);
      bluePlayers.push(blueCap);
      room.blueCaptainId = blueCap.id;
    } else if (bluePlayers.length > 0) {
      room.blueCaptainId = bluePlayers[0].id;
    }

    // 2. Randomly make the teams equal in players from spectators pool
    while (specPlayers.length > 0) {
      if (redPlayers.length < bluePlayers.length) {
        const p = specPlayers.pop()!;
        p.team = 'red';
        room.physics.addPlayer(p.id, p.name, 'red', p.avatar);
        redPlayers.push(p);
      } else if (bluePlayers.length < redPlayers.length) {
        const p = specPlayers.pop()!;
        p.team = 'blue';
        room.physics.addPlayer(p.id, p.name, 'blue', p.avatar);
        bluePlayers.push(p);
      } else if (specPlayers.length >= 2) {
        // Equal numbers: if at least 2 spectators exist, distribute 1 to Red, 1 to Blue
        const p1 = specPlayers.pop()!;
        p1.team = 'red';
        room.physics.addPlayer(p1.id, p1.name, 'red', p1.avatar);
        redPlayers.push(p1);

        const p2 = specPlayers.pop()!;
        p2.team = 'blue';
        room.physics.addPlayer(p2.id, p2.name, 'blue', p2.avatar);
        bluePlayers.push(p2);
      } else {
        // Exactly 1 spectator remains; leave for captain turn-by-turn choice
        break;
      }
    }

    // 3. Set draft turn team
    if (redPlayers.length < bluePlayers.length) {
      room.draftTurnTeam = 'red';
    } else if (bluePlayers.length < redPlayers.length) {
      room.draftTurnTeam = 'blue';
    } else {
      room.draftTurnTeam = losingTeam || 'red';
    }

    room.captainId = room.draftTurnTeam === 'red' ? room.redCaptainId : room.blueCaptainId;

    const redCapName = room.players.get(room.redCaptainId || '')?.name || 'None';
    const blueCapName = room.players.get(room.blueCaptainId || '')?.name || 'None';

    addSystemChat(room, `🎲 Teams equalized (${redPlayers.length}v${bluePlayers.length})! Red Captain: ${redCapName} | Blue Captain: ${blueCapName}`);
    if (specPlayers.length > 0 || redPlayers.length !== bluePlayers.length) {
      addSystemChat(room, `👑 ${room.draftTurnTeam?.toUpperCase()} Captain's turn to draft!`);
    }

    io.to(room.id).emit('sound_event', 'whistle');
    broadcastRoomState(room);
  }

  function startMatch(room: ServerRoom) {
    room.score = { red: 0, blue: 0 };
    room.timeRemaining = room.settings.timeLimit * 60;
    room.gameState = 'COUNTDOWN';
    room.countdownTimer = 3 * 60; // 3 seconds at 60 Hz
    room.possession = { redTicks: 0, blueTicks: 0 };

    room.physics.resetBall();
    room.physics.resetPlayersToSpawns();

    // Reset player stats
    room.players.forEach((p) => {
      p.stats = { goals: 0, assists: 0, shots: 0, touches: 0 };
    });

    addSystemChat(room, `Match starting in 3 seconds...`);
    io.to(room.id).emit('sound_event', 'whistle');
    broadcastRoomState(room);
  }

  function stopMatch(room: ServerRoom) {
    room.gameState = 'LOBBY';
    room.physics.resetBall();
    room.physics.resetPlayersToSpawns();
    addSystemChat(room, `Match reset to Lobby.`);
    broadcastRoomState(room);
  }

  function ensureGameLoop(room: ServerRoom) {
    if (room.interval) return;

    const TICK_RATE = 60; // 60 FPS tick rate
    const TICK_MS = 1000 / TICK_RATE;

    room.interval = setInterval(() => {
      try {
        room.tick++;

        // Handle COUNTDOWN state
        if (room.gameState === 'COUNTDOWN') {
          room.countdownTimer--;
          if (room.countdownTimer <= 0) {
            room.gameState = 'PLAYING';
            addSystemChat(room, `KICK OFF! Match underway!`);
            io.to(room.id).emit('sound_event', 'whistle');
            broadcastRoomState(room);
          }
        }

        // Handle GOAL_SCORED pause delay
        if (room.gameState === 'GOAL_SCORED') {
          room.goalPauseTimer--;
          if (room.goalPauseTimer <= 0) {
            // Check win condition
            const limit = room.settings.scoreLimit;
            if (limit > 0 && (room.score.red >= limit || room.score.blue >= limit)) {
              handleEndMatch(room);
            } else {
              // Reset for next kickoff
              room.gameState = 'PLAYING';
              room.physics.resetBall();
              room.physics.resetPlayersToSpawns();
              io.to(room.id).emit('sound_event', 'whistle');
              broadcastRoomState(room);
            }
          }
        }

        // Run physics step during PLAYING and LOBBY states so players can move & practice
        if (room.gameState === 'PLAYING' || room.gameState === 'LOBBY') {
          // Decrement match timer
          if (room.gameState === 'PLAYING' && room.tick % TICK_RATE === 0 && room.settings.timeLimit > 0) {
            room.timeRemaining--;
            if (room.timeRemaining <= 0) {
              // Time expired
              if (room.score.red !== room.score.blue) {
                handleEndMatch(room);
              } else {
                addSystemChat(room, `⏰ TIME EXPIRED! Golden Goal / Sudden Death! Next goal wins!`);
              }
            }
          }

          // Track ball possession half during match
          if (room.gameState === 'PLAYING') {
            if (room.physics.ball.x < room.physics.stadium.width / 2) {
              room.possession.blueTicks++;
            } else {
              room.possession.redTicks++;
            }
          }

          // Physics step
          const stepResult = room.physics.step();

          if (stepResult.bounceSound) {
            // Send bounce sound event periodically
            if (room.tick % 5 === 0) {
              io.to(room.id).emit('sound_event', 'bounce');
            }
          }

          if (room.gameState === 'PLAYING' && stepResult.goalScored) {
            const scoringTeam = stepResult.goalScored;
            room.scoringTeam = scoringTeam;
            room.score[scoringTeam]++;
            room.gameState = 'GOAL_SCORED';
            room.goalPauseTimer = 3 * TICK_RATE; // 3 seconds delay

            // Find scorer
            const scorerId = room.physics.lastTouchPlayerId;
            const scorer = scorerId ? room.players.get(scorerId) : undefined;
            let scorerName = scorer ? scorer.name : 'Unknown';

            if (scorer) {
              scorer.stats.goals++;
            }

            addSystemChat(room, `⚽ GOAL FOR ${scoringTeam.toUpperCase()} TEAM! Scored by ${scorerName}! (${room.score.red} - ${room.score.blue})`);
            io.to(room.id).emit('sound_event', 'goal');
            broadcastRoomState(room);
          }
        }

        // Broadcast Snapshot to room clients every tick (60Hz for zero-lag responsiveness)
        const totalPosTicks = room.possession.redTicks + room.possession.blueTicks || 1;
        const snapshot: GameSnapshot = {
          tick: room.tick,
          ball: room.physics.ball,
          players: Object.fromEntries(room.physics.players),
          score: room.score,
          timeRemaining: room.timeRemaining,
          gameState: room.gameState,
          scoringTeam: room.scoringTeam,
          lastTouchPlayerId: room.physics.lastTouchPlayerId,
          possession: {
            red: Math.round((room.possession.redTicks / totalPosTicks) * 100),
            blue: Math.round((room.possession.blueTicks / totalPosTicks) * 100),
          },
        };
        io.to(room.id).emit('game_tick', snapshot);
      } catch (loopErr) {
        console.error('Error in match loop:', loopErr);
      }
    }, TICK_MS);
  }

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`⚽ Soccer Arena Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
