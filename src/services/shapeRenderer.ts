export function renderShapeOnContext(
  ctx: CanvasRenderingContext2D,
  shape: 'line' | 'rect' | 'circle' | 'star' | 'heart',
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth: number,
  fill: boolean = false,
  glow: boolean = false
) {
  ctx.save();

  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = Math.max(10, lineWidth * 1.8);
  } else {
    ctx.shadowBlur = 0;
  }

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();

  if (shape === 'line') {
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  } else if (shape === 'rect') {
    const rx = Math.min(x0, x1);
    const ry = Math.min(y0, y1);
    const rw = Math.abs(x1 - x0);
    const rh = Math.abs(y1 - y0);
    if (fill) {
      ctx.fillRect(rx, ry, rw, rh);
    } else {
      ctx.strokeRect(rx, ry, rw, rh);
    }
  } else if (shape === 'circle') {
    const rx = (x0 + x1) / 2;
    const ry = (y0 + y1) / 2;
    const radX = Math.abs(x1 - x0) / 2;
    const radY = Math.abs(y1 - y0) / 2;
    ctx.ellipse(rx, ry, Math.max(1, radX), Math.max(1, radY), 0, 0, Math.PI * 2);
    if (fill) {
      ctx.fill();
    } else {
      ctx.stroke();
    }
  } else if (shape === 'star') {
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const rOuter = Math.max(1, Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0)) / 2);
    const rInner = rOuter * 0.45;
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? rOuter : rInner;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    if (fill) {
      ctx.fill();
    } else {
      ctx.stroke();
    }
  } else if (shape === 'heart') {
    const minX = Math.min(x0, x1);
    const minY = Math.min(y0, y1);
    const w = Math.max(1, Math.abs(x1 - x0));
    const h = Math.max(1, Math.abs(y1 - y0));

    // Normalized heart curves inside bounding box [minX, minY, w, h]
    ctx.moveTo(minX + w * 0.5, minY + h * 0.35);
    ctx.bezierCurveTo(minX + w * 0.5, minY + h * 0.1, minX + w * 0.1, minY, minX + w * 0.1, minY + h * 0.35);
    ctx.bezierCurveTo(minX + w * 0.1, minY + h * 0.6, minX + w * 0.3, minY + h * 0.8, minX + w * 0.5, minY + h);
    ctx.bezierCurveTo(minX + w * 0.7, minY + h * 0.8, minX + w * 0.9, minY + h * 0.6, minX + w * 0.9, minY + h * 0.35);
    ctx.bezierCurveTo(minX + w * 0.9, minY, minX + w * 0.5, minY + h * 0.1, minX + w * 0.5, minY + h * 0.35);

    if (fill) {
      ctx.fill();
    } else {
      ctx.stroke();
    }
  }

  ctx.restore();
}

export function renderSprayOnContext(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  points: Array<{ dx: number; dy: number }>,
  color: string,
  baseSize: number
) {
  ctx.save();
  ctx.fillStyle = color;
  const dotSize = Math.max(1, baseSize * 0.12);

  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(cx + p.dx, cy + p.dy, dotSize, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}
