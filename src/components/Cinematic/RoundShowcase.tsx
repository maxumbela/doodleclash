import React, { useEffect, useState } from 'react';
import { Player, PromptItem, RoomState } from '../../types/game';
import { Trophy, Award, Sparkles, Zap, ChevronRight } from 'lucide-react';
import { sounds } from '../../services/audio';

interface RoundShowcaseProps {
  room: RoomState;
  myId: string;
}

export const RoundShowcase: React.FC<RoundShowcaseProps> = ({ room, myId }) => {
  const roundIdx = room.currentRound - 1;
  const prompt = room.currentPrompt;
  const players = Object.values(room.players);
  const p1 = players[0];
  const p2 = players[1];

  const p1Drawing = p1?.drawings[roundIdx] || '';
  const p2Drawing = p2?.drawings[roundIdx] || '';

  const p1Accuracy = p1?.roundAccuracies[roundIdx] || 0;
  const p2Accuracy = p2?.roundAccuracies[roundIdx] || 0;

  const p1Score = p1?.roundScores[roundIdx] || 0;
  const p2Score = p2?.roundScores[roundIdx] || 0;

  // Rolling counter animation
  const [dispAccuracy1, setDispAccuracy1] = useState(0);
  const [dispAccuracy2, setDispAccuracy2] = useState(0);

  useEffect(() => {
    sounds.playWhoosh();
    setTimeout(() => {
      sounds.playScoreRoll();
    }, 400);

    let start = 0;
    const duration = 1200;
    const startTime = performance.now();

    const animateScores = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setDispAccuracy1(Math.round(p1Accuracy * ease));
      setDispAccuracy2(Math.round(p2Accuracy * ease));

      if (progress < 1) {
        requestAnimationFrame(animateScores);
      }
    };

    requestAnimationFrame(animateScores);
  }, [p1Accuracy, p2Accuracy]);

  const winner = room.roundWinnerId ? room.players[room.roundWinnerId] : null;
  const isMeWinner = winner?.id === myId;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between p-4 select-none scanlines overflow-y-auto">
      {/* Top Banner */}
      <div className="flex flex-col items-center gap-1 pt-2 animate-fade-in text-center flex-shrink-0">
        <div className="px-3 py-1 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-300 text-[11px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-md">
          <Zap className="w-3.5 h-3.5 text-arcade-yellow" />
          <span>ROUND {room.currentRound} SHOWDOWN</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black font-display tracking-wider bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
          BATTLE RESULTS
        </h2>
      </div>

      {/* Target Prompt Spotlight */}
      <div className="flex flex-col items-center justify-center my-2 flex-shrink-0">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600/30 to-pink-600/30 border border-purple-400/40 flex items-center justify-center text-4xl shadow-xl shadow-purple-500/20 animate-glow">
            {prompt?.emoji || '🎯'}
          </div>
          <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider border border-white/20">
            {prompt?.title}
          </span>
        </div>
      </div>

      {/* Versus Artwork Arena Side-by-Side */}
      <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto w-full flex-1 min-h-[220px] max-h-[380px] my-auto">
        {/* Player 1 Gallery Frame */}
        <div className={`flex flex-col rounded-3xl p-3 bg-slate-900/90 border-2 transition-all relative overflow-hidden shadow-2xl ${
          room.roundWinnerId === p1?.id
            ? 'border-arcade-yellow shadow-yellow-500/30 ring-2 ring-yellow-400/50'
            : 'border-slate-800'
        }`}>
          {room.roundWinnerId === p1?.id && (
            <div className="absolute top-2 right-2 p-1.5 rounded-xl bg-yellow-400 text-slate-950 shadow-md">
              <Trophy className="w-4 h-4 fill-slate-950" />
            </div>
          )}

          {/* Player header */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xl">{p1?.avatar || '🎨'}</span>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate max-w-[80px]">
                {p1?.name} {p1?.id === myId ? '(You)' : ''}
              </div>
            </div>
          </div>

          {/* Painting Image Container */}
          <div className="flex-1 w-full rounded-2xl bg-white overflow-hidden border border-slate-700/40 relative flex items-center justify-center">
            {p1Drawing ? (
              <img src={p1Drawing} alt="Artwork" className="w-full h-full object-contain" />
            ) : (
              <span className="text-xs text-slate-400">No drawing</span>
            )}
          </div>

          {/* Accuracy & Score readout */}
          <div className="mt-2.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-extrabold uppercase">
                ACCURACY
              </div>
              <div className="text-lg font-black text-pink-400 font-display">
                {dispAccuracy1}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-extrabold uppercase">
                POINTS
              </div>
              <div className="text-base font-black text-emerald-400 font-display">
                +{p1Score}
              </div>
            </div>
          </div>
        </div>

        {/* Player 2 Gallery Frame */}
        <div className={`flex flex-col rounded-3xl p-3 bg-slate-900/90 border-2 transition-all relative overflow-hidden shadow-2xl ${
          room.roundWinnerId === p2?.id
            ? 'border-arcade-yellow shadow-yellow-500/30 ring-2 ring-yellow-400/50'
            : 'border-slate-800'
        }`}>
          {room.roundWinnerId === p2?.id && (
            <div className="absolute top-2 right-2 p-1.5 rounded-xl bg-yellow-400 text-slate-950 shadow-md">
              <Trophy className="w-4 h-4 fill-slate-950" />
            </div>
          )}

          {/* Player header */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xl">{p2?.avatar || '⚡'}</span>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate max-w-[80px]">
                {p2?.name} {p2?.id === myId ? '(You)' : ''}
              </div>
            </div>
          </div>

          {/* Painting Image Container */}
          <div className="flex-1 w-full rounded-2xl bg-white overflow-hidden border border-slate-700/40 relative flex items-center justify-center">
            {p2Drawing ? (
              <img src={p2Drawing} alt="Artwork" className="w-full h-full object-contain" />
            ) : (
              <span className="text-xs text-slate-400">No drawing</span>
            )}
          </div>

          {/* Accuracy & Score readout */}
          <div className="mt-2.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-extrabold uppercase">
                ACCURACY
              </div>
              <div className="text-lg font-black text-cyan-400 font-display">
                {dispAccuracy2}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-extrabold uppercase">
                POINTS
              </div>
              <div className="text-base font-black text-emerald-400 font-display">
                +{p2Score}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Round Winner Banner */}
      <div className="flex flex-col items-center gap-2 pb-2 flex-shrink-0">
        <div className="px-5 py-2 rounded-2xl bg-gradient-to-r from-yellow-500/20 via-amber-500/30 to-yellow-500/20 border border-yellow-500/50 flex items-center gap-2 shadow-lg shadow-yellow-500/20">
          <Award className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-black text-white font-display tracking-wider">
            {winner ? `ROUND WINNER: ${winner.name}` : "IT'S A DRAW!"}
          </span>
        </div>

        {/* Progress to next round indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
          <span>Next round starting in</span>
          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-white font-bold font-display">
            {room.timerSeconds}s
          </span>
        </div>
      </div>
    </div>
  );
};
