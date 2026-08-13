import React from 'react';
import { Volume2, VolumeX, Shield, User, HelpCircle, Trophy, RefreshCw } from 'lucide-react';
import { soundEngine } from '../lib/audio';

interface HeaderProps {
  nickname: string;
  avatar: string;
  onOpenNicknameModal: () => void;
  onOpenHelpModal: () => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  currentRoomName?: string;
  onLeaveRoom?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  nickname,
  avatar,
  onOpenNicknameModal,
  onOpenHelpModal,
  isMuted,
  setIsMuted,
  currentRoomName,
  onLeaveRoom,
}) => {
  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundEngine.setMuted(nextMute);
  };

  return (
    <header className="h-16 bg-[#0F1115] border-b border-[#272C35] text-[#E0E4EC] px-4 sm:px-8 flex items-center justify-between shadow-md select-none shrink-0 font-hanken">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#22FF88] text-[#0F1115] font-sora font-extrabold text-xs rounded-xl flex items-center justify-center tracking-tight shadow-[0_0_15px_rgba(34,255,136,0.25)]">
          SA
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-sm sm:text-base font-sora font-bold tracking-tight text-white flex items-center gap-2">
            SOCCER ARENA
          </h1>
          {currentRoomName && (
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-[#181B20] border border-[#272C35] text-xs text-[#00F0FF] font-mono ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22FF88] mr-2 animate-pulse" />
              {currentRoomName}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {currentRoomName && onLeaveRoom && (
          <button
            onClick={onLeaveRoom}
            className="px-3.5 py-1.5 rounded-xl text-xs font-sora font-bold bg-[#FF00E5]/10 text-[#FF00E5] hover:bg-[#FF00E5]/20 border border-[#FF00E5]/30 transition"
          >
            LEAVE
          </button>
        )}

        {/* Audio Toggle */}
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-2 rounded-xl bg-[#181B20] hover:bg-[#21252D] text-[#E0E4EC] border border-[#272C35] transition"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-[#FF00E5]" /> : <Volume2 className="w-4 h-4 text-[#22FF88]" />}
        </button>

        {/* Help / Controls */}
        <button
          onClick={onOpenHelpModal}
          title="Controls & How to Play"
          className="p-2 rounded-xl bg-[#181B20] hover:bg-[#21252D] text-[#E0E4EC] border border-[#272C35] transition"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Profile */}
        <button
          onClick={onOpenNicknameModal}
          className="flex items-center gap-2 bg-[#181B20] hover:bg-[#21252D] px-3 py-1.5 rounded-xl border border-[#272C35] text-xs font-medium transition"
        >
          <div className="w-5 h-5 rounded-full bg-[#22FF88]/20 text-[#22FF88] font-mono font-bold text-[10px] flex items-center justify-center border border-[#22FF88]/40">
            {avatar || '10'}
          </div>
          <span className="font-sora font-bold text-[#E0E4EC] max-w-[90px] sm:max-w-[120px] truncate">{nickname}</span>
        </button>
      </div>
    </header>
  );
};
