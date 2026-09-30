import React, { RefObject } from 'react';
import { Player, ToolType } from '../../types/game';
import { Canvas, CanvasHandle } from './Canvas';
import { OpponentCanvas } from './OpponentCanvas';
import { Maximize2 } from 'lucide-react';

interface DualCanvasProps {
  canvasRef: RefObject<CanvasHandle>;
  tool: ToolType;
  color: string;
  size: number;
  fillShape?: boolean;
  layoutMode: 'split' | 'pip';
  opponentPlayer: Player | undefined;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
  onToggleLayout: () => void;
}

export const DualCanvas: React.FC<DualCanvasProps> = ({
  canvasRef,
  tool,
  color,
  size,
  fillShape = false,
  layoutMode,
  opponentPlayer,
  onHistoryChange,
  onToggleLayout,
}) => {
  if (layoutMode === 'split') {
    return (
      <div className="flex-1 w-full px-3 py-1 flex flex-col md:flex-row gap-2 min-h-0 relative select-none">
        {/* UPPER SIDE: Opponent's Real-time Mirror Canvas */}
        <div className="flex-1 relative min-h-0 rounded-2xl overflow-hidden shadow-lg border-2 border-cyan-500/40 bg-slate-900">
          <OpponentCanvas opponentPlayer={opponentPlayer} />
        </div>

        {/* DOWN SIDE: Your Interactive Drawing Canvas */}
        <div className="flex-1 relative min-h-0 rounded-2xl overflow-hidden shadow-lg border-2 border-purple-500/50 bg-slate-900">
          <Canvas
            ref={canvasRef}
            tool={tool}
            color={color}
            size={size}
            fillShape={fillShape}
            onHistoryChange={onHistoryChange}
          />
        </div>
      </div>
    );
  }

  // Picture-in-Picture Mode: User canvas is full screen, opponent canvas is floating
  return (
    <div className="flex-1 w-full px-3 py-1 flex flex-col min-h-0 relative select-none">
      {/* Full Primary Interactive Canvas */}
      <div className="flex-1 relative w-full h-full rounded-2xl overflow-hidden shadow-xl border-2 border-purple-500/60">
        <Canvas
          ref={canvasRef}
          tool={tool}
          color={color}
          size={size}
          fillShape={fillShape}
          onHistoryChange={onHistoryChange}
        />
      </div>

      {/* Floating Draggable / Tappable Opponent PiP Window */}
      <div
        onClick={onToggleLayout}
        className="absolute bottom-4 right-5 w-32 h-44 sm:w-40 sm:h-52 rounded-2xl overflow-hidden shadow-2xl border-2 border-cyan-400 bg-slate-900/90 cursor-pointer hover:scale-105 active:scale-95 transition-all z-30 group"
        title="Tap to switch to Split Screen"
      >
        <OpponentCanvas opponentPlayer={opponentPlayer} />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors pointer-events-none" />
        <div className="absolute bottom-1 right-1 p-1 rounded-lg bg-black/70 text-cyan-300">
          <Maximize2 className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
