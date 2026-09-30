import { AccuracyBreakdown, PromptItem } from '../types/game';

export class DrawingEvaluator {
  private static offscreenCanvas: HTMLCanvasElement | null = null;
  private static offscreenCtx: CanvasRenderingContext2D | null = null;

  private static getContext(width = 128, height = 128): CanvasRenderingContext2D | null {
    if (!this.offscreenCanvas && typeof document !== 'undefined') {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = width;
      this.offscreenCanvas.height = height;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    }
    return this.offscreenCtx;
  }

  /**
   * Evaluates a player's drawing canvas against the target prompt
   */
  public static async evaluateDrawing(
    playerCanvas: HTMLCanvasElement,
    prompt: PromptItem
  ): Promise<AccuracyBreakdown> {
    const pWidth = playerCanvas.width;
    const pHeight = playerCanvas.height;
    const pCtx = playerCanvas.getContext('2d', { willReadFrequently: true });

    if (!pCtx) {
      return this.defaultBreakdown(0);
    }

    const pImgData = pCtx.getImageData(0, 0, pWidth, pHeight);
    const pData = pImgData.data;

    // 1. Analyze Player Drawing Bounding Box and Pixel Coverage
    let pMinX = pWidth, pMaxX = 0, pMinY = pHeight, pMaxY = 0;
    let pFilledPixels = 0;
    const pColorCounts: { [hex: string]: number } = {};

    for (let y = 0; y < pHeight; y += 2) { // sampled for speed
      for (let x = 0; x < pWidth; x += 2) {
        const idx = (y * pWidth + x) * 4;
        const a = pData[idx + 3];
        // Ignore white background (if filled) or fully transparent
        const r = pData[idx];
        const g = pData[idx + 1];
        const b = pData[idx + 2];
        const isWhite = r > 245 && g > 245 && b > 245;

        if (a > 30 && !isWhite) {
          pFilledPixels++;
          if (x < pMinX) pMinX = x;
          if (x > pMaxX) pMaxX = x;
          if (y < pMinY) pMinY = y;
          if (y > pMaxY) pMaxY = y;

          // Track color
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
          pColorCounts[hex] = (pColorCounts[hex] || 0) + 1;
        }
      }
    }

    // Empty canvas check
    if (pFilledPixels < 50 || pMaxX <= pMinX || pMaxY <= pMinY) {
      return {
        overall: 5,
        silhouetteMatch: 5,
        strokeDetail: 5,
        colorHarmony: 5,
        commentary: '👻 A minimalist ghost drawing? Canvas was almost blank!'
      };
    }

    // 2. Render Reference Emoji on Offscreen Canvas (128x128)
    const refSize = 128;
    const refCanvas = document.createElement('canvas');
    refCanvas.width = refSize;
    refCanvas.height = refSize;
    const refCtx = refCanvas.getContext('2d', { willReadFrequently: true });
    if (!refCtx) return this.defaultBreakdown(50);

    refCtx.clearRect(0, 0, refSize, refSize);
    refCtx.font = '84px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
    refCtx.textAlign = 'center';
    refCtx.textBaseline = 'middle';
    refCtx.fillText(prompt.emoji, refSize / 2, refSize / 2 + 5);

    const refImgData = refCtx.getImageData(0, 0, refSize, refSize);
    const refData = refImgData.data;

    let refMinX = refSize, refMaxX = 0, refMinY = refSize, refMaxY = 0;
    let refFilledCount = 0;

    for (let y = 0; y < refSize; y++) {
      for (let x = 0; x < refSize; x++) {
        const idx = (y * refSize + x) * 4;
        const a = refData[idx + 3];
        if (a > 30) {
          refFilledCount++;
          if (x < refMinX) refMinX = x;
          if (x > refMaxX) refMaxX = x;
          if (y < refMinY) refMinY = y;
          if (y > refMaxY) refMaxY = y;
        }
      }
    }

    // 3. Normalized Silhouette Match (IoU)
    // Scale player's drawn bounding box into normalized 64x64 grid
    const normSize = 64;
    const pNormCanvas = document.createElement('canvas');
    pNormCanvas.width = normSize;
    pNormCanvas.height = normSize;
    const pNormCtx = pNormCanvas.getContext('2d');

    const refNormCanvas = document.createElement('canvas');
    refNormCanvas.width = normSize;
    refNormCanvas.height = normSize;
    const refNormCtx = refNormCanvas.getContext('2d');

    if (!pNormCtx || !refNormCtx) return this.defaultBreakdown(60);

    const pBoxW = Math.max(1, pMaxX - pMinX);
    const pBoxH = Math.max(1, pMaxY - pMinY);
    pNormCtx.drawImage(playerCanvas, pMinX, pMinY, pBoxW, pBoxH, 4, 4, normSize - 8, normSize - 8);

    const refBoxW = Math.max(1, refMaxX - refMinX);
    const refBoxH = Math.max(1, refMaxY - refMinY);
    refNormCtx.drawImage(refCanvas, refMinX, refMinY, refBoxW, refBoxH, 4, 4, normSize - 8, normSize - 8);

    const pNormData = pNormCtx.getImageData(0, 0, normSize, normSize).data;
    const refNormData = refNormCtx.getImageData(0, 0, normSize, normSize).data;

    let intersection = 0;
    let union = 0;
    let edgeDetails = 0;

    for (let y = 0; y < normSize; y++) {
      for (let x = 0; x < normSize; x++) {
        const idx = (y * normSize + x) * 4;
        const pActive = pNormData[idx + 3] > 40 && !(pNormData[idx] > 245 && pNormData[idx + 1] > 245 && pNormData[idx + 2] > 245);
        const refActive = refNormData[idx + 3] > 40;

        if (pActive && refActive) intersection++;
        if (pActive || refActive) union++;

        // Edge detection check
        if (pActive && x > 0 && y > 0) {
          const prevXIdx = (y * normSize + (x - 1)) * 4;
          const prevYIdx = ((y - 1) * normSize + x) * 4;
          if (pNormData[prevXIdx + 3] < 30 || pNormData[prevYIdx + 3] < 30) {
            edgeDetails++;
          }
        }
      }
    }

    const rawIoU = union > 0 ? (intersection / union) : 0;
    // Boost IoU dynamically because freehand sketches have thinner lines than solid emoji sprites
    const silhouetteScore = Math.min(100, Math.round(rawIoU * 190 + 20));

    // 4. Stroke & Feature Detail Score
    const totalDrawnSampled = pFilledPixels;
    const totalBoxPixels = (pBoxW * pBoxH) / 4;
    const densityRatio = totalBoxPixels > 0 ? totalDrawnSampled / totalBoxPixels : 0;

    let detailScore = 65;
    if (densityRatio > 0.9) {
      // User just flooded the entire box solid: penalize
      detailScore = 30;
    } else if (edgeDetails > 150) {
      detailScore = Math.min(98, 70 + Math.round((edgeDetails / 400) * 28));
    } else {
      detailScore = Math.max(35, Math.round((edgeDetails / 150) * 65));
    }

    // 5. Color Harmony
    let colorScore = 60;
    const colorKeys = Object.keys(pColorCounts);
    if (colorKeys.length > 1) {
      colorScore += 15;
    }
    if (colorKeys.length > 3) {
      colorScore += 10;
    }

    // 6. Overall Weighted Accuracy Percentage
    const overall = Math.min(98, Math.max(12, Math.round(
      silhouetteScore * 0.50 +
      detailScore * 0.35 +
      colorScore * 0.15
    )));

    // Gaming Commentary
    let commentary = '🎨 Creative attempt!';
    if (overall >= 88) {
      commentary = '🔥 Masterpiece! Looks almost identical to the emoji!';
    } else if (overall >= 75) {
      commentary = '✨ Brilliant artwork! Super recognizable!';
    } else if (overall >= 60) {
      commentary = '👏 Solid drawing! Great shape and contouring!';
    } else if (overall >= 45) {
      commentary = '👀 Abstract vibes! With a little imagination, we see it!';
    } else {
      commentary = '🥔 Avant-garde Picasso style! Keep practicing!';
    }

    return {
      overall,
      silhouetteMatch: silhouetteScore,
      strokeDetail: detailScore,
      colorHarmony: colorScore,
      commentary
    };
  }

  private static defaultBreakdown(score: number): AccuracyBreakdown {
    return {
      overall: score,
      silhouetteMatch: score,
      strokeDetail: score,
      colorHarmony: score,
      commentary: 'Drawing processed!'
    };
  }
}
