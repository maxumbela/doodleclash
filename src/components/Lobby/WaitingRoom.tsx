import React, { useState } from 'react';
import { Copy, Check, ShieldCheck, Zap, ArrowLeft, SlidersHorizontal, Clock, Trophy, Shapes, Link } from 'lucide-react';
import { Player, RoomSettings, RoomState } from '../../types/game';
import { sounds } from '../../services/audio';

interface WaitingRoomProps {
  room: RoomState;
  myId: string;
  isWebRTCConnected: boolean;
  onToggleReady: (ready: boolean) => void;
  onUpdateSettings?: (settings: Partial<RoomSettings>) => void;
  onLeave: () => void;
}

const TIME_OPTIONS = [30, 45, 60, 90, 120];
const ROUND_OPTIONS = [1, 3, 5, 7];
const CATEGORY_OPTIONS = [
  { id: 'all', label: 'All', emoji: '🎨' },
  { id: 'Animal', label: 'Animals', emoji: '🐱' },
  { id: 'Food', label: 'Food', emoji: '🍕' },
  { id: 'Vehicle', label: 'Vehicles', emoji: '🚗' },
  { id: 'Object', label: 'Objects', emoji: '👑' },
  { id: 'Nature', label: 'Nature', emoji: '🌻' },
];

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  room,
  myId,
  isWebRTCConnected,
  onToggleReady,
  onUpdateSettings,
  onLeave,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const myPlayer = room.players[myId];
  const isReady = myPlayer?.ready || false;
  const isHost = myPlayer?.isHost || false;

  const currentSettings: RoomSettings = room.settings || {
    roundDuration: 45,
    totalRounds: room.totalRounds || 5,
    category: 'all'
  };

  const playerList = Object.values(room.players);
  const hostPlayer = playerList.find(p => p.isHost);
  const guestPlayer = playerList.find(p => !p.isHost);

  const copyCode = () => {
    sounds.playPop();
    navigator.clipboard.writeText(room.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    sounds.playPop();
    const link = `${window.location.origin}${window.location.pathname}?room=${room.roomId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSettingChange = (patch: Partial<RoomSettings>) => {
    if (!isHost) return;
    sounds.playPop();
    onUpdateSettings?.(patch);
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
          className="p-2 rounded-xl glass-panel text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs font-bold active:scale-95"
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
          <span>{isWebRTCConnected ? 'P2P Direct' : 'Signaling Sync'}</span>
        </div>
      </div>

      {/* 4-Digit Code Big Display */}
      <div className="flex flex-col items-center gap-1.5 my-2">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
          ROOM PIN CODE
        </span>
        <div
          onClick={copyCode}
          className="cursor-pointer group relative flex items-center justify-center gap-3 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-purple-900/60 border-2 border-purple-500/60 shadow-xl shadow-purple-500/20 hover:scale-105 active:scale-95 transition"
        >
          <div className="text-3xl sm:text-4xl font-black tracking-[0.35em] text-white font-display ml-2">
            {room.roomId}
          </div>
          <div className="p-2 rounded-xl bg-purple-800/80 text-purple-200">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </div>
        </div>

        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition border border-purple-500/30 cursor-pointer active:scale-95"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link className="w-3.5 h-3.5 text-purple-400" />}
          <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Direct Invite Link'}</span>
        </button>

        <p className="text-[10px] text-slate-400">
          Share this 4-digit code or direct link with your challenger to start!
        </p>
      </div>

      {/* Players Versus Cards */}
      <div className="grid grid-cols-2 gap-3 my-2">
        {/* Player 1 Card (Host) */}
        <div className={`glass-panel rounded-3xl p-3 flex flex-col items-center justify-between text-center relative border transition ${
          hostPlayer?.ready ? 'border-emerald-500/80 shadow-lg shadow-emerald-500/20' : 'border-slate-800'
        }`}>
          <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/40 mb-1">
            HOST
          </span>
          <div className="text-3xl my-1 p-2.5 rounded-2xl bg-slate-900/90 shadow-inner">
            {hostPlayer?.avatar || '🎨'}
          </div>
          <h3 className="font-bold text-xs sm:text-sm text-white truncate max-w-full">
            {hostPlayer?.name || 'Waiting...'}
          </h3>
          <div className={`mt-2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
            hostPlayer?.ready
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
              : 'bg-slate-800 text-slate-400'
          }`}>
            {hostPlayer?.ready ? 'READY' : 'NOT READY'}
          </div>
        </div>

        {/* Player 2 Card (Guest) */}
        <div className={`glass-panel rounded-3xl p-3 flex flex-col items-center justify-between text-center relative border transition ${
          guestPlayer?.ready ? 'border-emerald-500/80 shadow-lg shadow-emerald-500/20' : 'border-slate-800'
        }`}>
          <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 mb-1">
            CHALLENGER
          </span>
          {guestPlayer ? (
            <>
              <div className="text-3xl my-1 p-2.5 rounded-2xl bg-slate-900/90 shadow-inner">
                {guestPlayer.avatar}
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-white truncate max-w-full">
                {guestPlayer.name}
              </h3>
              <div className={`mt-2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                guestPlayer.ready
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {guestPlayer.ready ? 'READY' : 'NOT READY'}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center my-auto py-2">
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center animate-spin text-slate-600 mb-1">
                •
              </div>
              <p className="text-[10px] text-slate-400 font-semibold animate-pulse">
                Waiting for player 2...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Match Rules & Host Customization Panel */}
      <div className="rounded-2xl bg-slate-900/90 border border-purple-500/30 p-3 shadow-lg flex flex-col gap-2.5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
            <span>MATCH RULES</span>
            {isHost ? (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/70 text-purple-300 border border-purple-700/50 font-semibold">
                HOST CONTROLS
              </span>
            ) : (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-semibold">
                SET BY HOST
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-bold">
            {playerList.length}/2 Players
          </span>
        </div>

        {/* Rule 1: Round Duration */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              Round Timer
            </span>
            <span className="text-cyan-300 font-black text-xs">
              {currentSettings.roundDuration}s
            </span>
          </div>
          {isHost ? (
            <div className="grid grid-cols-5 gap-1">
              {TIME_OPTIONS.map(sec => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => handleSettingChange({ roundDuration: sec })}
                  className={`py-1 text-[11px] font-bold rounded-lg transition active:scale-95 ${
                    currentSettings.roundDuration === sec
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] font-semibold text-slate-300 flex items-center justify-between">
              <span>Time per drawing:</span>
              <span className="text-cyan-400 font-bold">{currentSettings.roundDuration} seconds</span>
            </div>
          )}
        </div>

        {/* Rule 2: Total Rounds */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              Total Rounds
            </span>
            <span className="text-amber-300 font-black text-xs">
              {currentSettings.totalRounds} {currentSettings.totalRounds === 1 ? 'Round' : 'Rounds'}
            </span>
          </div>
          {isHost ? (
            <div className="grid grid-cols-4 gap-1">
              {ROUND_OPTIONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleSettingChange({ totalRounds: r })}
                  className={`py-1 text-[11px] font-bold rounded-lg transition active:scale-95 ${
                    currentSettings.totalRounds === r
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80'
                  }`}
                >
                  {r} {r === 1 ? 'Round' : 'Rounds'}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] font-semibold text-slate-300 flex items-center justify-between">
              <span>Match length:</span>
              <span className="text-amber-400 font-bold">{currentSettings.totalRounds} {currentSettings.totalRounds === 1 ? 'Round' : 'Rounds'}</span>
            </div>
          )}
        </div>

        {/* Rule 3: Word Categories */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Shapes className="w-3 h-3 text-pink-400" />
              Theme Category
            </span>
            <span className="text-pink-300 font-bold text-xs capitalize">
              {currentSettings.category}
            </span>
          </div>
          {isHost ? (
            <div className="grid grid-cols-3 gap-1">
              {CATEGORY_OPTIONS.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSettingChange({ category: cat.id })}
                  className={`py-1 px-1.5 text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1 active:scale-95 ${
                    currentSettings.category.toLowerCase() === cat.id.toLowerCase()
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30 ring-1 ring-pink-400'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] font-semibold text-slate-300 flex items-center justify-between">
              <span>Category:</span>
              <span className="text-pink-400 font-bold capitalize">{currentSettings.category}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action / Ready Button */}
      <div className="pt-2">
        <button
          onClick={() => {
            sounds.playPop();
            onToggleReady(!isReady);
          }}
          disabled={!guestPlayer}
          className={`w-full py-3.5 rounded-2xl font-black text-sm sm:text-base tracking-wider uppercase shadow-xl transition flex items-center justify-center gap-2 active:scale-95 ${
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

