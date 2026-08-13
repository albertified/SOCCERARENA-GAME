import React from 'react';
import { HelpCircle, X, Move, Space, ShieldAlert, Trophy } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0F1115]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-hanken">
      <div className="bg-[#181B20] border border-[#272C35] rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl text-[#E0E4EC] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-sora font-bold text-white">How to Play Soccer Arena</h2>
              <p className="text-xs text-slate-400 font-medium">Controls, rules and kicking mechanics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#21252D] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm text-slate-300">
          <div className="bg-[#0F1115] p-4 rounded-2xl border border-[#272C35] space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase text-[#22FF88] flex items-center gap-2">
              <Move className="w-4 h-4" /> Movement Controls
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#181B20] p-3 rounded-xl border border-[#272C35]">
                <span className="font-mono bg-[#0F1115] px-2 py-1 rounded-lg text-white font-bold border border-[#272C35]">W A S D</span> or <span className="font-mono bg-[#0F1115] px-2 py-1 rounded-lg text-white font-bold border border-[#272C35]">Arrows</span>
                <p className="text-slate-400 mt-1.5">Steer your player disc on the pitch</p>
              </div>
              <div className="bg-[#181B20] p-3 rounded-xl border border-[#272C35]">
                <span className="font-mono bg-[#0F1115] px-2 py-1 rounded-lg text-white font-bold border border-[#272C35]">SPACE</span> or <span className="font-mono bg-[#0F1115] px-2 py-1 rounded-lg text-white font-bold border border-[#272C35]">X</span>
                <p className="text-slate-400 mt-1.5">Kick the ball / Power shot impulse</p>
              </div>
              <div className="bg-[#181B20] p-3 rounded-xl border border-[#272C35]">
                <span className="font-mono bg-[#0F1115] px-2 py-1 rounded-lg text-[#00F0FF] font-bold border border-[#272C35]">Q / Z</span>
                <p className="text-slate-400 mt-1.5">Hold to ◄ Curve Left (Counter-clockwise bend)</p>
              </div>
              <div className="bg-[#181B20] p-3 rounded-xl border border-[#272C35]">
                <span className="font-mono bg-[#0F1115] px-2 py-1 rounded-lg text-[#22FF88] font-bold border border-[#272C35]">E / C</span>
                <p className="text-slate-400 mt-1.5">Hold to Curve Right ► (Clockwise bend)</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0F1115] p-4 rounded-2xl border border-[#272C35] space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase text-[#22FF88] flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Rules & Objectives
            </h3>
            <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
              <li>Score goals by kicking the ball into the opponent's goal mouth.</li>
              <li>Red team scores in the Right Goal; Blue team scores in the Left Goal.</li>
              <li>Press Space/X while close to the ball to shoot with high velocity!</li>
              <li>When kicking, a white ring indicator appears around your disc.</li>
              <li>First team to reach the score limit or lead when time expires wins!</li>
            </ul>
          </div>

          <div className="bg-[#0F1115] p-4 rounded-2xl border border-[#272C35] space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase text-[#00F0FF] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Multi-room & Team Management
            </h3>
            <p className="text-xs text-slate-400">
              In the lobby, click <strong className="text-white">"RED"</strong> or <strong className="text-white">"BLU"</strong> to select your side, or <strong className="text-white">"SPEC"</strong> to watch the match. Room hosts can adjust stadium pitch size, time limits, and start matches!
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl text-xs font-sora font-bold bg-[#22FF88] hover:bg-[#1DE57A] text-[#0F1115] shadow-lg transition"
          >
            Got it, let's play!
          </button>
        </div>
      </div>
    </div>
  );
};
