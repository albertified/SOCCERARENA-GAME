import React, { useState } from 'react';
import { User, Check, Sparkles } from 'lucide-react';

interface NicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
  nickname: string;
  avatar: string;
  onSave: (name: string, avatar: string) => void;
}

const AVATAR_OPTIONS = ['10', '7', '9', '11', '1', '99', '23', '8', '🔥', '⚡', '⚽', '👑', '🛡️', '💎'];

export const NicknameModal: React.FC<NicknameModalProps> = ({
  isOpen,
  onClose,
  nickname,
  avatar,
  onSave,
}) => {
  const [nameInput, setNameInput] = useState(nickname);
  const [avatarInput, setAvatarInput] = useState(avatar || '10');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onSave(nameInput.trim(), avatarInput);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0F1115]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-hanken">
      <div className="bg-[#181B20] border border-[#272C35] rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl text-[#E0E4EC] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-[#22FF88]/10 text-[#22FF88] border border-[#22FF88]/20">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-sora font-bold text-white">Player Profile</h2>
            <p className="text-xs text-slate-400">Choose your display nickname and shirt number or badge</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-2">Nickname</label>
            <input
              type="text"
              maxLength={15}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter nickname..."
              className="w-full bg-[#0F1115] border border-[#272C35] focus:border-[#22FF88] rounded-2xl px-4 py-2.5 text-sm outline-none text-white font-mono placeholder:text-slate-600 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-2">Disc Number / Badge</label>
            <div className="grid grid-cols-7 gap-2">
              {AVATAR_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAvatarInput(opt)}
                  className={`h-10 rounded-xl font-mono font-bold text-xs flex items-center justify-center border transition ${
                    avatarInput === opt
                      ? 'bg-[#22FF88] text-[#0F1115] border-[#22FF88] shadow-lg shadow-[#22FF88]/20'
                      : 'bg-[#0F1115] border-[#272C35] text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
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
              className="px-6 py-2.5 rounded-2xl text-xs font-sora font-bold bg-[#22FF88] hover:bg-[#1DE57A] text-[#0F1115] shadow-lg transition flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
