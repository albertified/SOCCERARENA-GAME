import React, { useState } from 'react';
import { PlusCircle, Lock, Shield, Trophy, Clock, Users } from 'lucide-react';
import { RoomSettings } from '../types/haxball';
import { STADIUMS } from '../physics/stadiums';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (settings: RoomSettings) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('My Pitch Room');
  const [stadiumId, setStadiumId] = useState('classic');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [scoreLimit, setScoreLimit] = useState(3);
  const [timeLimit, setTimeLimit] = useState(3);
  const [password, setPassword] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name: name.trim() || 'Pitch Room',
      stadiumId,
      maxPlayers,
      scoreLimit,
      timeLimit,
      password,
      isPublic,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#0F1115]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-hanken">
      <div className="bg-[#181B20] border border-[#272C35] rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl text-[#E0E4EC] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-[#22FF88]/10 text-[#22FF88] border border-[#22FF88]/20">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-sora font-bold text-white">Create Room</h2>
            <p className="text-xs text-slate-400">Host your own stadium match for friends or public players</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-1">Room Name</label>
            <input
              type="text"
              maxLength={24}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0F1115] border border-[#272C35] focus:border-[#22FF88] rounded-2xl px-4 py-2.5 text-sm outline-none text-white font-mono transition"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
                Stadium Pitch
              </label>
              <select
                value={stadiumId}
                onChange={(e) => setStadiumId(e.target.value)}
                className="w-full bg-[#0F1115] border border-[#272C35] focus:border-[#22FF88] rounded-2xl px-3 py-2.5 text-sm outline-none text-white font-mono transition"
              >
                {Object.values(STADIUMS).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#00F0FF]" /> Max Players
              </label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full bg-[#0F1115] border border-[#272C35] focus:border-[#22FF88] rounded-2xl px-3 py-2.5 text-sm outline-none text-white font-mono transition"
              >
                <option value={2}>2 Players (1v1)</option>
                <option value={4}>4 Players (2v2)</option>
                <option value={6}>6 Players (3v3)</option>
                <option value={8}>8 Players (4v4)</option>
                <option value={10}>10 Players (5v5)</option>
                <option value={16}>16 Players (Full Room)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-[#22FF88]" /> Score Limit
              </label>
              <select
                value={scoreLimit}
                onChange={(e) => setScoreLimit(Number(e.target.value))}
                className="w-full bg-[#0F1115] border border-[#272C35] focus:border-[#22FF88] rounded-2xl px-3 py-2.5 text-sm outline-none text-white font-mono transition"
              >
                <option value={1}>1 Goal</option>
                <option value={3}>3 Goals</option>
                <option value={5}>5 Goals</option>
                <option value={7}>7 Goals</option>
                <option value={0}>No Limit (Time Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#00F0FF]" /> Time Limit (Mins)
              </label>
              <select
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full bg-[#0F1115] border border-[#272C35] focus:border-[#22FF88] rounded-2xl px-3 py-2.5 text-sm outline-none text-white font-mono transition"
              >
                <option value={3}>3 Minutes</option>
                <option value={5}>5 Minutes</option>
                <option value={7}>7 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={0}>No Time Limit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#FF00E5]" /> Password (Optional)
            </label>
            <input
              type="password"
              placeholder="Leave empty for open room"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0F1115] border border-[#272C35] focus:border-[#22FF88] rounded-2xl px-4 py-2.5 text-sm outline-none text-white font-mono placeholder:text-slate-600 transition"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded accent-[#22FF88]"
            />
            <label htmlFor="isPublic" className="text-sm text-slate-300 font-hanken">
              List room publicly in room browser
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#272C35]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-sora font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl text-xs font-sora font-bold bg-[#22FF88] hover:bg-[#1DE57A] text-[#0F1115] shadow-lg transition"
            >
              Create Arena Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
