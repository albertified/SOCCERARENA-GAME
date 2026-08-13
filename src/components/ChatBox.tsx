import React, { useEffect, useRef, useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { ChatMessage } from '../types/haxball';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
    // Blur input so keyboard focus immediately returns to WASD/Arrows movement
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      (e.target as HTMLElement).blur();
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-[380px] lg:h-[480px]">
      <div className="p-1 pb-3 border-b border-slate-800">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Match Chat
        </h2>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto space-y-3 p-2 my-2 text-xs">
        {messages.length === 0 ? (
          <p className="text-slate-500 italic text-center py-10 text-xs">No chat activity yet. Send a message to team!</p>
        ) : (
          messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">System</span>
                  <span className="text-emerald-400 italic text-xs">{msg.text}</span>
                </div>
              );
            }

            const isRed = msg.senderTeam === 'red';
            const isBlue = msg.senderTeam === 'blue';

            return (
              <div key={msg.id} className="flex flex-col leading-snug">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isRed ? 'text-red-500' : isBlue ? 'text-blue-500' : 'text-slate-500'
                  }`}
                >
                  {msg.senderName}
                </span>
                <span className="text-slate-300 break-words text-xs font-normal">{msg.text}</span>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="pt-2 border-t border-slate-800">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex items-center gap-2 focus-within:border-emerald-500/80 transition">
          <input
            type="text"
            maxLength={100}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type message (Press Enter/ESC to lock movement)..."
            className="bg-transparent border-none outline-none text-xs w-full text-slate-200 placeholder:text-slate-600 px-1"
          />
          <button
            type="submit"
            className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm transition shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
