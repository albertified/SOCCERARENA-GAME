import React, { useState } from 'react';
import { Play, Square, Link as LinkIcon, LogOut, Lock, Unlock, RefreshCw, Shuffle, Users } from 'lucide-react';
import { PlayerState, RoomSettings, Team } from '../types/haxball';
import { STADIUMS } from '../physics/stadiums';
import { getSocket } from '../lib/socket';

interface LobbyUIProps {
  settings: RoomSettings;
  players: PlayerState[];
  localPlayerId: string;
  hostId: string;
  captainId?: string;
  redCaptainId?: string;
  blueCaptainId?: string;
  draftTurnTeam?: Team;
  gameState: 'LOBBY' | 'COUNTDOWN' | 'PLAYING' | 'GOAL_SCORED' | 'GAME_OVER';
  onChangeTeam: (team: Team) => void;
  onStartMatch: () => void;
  onResetMatch: () => void;
  onChangeSettings: (newSettings: Partial<RoomSettings>) => void;
  onLeaveRoom: () => void;
  onPickPlayer?: (targetPlayerId: string) => void;
}

export const LobbyUI: React.FC<LobbyUIProps> = ({
  settings,
  players,
  localPlayerId,
  hostId,
  captainId,
  redCaptainId,
  blueCaptainId,
  draftTurnTeam = 'red',
  gameState,
  onChangeTeam,
  onStartMatch,
  onResetMatch,
  onChangeSettings,
  onLeaveRoom,
  onPickPlayer,
}) => {
  const isHost = localPlayerId === hostId || hostId === 'system';
  const isRedCaptain = localPlayerId === redCaptainId;
  const isBlueCaptain = localPlayerId === blueCaptainId;
  const isMyDraftTurn = (draftTurnTeam === 'red' && isRedCaptain) || (draftTurnTeam === 'blue' && isBlueCaptain) || isHost;

  const redCaptainPlayer = players.find((p) => p.id === redCaptainId);
  const blueCaptainPlayer = players.find((p) => p.id === blueCaptainId);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const redPlayers = players.filter((p) => p.team === 'red');
  const bluePlayers = players.filter((p) => p.team === 'blue');
  const specPlayers = players.filter((p) => p.team === 'spec');

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleMoveSelected = (team: Team) => {
    const socket = getSocket();
    if (isHost && selectedPlayerId) {
      socket.emit('move_player', { targetPlayerId: selectedPlayerId, team });
    } else {
      onChangeTeam(team);
    }
  };

  const handleAutoTeams = () => {
    if (!isHost) return;
    getSocket().emit('auto_teams');
  };

  const handleEqualizeTeams = () => {
    getSocket().emit('equalize_teams');
  };

  const handleRandTeams = () => {
    if (!isHost) return;
    getSocket().emit('rand_teams');
  };

  const handleLockTeams = () => {
    if (!isHost) return;
    getSocket().emit('lock_teams');
  };

  const handleResetTeams = () => {
    if (!isHost) return;
    getSocket().emit('reset_teams');
  };

  const currentStadium = STADIUMS[settings.stadiumId] || STADIUMS.classic;

  return (
    <div className="w-full max-w-4xl bg-[#19202a] border border-[#2a3746] rounded-xl shadow-2xl overflow-hidden font-sans select-none text-[#d3dbe6] animate-in fade-in zoom-in-95 duration-200">
      {/* Header Bar matching image.png */}
      <div className="bg-[#151a23] px-5 py-3 flex items-center justify-between border-b border-[#232d3b] relative">
        <h2 className="text-lg font-bold text-white tracking-wide">
          {settings.name || "bert's room"}
        </h2>

        {/* Top Right Buttons matching image.png */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRecording((r) => !r)}
            className={`px-3 py-1.5 rounded bg-[#2b3a4e] hover:bg-[#364962] text-xs font-semibold flex items-center gap-1.5 border border-[#3b4e68] transition ${
              isRecording ? 'text-rose-400 border-rose-500/50' : 'text-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>Rec</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded bg-[#2b3a4e] hover:bg-[#364962] text-xs font-semibold flex items-center gap-1.5 border border-[#3b4e68] text-slate-200 transition"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>{isCopied ? 'Copied!' : 'Link'}</span>
          </button>

          <button
            onClick={onLeaveRoom}
            className="px-3 py-1.5 rounded bg-[#2b3a4e] hover:bg-[#364962] text-xs font-semibold flex items-center gap-1.5 border border-[#3b4e68] text-slate-200 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>

        {/* Red Accent Bar under Header */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-600/90" />
      </div>

      {/* Main Content Area */}
      <div className="p-5 space-y-5">
        {/* Teams and Sidebar Layout matching image.png */}
        <div className="flex gap-4 items-stretch">
          {/* Left Action Buttons (Host Side Controls) */}
          <div className="flex flex-col gap-2 shrink-0 justify-center">
            <button
              disabled={!isHost || gameState !== 'LOBBY'}
              onClick={handleAutoTeams}
              className="w-16 py-1.5 rounded bg-[#2b4263] hover:bg-[#36537c] disabled:opacity-40 text-xs font-bold text-white shadow border border-[#385885] transition"
            >
              Auto
            </button>

            <button
              disabled={gameState !== 'LOBBY'}
              onClick={handleEqualizeTeams}
              className="w-16 py-1.5 rounded bg-emerald-800/80 hover:bg-emerald-700 disabled:opacity-40 text-xs font-bold text-emerald-200 shadow border border-emerald-600/50 transition flex items-center justify-center gap-0.5"
              title="Randomly Equalize Teams"
            >
              Equal
            </button>

            <button
              disabled={!isHost || gameState !== 'LOBBY'}
              onClick={handleRandTeams}
              className="w-16 py-1.5 rounded bg-[#2b4263] hover:bg-[#36537c] disabled:opacity-40 text-xs font-bold text-white shadow border border-[#385885] transition"
            >
              Rand
            </button>

            <button
              disabled={!isHost}
              onClick={handleLockTeams}
              className="w-16 py-1.5 rounded bg-[#2b4263] hover:bg-[#36537c] disabled:opacity-40 text-xs font-bold text-white shadow border border-[#385885] transition flex items-center justify-center gap-1"
            >
              <Lock className="w-3 h-3" /> Lock
            </button>

            <button
              disabled={!isHost || gameState !== 'LOBBY'}
              onClick={handleResetTeams}
              className="w-16 py-1.5 rounded bg-[#2b4263] hover:bg-[#36537c] disabled:opacity-40 text-xs font-bold text-white shadow border border-[#385885] transition"
            >
              Reset
            </button>
          </div>

          {/* 3 Team Panels Grid */}
          <div className="flex-1 grid grid-cols-3 gap-3">
            {/* RED TEAM PANEL */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  disabled={gameState !== 'LOBBY'}
                  onClick={() => handleMoveSelected('red')}
                  className="flex-1 py-1.5 px-3 rounded bg-[#8c3232] hover:bg-[#a63c3c] disabled:opacity-50 text-xs font-bold text-white text-center border border-[#a84444] shadow transition flex items-center justify-center gap-1.5"
                >
                  <span>Red</span>
                  {redCaptainPlayer && <span className="text-[10px] text-amber-300">👑 {redCaptainPlayer.name}</span>}
                </button>
                <button
                  disabled={gameState !== 'LOBBY'}
                  onClick={() => handleMoveSelected('red')}
                  className="px-2.5 py-1.5 rounded bg-[#2b4263] hover:bg-[#36537c] disabled:opacity-50 text-xs font-bold text-white border border-[#385885] transition"
                  title="Move to Red"
                >
                  ▶
                </button>
              </div>

              <div className="flex-1 min-h-[220px] max-h-[260px] bg-[#10141a] border border-[#232d3b] rounded p-2 overflow-y-auto space-y-1">
                {redPlayers.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlayerId(p.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs cursor-pointer transition ${
                      selectedPlayerId === p.id
                        ? 'bg-[#2b4263] text-white font-bold'
                        : 'hover:bg-[#1a212b] text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm shrink-0">🇺🇸</span>
                      <span className={`truncate ${p.id === hostId ? 'text-amber-400 font-bold' : ''}`}>
                        {p.name}
                      </span>
                      {p.id === redCaptainId && <span className="text-amber-300 text-xs shrink-0" title="Red Captain">👑</span>}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">0</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SPECTATORS PANEL */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <button
                  disabled={gameState !== 'LOBBY'}
                  onClick={() => handleMoveSelected('spec')}
                  className="w-full py-1.5 px-3 rounded bg-[#2b4263] hover:bg-[#36537c] disabled:opacity-50 text-xs font-bold text-white text-center border border-[#385885] shadow transition"
                >
                  Spectators
                </button>
              </div>

              {/* DRAFT TURN STATUS BANNER */}
              {specPlayers.length > 0 && (
                <div
                  className={`text-center text-[11px] font-bold rounded py-1 px-2 border flex items-center justify-center gap-1.5 shadow ${
                    draftTurnTeam === 'red'
                      ? 'bg-red-500/15 border-red-500/40 text-red-300 animate-pulse'
                      : 'bg-blue-500/15 border-blue-500/40 text-blue-300 animate-pulse'
                  }`}
                >
                  <span>
                    👑 {draftTurnTeam === 'red' ? 'RED' : 'BLUE'} CAPTAIN'S TURN TO DRAFT
                  </span>
                </div>
              )}

              <div className="flex-1 min-h-[220px] max-h-[260px] bg-[#10141a] border border-[#232d3b] rounded p-2 overflow-y-auto space-y-1">
                {specPlayers.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPlayerId(p.id);
                      if (isMyDraftTurn && onPickPlayer) {
                        onPickPlayer(p.id);
                      }
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs cursor-pointer transition ${
                      selectedPlayerId === p.id
                        ? 'bg-[#2b4263] text-white font-bold'
                        : 'hover:bg-[#1a212b] text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm shrink-0">🇺🇸</span>
                      <span className={`truncate ${p.id === hostId ? 'text-amber-400 font-bold' : ''}`}>
                        {p.name}
                      </span>
                    </div>

                    {isMyDraftTurn ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onPickPlayer) onPickPlayer(p.id);
                        }}
                        className={`px-2 py-0.5 rounded font-bold text-[10px] border transition shrink-0 ${
                          draftTurnTeam === 'red'
                            ? 'bg-red-500/20 hover:bg-red-500/40 text-red-300 border-red-500/30'
                            : 'bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border-blue-500/30'
                        }`}
                        title={`Draft player to ${draftTurnTeam.toUpperCase()} team`}
                      >
                        + Draft {draftTurnTeam.toUpperCase()}
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">0</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* BLUE TEAM PANEL */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  disabled={gameState !== 'LOBBY'}
                  onClick={() => handleMoveSelected('blue')}
                  className="px-2.5 py-1.5 rounded bg-[#2b4263] hover:bg-[#36537c] disabled:opacity-50 text-xs font-bold text-white border border-[#385885] transition"
                  title="Move to Blue"
                >
                  ◀
                </button>
                <button
                  disabled={gameState !== 'LOBBY'}
                  onClick={() => handleMoveSelected('blue')}
                  className="flex-1 py-1.5 px-3 rounded bg-[#2b508b] hover:bg-[#3562a8] disabled:opacity-50 text-xs font-bold text-white text-center border border-[#3d6eba] shadow transition flex items-center justify-center gap-1.5"
                >
                  <span>Blue</span>
                  {blueCaptainPlayer && <span className="text-[10px] text-amber-300">👑 {blueCaptainPlayer.name}</span>}
                </button>
              </div>

              <div className="flex-1 min-h-[220px] max-h-[260px] bg-[#10141a] border border-[#232d3b] rounded p-2 overflow-y-auto space-y-1">
                {bluePlayers.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlayerId(p.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs cursor-pointer transition ${
                      selectedPlayerId === p.id
                        ? 'bg-[#2b4263] text-white font-bold'
                        : 'hover:bg-[#1a212b] text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm shrink-0">🇺🇸</span>
                      <span className={`truncate ${p.id === hostId ? 'text-amber-400 font-bold' : ''}`}>
                        {p.name}
                      </span>
                      {p.id === blueCaptainId && <span className="text-amber-300 text-xs shrink-0" title="Blue Captain">👑</span>}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">0</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Settings & Match Control Row matching image.png */}
        <div className="flex flex-col items-center gap-4 pt-3 border-t border-[#232d3b]">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300">
            {/* Time Limit */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-400">Time limit</span>
              <input
                type="number"
                min="0"
                max="15"
                disabled={!isHost}
                value={settings.timeLimit}
                onChange={(e) => onChangeSettings({ timeLimit: parseInt(e.target.value, 10) || 0 })}
                className="w-14 bg-[#10141a] border border-[#232d3b] focus:border-[#385885] text-center py-1 rounded text-white font-mono text-xs outline-none disabled:opacity-60"
              />
            </div>

            {/* Score Limit */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-400">Score limit</span>
              <input
                type="number"
                min="0"
                max="10"
                disabled={!isHost}
                value={settings.scoreLimit}
                onChange={(e) => onChangeSettings({ scoreLimit: parseInt(e.target.value, 10) || 0 })}
                className="w-14 bg-[#10141a] border border-[#232d3b] focus:border-[#385885] text-center py-1 rounded text-white font-mono text-xs outline-none disabled:opacity-60"
              />
            </div>

            {/* Stadium */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-400">Stadium</span>
              <span className="text-white font-bold">{currentStadium.name}</span>
              {isHost && (
                <select
                  value={settings.stadiumId}
                  onChange={(e) => onChangeSettings({ stadiumId: e.target.value })}
                  className="bg-[#2b4263] hover:bg-[#36537c] text-white px-2 py-1 rounded text-xs font-bold border border-[#385885] outline-none transition cursor-pointer"
                >
                  {Object.values(STADIUMS).map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#19202a] text-white">
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Start Game Button (Green Pill) */}
          <div className="flex flex-col items-center gap-1">
            {gameState === 'LOBBY' ? (
              <button
                disabled={!isHost}
                onClick={onStartMatch}
                className={`px-8 py-2.5 rounded bg-[#27963c] hover:bg-[#2cb046] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg border border-[#31b349] transition flex items-center gap-2`}
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start game</span>
              </button>
            ) : (
              <button
                disabled={!isHost}
                onClick={onResetMatch}
                className="px-8 py-2.5 rounded bg-[#b53434] hover:bg-[#d43d3d] disabled:opacity-40 text-white font-bold text-sm shadow-lg border border-[#e04848] transition flex items-center gap-2"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop game</span>
              </button>
            )}

            {!isHost && (
              <span className="text-[11px] text-slate-400 italic">
                Waiting for host to start the match...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
