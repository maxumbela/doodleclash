import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { ToolType, DrawStrokeEvent, DrawBucketEvent, DrawShapeEvent, DrawSprayEvent } from '../../types/game';
import { network } from '../../services/webrtc';
import { renderShapeOnContext, renderSprayOnContext } from '../../services/shapeRenderer';

export interface CanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
  clearCanvas: (resetHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface CanvasProps {
  tool: ToolType;
  color: string;
  size: number;
  fillShape?: boolean;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
}

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(({
  tool,
  color,
  size,
  fillShape = false,
  onHistoryChange,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const shapePreviewSnapshot = useRef<ImageData | null>(null);
  
  // Undo / Redo history
  const history = useRef<ImageData[]>([]);
  const historyIndex = useRef<number>(-1);

  const isShapeTool = ['line', 'rect', 'circle', 'star', 'heart'].includes(tool);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    history.current = history.current.slice(0, historyIndex.current + 1);
    history.current.push(imgData);
    if (history.current.length > 30) {
      history.current.shift();
    } else {
      historyIndex.current++;
    }
    updateHistoryState();
  };

  const updateHistoryState = () => {
    const canUndo = historyIndex.current > 0;
    const canRedo = historyIndex.current < history.current.length - 1;
    onHistoryChange?.(canUndo, canRedo);
  };

  // Expose imperative methods to parent
  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    clearCanvas: (resetHistory: boolean = false) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (resetHistory) {
        history.current = [];
        historyIndex.current = -1;
      }
      saveState();
      network.sendDrawingEvent({ type: 'canvas_clear' });
    },
    undo: () => {
      if (historyIndex.current > 0) {
        historyIndex.current--;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx && history.current[historyIndex.current]) {
          ctx.putImageData(history.current[historyIndex.current], 0, 0);
          updateHistoryState();
          network.sendDrawingEvent({ type: 'canvas_undo', historyIndex: historyIndex.current });
        }
      }
    },
    redo: () => {
      if (historyIndex.current < history.current.length - 1) {
        historyIndex.current++;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx && history.current[historyIndex.current]) {
          ctx.putImageData(history.current[historyIndex.current], 0, 0);
          updateHistoryState();
          network.sendDrawingEvent({ type: 'canvas_undo', historyIndex: historyIndex.current });
        }
      }
    },
    canUndo: historyIndex.current > 0,
    canRedo: historyIndex.current < history.current.length - 1
  }));

  // Setup initial canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.floor(rect.width * dpr);
      const height = Math.floor(rect.height * dpr);

      if (canvas.width !== width || canvas.height !== height) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx && canvas.width > 0) {
          tempCtx.drawImage(canvas, 0, 0);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          if (tempCanvas.width > 0) {
            ctx.drawImage(tempCanvas, 0, 0, width, height);
          }
          saveState();
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getNormCoord = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { normX: 0, normY: 0, rawX: 0, rawY: 0 };
    const rect = canvas.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const rawY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    return {
      normX: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      normY: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
      rawX,
      rawY
    };
  };

  // Flood fill algorithm
  const performFloodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const width = canvas.width;
    const height = canvas.height;

    const tempEl = document.createElement('div');
    tempEl.style.color = fillColor;
    document.body.appendChild(tempEl);
    const computed = window.getComputedStyle(tempEl).color;
    document.body.removeChild(tempEl);
    const rgb = computed.match(/\d+/g)?.map(Number) || [0, 0, 0];
    const fillR = rgb[0], fillG = rgb[1], fillB = rgb[2], fillA = 255;

    const startPixelIndex = (Math.floor(startY) * width + Math.floor(startX)) * 4;
    const startR = data[startPixelIndex];
    const startG = data[startPixelIndex + 1];
    const startB = data[startPixelIndex + 2];
    const startA = data[startPixelIndex + 3];

    if (
      Math.abs(startR - fillR) < 10 &&
      Math.abs(startG - fillG) < 10 &&
      Math.abs(startB - fillB) < 10 &&
      Math.abs(startA - fillA) < 10
    ) {
      return;
    }

    const colorMatch = (idx: number) => {
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      return (
        Math.abs(r - startR) < 32 &&
        Math.abs(g - startG) < 32 &&
        Math.abs(b - startB) < 32 &&
        Math.abs(a - startA) < 32
      );
    };

    const queue: [number, number][] = [[Math.floor(startX), Math.floor(startY)]];
    const visited = new Uint8Array(width * height);

    while (queue.length > 0) {
      const [x, y] = queue.pop()!;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      const pos = y * width + x;
      if (visited[pos]) continue;
      visited[pos] = 1;

      const idx = pos * 4;
      if (colorMatch(idx)) {
        data[idx] = fillR;
        data[idx + 1] = fillG;
        data[idx + 2] = fillB;
        data[idx + 3] = fillA;

        queue.push([x + 1, y]);
        queue.push([x - 1, y]);
        queue.push([x, y + 1]);
        queue.push([x, y - 1]);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    saveState();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const { normX, normY, rawX, rawY } = getNormCoord(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (tool === 'bucket') {
      performFloodFill(rawX, rawY, color);
      network.sendDrawingEvent({
        type: 'bucket_fill',
        x: normX,
        y: normY,
        color
      });
      return;
    }

    isDrawing.current = true;
    startPoint.current = { x: rawX, y: rawY };
    lastPoint.current = { x: rawX, y: rawY };

    if (isShapeTool) {
      shapePreviewSnapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return;
    }

    const scale = canvas.width / 400;
    const scaledSize = Math.max(1, size * scale);

    if (tool === 'spray') {
      const sprayPoints: Array<{ dx: number; dy: number }> = [];
      const density = Math.max(12, Math.floor(size * 1.5));
      const radius = size * scale * 1.6;
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;
        sprayPoints.push({
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist
        });
      }
      renderSprayOnContext(ctx, rawX, rawY, sprayPoints, color, scaledSize);
      network.sendDrawingEvent({
        type: 'spray_step',
        cx: normX,
        cy: normY,
        points: sprayPoints.map(p => ({ dx: p.dx / canvas.width, dy: p.dy / canvas.height })),
        color,
        size
      });
      return;
    }

    // Freehand stroke / dot
    ctx.save();
    if (tool === 'neon') {
      ctx.shadowColor = color;
      ctx.shadowBlur = Math.max(12, scaledSize * 1.8);
    }
    if (tool === 'highlighter') {
      ctx.globalAlpha = 0.35;
    }
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = scaledSize;
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.arc(rawX, rawY, scaledSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.fill();
    ctx.restore();

    network.sendDrawingEvent({
      type: 'stroke_step',
      x0: normX,
      y0: normY,
      x1: normX,
      y1: normY,
      color: tool === 'eraser' ? '#ffffff' : color,
      size,
      tool,
      glow: tool === 'neon'
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { normX, normY, rawX, rawY } = getNormCoord(e);
    const scale = canvas.width / 400;
    const scaledSize = Math.max(1, size * scale);

    if (isShapeTool && startPoint.current && shapePreviewSnapshot.current) {
      // Restore pre-drag canvas and draw live preview
      ctx.putImageData(shapePreviewSnapshot.current, 0, 0);
      renderShapeOnContext(
        ctx,
        tool as any,
        startPoint.current.x,
        startPoint.current.y,
        rawX,
        rawY,
        color,
        scaledSize,
        fillShape,
        tool === 'neon'
      );
      return;
    }

    if (tool === 'spray') {
      const sprayPoints: Array<{ dx: number; dy: number }> = [];
      const density = Math.max(8, Math.floor(size * 1.2));
      const radius = size * scale * 1.6;
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;
        sprayPoints.push({
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist
        });
      }
      renderSprayOnContext(ctx, rawX, rawY, sprayPoints, color, scaledSize);
      network.sendDrawingEvent({
        type: 'spray_step',
        cx: normX,
        cy: normY,
        points: sprayPoints.map(p => ({ dx: p.dx / canvas.width, dy: p.dy / canvas.height })),
        color,
        size
      });
      lastPoint.current = { x: rawX, y: rawY };
      return;
    }

    if (!lastPoint.current) return;
    const prevRaw = lastPoint.current;
    const prevNormX = prevRaw.x / canvas.width;
    const prevNormY = prevRaw.y / canvas.height;

    ctx.save();
    if (tool === 'neon') {
      ctx.shadowColor = color;
      ctx.shadowBlur = Math.max(12, scaledSize * 1.8);
    }
    if (tool === 'highlighter') {
      ctx.globalAlpha = 0.35;
    }
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = scaledSize;
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.moveTo(prevRaw.x, prevRaw.y);
    ctx.lineTo(rawX, rawY);
    ctx.stroke();
    ctx.restore();

    network.sendDrawingEvent({
      type: 'stroke_step',
      x0: prevNormX,
      y0: prevNormY,
      x1: normX,
      y1: normY,
      color: tool === 'eraser' ? '#ffffff' : color,
      size,
      tool,
      glow: tool === 'neon'
    });

    lastPoint.current = { x: rawX, y: rawY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { normX, normY, rawX, rawY } = getNormCoord(e);
    const scale = canvas.width / 400;
    const scaledSize = Math.max(1, size * scale);

    if (isShapeTool && startPoint.current && shapePreviewSnapshot.current) {
      ctx.putImageData(shapePreviewSnapshot.current, 0, 0);
      renderShapeOnContext(
        ctx,
        tool as any,
        startPoint.current.x,
        startPoint.current.y,
        rawX,
        rawY,
        color,
        scaledSize,
        fillShape,
        tool === 'neon'
      );

      network.sendDrawingEvent({
        type: 'shape_draw',
        shape: tool as any,
        x0: startPoint.current.x / canvas.width,
        y0: startPoint.current.y / canvas.height,
        x1: normX,
        y1: normY,
        color,
        size,
        fill: fillShape,
        glow: tool === 'neon'
      });
      shapePreviewSnapshot.current = null;
    }

    startPoint.current = null;
    lastPoint.current = null;
    saveState();
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner bg-white border border-slate-700/50">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full cursor-crosshair touch-none"
      />
      <div className="absolute top-2 left-2 pointer-events-none px-2.5 py-0.5 rounded-lg bg-black/70 text-purple-300 text-[10px] font-black tracking-wider uppercase border border-purple-500/40 backdrop-blur-sm flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
        <span>YOUR CANVAS (DRAW HERE)</span>
      </div>
    </div>
  );
});
