import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { RoomList } from './components/RoomList';
import { GameCanvas } from './components/GameCanvas';
import { MatchUI } from './components/MatchUI';
import { LobbyUI } from './components/LobbyUI';
import { ChatBox } from './components/ChatBox';
import { CreateRoomModal } from './components/CreateRoomModal';
import { NicknameModal } from './components/NicknameModal';
import { HelpModal } from './components/HelpModal';
import { getSocket } from './lib/socket';
import { soundEngine } from './lib/audio';
import { STADIUMS } from './physics/stadiums';
import {
  ChatMessage,
  GameSnapshot,
  PlayerState,
  RoomInfo,
  RoomSettings,
  Stadium,
  Team,
} from './types/haxball';

export default function App() {
  const [socketId, setSocketId] = useState<string>('');
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('soccer_nickname') || 'Player' + Math.floor(10 + Math.random() * 90);
  });
  const [avatar, setAvatar] = useState<string>(() => {
    return localStorage.getItem('soccer_avatar') || '10';
  });

  const [isMuted, setIsMuted] = useState(false);
  const [roomsList, setRoomsList] = useState<RoomInfo[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentRoomSettings, setCurrentRoomSettings] = useState<RoomSettings | null>(null);
  const [hostId, setHostId] = useState<string>('');
  const [captainId, setCaptainId] = useState<string>('');
  const [redCaptainId, setRedCaptainId] = useState<string>('');
  const [blueCaptainId, setBlueCaptainId] = useState<string>('');
  const [draftTurnTeam, setDraftTurnTeam] = useState<Team>('red');
  const [stadium, setStadium] = useState<Stadium>(STADIUMS.classic);

  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [score, setScore] = useState({ red: 0, blue: 0 });
  const [gameState, setGameState] = useState<'LOBBY' | 'COUNTDOWN' | 'PLAYING' | 'GOAL_SCORED' | 'GAME_OVER'>('LOBBY');
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & UI Toggles
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'BUTTON' || target.closest('button'))) {
        setTimeout(() => {
          if (
            document.activeElement &&
            document.activeElement.tagName === 'BUTTON'
          ) {
            (document.activeElement as HTMLElement).blur();
          }
        }, 50);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);

    const socket = getSocket();

    socket.on('connect', () => {
      setSocketId(socket.id || '');
      socket.emit('set_nickname', nickname, avatar);
      socket.emit('get_rooms');
    });

    socket.on('rooms_list', (list: RoomInfo[]) => {
      setRoomsList(list);
    });

    socket.on('error_msg', (msg: string) => {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    });

    socket.on('joined_room', ({ roomId, settings, hostId: hId, stadium: st }) => {
      setCurrentRoomId(roomId);
      setCurrentRoomSettings(settings);
      setHostId(hId);
      if (st) setStadium(st);
      setChatMessages([]);
    });

    socket.on('room_closed', (msg: string) => {
      setErrorMessage(msg);
      setCurrentRoomId(null);
      setPlayers([]);
      setTimeout(() => setErrorMessage(null), 4000);
    });

    socket.on('room_state', ({ players: pList, settings, hostId: hId, captainId: cId, redCaptainId: rCap, blueCaptainId: bCap, draftTurnTeam: dTurn, score: sc, gameState: gState, stadium: st }) => {
      setPlayers(pList);
      if (settings) setCurrentRoomSettings(settings);
      if (hId) setHostId(hId);
      setCaptainId(cId || '');
      if (rCap) setRedCaptainId(rCap);
      if (bCap) setBlueCaptainId(bCap);
      if (dTurn) setDraftTurnTeam(dTurn);
      if (sc) setScore(sc);
      if (gState) setGameState(gState);
      if (st) setStadium(st);
    });

    socket.on('game_tick', (snap: GameSnapshot) => {
      setSnapshot(snap);
      setScore(snap.score);
      setGameState(snap.gameState);
    });

    socket.on('chat_message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socket.on('sound_event', (event: string) => {
      if (event === 'kick') soundEngine.playKick();
      else if (event === 'bounce') soundEngine.playBounce();
      else if (event === 'goal') soundEngine.playGoal();
      else if (event === 'whistle') soundEngine.playWhistle();
    });

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      socket.off('connect');
      socket.off('rooms_list');
      socket.off('error_msg');
      socket.off('joined_room');
      socket.off('room_state');
      socket.off('game_tick');
      socket.off('chat_message');
      socket.off('sound_event');
    };
  }, [nickname, avatar]);

  const handleSaveProfile = (newName: string, newAvatar: string) => {
    setNickname(newName);
    setAvatar(newAvatar);
    localStorage.setItem('soccer_nickname', newName);
    localStorage.setItem('soccer_avatar', newAvatar);

    const socket = getSocket();
    socket.emit('set_nickname', newName, newAvatar);
  };

  const handleCreateRoom = (settings: RoomSettings) => {
    const socket = getSocket();
    socket.emit('create_room', settings);
  };

  const handleJoinRoom = (roomId: string, password?: string) => {
    const socket = getSocket();
    socket.emit('join_room', { roomId, password });
  };

  const handleQuickPlay = () => {
    const openRoom = roomsList.find(
      (r) => !r.settings.password && r.playerCount < r.settings.maxPlayers
    );
    if (openRoom) {
      handleJoinRoom(openRoom.id);
    } else {
      setIsCreateModalOpen(true);
    }
  };

  const handleLeaveRoom = () => {
    const socket = getSocket();
    socket.emit('leave_room');
    setCurrentRoomId(null);
    setCurrentRoomSettings(null);
    setSnapshot(null);
  };

  const handleChangeTeam = (team: Team) => {
    const socket = getSocket();
    socket.emit('change_team', team);
  };

  const handleStartMatch = () => {
    const socket = getSocket();
    socket.emit('start_match');
  };

  const handleResetMatch = () => {
    const socket = getSocket();
    socket.emit('reset_match');
  };

  const handleChangeSettings = (newSettings: Partial<RoomSettings>) => {
    const socket = getSocket();
    socket.emit('change_settings', newSettings);
  };

  const handleSendMessage = (text: string) => {
    const socket = getSocket();
    socket.emit('send_chat', text);
  };

  // If inside an active room match, render Full Screen Stadium Pitch Layout
  if (currentRoomId) {
    const activeSettings = currentRoomSettings || {
      name: 'bert\'s room',
      maxPlayers: 8,
      scoreLimit: 3,
      timeLimit: 3,
      stadiumId: 'classic',
      isPublic: true,
    };

    return (
      <div className="fixed inset-0 w-screen h-screen bg-slate-950 flex flex-col overflow-hidden select-none z-20">
        {/* Error Toast Notification */}
        {errorMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-rose-500 text-slate-950 font-extrabold px-6 py-2.5 rounded-full shadow-2xl border border-rose-400 animate-in fade-in slide-in-from-top-4 duration-200 text-xs">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Top Menu Settings Bar */}
        <MatchUI
          score={score}
          timeRemaining={snapshot?.timeRemaining ?? (activeSettings.timeLimit ?? 3) * 60}
          gameState={gameState}
          players={players}
          localPlayerId={socketId}
          hostId={hostId}
          settings={activeSettings}
          possession={snapshot?.possession}
          onChangeTeam={handleChangeTeam}
          onStartMatch={handleStartMatch}
          onResetMatch={handleResetMatch}
          onChangeSettings={handleChangeSettings}
          onLeaveRoom={handleLeaveRoom}
          isChatOpen={isChatOpen}
          onToggleChat={() => setIsChatOpen((v) => !v)}
          isRosterOpen={isRosterOpen}
          onToggleRoster={() => setIsRosterOpen((v) => !v)}
          isSettingsOpen={isSettingsOpen}
          onToggleSettings={() => setIsSettingsOpen((v) => !v)}
        />

        {/* Full Screen Area: Show Lobby UI over grass pitch when in LOBBY or Roster open */}
        <main
          className={`flex-1 relative w-full h-full overflow-hidden flex items-center justify-center ${
            gameState === 'LOBBY' ? 'bg-pitch-stripes' : 'bg-slate-950'
          }`}
        >
          {/* Game Canvas rendered during match or background */}
          <GameCanvas
            stadium={stadium}
            snapshot={snapshot}
            localPlayerId={socketId}
          />

          {/* Centered Lobby UI Overlay matching image.png */}
          {(gameState === 'LOBBY' || isRosterOpen) && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-30 flex items-center justify-center p-4">
              <LobbyUI
                settings={activeSettings}
                players={players}
                localPlayerId={socketId}
                hostId={hostId}
                captainId={captainId}
                redCaptainId={redCaptainId}
                blueCaptainId={blueCaptainId}
                draftTurnTeam={draftTurnTeam}
                gameState={gameState}
                onChangeTeam={handleChangeTeam}
                onStartMatch={handleStartMatch}
                onResetMatch={handleResetMatch}
                onChangeSettings={handleChangeSettings}
                onLeaveRoom={handleLeaveRoom}
                onPickPlayer={(targetPlayerId) => {
                  getSocket().emit('pick_player', { targetPlayerId });
                }}
              />
            </div>
          )}

          {/* Floating Chat Box Overlay */}
          {isChatOpen && (
            <div className="absolute bottom-4 right-4 w-80 sm:w-96 shadow-2xl rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/90 backdrop-blur-md z-40">
              <ChatBox
                messages={chatMessages}
                onSendMessage={handleSendMessage}
              />
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Header
        nickname={nickname}
        avatar={avatar}
        onOpenNicknameModal={() => setIsNicknameModalOpen(true)}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
      />

      {/* Error Toast Notification */}
      {errorMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-rose-500 text-slate-950 font-extrabold px-6 py-2.5 rounded-full shadow-2xl border border-rose-400 animate-in fade-in slide-in-from-top-4 duration-200 text-xs sm:text-sm">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Main View Area (Room Browser) */}
      <main className="flex-1 py-6 px-4 max-w-7xl mx-auto w-full">
        <RoomList
          rooms={roomsList}
          onJoinRoom={handleJoinRoom}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onRefreshRooms={() => getSocket().emit('get_rooms')}
          onQuickPlay={handleQuickPlay}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Soccer Arena © 2026 • Real-Time 2D Physics Soccer
      </footer>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateRoom}
      />

      <NicknameModal
        isOpen={isNicknameModalOpen}
        onClose={() => setIsNicknameModalOpen(false)}
        nickname={nickname}
        avatar={avatar}
        onSave={handleSaveProfile}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}
