import {
  BAYER_MATRIX_4x4,
  BAYER_MATRIX_8x8,
  DitherSettings,
  ColorMode,
} from "./dither-types";

export function parseColor(color: string): [number, number, number] {
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ];
    }
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  const match = color.match(/rgb\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\)/i);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }
  return [0, 0, 0];
}

function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export interface ResolvedSettings {
  parsedPrimaryColor: [number, number, number];
  parsedSecondaryColor: [number, number, number];
  parsedCustomPalette: [number, number, number][];
}

export function resolveSettings(settings: DitherSettings): ResolvedSettings {
  return {
    parsedPrimaryColor: parseColor(settings.primaryColor),
    parsedSecondaryColor: parseColor(settings.secondaryColor),
    parsedCustomPalette: settings.customPalette.map(parseColor),
  };
}

export interface RenderContext {
  source: ImageData;
  target: CanvasRenderingContext2D;
  targetWidth: number;
  targetHeight: number;
  time: number;
  objectFit: "cover" | "contain" | "fill" | "none";
}

function drawSourceToOffscreen(
  source: HTMLImageElement | HTMLCanvasElement,
  objectFit: "cover" | "contain" | "fill" | "none",
  width: number,
  height: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create 2d context");

  const iw =
    "naturalWidth" in source ? source.naturalWidth : source.width;
  const ih =
    "naturalHeight" in source ? source.naturalHeight : source.height;

  let dw = width;
  let dh = height;
  let dx = 0;
  let dy = 0;

  if (objectFit === "cover") {
    const scale = Math.max(width / iw, height / ih);
    dw = Math.ceil(iw * scale);
    dh = Math.ceil(ih * scale);
    dx = Math.floor((width - dw) / 2);
    dy = Math.floor((height - dh) / 2);
  } else if (objectFit === "contain") {
    const scale = Math.min(width / iw, height / ih);
    dw = Math.ceil(iw * scale);
    dh = Math.ceil(ih * scale);
    dx = Math.floor((width - dw) / 2);
    dy = Math.floor((height - dh) / 2);
  } else if (objectFit === "fill") {
    dw = width;
    dh = height;
  } else {
    dw = iw;
    dh = ih;
    dx = Math.floor((width - dw) / 2);
    dy = Math.floor((height - dh) / 2);
  }

  ctx.drawImage(source, dx, dy, dw, dh);
  return { canvas, ctx };
}

