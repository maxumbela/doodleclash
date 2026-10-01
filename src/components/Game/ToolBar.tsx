import React, { useState, useRef, useEffect } from 'react';
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
  Check,
  ChevronUp,
  X,
  Palette
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

interface ToolDefinition {
  id: ToolType;
  label: string;
  category: 'pen' | 'shape';
  desc: string;
  icon: React.ReactNode;
  accent: string;
}

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
  const [showTools, setShowTools] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const [toolTab, setToolTab] = useState<'pens' | 'shapes'>('pens');

  const isShapeTool = ['line', 'rect', 'circle', 'star', 'heart'].includes(currentTool);

  // If a shape tool is currently active, ensure tab reflects it
  useEffect(() => {
    if (isShapeTool) {
      setToolTab('shapes');
    }
  }, [currentTool, isShapeTool]);

  const PEN_TOOLS: ToolDefinition[] = [
    {
      id: 'brush',
      label: 'Classic Pen',
      category: 'pen',
      desc: 'Natural freehand ink & sketch',
      icon: <Paintbrush className="w-5 h-5 text-purple-400" />,
      accent: 'from-purple-600 to-indigo-600',
    },
    {
      id: 'neon',
      label: 'Neon Glow',
      category: 'pen',
      desc: 'Glowing laser arcade light trail',
      icon: <Sparkles className="w-5 h-5 text-pink-400 animate-pulse" />,
      accent: 'from-pink-500 to-purple-500',
    },
    {
      id: 'highlighter',
      label: 'Marker / Hilite',
      category: 'pen',
      desc: 'Translucent soft coloring',
      icon: <Highlighter className="w-5 h-5 text-amber-400" />,
      accent: 'from-amber-500 to-orange-500',
    },
    {
      id: 'spray',
      label: 'Spray Airbrush',
      category: 'pen',
      desc: 'Fine mist particle scatter',
      icon: <CloudDrizzle className="w-5 h-5 text-teal-400" />,
      accent: 'from-teal-500 to-cyan-500',
    },
    {
      id: 'bucket',
      label: 'Fill Bucket',
      category: 'pen',
      desc: 'Instant flood fill closed area',
      icon: <PaintBucket className="w-5 h-5 text-blue-400" />,
      accent: 'from-cyan-500 to-blue-600',
    },
    {
      id: 'eraser',
      label: 'Eraser',
      category: 'pen',
      desc: 'Clean mistakes & erase strokes',
      icon: <Eraser className="w-5 h-5 text-rose-400" />,
      accent: 'from-rose-600 to-pink-600',
    },
  ];

  const SHAPE_TOOLS: ToolDefinition[] = [
    {
      id: 'line',
      label: 'Straight Line',
      category: 'shape',
      desc: 'Crisp vector line between points',
      icon: <Minus className="w-5 h-5 text-cyan-400 rotate-45" />,
      accent: 'from-cyan-600 to-blue-600',
    },
    {
      id: 'rect',
      label: 'Rectangle',
      category: 'shape',
      desc: 'Sharp geometric box or square',
      icon: <Square className="w-5 h-5 text-cyan-400" />,
      accent: 'from-cyan-600 to-blue-600',
    },
    {
      id: 'circle',
      label: 'Circle / Oval',
      category: 'shape',
      desc: 'Smooth curved round geometry',
      icon: <Circle className="w-5 h-5 text-cyan-400" />,
      accent: 'from-cyan-600 to-blue-600',
    },
    {
      id: 'star',
      label: '5-Point Star',
      category: 'shape',
      desc: 'Arcade victory star graphic',
      icon: <Star className="w-5 h-5 text-amber-400" />,
      accent: 'from-amber-500 to-yellow-500',
    },
    {
      id: 'heart',
      label: 'Heart Shape',
      category: 'shape',
      desc: 'Cute expressive heart silhouette',
      icon: <Heart className="w-5 h-5 text-pink-400" />,
      accent: 'from-pink-500 to-rose-600',
    },
  ];

  const getActiveToolLabel = (tool: ToolType): string => {
    const all = [...PEN_TOOLS, ...SHAPE_TOOLS];
    const match = all.find(t => t.id === tool);
    return match ? match.label : 'Pen';
  };

  const getActiveToolIcon = (tool: ToolType) => {
    switch (tool) {
      case 'brush': return <Paintbrush className="w-4 h-4 text-purple-400" />;
      case 'neon': return <Sparkles className="w-4 h-4 text-pink-400" />;
      case 'highlighter': return <Highlighter className="w-4 h-4 text-amber-400" />;
      case 'spray': return <CloudDrizzle className="w-4 h-4 text-teal-400" />;
      case 'bucket': return <PaintBucket className="w-4 h-4 text-cyan-400" />;
      case 'eraser': return <Eraser className="w-4 h-4 text-rose-400" />;
      case 'line': return <Minus className="w-4 h-4 text-cyan-400 rotate-45" />;
      case 'rect': return <Square className="w-4 h-4 text-cyan-400" />;
      case 'circle': return <Circle className="w-4 h-4 text-cyan-400" />;
      case 'star': return <Star className="w-4 h-4 text-amber-400" />;
      case 'heart': return <Heart className="w-4 h-4 text-pink-400" />;
      default: return <Paintbrush className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="w-full flex flex-col gap-1.5 px-3 pb-2 pt-0.5 select-none flex-shrink-0 z-30 relative">
      {/* 1. DISMISS BACKDROP WHEN FLOATING MENUS ARE OPEN */}
      {(showTools || showSlider) && (
        <div
          onClick={() => {
            setShowTools(false);
            setShowSlider(false);
          }}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] transition-opacity"
        />
      )}

      {/* 2. FLOATING UPPER POPUP DRAWER: HOVERS OVER UPPER WITH ANIMATION */}
      {showTools && (
        <div className="absolute bottom-[calc(100%+10px)] left-2 right-2 sm:left-4 sm:right-4 max-w-lg mx-auto z-40 animate-slide-up-popover">
          <div className="glass-panel-glow rounded-3xl p-4 border border-cyan-500/50 shadow-2xl shadow-cyan-950/80 bg-slate-950/95 backdrop-blur-2xl flex flex-col gap-3">
            {/* Header: Title + Category Tabs + Close Button */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 shadow-md shadow-cyan-500/40">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-wider uppercase bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent font-display">
                    DRAWING TOOLS
                  </h3>
                  <p className="text-[10px] text-slate-400">Choose a pen style or shape</p>
                </div>
              </div>

              {/* Category Switcher Tabs */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => {
                    sounds.playPop();
                    setToolTab('pens');
                    if (isShapeTool) onSelectTool('brush');
                  }}
                  className={`px-3 py-1 text-[11px] font-black rounded-lg transition cursor-pointer ${
                    toolTab === 'pens'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
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
                  className={`px-3 py-1 text-[11px] font-black rounded-lg transition cursor-pointer ${
                    toolTab === 'shapes'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SHAPES
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  sounds.playPop();
                  setShowTools(false);
                }}
                className="p-1.5 rounded-xl bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB CONTENT: PENS */}
            {toolTab === 'pens' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PEN_TOOLS.map(t => {
                  const isActive = currentTool === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        sounds.playPop();
                        onSelectTool(t.id);
                        setShowTools(false);
                      }}
                      className={`p-2.5 rounded-2xl flex items-center gap-2.5 border transition-all duration-200 text-left cursor-pointer group ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-950/90 via-purple-950/90 to-slate-900 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/30 scale-[1.02]'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850 active:scale-95'
                      }`}
                    >
                      <div className={`p-2 rounded-xl transition ${
                        isActive
                          ? 'bg-gradient-to-tr ' + t.accent + ' text-white shadow-md'
                          : 'bg-slate-800/90 text-slate-300 group-hover:bg-slate-750'
                      }`}>
                        {t.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white truncate">{t.label}</span>
                          {isActive && <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* TAB CONTENT: SHAPES */
              <div className="flex flex-col gap-2.5">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {SHAPE_TOOLS.map(t => {
                    const isActive = currentTool === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          sounds.playPop();
                          onSelectTool(t.id);
                          setShowTools(false);
                        }}
                        className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-b from-cyan-950 to-slate-900 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/30 scale-105'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850 active:scale-95'
                        }`}
                      >
                        <div className={`p-2 rounded-xl ${
                          isActive
                            ? 'bg-cyan-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {t.icon}
                        </div>
                        <span className="text-[11px] font-bold text-white text-center truncate w-full">
                          {t.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Fill Shape Toggle Button */}
                <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-cyan-400 ml-1" />
                    <span className="text-xs font-bold text-slate-300">Shape Fill Style:</span>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playPop();
                      onToggleFillShape();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                      fillShape
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    {fillShape && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>{fillShape ? 'FILLED SHAPE' : 'OUTLINE ONLY'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Brush Size Presets inside Drawer */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Stroke Width:
              </span>
              <div className="flex items-center gap-1.5">
                {[4, 8, 14, 24, 40].map(sz => (
                  <button
                    key={sz}
                    onClick={() => {
                      sounds.playTick();
                      onSelectSize(sz);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold font-mono transition cursor-pointer ${
                      brushSize === sz
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30 ring-1 ring-purple-400'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {sz}px
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. DYNAMIC SIZE SLIDER POPOVER */}
      {showSlider && (
        <div className="absolute bottom-[calc(100%+10px)] right-4 sm:right-6 w-72 z-40 animate-slide-up-popover">
          <div className="flex flex-col gap-2 p-3.5 rounded-2xl glass-panel-glow border border-purple-500/40 shadow-2xl bg-slate-950/95 backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-purple-300">
                {currentTool === 'eraser' ? 'Eraser Size' : 'Brush Size'}
              </span>
              <span className="text-xs font-mono font-bold text-white bg-purple-950/80 px-2 py-0.5 rounded-lg border border-purple-500/30">
                {brushSize}px
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="2"
                max="60"
                value={brushSize}
                onChange={(e) => onSelectSize(Number(e.target.value))}
                className="flex-1 accent-purple-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div 
                className="rounded-full bg-purple-400 border border-white/40 flex-shrink-0"
                style={{
                  width: Math.min(24, Math.max(4, brushSize / 2)),
                  height: Math.min(24, Math.max(4, brushSize / 2))
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. TOP ROW: PALETTE + SIZE TOGGLE */}
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
              className={`w-6 h-6 rounded-full flex-shrink-0 border transition-transform cursor-pointer ${
                currentColor === color && currentTool !== 'eraser'
                  ? 'ring-2 ring-purple-400 scale-120 border-white shadow-md'
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
            setShowTools(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
            showSlider 
              ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/40'
              : 'glass-panel text-slate-300 hover:text-white border-slate-700/80'
          }`}
          title="Adjust stroke size"
        >
          <Sliders className="w-3.5 h-3.5 text-purple-300" />
          <span className="text-[11px] font-mono">{brushSize}px</span>
        </button>
      </div>

      {/* 5. BOTTOM MAIN DOCKED ROW: TOOLBAR OPTION (CLICKS TO HOVER OVER UPPER) + SHORTCUTS + UNDO/REDO */}
      <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl glass-panel border border-slate-800/90 shadow-xl relative z-30">
        
        {/* MAIN TOOL OPTION BUTTON (CLICK TO HOVER OVER UPPER WITH ANIMATION) */}
        <button
          onClick={() => {
            sounds.playPop();
            setShowTools(!showTools);
            setShowSlider(false);
          }}
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl font-black text-xs transition-all duration-200 cursor-pointer ${
            showTools
              ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-xl shadow-cyan-500/40 ring-2 ring-cyan-300 scale-[1.02]'
              : 'bg-slate-900/90 hover:bg-slate-800 text-white border border-cyan-500/40 hover:border-cyan-400/80 shadow-md'
          }`}
          title="Click to open Pen & Tool Menu"
        >
          <div className="p-1 rounded-lg bg-slate-800/90 text-cyan-300 shadow-inner">
            {getActiveToolIcon(currentTool)}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-extrabold leading-none">
              TOOL
            </span>
            <span className="text-xs font-black tracking-wide text-white leading-tight capitalize truncate max-w-[80px] sm:max-w-[110px]">
              {getActiveToolLabel(currentTool)}
            </span>
          </div>
          <ChevronUp className={`w-4 h-4 text-cyan-300 transition-transform duration-300 ${showTools ? 'rotate-180' : ''}`} />
        </button>

        {/* QUICK SHORTCUT BUTTONS: ERASER & FILL BUCKET */}
        <div className="flex items-center gap-1">
          {/* Quick Eraser Switcher */}
          <button
            onClick={() => {
              sounds.playPop();
              if (currentTool === 'eraser') {
                onSelectTool('brush');
              } else {
                onSelectTool('eraser');
              }
            }}
            className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              currentTool === 'eraser'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/40 ring-1 ring-rose-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-slate-800/80'
            }`}
            title="Toggle Eraser"
          >
            <Eraser className="w-4 h-4" />
            <span className="text-[10px] font-bold hidden sm:inline">Eraser</span>
          </button>

          {/* Quick Bucket Switcher */}
          <button
            onClick={() => {
              sounds.playPop();
              if (currentTool === 'bucket') {
                onSelectTool('brush');
              } else {
                onSelectTool('bucket');
              }
            }}
            className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              currentTool === 'bucket'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/40 ring-1 ring-cyan-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-slate-800/80'
            }`}
            title="Toggle Fill Bucket"
          >
            <PaintBucket className="w-4 h-4" />
            <span className="text-[10px] font-bold hidden sm:inline">Fill</span>
          </button>
        </div>

        {/* ACTION CONTROLS: UNDO, REDO, CLEAR CANVAS */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              sounds.playPop();
              onUndo();
            }}
            disabled={!canUndo}
            className={`p-2 rounded-xl text-xs transition cursor-pointer ${
              canUndo ? 'text-slate-200 hover:bg-slate-800 active:scale-95' : 'text-slate-600 cursor-not-allowed'
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
            className={`p-2 rounded-xl text-xs transition cursor-pointer ${
              canRedo ? 'text-slate-200 hover:bg-slate-800 active:scale-95' : 'text-slate-600 cursor-not-allowed'
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
            className="p-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 active:scale-95 transition cursor-pointer"
            title="Clear Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
