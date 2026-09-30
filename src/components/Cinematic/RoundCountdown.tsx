import React, { useEffect } from 'react';
import { PromptItem } from '../../types/game';
import { sounds } from '../../services/audio';

interface RoundCountdownProps {
  currentRound: number;
  prompt: PromptItem | null;
  timerSeconds: number; // 3, 2, 1
}

export const RoundCountdown: React.FC<RoundCountdownProps> = ({
  currentRound,
  prompt,
  timerSeconds,
}) => {
  useEffect(() => {
    if (timerSeconds > 0) {
      sounds.playWarningBeep();
    } else {
      sounds.playBuzzer();
    }
  }, [timerSeconds]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none scanlines animate-fade-in">
      <div className="px-4 py-1 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs font-black tracking-widest uppercase mb-4 shadow-lg">
        ROUND {currentRound} STARTING
      </div>

      {/* Target Preview */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="text-7xl sm:text-8xl filter drop-shadow-2xl animate-bounce">
          {prompt?.emoji || '🎯'}
        </div>
        <h2 className="text-3xl sm:text-4xl font-black font-display text-white tracking-wide">
          Draw "{prompt?.title}"!
        </h2>
        <p className="text-sm font-semibold text-purple-300 bg-purple-950/60 px-4 py-1.5 rounded-full border border-purple-800/40">
          💡 {prompt?.hint}
        </p>
      </div>

      {/* 3, 2, 1 Countdown Number */}
      <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-6xl font-black font-display text-white shadow-2xl shadow-pink-500/50 animate-ping-once">
        {timerSeconds > 0 ? timerSeconds : 'GO!'}
      </div>
    </div>
  );
};
