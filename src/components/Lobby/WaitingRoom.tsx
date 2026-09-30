import React, { useState } from 'react';
import { Copy, Check, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';
import { Player, RoomState } from '../../types/game';
import { sounds } from '../../services/audio';

interface WaitingRoomProps {
  room: RoomState;
  myId: string;
  isWebRTCConnected: boolean;
  onToggleReady: (ready: boolean) => void;
  onLeave: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  room,
  myId,
  isWebRTCConnected,
  onToggleReady,
  onLeave,
}) => {
  const [copied, setCopied] = useState(false);
  const myPlayer = room.players[myId];
  const isReady = myPlayer?.ready || false;

  const playerList = Object.values(room.players);
  const hostPlayer = playerList.find(p => p.isHost);
  const guestPlayer = playerList.find(p => !p.isHost);

  const copyCode = () => {
    sounds.playPop();
    navigator.clipboard.writeText(room.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto p-4 justify-between select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => {
            sounds.playPop();
            onLeave();
          }}
          className="p-2 rounded-xl glass-panel text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>LEAVE</span>
        </button>

        {/* WebRTC Status Pill */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition ${
          isWebRTCConnected
            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
            : 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300'
        }`}>
          <Zap className="w-3 h-3 animate-pulse" />
          <span>{isWebRTCConnected ? 'P2P WebRTC Direct' : 'Signaling Sync'}</span>
        </div>
      </div>

      {/* 4-Digit Code Big Display */}
      <div className="flex flex-col items-center gap-2 my-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          ROOM PIN CODE
        </span>
        <div
          onClick={copyCode}
          className="cursor-pointer group relative flex items-center justify-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-purple-900/60 border-2 border-purple-500/60 shadow-xl shadow-purple-500/20 hover:scale-105 active:scale-95 transition"
        >
          <div className="text-4xl font-black tracking-[0.35em] text-white font-display ml-2">
            {room.roomId}
          </div>
          <div className="p-2 rounded-xl bg-purple-800/80 text-purple-200">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </div>
        </div>
        <p className="text-[11px] text-slate-400">
          Share this 4-digit code with your challenger to start!
        </p>
      </div>

      {/* Players Versus Cards */}
      <div className="grid grid-cols-2 gap-3 my-auto">
        {/* Player 1 Card (Host) */}
        <div className={`glass-panel rounded-3xl p-4 flex flex-col items-center justify-between text-center relative border transition ${
          hostPlayer?.ready ? 'border-emerald-500/80 shadow-lg shadow-emerald-500/20' : 'border-slate-800'
        }`}>
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/40 mb-2">
            HOST
          </span>
          <div className="text-4xl my-2 p-3 rounded-2xl bg-slate-900/90 shadow-inner">
            {hostPlayer?.avatar || '🎨'}
          </div>
          <h3 className="font-bold text-sm text-white truncate max-w-full">
            {hostPlayer?.name || 'Waiting...'}
          </h3>
          <div className={`mt-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            hostPlayer?.ready
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
              : 'bg-slate-800 text-slate-400'
          }`}>
            {hostPlayer?.ready ? 'READY' : 'NOT READY'}
          </div>
        </div>

        {/* Player 2 Card (Guest) */}
        <div className={`glass-panel rounded-3xl p-4 flex flex-col items-center justify-between text-center relative border transition ${
          guestPlayer?.ready ? 'border-emerald-500/80 shadow-lg shadow-emerald-500/20' : 'border-slate-800'
        }`}>
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 mb-2">
            CHALLENGER
          </span>
          {guestPlayer ? (
            <>
              <div className="text-4xl my-2 p-3 rounded-2xl bg-slate-900/90 shadow-inner">
                {guestPlayer.avatar}
              </div>
              <h3 className="font-bold text-sm text-white truncate max-w-full">
                {guestPlayer.name}
              </h3>
              <div className={`mt-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                guestPlayer.ready
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {guestPlayer.ready ? 'READY' : 'NOT READY'}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center my-auto py-4">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center animate-spin text-slate-600 mb-2">
                •
              </div>
              <p className="text-xs text-slate-400 font-semibold animate-pulse">
                Waiting for player 2...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Match Rules Pill */}
      <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>5 Rounds • 45s Timer • Accuracy Points</span>
        </div>
        <span className="text-slate-300 font-bold">2/2 Players</span>
      </div>

      {/* Action / Ready Button */}
      <div className="pt-2">
        <button
          onClick={() => {
            sounds.playPop();
            onToggleReady(!isReady);
          }}
          disabled={!guestPlayer}
          className={`w-full py-4 rounded-2xl font-black text-base tracking-wider uppercase shadow-xl transition flex items-center justify-center gap-2 active:scale-95 ${
            !guestPlayer
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : isReady
              ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 ring-2 ring-emerald-300'
              : 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white shadow-pink-600/30'
          }`}
        >
          {isReady ? (
            <>
              <Check className="w-5 h-5 stroke-[3]" />
              <span>LOCKED IN (READY)</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>LOCK IN & READY</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
