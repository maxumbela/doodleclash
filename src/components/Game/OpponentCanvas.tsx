import React, { useRef, useEffect, useState } from 'react';
import { Player, DrawStrokeEvent, DrawBucketEvent, DrawShapeEvent, DrawSprayEvent } from '../../types/game';
import { network } from '../../services/webrtc';
import { renderShapeOnContext, renderSprayOnContext } from '../../services/shapeRenderer';

interface OpponentCanvasProps {
  opponentPlayer: Player | undefined;
}

export const OpponentCanvas: React.FC<OpponentCanvasProps> = ({ opponentPlayer }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const cursorTimer = useRef<NodeJS.Timeout | null>(null);

  // Setup initial canvas with ResizeObserver
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
        const prevWidth = canvas.width;
        const prevHeight = canvas.height;

        let tempCanvas: HTMLCanvasElement | null = null;
        if (prevWidth > 0 && prevHeight > 0) {
          tempCanvas = document.createElement('canvas');
          tempCanvas.width = prevWidth;
          tempCanvas.height = prevHeight;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.drawImage(canvas, 0, 0);
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          if (tempCanvas && tempCanvas.width > 0 && tempCanvas.height > 0) {
            ctx.drawImage(tempCanvas, 0, 0, width, height);
          }
        }
      }
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(canvas);
    if (canvas.parentElement) {
      ro.observe(canvas.parentElement);
    }
    window.addEventListener('resize', resize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);


  // Listen for WebRTC incoming opponent events
  useEffect(() => {
    const handleStroke = (data: DrawStrokeEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = canvas.width / 400;
      const x0 = data.x0 * canvas.width;
      const y0 = data.y0 * canvas.height;
      const x1 = data.x1 * canvas.width;
      const y1 = data.y1 * canvas.height;
      const lineWidth = Math.max(1, data.size * scale);

      ctx.save();
      if (data.glow || data.tool === 'neon') {
        ctx.shadowColor = data.color;
        ctx.shadowBlur = Math.max(12, lineWidth * 1.8);
      }
      if (data.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
      }

      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = data.color;

      if (Math.abs(x0 - x1) < 0.1 && Math.abs(y0 - y1) < 0.1) {
        ctx.arc(x0, y0, lineWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = data.color;
        ctx.fill();
      } else {
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      ctx.restore();

      // Update cursor indicator
      setCursorPos({ x: data.x1 * 100, y: data.y1 * 100, active: true });
      if (cursorTimer.current) clearTimeout(cursorTimer.current);
      cursorTimer.current = setTimeout(() => {
        setCursorPos(prev => ({ ...prev, active: false }));
      }, 1000);
    };

    const handleShape = (data: DrawShapeEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = canvas.width / 400;
      const x0 = data.x0 * canvas.width;
      const y0 = data.y0 * canvas.height;
      const x1 = data.x1 * canvas.width;
      const y1 = data.y1 * canvas.height;
      const lineWidth = Math.max(1, data.size * scale);

      renderShapeOnContext(
        ctx,
        data.shape,
        x0,
        y0,
        x1,
        y1,
        data.color,
        lineWidth,
        data.fill,
        data.glow
      );

      setCursorPos({ x: data.x1 * 100, y: data.y1 * 100, active: true });
      if (cursorTimer.current) clearTimeout(cursorTimer.current);
      cursorTimer.current = setTimeout(() => {
        setCursorPos(prev => ({ ...prev, active: false }));
      }, 1000);
    };

    const handleSpray = (data: DrawSprayEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = canvas.width / 400;
      const cx = data.cx * canvas.width;
      const cy = data.cy * canvas.height;
      const scaledPoints = data.points.map(p => ({
        dx: p.dx * canvas.width,
        dy: p.dy * canvas.height
      }));

      renderSprayOnContext(ctx, cx, cy, scaledPoints, data.color, Math.max(1, data.size * scale));

      setCursorPos({ x: data.cx * 100, y: data.cy * 100, active: true });
      if (cursorTimer.current) clearTimeout(cursorTimer.current);
      cursorTimer.current = setTimeout(() => {
        setCursorPos(prev => ({ ...prev, active: false }));
      }, 1000);
    };

    const handleBucket = (data: DrawBucketEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const startX = data.x * canvas.width;
      const startY = data.y * canvas.height;
      const fillColor = data.color;

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imgData.data;
      const width = canvas.width;
      const height = canvas.height;

      const tempEl = document.createElement('div');
      tempEl.style.color = fillColor;
      document.body.appendChild(tempEl);
      const computed = window.getComputedStyle(tempEl).color;
      document.body.removeChild(tempEl);
      const rgb = computed.match(/\d+/g)?.map(Number) || [0, 0, 0];
      const fillR = rgb[0], fillG = rgb[1], fillB = rgb[2], fillA = 255;

      const startIdx = (Math.floor(startY) * width + Math.floor(startX)) * 4;
      const startR = pixels[startIdx];
      const startG = pixels[startIdx + 1];
      const startB = pixels[startIdx + 2];
      const startA = pixels[startIdx + 3];

      if (
        Math.abs(startR - fillR) < 10 &&
        Math.abs(startG - fillG) < 10 &&
        Math.abs(startB - fillB) < 10 &&
        Math.abs(startA - fillA) < 10
      ) return;

      const colorMatch = (idx: number) => {
        return (
          Math.abs(pixels[idx] - startR) < 32 &&
          Math.abs(pixels[idx + 1] - startG) < 32 &&
          Math.abs(pixels[idx + 2] - startB) < 32 &&
          Math.abs(pixels[idx + 3] - startA) < 32
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
          pixels[idx] = fillR;
          pixels[idx + 1] = fillG;
          pixels[idx + 2] = fillB;
          pixels[idx + 3] = fillA;

          queue.push([x + 1, y]);
          queue.push([x - 1, y]);
          queue.push([x, y + 1]);
          queue.push([x, y - 1]);
        }
      }

      ctx.putImageData(imgData, 0, 0);
    };

    const handleClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const unsubStroke = network.on('opponent_stroke', handleStroke);
    const unsubShape = network.on('opponent_shape', handleShape);
    const unsubSpray = network.on('opponent_spray', handleSpray);
    const unsubBucket = network.on('opponent_bucket', handleBucket);
    const unsubClear = network.on('opponent_clear', handleClear);
    const unsubRoom = network.on('room_update', (newRoom) => {
      if (newRoom.phase === 'ROUND_COUNTDOWN') {
        handleClear();
      }
    });

    return () => {
      unsubStroke();
      unsubShape();
      unsubSpray();
      unsubBucket();
      unsubClear();
      unsubRoom();
      if (cursorTimer.current) clearTimeout(cursorTimer.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner bg-white border border-slate-700/50">
      <canvas
        ref={canvasRef}
        className="w-full h-full pointer-events-none"
      />

      {/* Opponent Live Cursor */}
      {cursorPos.active && (
        <div
          className="absolute pointer-events-none transition-all duration-75 ease-out transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ left: `${cursorPos.x}%`, top: `${cursorPos.y}%` }}
        >
          <div className="flex items-center gap-1 bg-cyan-950/90 text-cyan-300 border border-cyan-400 px-1.5 py-0.5 rounded-full text-[9px] font-black shadow-lg shadow-cyan-500/50">
            <span>{opponentPlayer?.avatar || '⚡'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
          </div>
        </div>
      )}

      {/* Badge */}
      <div className="absolute top-2 left-2 pointer-events-none px-2.5 py-0.5 rounded-lg bg-black/70 text-cyan-300 text-[10px] font-black tracking-wider uppercase border border-cyan-500/40 backdrop-blur-sm flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
        <span>{opponentPlayer?.name || 'OPPONENT'}'S CANVAS (LIVE)</span>
      </div>
    </div>
  );
};
