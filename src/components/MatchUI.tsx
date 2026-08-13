import React from 'react';
import { Play, RotateCcw, Settings, Users, MessageSquare, LogOut, Share2, Crown, X, Check } from 'lucide-react';
import { PlayerState, RoomSettings, Team } from '../types/haxball';
import { STADIUMS } from '../physics/stadiums';

interface MatchUIProps {
  score: { red: number; blue: number };
  timeRemaining: number;
  gameState: 'LOBBY' | 'COUNTDOWN' | 'PLAYING' | 'GOAL_SCORED' | 'GAME_OVER';
  players: PlayerState[];
  localPlayerId: string;
  hostId: string;
  settings: RoomSettings;
  possession?: { red: number; blue: number };
  onChangeTeam: (team: Team) => void;
  onStartMatch: () => void;
  onResetMatch: () => void;
  onChangeSettings: (newSettings: Partial<RoomSettings>) => void;
  onLeaveRoom: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  isRosterOpen: boolean;
  onToggleRoster: () => void;
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
}

export const MatchUI: React.FC<MatchUIProps> = ({
  score,
  timeRemaining,
  gameState,
  players,
  localPlayerId,
  hostId,
  settings,
  possession = { red: 50, blue: 50 },
  onChangeTeam,
  onStartMatch,
  onResetMatch,
  onChangeSettings,
  onLeaveRoom,
  isChatOpen,
  onToggleChat,
  isRosterOpen,
  onToggleRoster,
  isSettingsOpen,
  onToggleSettings,
}) => {
  const isHost = localPlayerId === hostId || hostId === 'system';
  const localPlayer = players.find((p) => p.id === localPlayerId);

  const redPlayers = players.filter((p) => p.team === 'red');
  const bluePlayers = players.filter((p) => p.team === 'blue');
  const specPlayers = players.filter((p) => p.team === 'spec');

  const formatTime = (secs: number) => {
    if (secs < 0) secs = 0;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <>
      {/* Pinned Top Navigation & Menu Settings Bar */}
      <header className="w-full h-14 sm:h-16 bg-[#0F1115] border-b border-[#272C35] px-3 sm:px-5 flex items-center justify-between shrink-0 shadow-2xl z-30 select-none font-hanken">
        {/* Left Side: Brand & Team Switchers */}
        <div className="flex items-center gap-3">
          {/* Logo & Room Title */}
          <div className="hidden md:flex items-center gap-2 pr-3 border-r border-[#272C35]">
            <span className="text-lg">⚽</span>
            <span className="font-sora font-extrabold text-xs tracking-wider text-white uppercase">
              SOCCER ARENA
            </span>
            <span className="text-xs text-slate-400 max-w-[120px] truncate font-mono">
              • {settings.name}
            </span>
          </div>

          {/* Team Pickers */}
          <div className="flex items-center gap-1 bg-[#181B20] p-1 rounded-2xl border border-[#272C35]">
            <button
              disabled={gameState !== 'LOBBY'}
              onClick={() => onChangeTeam('red')}
              className={`px-3 py-1 rounded-xl text-xs font-sora font-bold transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                localPlayer?.team === 'red'
                  ? 'bg-[#FF00E5] text-white shadow-md'
                  : 'text-[#FF00E5] hover:bg-[#21252D]'
              }`}
              title={gameState !== 'LOBBY' ? 'Team changes locked during match' : 'Join Red'}
            >
              <span className="w-2 h-2 rounded-full bg-[#FF00E5] shrink-0" />
              <span>RED</span>
              <span className="text-[10px] opacity-75 font-mono">({redPlayers.length})</span>
            </button>

            <button
              disabled={gameState !== 'LOBBY'}
              onClick={() => onChangeTeam('spec')}
              className={`px-2.5 py-1 rounded-xl text-xs font-sora font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                localPlayer?.team === 'spec'
                  ? 'bg-[#272C35] text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:bg-[#21252D]'
              }`}
              title={gameState !== 'LOBBY' ? 'Team changes locked during match' : 'Spectate'}
            >
              SPEC ({specPlayers.length})
            </button>

            <button
              disabled={gameState !== 'LOBBY'}
              onClick={() => onChangeTeam('blue')}
              className={`px-3 py-1 rounded-xl text-xs font-sora font-bold transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                localPlayer?.team === 'blue'
                  ? 'bg-[#00F0FF] text-[#0F1115] shadow-md'
                  : 'text-[#00F0FF] hover:bg-[#21252D]'
              }`}
              title={gameState !== 'LOBBY' ? 'Team changes locked during match' : 'Join Blue'}
            >
              <span className="w-2 h-2 rounded-full bg-[#00F0FF] shrink-0" />
              <span>BLU</span>
              <span className="text-[10px] opacity-75 font-mono">({bluePlayers.length})</span>
            </button>
          </div>
        </div>

        {/* Center: Scoreboard Console */}
        <div className="flex items-center gap-3 bg-[#181B20] rounded-full px-5 py-1.5 border border-[#272C35] shadow-2xl">
          {/* Red Score */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF00E5] shadow-[0_0_8px_rgba(255,0,229,0.5)] shrink-0" />
            <span className="text-xl font-mono font-black text-[#FF00E5]">
              {score.red < 10 ? `0${score.red}` : score.red}
            </span>
          </div>

          <div className="h-4 w-px bg-[#272C35]" />

          {/* Clock & Status */}
          <div className="flex flex-col items-center">
            <span className="text-base font-mono font-black text-white tracking-wider">
              {formatTime(timeRemaining)}
            </span>
            <span className="text-[9px] font-sora font-bold uppercase tracking-widest text-[#22FF88] -mt-0.5">
              {gameState === 'PLAYING'
                ? 'PLAYING'
                : gameState === 'COUNTDOWN'
                ? 'READY'
                : gameState === 'GOAL_SCORED'
                ? 'GOAL!'
                : gameState === 'GAME_OVER'
                ? 'OVER'
                : 'LOBBY'}
            </span>
          </div>

          <div className="h-4 w-px bg-[#272C35]" />

          {/* Blue Score */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-mono font-black text-[#00F0FF]">
              {score.blue < 10 ? `0${score.blue}` : score.blue}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.5)] shrink-0" />
          </div>
        </div>

        {/* Right Side: Host Actions & Menu Controls */}
        <div className="flex items-center gap-2">
          {/* Host Quick Controls */}
          {isHost && (
            <div className="hidden lg:flex items-center gap-1.5 mr-2 pr-2 border-r border-slate-800">
              <button
                onClick={onStartMatch}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md transition flex items-center gap-1"
                title="Start or Restart Match"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>START</span>
              </button>
              <button
                onClick={onResetMatch}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Reset to Lobby"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Settings Modal Toggle */}
          <button
            onClick={onToggleSettings}
            className={`p-2 rounded-xl border transition flex items-center gap-1 text-xs font-semibold ${
              isSettingsOpen
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
            }`}
            title="Room & Stadium Settings"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden xl:inline">Settings</span>
          </button>

          {/* Roster Modal Toggle */}
          <button
            onClick={onToggleRoster}
            className={`p-2 rounded-xl border transition flex items-center gap-1 text-xs font-semibold ${
              isRosterOpen
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
            }`}
            title="Player Roster"
          >
            <Users className="w-4 h-4" />
            <span className="hidden xl:inline">Roster</span>
          </button>

          {/* Chat Toggle */}
          <button
            onClick={onToggleChat}
            className={`p-2 rounded-xl border transition flex items-center gap-1 text-xs font-semibold ${
              isChatOpen
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
            }`}
            title="Toggle Live Chat"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden xl:inline">Chat</span>
          </button>

          {/* Leave Room Button */}
          <button
            onClick={onLeaveRoom}
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition text-xs font-semibold flex items-center gap-1"
            title="Leave Match"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* Floating Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" /> Room & Pitch Settings
              </h3>
              <button
                onClick={onToggleSettings}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Stadium Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Stadium / Pitch Map
                </label>
                <select
                  value={settings.stadiumId}
                  disabled={!isHost}
                  onChange={(e) => onChangeSettings({ stadiumId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none font-medium disabled:opacity-50"
                >
                  {Object.values(STADIUMS).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.width}x{s.height})
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Limit */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Time Limit: <span className="text-emerald-400 font-mono">{settings.timeLimit} Minutes</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={settings.timeLimit}
                  disabled={!isHost}
                  onChange={(e) => onChangeSettings({ timeLimit: parseInt(e.target.value, 10) })}
                  className="w-full accent-emerald-500 disabled:opacity-50"
                />
              </div>

              {/* Score Limit */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Goal Limit: <span className="text-emerald-400 font-mono">{settings.scoreLimit} Goals</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={settings.scoreLimit}
                  disabled={!isHost}
                  onChange={(e) => onChangeSettings({ scoreLimit: parseInt(e.target.value, 10) })}
                  className="w-full accent-emerald-500 disabled:opacity-50"
                />
              </div>

              {/* Host Match Actions */}
              {isHost && (
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      onStartMatch();
                      onToggleSettings();
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-4 h-4 fill-slate-950" /> Start / Restart Match
                  </button>
                  <button
                    onClick={() => {
                      onResetMatch();
                      onToggleSettings();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Roster Modal */}
      {isRosterOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" /> Player Roster ({players.length})
              </h3>
              <button
                onClick={onToggleRoster}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Red Team Roster */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-red-400 uppercase tracking-widest border-b border-red-500/20 pb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Red Team ({redPlayers.length})
                </span>
                <button
                  onClick={() => onChangeTeam('red')}
                  className="text-[11px] hover:underline text-slate-300"
                >
                  Switch to Red
                </button>
              </div>
              {redPlayers.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-red-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                      {p.avatar || p.name[0]}
                    </span>
                    <span className="font-semibold text-slate-200">{p.name}</span>
                    {p.isHost && <Crown className="w-3.5 h-3.5 text-amber-400" title="Host" />}
                  </div>
                  <span className="text-emerald-400 font-mono font-bold">⚽ {p.stats.goals} Goals</span>
                </div>
              ))}
            </div>

            {/* Blue Team Roster */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-blue-500/20 pb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Blue Team ({bluePlayers.length})
                </span>
                <button
                  onClick={() => onChangeTeam('blue')}
                  className="text-[11px] hover:underline text-slate-300"
                >
                  Switch to Blue
                </button>
              </div>
              {bluePlayers.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                      {p.avatar || p.name[0]}
                    </span>
                    <span className="font-semibold text-slate-200">{p.name}</span>
                    {p.isHost && <Crown className="w-3.5 h-3.5 text-amber-400" title="Host" />}
                  </div>
                  <span className="text-emerald-400 font-mono font-bold">⚽ {p.stats.goals} Goals</span>
                </div>
              ))}
            </div>

            {/* Spectator Roster */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">
                <span>Spectators ({specPlayers.length})</span>
                <button
                  onClick={() => onChangeTeam('spec')}
                  className="text-[11px] hover:underline text-slate-300"
                >
                  Spectate
                </button>
              </div>
              {specPlayers.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs opacity-70">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-[10px]">
                      {p.avatar || p.name[0]}
                    </span>
                    <span className="font-medium text-slate-300">{p.name}</span>
                    {p.isHost && <Crown className="w-3.5 h-3.5 text-amber-400" title="Host" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