export function renderDither(
  source: HTMLImageElement,
  canvas: HTMLCanvasElement,
  settings: DitherSettings,
  time = 0,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const displayWidth = canvas.width;
  const displayHeight = canvas.height;

  if (displayWidth === 0 || displayHeight === 0) return;

  if (settings.backgroundColor !== "transparent") {
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
  } else {
    ctx.clearRect(0, 0, displayWidth, displayHeight);
  }

  const off = drawSourceToOffscreen(
    source,
    settings.objectFit,
    displayWidth,
    displayHeight,
  );
  let sourceData: Uint8ClampedArray;
  try {
    sourceData = off.ctx.getImageData(
      0,
      0,
      displayWidth,
      displayHeight,
    ).data;
  } catch (e) {
    console.error("Could not get image data", e);
    return;
  }
  const sourceWidth = displayWidth;
  const sourceHeight = displayHeight;

  const resolved = resolveSettings(settings);
  const {
    gridSize,
    ditherMode,
    colorMode,
    invert,
    pixelRatio,
    brightness,
    contrast,
    threshold,
  } = settings;

  const effectivePixelSize = Math.max(1, Math.floor(gridSize * pixelRatio));
  const matrixSize = gridSize <= 4 ? 4 : 8;
  const bayerMatrix = gridSize <= 4 ? BAYER_MATRIX_4x4 : BAYER_MATRIX_8x8;
  const matrixScale = matrixSize === 4 ? 16 : 64;

  for (let y = 0; y < displayHeight; y += effectivePixelSize) {
    for (let x = 0; x < displayWidth; x += effectivePixelSize) {
      const srcX = Math.floor((x / displayWidth) * sourceWidth);
      const srcY = Math.floor((y / displayHeight) * sourceHeight);
      const srcIdx = (srcY * sourceWidth + srcX) * 4;

      let r = sourceData[srcIdx] || 0;
      let g = sourceData[srcIdx + 1] || 0;
      let b = sourceData[srcIdx + 2] || 0;
      const a = sourceData[srcIdx + 3] || 0;

      if (a < 10) continue;

      r = clamp((r - 128) * contrast + 128 + brightness * 255, 0, 255);
      g = clamp((g - 128) * contrast + 128 + brightness * 255, 0, 255);
      b = clamp((b - 128) * contrast + 128 + brightness * 255, 0, 255);

      const luminance = getLuminance(r, g, b) / 255;

      let ditherThreshold: number;
      const matrixX = Math.floor(x / gridSize) % matrixSize;
      const matrixY = Math.floor(y / gridSize) % matrixSize;

      switch (ditherMode) {
        case "bayer":
          ditherThreshold = bayerMatrix[matrixY][matrixX] / matrixScale;
          break;
        case "halftone": {
          const angle = Math.PI / 4;
          const scale = gridSize * 2;
          const rotX = x * Math.cos(angle) + y * Math.sin(angle);
          const rotY = -x * Math.sin(angle) + y * Math.cos(angle);
          const pattern =
            (Math.sin(rotX / scale) + Math.sin(rotY / scale) + 2) / 4;
          ditherThreshold = pattern;
          break;
        }
        case "noise": {
          const noiseVal =
            Math.sin(x * 12.9898 + y * 78.233 + time * 100) * 43758.5453;
          ditherThreshold = noiseVal - Math.floor(noiseVal);
          break;
        }
        case "crosshatch": {
          const line1 = (x + y) % (gridSize * 2) < gridSize ? 1 : 0;
          const line2 =
            (x - y + gridSize * 4) % (gridSize * 2) < gridSize ? 1 : 0;
          ditherThreshold = (line1 + line2) / 2;
          break;
        }
        default:
          ditherThreshold = bayerMatrix[matrixY][matrixX] / matrixScale;
      }

      ditherThreshold = ditherThreshold * (1 - threshold) + threshold * 0.5;

      let outputColor: [number, number, number];

      switch (colorMode as ColorMode) {
        case "grayscale": {
          const shouldBeDark = luminance < ditherThreshold;
          outputColor = shouldBeDark ? [0, 0, 0] : [255, 255, 255];
          break;
        }
        case "duotone": {
          const shouldBeDark = luminance < ditherThreshold;
          outputColor = shouldBeDark
            ? resolved.parsedPrimaryColor
            : resolved.parsedSecondaryColor;
          break;
        }
        case "custom": {
          if (resolved.parsedCustomPalette.length === 2) {
            const shouldBeDark = luminance < ditherThreshold;
            outputColor = shouldBeDark
              ? resolved.parsedCustomPalette[0]
              : resolved.parsedCustomPalette[1];
          } else {
            const adjustedLuminance =
              luminance + (ditherThreshold - 0.5) * 0.5;
            const paletteIndex = Math.floor(
              clamp(adjustedLuminance, 0, 1) *
                (resolved.parsedCustomPalette.length - 1),
            );
            outputColor = resolved.parsedCustomPalette[paletteIndex];
          }
          break;
        }
        case "original":
        default: {
          const ditherAmount = ditherThreshold - 0.5;
          const adjustedR = clamp(r + ditherAmount * 64, 0, 255);
          const adjustedG = clamp(g + ditherAmount * 64, 0, 255);
          const adjustedB = clamp(b + ditherAmount * 64, 0, 255);

          const levels = 4;
          outputColor = [
            Math.round(adjustedR / (255 / levels)) * (255 / levels),
            Math.round(adjustedG / (255 / levels)) * (255 / levels),
            Math.round(adjustedB / (255 / levels)) * (255 / levels),
          ];
          break;
        }
      }

      if (invert) {
        outputColor = [
          255 - outputColor[0],
          255 - outputColor[1],
          255 - outputColor[2],
        ];
      }

      ctx.fillStyle = `rgb(${outputColor[0]}, ${outputColor[1]}, ${outputColor[2]})`;
      ctx.fillRect(x, y, effectivePixelSize, effectivePixelSize);
    }
  }
}
