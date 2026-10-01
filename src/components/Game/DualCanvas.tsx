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
  const isPip = layoutMode === 'pip';


  return (
    <div className="flex-1 w-full px-3 py-1 min-h-0 relative select-none flex flex-col md:flex-row gap-2">
      {/* OPPONENT CANVAS CONTAINER */}
      <div
        onClick={isPip ? onToggleLayout : undefined}
        className={`transition-all duration-300 rounded-2xl overflow-hidden shadow-xl ${
          isPip
            ? 'absolute bottom-4 right-5 z-30 w-36 h-48 sm:w-44 sm:h-56 border-2 border-cyan-400 bg-slate-950/95 shadow-2xl shadow-cyan-950/50 cursor-pointer hover:scale-105 active:scale-95 group ring-1 ring-cyan-400/50'
            : 'flex-1 relative min-h-0 border-2 border-cyan-500/40 bg-slate-900'
        }`}
        title={isPip ? 'Tap to switch to Split Screen' : undefined}
      >
        <OpponentCanvas opponentPlayer={opponentPlayer} />
        {isPip && (
          <>
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors pointer-events-none" />
            <div className="absolute bottom-1 right-1 p-1 rounded-lg bg-black/80 text-cyan-300 flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 pointer-events-none">
              <Maximize2 className="w-3 h-3" />
              <span>SPLIT</span>
            </div>
          </>
        )}
      </div>

      {/* USER DRAWING CANVAS CONTAINER */}
      <div
        className={`transition-all duration-300 rounded-2xl overflow-hidden shadow-xl border-2 border-purple-500/50 bg-slate-900 ${
          isPip
            ? 'absolute inset-x-3 inset-y-1 z-10 border-purple-500/70 shadow-2xl shadow-purple-950/50'
            : 'flex-1 relative min-h-0'
        }`}
      >
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
};

