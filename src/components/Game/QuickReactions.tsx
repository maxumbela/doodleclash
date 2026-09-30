import React, { useState, useEffect } from 'react';
import { network } from '../../services/webrtc';
import { sounds } from '../../services/audio';

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

const REACTIONS = ['🔥', '😱', '😂', '👏', '💯', '🎨'];

export const QuickReactions: React.FC = () => {
  const [activeReactions, setActiveReactions] = useState<FloatingReaction[]>([]);

  const triggerReaction = (emoji: string) => {
    sounds.playReaction();
    const id = Math.random().toString(36).substring(2, 9);
    const x = 20 + Math.random() * 60; // 20% to 80% screen width

    network.sendDrawingEvent({
      type: 'reaction',
      emoji,
      id,
      x
    });

    addFloatingEmoji({ id, emoji, x });
  };

  const addFloatingEmoji = (item: FloatingReaction) => {
    setActiveReactions(prev => [...prev, item]);
    setTimeout(() => {
      setActiveReactions(prev => prev.filter(r => r.id !== item.id));
    }, 2500);
  };

  useEffect(() => {
    const unsub = network.on('opponent_reaction', (data) => {
      sounds.playReaction();
      addFloatingEmoji({
        id: data.id || Math.random().toString(),
        emoji: data.emoji,
        x: data.x || 50
      });
    });

    return () => unsub();
  }, []);

  return (
    <>
      {/* Floating Reaction Sprites */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {activeReactions.map(r => (
          <div
            key={r.id}
            className="absolute bottom-24 text-4xl sm:text-5xl animate-float-up filter drop-shadow-lg"
            style={{
              left: `${r.x}%`,
              animation: 'floatUp 2.4s ease-out forwards',
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes floatUp {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.6);
          }
          15% {
            opacity: 1;
            transform: translateY(-40px) scale(1.3);
          }
          80% {
            opacity: 0.9;
            transform: translateY(-220px) scale(1.1);
          }
          100% {
            opacity: 0;
            transform: translateY(-300px) scale(0.9);
          }
        }
      `}</style>

      {/* Mini Reaction Pill Bar */}
      <div className="flex items-center justify-center gap-1.5 py-1 z-30">
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full glass-panel border border-white/10 shadow-lg">
          <span className="text-[10px] font-extrabold text-slate-400 mr-1 uppercase tracking-wider">
            TAUNT
          </span>
          {REACTIONS.map(emoji => (
            <button
              key={emoji}
              onClick={() => triggerReaction(emoji)}
              className="text-lg hover:scale-130 active:scale-90 transition-transform p-0.5"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
