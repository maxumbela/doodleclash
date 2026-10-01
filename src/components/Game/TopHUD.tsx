import React from 'react';
import { Player, PromptItem } from '../../types/game';
import { SplitSquareVertical, Minimize2, Lightbulb } from 'lucide-react';
import { sounds } from '../../services/audio';

interface TopHUDProps {
  currentRound: number;
  totalRounds: number;
  prompt: PromptItem | null;
  timerSeconds: number;
  maxTimerSeconds?: number;
  myPlayer: Player;
  opponentPlayer: Player | undefined;
  layoutMode: 'split' | 'pip';
  onToggleLayout: () => void;
}

export const TopHUD: React.FC<TopHUDProps> = ({
  currentRound,
  totalRounds,
  prompt,
  timerSeconds,
  maxTimerSeconds = 45,
  myPlayer,
  opponentPlayer,
  layoutMode,
  onToggleLayout,
}) => {
  const isUrgent = timerSeconds <= 5;
  const isWarning = timerSeconds <= 15 && timerSeconds > 5;
  const progressPercent = Math.min(100, Math.max(0, (timerSeconds / maxTimerSeconds) * 100));

  return (
    <div className="w-full flex flex-col gap-1.5 px-3 pt-2 pb-1 select-none flex-shrink-0 z-20">
      {/* Top row: Round, Timer, Layout switch */}
      <div className="flex items-center justify-between">
        {/* Round Badge */}
        <div className="px-2.5 py-1 rounded-xl bg-purple-950/80 border border-purple-600/40 text-purple-300 text-xs font-black tracking-wider flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
          <span>ROUND {currentRound}/{totalRounds}</span>
        </div>

        {/* Central Circular / Pill Countdown Timer */}
        <div className={`flex items-center gap-1 px-4 py-1 rounded-2xl border font-display font-black text-base tracking-widest transition-all ${
          isUrgent
            ? 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/50 scale-110 animate-pulse'
            : isWarning
            ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-md shadow-amber-500/30'
            : 'bg-slate-900/90 border-slate-700/80 text-white shadow-md'
        }`}>
          <span className="text-xs text-slate-400 font-sans font-bold">⏱</span>
          <span>{timerSeconds}s</span>
        </div>

        {/* Dual Screen Mode Toggle */}
        <button
          onClick={() => {
            sounds.playPop();
            onToggleLayout();
          }}
          className="px-2.5 py-1 rounded-xl glass-panel text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
          title="Toggle Canvas View"
        >
          {layoutMode === 'split' ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px]">PiP</span>
            </>
          ) : (
            <>
              <SplitSquareVertical className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-[11px]">Split</span>
            </>
          )}
        </button>
      </div>

      {/* Dynamic Timer Progress Bar */}
      <div className="w-full h-1 bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${
            isUrgent
              ? 'bg-rose-500 shadow-sm shadow-rose-500/80'
              : isWarning
              ? 'bg-amber-500 shadow-sm shadow-amber-500/80'
              : 'bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Target Prompt Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/50 to-pink-900/40 border border-purple-500/30 p-2 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl filter drop-shadow animate-bounce-subtle">
            {prompt?.emoji || '🎯'}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-pink-400">
                DRAW THIS
              </span>
              {prompt?.category && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/50 font-bold uppercase">
                  {prompt.category}
                </span>
              )}
            </div>
            <span className="text-base font-black text-white leading-tight font-display tracking-wide">
              {prompt?.title || 'Mystery Challenge'}
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-purple-200/80 bg-purple-950/60 px-2.5 py-1 rounded-xl border border-purple-800/30 max-w-[180px] truncate">
          <Lightbulb className="w-3.5 h-3.5 text-arcade-yellow flex-shrink-0" />
          <span className="truncate">{prompt?.hint}</span>
        </div>

        {/* Live Score Tally */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-bold truncate max-w-[65px]">
              {myPlayer.name}
            </div>
            <div className="text-xs font-black text-emerald-400 font-display">
              {myPlayer.score} <span className="text-[9px]">pts</span>
            </div>
          </div>
          <div className="text-slate-600 font-black text-xs">VS</div>
          <div className="text-left">
            <div className="text-[10px] text-slate-400 font-bold truncate max-w-[65px]">
              {opponentPlayer?.name || 'Rival'}
            </div>
            <div className="text-xs font-black text-cyan-400 font-display">
              {opponentPlayer?.score || 0} <span className="text-[9px]">pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

