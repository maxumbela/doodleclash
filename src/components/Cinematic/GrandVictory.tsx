import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Medal, RotateCcw, Home, Sparkles, ChevronRight, Award } from 'lucide-react';
import { RoomState } from '../../types/game';
import { sounds } from '../../services/audio';

interface GrandVictoryProps {
  room: RoomState;
  myId: string;
  onRematch: () => void;
  onLeave: () => void;
}

export const GrandVictory: React.FC<GrandVictoryProps> = ({
  room,
  myId,
  onRematch,
  onLeave,
}) => {
  const players = Object.values(room.players);
  const p1 = players[0];
  const p2 = players[1];

  const overallWinner = room.overallWinnerId ? room.players[room.overallWinnerId] : null;
  const isMeChampion = overallWinner?.id === myId;
  const isDraw = p1 && p2 && p1.score === p2.score;

  const [selectedRound, setSelectedRound] = useState(0);

  useEffect(() => {
    sounds.playVictory();

    // Launch celebratory confetti burst
    const end = Date.now() + 3000;
    const colors = ['#a855f7', '#ec4899', '#facc15', '#06b6d4', '#10b981'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between p-4 select-none scanlines overflow-y-auto">
      {/* Top Victory Header */}
      <div className="flex flex-col items-center gap-1 pt-2 animate-fade-in text-center flex-shrink-0">
        <div className="px-4 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-black tracking-widest uppercase flex items-center gap-2 shadow-lg">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span>CHAMPIONSHIP PODIUM</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-display tracking-wider bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
          {isDraw ? "HONORABLE DRAW!" : isMeChampion ? "VICTORY ROYALE!" : "MATCH COMPLETE!"}
        </h1>
      </div>

      {/* Champion Spotlight & Score Totals */}
      <div className="flex flex-col items-center justify-center my-auto py-2">
        {/* Trophy / Winner Avatar */}
        <div className="relative mb-3">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-yellow-600/40 to-amber-500/30 border-2 border-yellow-400 flex items-center justify-center text-5xl shadow-2xl shadow-yellow-500/30 animate-bounce-subtle">
            {overallWinner?.avatar || '🏆'}
          </div>
          <div className="absolute -bottom-2 -right-2 p-2 rounded-2xl bg-yellow-400 text-slate-950 shadow-md">
            <Trophy className="w-5 h-5 fill-slate-950" />
          </div>
        </div>

        <h3 className="text-lg font-black text-white font-display">
          {isDraw ? "Both Players Tied!" : `${overallWinner?.name} Wins the Tournament!`}
        </h3>

        {/* Final Score Cards */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-3">
          <div className={`p-3 rounded-2xl border text-center transition ${
            p1?.id === room.overallWinnerId
              ? 'bg-yellow-950/40 border-yellow-500/80 shadow-lg shadow-yellow-500/20'
              : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="text-xs font-bold text-slate-300 truncate mb-1">
              {p1?.name} {p1?.id === myId ? '(You)' : ''}
            </div>
            <div className="text-2xl font-black text-yellow-400 font-display">
              {p1?.score}
              <span className="text-xs text-slate-400 font-normal ml-1">pts</span>
            </div>
          </div>

          <div className={`p-3 rounded-2xl border text-center transition ${
            p2?.id === room.overallWinnerId
              ? 'bg-yellow-950/40 border-yellow-500/80 shadow-lg shadow-yellow-500/20'
              : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="text-xs font-bold text-slate-300 truncate mb-1">
              {p2?.name} {p2?.id === myId ? '(You)' : ''}
            </div>
            <div className="text-2xl font-black text-cyan-400 font-display">
              {p2?.score}
              <span className="text-xs text-slate-400 font-normal ml-1">pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Round Match Gallery Review */}
      <div className="w-full max-w-md mx-auto my-2 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            5-Round Art Gallery
          </span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map(idx => (
              <button
                key={idx}
                onClick={() => {
                  sounds.playPop();
                  setSelectedRound(idx);
                }}
                className={`w-6 h-6 rounded-lg text-xs font-black transition ${
                  selectedRound === idx
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                R{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Round Artwork Comparison */}
        <div className="p-3 rounded-2xl glass-panel border border-slate-800 flex items-center justify-between gap-2">
          {/* Player 1 Art */}
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full h-24 rounded-xl bg-white overflow-hidden border border-slate-700/40 flex items-center justify-center">
              {p1?.drawings[selectedRound] ? (
                <img src={p1.drawings[selectedRound]} alt="R" className="w-full h-full object-contain" />
              ) : (
                <span className="text-[10px] text-slate-400">No draw</span>
              )}
            </div>
            <div className="mt-1 text-[11px] font-bold text-slate-300 truncate max-w-full">
              {p1?.roundAccuracies[selectedRound] || 0}% Acc
            </div>
          </div>

          <div className="text-xs font-black text-slate-500">VS</div>

          {/* Player 2 Art */}
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full h-24 rounded-xl bg-white overflow-hidden border border-slate-700/40 flex items-center justify-center">
              {p2?.drawings[selectedRound] ? (
                <img src={p2.drawings[selectedRound]} alt="R" className="w-full h-full object-contain" />
              ) : (
                <span className="text-[10px] text-slate-400">No draw</span>
              )}
            </div>
            <div className="mt-1 text-[11px] font-bold text-slate-300 truncate max-w-full">
              {p2?.roundAccuracies[selectedRound] || 0}% Acc
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons: Rematch & Leave */}
      <div className="flex flex-col gap-2 pt-2 max-w-md mx-auto w-full flex-shrink-0">
        <button
          onClick={() => {
            sounds.playPop();
            onRematch();
          }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-base tracking-wider uppercase shadow-xl shadow-pink-600/30 active:scale-95 transition flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>PLAY REMATCH</span>
        </button>

        <button
          onClick={() => {
            sounds.playPop();
            onLeave();
          }}
          className="w-full py-2.5 rounded-xl glass-panel text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5"
        >
          <Home className="w-4 h-4" />
          <span>BACK TO LOBBY</span>
        </button>
      </div>
    </div>
  );
};
