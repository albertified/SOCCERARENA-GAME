import React, { useState } from 'react';
import { Users, Lock, Play, PlusCircle, RefreshCw, Trophy, Search } from 'lucide-react';
import { RoomInfo } from '../types/haxball';
import { STADIUMS } from '../physics/stadiums';

interface RoomListProps {
  rooms: RoomInfo[];
  onJoinRoom: (roomId: string, password?: string) => void;
  onOpenCreateModal: () => void;
  onRefreshRooms: () => void;
  onQuickPlay: () => void;
}

export const RoomList: React.FC<RoomListProps> = ({
  rooms,
  onJoinRoom,
  onOpenCreateModal,
  onRefreshRooms,
  onQuickPlay,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleJoinClick = (room: RoomInfo) => {
    if (room.settings.password) {
      setSelectedRoomId(room.id);
    } else {
      onJoinRoom(room.id);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoomId) {
      onJoinRoom(selectedRoomId, passwordInput);
      setSelectedRoomId(null);
      setPasswordInput('');
    }
  };

  const filteredRooms = rooms.filter((room) =>
    room.settings.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.hostName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-300 select-none font-hanken">
      {/* Action Header Banner */}
      <div className="bg-[#181B20] border border-[#272C35] rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F1115] text-[#22FF88] text-xs font-mono border border-[#272C35]">
            <span className="w-2 h-2 rounded-full bg-[#22FF88] animate-pulse" />
            ONLINE ARENA SERVERS
          </div>
          <h2 className="text-2xl sm:text-3xl font-sora font-extrabold text-white tracking-tight">
            Soccer Arena
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Fast-paced 2D multiplayer soccer physics with aerodynamic curve trajectory controls.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button
            onClick={onQuickPlay}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#E0E4EC] hover:bg-white text-[#0F1115] font-sora font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-[#0F1115]" /> QUICK JOIN
          </button>
          <button
            onClick={onOpenCreateModal}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#22FF88] hover:bg-[#1DE57A] text-[#0F1115] font-sora font-bold text-xs shadow-[0_0_20px_rgba(34,255,136,0.3)] transition flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> HOST ROOM
          </button>
        </div>
      </div>

      {/* Room Table Header & Search */}
      <div className="bg-[#181B20] border border-[#272C35] rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-sora font-bold text-slate-300 uppercase tracking-wider">
              Active Rooms
            </h3>
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#0F1115] text-[#00F0FF] border border-[#272C35]">
              {filteredRooms.length} {filteredRooms.length === 1 ? 'Room' : 'Rooms'}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input Bar (Matching Image Design) */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0F1115] border border-[#272C35] focus:border-[#22FF88] rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-[#E0E4EC] placeholder-slate-500 outline-none transition"
              />
            </div>

            <button
              onClick={onRefreshRooms}
              className="p-2.5 rounded-xl bg-[#0F1115] hover:bg-[#21252D] text-[#E0E4EC] border border-[#272C35] text-xs font-sora font-bold flex items-center gap-2 transition shrink-0"
              title="Refresh Room List"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Rooms Grid / List */}
        {filteredRooms.length === 0 ? (
          <div className="text-center py-12 bg-[#0F1115]/60 rounded-2xl border border-[#272C35] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#181B20] border border-[#272C35] text-[#22FF88] flex items-center justify-center mx-auto text-xl">
              ⚽
            </div>
            <div className="space-y-1">
              <p className="text-slate-200 text-sm font-sora font-semibold">No active rooms found</p>
              <p className="text-slate-400 text-xs">Host a new room to start playing with friends or online players!</p>
            </div>
            <button
              onClick={onOpenCreateModal}
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#22FF88] text-[#0F1115] font-sora font-bold text-xs hover:bg-[#1DE57A] transition"
            >
              + Host a Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRooms.map((room) => {
              const stadium = STADIUMS[room.settings.stadiumId] || STADIUMS.classic;
              const isFull = room.playerCount >= room.settings.maxPlayers;

              return (
                <div
                  key={room.id}
                  className="bg-[#0F1115] hover:bg-[#14171D] border border-[#272C35] hover:border-[#22FF88]/50 rounded-2xl p-5 transition flex flex-col justify-between gap-4 group shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-sora font-bold text-white group-hover:text-[#22FF88] transition text-sm">
                            {room.settings.name}
                          </h4>
                          {room.settings.password && (
                            <Lock className="w-3.5 h-3.5 text-[#FF00E5]" title="Password Protected" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                          Host: <span className="text-[#E0E4EC] font-sora font-medium">{room.hostName}</span>
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
                          room.isPlaying
                            ? 'bg-[#FF00E5]/10 text-[#FF00E5] border-[#FF00E5]/20'
                            : 'bg-[#22FF88]/10 text-[#22FF88] border-[#22FF88]/20'
                        }`}
                      >
                        {room.isPlaying ? `IN MATCH (${room.score.red} - ${room.score.blue})` : 'WAITING'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Users className="w-3.5 h-3.5 text-[#00F0FF]" />
                        <span className="text-[#E0E4EC] font-bold">{room.playerCount}</span>/{room.settings.maxPlayers} PLAYERS
                      </span>

                      <span className="flex items-center gap-1.5 font-mono">
                        <Trophy className="w-3.5 h-3.5 text-[#22FF88]" />
                        {stadium.name}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#272C35] flex items-center justify-between">
                    <div className="text-[11px] font-mono text-slate-500">
                      Limit: {room.settings.scoreLimit ? `${room.settings.scoreLimit} goals` : 'No score limit'} • {room.settings.timeLimit ? `${room.settings.timeLimit} min` : 'No time limit'}
                    </div>

                    <button
                      disabled={isFull}
                      onClick={() => handleJoinClick(room)}
                      className={`px-4 py-2 rounded-xl text-xs font-sora font-bold transition flex items-center gap-1.5 ${
                        isFull
                          ? 'bg-[#272C35] text-slate-500 cursor-not-allowed'
                          : 'bg-[#22FF88] hover:bg-[#1DE57A] text-[#0F1115] shadow-sm'
                      }`}
                    >
                      {isFull ? 'FULL' : 'JOIN MATCH'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Password Modal */}
      {selectedRoomId && (
        <div className="fixed inset-0 bg-[#0F1115]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B20] border border-[#272C35] rounded-3xl p-6 w-full max-w-sm shadow-2xl text-[#E0E4EC]">
            <h3 className="text-lg font-sora font-bold mb-2 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#FF00E5]" /> Protected Room
            </h3>
            <p className="text-xs text-slate-400 mb-4">Enter password to join this match</p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Room password..."
                className="w-full bg-[#0F1115] border border-[#272C35] focus:border-[#22FF88] rounded-xl px-4 py-2.5 text-sm outline-none text-white font-mono"
                autoFocus
                required
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRoomId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-sora font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-sora font-bold bg-[#22FF88] text-[#0F1115] hover:bg-[#1DE57A]"
                >
                  Join Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
