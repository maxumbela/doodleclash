import React, { useState } from 'react';
import { Sparkles, Gamepad2, Volume2, VolumeX, ArrowRight, Palette } from 'lucide-react';
import { sounds } from '../../services/audio';

interface RoomJoinProps {
  onHostRoom: (name: string, avatar: string, settings?: any) => void;
  onJoinRoom: (roomId: string, name: string, avatar: string) => void;
  isAudioOn: boolean;
  onToggleAudio: () => void;
}

const AVATARS = ['🐱', '🦊', '🤖', '👾', '🦄', '🐼', '🐯', '🚀', '🔥', '⚡'];

export const RoomJoin: React.FC<RoomJoinProps> = ({
  onHostRoom,
  onJoinRoom,
  isAudioOn,
  onToggleAudio,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🐱');
  const [roomCode, setRoomCode] = useState('');

  // Host customization presets
  const [roundDuration, setRoundDuration] = useState<number>(45);
  const [totalRounds, setTotalRounds] = useState<number>(5);
  const [category, setCategory] = useState<string>('all');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playPop();
    const finalName = name.trim() || `Artist ${Math.floor(100 + Math.random() * 900)}`;
    onHostRoom(finalName, selectedAvatar, {
      roundDuration,
      totalRounds,
      category
    });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.length !== 4) return;
    sounds.playPop();
    const finalName = name.trim() || `Challenger ${Math.floor(100 + Math.random() * 900)}`;
    onJoinRoom(roomCode, finalName, selectedAvatar);
  };

  const handleNumClick = (num: string) => {
    sounds.playTick();
    if (roomCode.length < 4) {
      setRoomCode(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    sounds.playPop();
    setRoomCode(prev => prev.slice(0, -1));
  };

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto p-4 justify-between select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 shadow-lg shadow-purple-500/30">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-display">
              DOODLE CLASH
            </h1>
            <p className="text-[11px] font-semibold text-slate-400 tracking-widest uppercase">
              1v1 Real-Time Drawing Arena
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playPop();
            onToggleAudio();
          }}
          className="p-2.5 rounded-xl glass-panel text-slate-300 hover:text-white transition"
          aria-label="Toggle Audio"
        >
          {isAudioOn ? <Volume2 className="w-5 h-5 text-arcade-yellow" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
        </button>
      </div>

      {/* Main Card */}
      <div className="glass-panel-glow rounded-3xl p-5 my-auto flex flex-col gap-4">
        {/* Avatar & Name Selection */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Select Your Avatar
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {AVATARS.map(avatar => (
              <button
                key={avatar}
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setSelectedAvatar(avatar);
                }}
                className={`text-2xl p-2 rounded-2xl transition transform active:scale-95 ${
                  selectedAvatar === avatar
                    ? 'bg-purple-600 ring-2 ring-purple-400 scale-110 shadow-lg shadow-purple-500/40'
                    : 'bg-slate-800/80 hover:bg-slate-700/80'
                }`}
              >
                {avatar}
              </button>
            ))}
          </div>

          <div className="mt-3">
            <input
              type="text"
              placeholder="Enter your nickname..."
              maxLength={15}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
            />
          </div>
        </div>

        {/* Tab Switcher: Create vs Join */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900/80 border border-slate-800">
          <button
            onClick={() => {
              sounds.playPop();
              setTab('create');
            }}
            className={`py-2.5 text-xs font-bold rounded-xl transition ${
              tab === 'create'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CREATE ROOM
          </button>
          <button
            onClick={() => {
              sounds.playPop();
              setTab('join');
            }}
            className={`py-2.5 text-xs font-bold rounded-xl transition ${
              tab === 'join'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            JOIN 4-DIGIT
          </button>
        </div>

        {tab === 'create' ? (
          /* Create Room Section with Host Options */
          <div className="flex flex-col gap-3 py-1">
            {/* Quick Rules Setup */}
            <div className="p-3 rounded-2xl bg-slate-900/70 border border-purple-500/30 flex flex-col gap-2">
              <span className="text-[10px] font-black tracking-wider text-purple-400 uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Customize Arena Match Rules
              </span>

              {/* Time Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Round Timer:</span>
                <div className="flex gap-1">
                  {[30, 45, 60, 90].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRoundDuration(s)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                        roundDuration === s
                          ? 'bg-purple-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Rounds Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Total Rounds:</span>
                <div className="flex gap-1">
                  {[3, 5, 7].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setTotalRounds(r)}
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition ${
                        totalRounds === r
                          ? 'bg-amber-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Category:</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded-lg px-2 py-0.5 focus:outline-none focus:border-purple-500 font-semibold"
                >
                  <option value="all">🎨 All Themes</option>
                  <option value="Animal">🐱 Animals</option>
                  <option value="Food">🍕 Food</option>
                  <option value="Vehicle">🚗 Vehicles</option>
                  <option value="Object">👑 Objects</option>
                  <option value="Nature">🌻 Nature</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCreate}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-base tracking-wider uppercase shadow-xl shadow-pink-600/30 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Gamepad2 className="w-5 h-5" />
              CREATE BATTLE ROOM
            </button>
          </div>
        ) : (

          /* Join Room via 4-Digit Code */
          <div className="flex flex-col gap-3">
            {/* 4-Digit Display */}
            <div className="flex justify-center items-center gap-3 py-1">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-12 h-14 rounded-2xl flex items-center justify-center text-2xl font-black font-display border transition-all ${
                    roomCode[i]
                      ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/30 scale-105'
                      : 'bg-slate-900/60 border-slate-700/60 text-slate-500'
                  }`}
                >
                  {roomCode[i] || '•'}
                </div>
              ))}
            </div>

            {/* Custom Phone Numpad */}
            <div className="grid grid-cols-3 gap-2 px-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumClick(num)}
                  className="py-3 rounded-xl bg-slate-800/70 hover:bg-slate-750 text-white text-lg font-bold active:bg-cyan-700 active:scale-95 transition"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRoomCode('')}
                className="py-3 rounded-xl bg-slate-800/40 text-xs text-slate-400 font-bold active:scale-95 transition"
              >
                CLEAR
              </button>
              <button
                type="button"
                onClick={() => handleNumClick('0')}
                className="py-3 rounded-xl bg-slate-800/70 text-white text-lg font-bold active:bg-cyan-700 active:scale-95 transition"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="py-3 rounded-xl bg-slate-800/40 text-xs text-rose-400 font-bold active:scale-95 transition"
              >
                DEL
              </button>
            </div>

            <button
              onClick={handleJoin}
              disabled={roomCode.length !== 4}
              className={`w-full py-3.5 rounded-2xl font-extrabold text-sm tracking-wider uppercase transition flex items-center justify-center gap-2 ${
                roomCode.length === 4
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-600/30 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>ENTER ARENA</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center pb-2">
        <p className="text-[11px] text-slate-500">
          Powered by WebRTC P2P & Real-Time Computer Vision Scoring
        </p>
      </div>
    </div>
  );
};
