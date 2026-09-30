import React, { useState } from 'react';
import { 
  Paintbrush, 
  Sparkles, 
  Highlighter, 
  CloudDrizzle, 
  Eraser, 
  PaintBucket, 
  Minus, 
  Square, 
  Circle, 
  Star, 
  Heart, 
  Sliders, 
  RotateCcw, 
  RotateCw, 
  Trash2,
  Check
} from 'lucide-react';
import { ToolType } from '../../types/game';
import { sounds } from '../../services/audio';

interface ToolBarProps {
  currentTool: ToolType;
  currentColor: string;
  brushSize: number;
  fillShape: boolean;
  onSelectTool: (tool: ToolType) => void;
  onSelectColor: (color: string) => void;
  onSelectSize: (size: number) => void;
  onToggleFillShape: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const ARCADE_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', 
  '#facc15', '#10b981', '#06b6d4', '#3b82f6', 
  '#8b5cf6', '#ec4899', '#78350f', '#64748b'
];

export const ToolBar: React.FC<ToolBarProps> = ({
  currentTool,
  currentColor,
  brushSize,
  fillShape,
  onSelectTool,
  onSelectColor,
  onSelectSize,
  onToggleFillShape,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
}) => {
  const [showSlider, setShowSlider] = useState(false);
  const [toolTab, setToolTab] = useState<'brushes' | 'shapes'>('brushes');

  const isShapeTool = ['line', 'rect', 'circle', 'star', 'heart'].includes(currentTool);

  return (
    <div className="w-full flex flex-col gap-1 px-3 pb-2 pt-0.5 select-none flex-shrink-0 z-20">
      {/* Dynamic Size Slider Popover / Drawer */}
      {showSlider && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-2xl glass-panel-glow border border-purple-500/40 shadow-xl animate-fade-in mb-1">
          <span className="text-[11px] font-black uppercase text-purple-300 flex-shrink-0">
            {currentTool === 'eraser' ? 'Eraser Size' : 'Brush Size'}
          </span>
          <input
            type="range"
            min="2"
            max="60"
            value={brushSize}
            onChange={(e) => onSelectSize(Number(e.target.value))}
            className="flex-1 accent-purple-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs font-mono font-bold text-white w-8 text-right">
              {brushSize}px
            </span>
            {/* Visual Dot Preview */}
            <div 
              className="rounded-full bg-purple-400 border border-white/40 flex-shrink-0"
              style={{
                width: Math.min(24, Math.max(4, brushSize / 2)),
                height: Math.min(24, Math.max(4, brushSize / 2))
              }}
            />
          </div>
        </div>
      )}

      {/* Palette Row + Size Slider Toggle */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto py-0.5 scrollbar-none">
        <div className="flex items-center gap-1.5 flex-1">
          {ARCADE_COLORS.map(color => (
            <button
              key={color}
              onClick={() => {
                sounds.playPop();
                onSelectColor(color);
                if (currentTool === 'eraser') onSelectTool('brush');
              }}
              style={{ backgroundColor: color }}
              className={`w-6 h-6 rounded-full flex-shrink-0 border transition-transform ${
                currentColor === color && currentTool !== 'eraser'
                  ? 'ring-2 ring-purple-400 scale-115 border-white shadow-md'
                  : 'border-white/20 hover:scale-105'
              }`}
            />
          ))}

          {/* Custom Color Rainbow Picker */}
          <label className="relative w-6 h-6 rounded-full flex-shrink-0 cursor-pointer overflow-hidden border border-white/40 bg-gradient-to-tr from-rose-500 via-emerald-400 to-indigo-500 flex items-center justify-center">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => {
                onSelectColor(e.target.value);
                if (currentTool === 'eraser') onSelectTool('brush');
              }}
              className="opacity-0 absolute inset-0 cursor-pointer"
            />
          </label>
        </div>

        {/* Size Slider Toggle Button */}
        <button
          onClick={() => {
            sounds.playPop();
            setShowSlider(!showSlider);
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition ${
            showSlider 
              ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/30'
              : 'glass-panel text-slate-300 hover:text-white border-slate-700'
          }`}
          title="Adjust size slider"
        >
          <Sliders className="w-3.5 h-3.5 text-purple-300" />
          <span className="text-[11px] font-mono">{brushSize}px</span>
        </button>
      </div>

      {/* Main Tools Container */}
      <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl glass-panel border border-slate-800/90 shadow-xl">
        {/* Category Switcher: Brushes vs Shapes */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              sounds.playPop();
              setToolTab('brushes');
              if (isShapeTool) onSelectTool('brush');
            }}
            className={`px-2 py-1 text-[11px] font-black rounded-lg transition ${
              toolTab === 'brushes'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PENS
          </button>
          <button
            onClick={() => {
              sounds.playPop();
              setToolTab('shapes');
              if (!isShapeTool) onSelectTool('rect');
            }}
            className={`px-2 py-1 text-[11px] font-black rounded-lg transition ${
              toolTab === 'shapes'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SHAPES
          </button>
        </div>

        {/* Dynamic Tool Buttons depending on Tab */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 justify-center">
          {toolTab === 'brushes' ? (
            <>
              {/* Freehand Brush */}
              <button
                onClick={() => {
                  sounds.playPop();
                  onSelectTool('brush');
                }}
                className={`p-1.5 rounded-xl transition flex items-center gap-1 text-xs font-bold ${
                  currentTool === 'brush'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/50'
                }`}
                title="Pen / Brush"
              >
                <Paintbrush className="w-4 h-4" />
                <span className="text-[10px] hidden sm:inline">Pen</span>
              </button>

              {/* Glowing Neon Pen */}
              <button
                onClick={() => {
                  sounds.playPop();
                  onSelectTool('neon');
                }}
                className={`p-1.5 rounded-xl transition flex items-center gap-1 text-xs font-bold ${
                  currentTool === 'neon'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/50 ring-1 ring-pink-300'
                    : 'text-slate-400 hover:bg-slate-800/50'
                }`}
                title="Neon Glow Pen"
              >
                <Sparkles className="w-4 h-4 text-arcade-yellow" />
                <span className="text-[10px] hidden sm:inline">Neon</span>
              </button>

              {/* Highlighter */}
              <button
                onClick={() => {
                  sounds.playPop();
                  onSelectTool('highlighter');
                }}
                className={`p-1.5 rounded-xl transition flex items-center gap-1 text-xs font-bold ${
                  currentTool === 'highlighter'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/50'
                }`}
                title="Highlighter"
              >
                <Highlighter className="w-4 h-4" />
                <span className="text-[10px] hidden sm:inline">Marker</span>
              </button>

              {/* Spray */}
              <button
                onClick={() => {
                  sounds.playPop();
                  onSelectTool('spray');
                }}
                className={`p-1.5 rounded-xl transition flex items-center gap-1 text-xs font-bold ${
                  currentTool === 'spray'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/50'
                }`}
                title="Spray Airbrush"
              >
                <CloudDrizzle className="w-4 h-4" />
                <span className="text-[10px] hidden sm:inline">Spray</span>
              </button>

              {/* Eraser */}
              <button
                onClick={() => {
                  sounds.playPop();
                  onSelectTool('eraser');
                }}
                className={`p-1.5 rounded-xl transition flex items-center gap-1 text-xs font-bold ${
                  currentTool === 'eraser'
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/40'
                    : 'text-slate-400 hover:bg-slate-800/50'
                }`}
                title="Eraser"
              >
                <Eraser className="w-4 h-4" />
                <span className="text-[10px] hidden sm:inline">Eraser</span>
              </button>

              {/* Fill Bucket */}
              <button
                onClick={() => {
                  sounds.playPop();
                  onSelectTool('bucket');
                }}
                className={`p-1.5 rounded-xl transition flex items-center gap-1 text-xs font-bold ${
                  currentTool === 'bucket'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/50'
                }`}
                title="Paint Bucket"
              >
                <PaintBucket className="w-4 h-4" />
                <span className="text-[10px] hidden sm:inline">Fill</span>
              </button>
            </>
          ) : (
            <>
              {/* Line */}
              <button
                onClick={() => {
                  sounds.playPop();
                  onSelectTool('line');
                }}
                className={`p-1.5 rounded-xl transition ${
                  currentTool === 'line' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
                title="Line"
              >
                <Minus className="w-4 h-4 rotate-45" />
              </button>

              {/* Rectangle */}
              <button
                onClick={() => {
                  sounds.playPop();
                  onSelectTool('rect');
                }}
                className={`p-1.5 rounded-xl transition ${
                  currentTool === 'rect' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
                title="Rectangle"
              >
                <Square className="w-4 h-4" />
              </button>

              {/* Circle */}
              <button
                onClick={() => {
                  sounds.playPop();
                  onSelectTool('circle');
                }}
                className={`p-1.5 rounded-xl transition ${
                  currentTool === 'circle' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
                title="Circle"
              >
                <Circle className="w-4 h-4" />
              </button>

              {/* Star */}
              <button
                onClick={() => {
                  sounds.playPop();
                  onSelectTool('star');
                }}
                className={`p-1.5 rounded-xl transition ${
                  currentTool === 'star' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
                title="Star"
              >
                <Star className="w-4 h-4" />
              </button>

              {/* Heart */}
              <button
                onClick={() => {
                  sounds.playPop();
                  onSelectTool('heart');
                }}
                className={`p-1.5 rounded-xl transition ${
                  currentTool === 'heart' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
                title="Heart"
              >
                <Heart className="w-4 h-4" />
              </button>

              {/* Fill vs Stroke Toggle */}
              <button
                onClick={() => {
                  sounds.playPop();
                  onToggleFillShape();
                }}
                className={`px-2 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase border transition flex items-center gap-1 ${
                  fillShape
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
                title="Fill Shape vs Outline"
              >
                {fillShape && <Check className="w-3 h-3 stroke-[3]" />}
                <span>{fillShape ? 'FILLED' : 'OUTLINE'}</span>
              </button>
            </>
          )}
        </div>

        {/* Action Controls: Undo, Redo, Clear */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              sounds.playPop();
              onUndo();
            }}
            disabled={!canUndo}
            className={`p-1.5 rounded-xl text-xs transition ${
              canUndo ? 'text-slate-300 hover:bg-slate-800 active:scale-95' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              sounds.playPop();
              onRedo();
            }}
            disabled={!canRedo}
            className={`p-1.5 rounded-xl text-xs transition ${
              canRedo ? 'text-slate-300 hover:bg-slate-800 active:scale-95' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Redo"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              sounds.playPop();
              onClear();
            }}
            className="p-1.5 rounded-xl text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 active:scale-95 transition"
            title="Clear Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
