import React, { useState, useEffect, useRef } from 'react';
import { RoomState, ToolType } from './types/game';
import { network } from './services/webrtc';
import { sounds } from './services/audio';
import { DrawingEvaluator } from './services/evaluator';

import { RoomJoin } from './components/Lobby/RoomJoin';
import { WaitingRoom } from './components/Lobby/WaitingRoom';
import { TopHUD } from './components/Game/TopHUD';
import { DualCanvas } from './components/Game/DualCanvas';
import { ToolBar } from './components/Game/ToolBar';
import { QuickReactions } from './components/Game/QuickReactions';
import { RoundCountdown } from './components/Cinematic/RoundCountdown';
import { RoundShowcase } from './components/Cinematic/RoundShowcase';
import { GrandVictory } from './components/Cinematic/GrandVictory';
import { CanvasHandle } from './components/Game/Canvas';

export const App: React.FC = () => {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [myId, setMyId] = useState<string>('');
  const [isWebRTCConnected, setIsWebRTCConnected] = useState<boolean>(false);
  const [isAudioOn, setIsAudioOn] = useState<boolean>(true);

  // Drawing tools state
  const [tool, setTool] = useState<ToolType>('brush');
  const [color, setColor] = useState<string>('#ef4444');
  const [size, setSize] = useState<number>(10);
  const [fillShape, setFillShape] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<'split' | 'pip'>('split');
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  const canvasRef = useRef<CanvasHandle>(null);
  const hasSubmittedCurrentRound = useRef<boolean>(false);

  // Check URL parameters for 4-digit room code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('room');
    if (codeParam && codeParam.length === 4) {
      // Room code available in URL
    }
  }, []);

  // Listen to Network Events
  useEffect(() => {
    const unsubId = network.on('connected', (id: string) => {
      setMyId(id);
    });

    const unsubRoom = network.on('room_update', (newRoom: RoomState) => {
      setRoom(newRoom);
      if (newRoom.phase === 'ROUND_COUNTDOWN') {
        hasSubmittedCurrentRound.current = false;
        // Clean whole canvas and wipe history on new round!
        canvasRef.current?.clearCanvas(true);
      }
      if (newRoom.phase === 'DRAWING' && hasSubmittedCurrentRound.current) {
        hasSubmittedCurrentRound.current = false;
      }
    });

    const unsubWebRTC = network.on('webrtc_connected', (connected: boolean) => {
      setIsWebRTCConnected(connected);
    });

    const unsubTimer = network.on('timer_tick', ({ phase, seconds }) => {
      setRoom(prev => prev ? { ...prev, timerSeconds: seconds, phase } : null);

      if (phase === 'DRAWING') {
        if (seconds <= 5 && seconds > 0) {
          sounds.playWarningBeep();
        } else if (seconds > 5 && seconds % 10 === 0) {
          sounds.playTick();
        }
      }
    });

    const unsubRequestSubmit = network.on('request_submission', async () => {
      await handleAutoSubmitDrawing();
    });

    return () => {
      unsubId();
      unsubRoom();
      unsubWebRTC();
      unsubTimer();
      unsubRequestSubmit();
    };
  }, [room?.currentPrompt]);

  const handleAutoSubmitDrawing = async () => {
    if (hasSubmittedCurrentRound.current) return;
    hasSubmittedCurrentRound.current = true;

    sounds.playBuzzer();

    const canvas = canvasRef.current?.getCanvas();
    if (!canvas || !room?.currentPrompt) {
      network.submitDrawing('', 15);
      return;
    }

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const breakdown = await DrawingEvaluator.evaluateDrawing(canvas, room.currentPrompt);
      network.submitDrawing(dataUrl, breakdown.overall);
    } catch (err) {
      console.error('Error evaluating drawing:', err);
      network.submitDrawing('', 20);
    }
  };

  const handleHostRoom = (name: string, avatar: string) => {
    network.createRoom(name, avatar);
  };

  const handleJoinRoom = (roomId: string, name: string, avatar: string) => {
    network.joinRoom(roomId, name, avatar);
  };

  const handleToggleReady = (ready: boolean) => {
    network.setReady(ready);
  };

  const handleRematch = () => {
    network.requestRematch();
  };

  const handleLeave = () => {
    window.location.href = window.location.pathname;
  };

  const toggleAudio = () => {
    const nextState = !isAudioOn;
    setIsAudioOn(nextState);
    sounds.enabled = nextState;
  };

  // Derive players
  const myPlayer = room?.players[myId] || {
    id: myId,
    name: 'You',
    avatar: '🐱',
    isHost: false,
    score: 0,
    roundScores: [],
    roundAccuracies: [],
    drawings: [],
    ready: false
  };

  const opponentPlayer = room
    ? Object.values(room.players).find(p => p.id !== myId)
    : undefined;

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-arcade-dark text-slate-100 overflow-hidden relative select-none">
      {/* Dynamic Game Phases */}
      {!room || room.phase === 'LOBBY' ? (
        <RoomJoin
          onHostRoom={handleHostRoom}
          onJoinRoom={handleJoinRoom}
          isAudioOn={isAudioOn}
          onToggleAudio={toggleAudio}
        />
      ) : room.phase === 'WAITING' ? (
        <WaitingRoom
          room={room}
          myId={myId}
          isWebRTCConnected={isWebRTCConnected}
          onToggleReady={handleToggleReady}
          onLeave={handleLeave}
        />
      ) : (
        /* Active Game Loop: TOP HUD + DUAL CANVAS + TOOLBAR */
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto overflow-hidden justify-between">
          {/* Top HUD with round, prompt, countdown & score */}
          <TopHUD
            currentRound={room.currentRound}
            totalRounds={room.totalRounds}
            prompt={room.currentPrompt}
            timerSeconds={room.timerSeconds}
            myPlayer={myPlayer}
            opponentPlayer={opponentPlayer}
            layoutMode={layoutMode}
            onToggleLayout={() => setLayoutMode(prev => prev === 'split' ? 'pip' : 'split')}
          />

          {/* Dual Canvas: Opponent Live Canvas (Upper) + Own Interactive Canvas (Down) */}
          <DualCanvas
            canvasRef={canvasRef}
            tool={tool}
            color={color}
            size={size}
            fillShape={fillShape}
            layoutMode={layoutMode}
            opponentPlayer={opponentPlayer}
            onHistoryChange={(undo, redo) => {
              setCanUndo(undo);
              setCanRedo(redo);
            }}
            onToggleLayout={() => setLayoutMode(prev => prev === 'split' ? 'pip' : 'split')}
          />

          {/* Quick Reaction Bar */}
          <QuickReactions />

          {/* Bottom Thumb Toolbar */}
          <ToolBar
            currentTool={tool}
            currentColor={color}
            brushSize={size}
            fillShape={fillShape}
            onSelectTool={setTool}
            onSelectColor={setColor}
            onSelectSize={setSize}
            onToggleFillShape={() => setFillShape(prev => !prev)}
            onUndo={() => canvasRef.current?.undo()}
            onRedo={() => canvasRef.current?.redo()}
            onClear={() => canvasRef.current?.clearCanvas()}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>
      )}

      {/* Cinematic Round Countdown (3-2-1 Fight) */}
      {room && room.phase === 'ROUND_COUNTDOWN' && (
        <RoundCountdown
          currentRound={room.currentRound}
          prompt={room.currentPrompt}
          timerSeconds={room.timerSeconds}
        />
      )}

      {/* Cinematic Round Showcase (Full screen side-by-side artwork showdown) */}
      {room && room.phase === 'ROUND_SHOWCASE' && (
        <RoundShowcase
          room={room}
          myId={myId}
        />
      )}

      {/* Cinematic Grand Victory Podium (After 5 Rounds) */}
      {room && room.phase === 'GAME_OVER' && (
        <GrandVictory
          room={room}
          myId={myId}
          onRematch={handleRematch}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
};
