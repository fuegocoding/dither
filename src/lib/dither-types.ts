export const BAYER_MATRIX_4x4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export const BAYER_MATRIX_8x8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

export type DitheringMode = "bayer" | "halftone" | "noise" | "crosshatch";
export type ColorMode = "original" | "grayscale" | "duotone" | "custom";

export interface DitherSettings {
  gridSize: number;
  ditherMode: DitheringMode;
  colorMode: ColorMode;
  invert: boolean;
  pixelRatio: number;
  primaryColor: string;
  secondaryColor: string;
  customPalette: string[];
  brightness: number;
  contrast: number;
  backgroundColor: string;
  threshold: number;
  animated: boolean;
  animationSpeed: number;
  objectFit: "cover" | "contain" | "fill" | "none";
}

export const DEFAULT_SETTINGS: DitherSettings = {
  gridSize: 2,
  ditherMode: "bayer",
  colorMode: "duotone",
  invert: false,
  pixelRatio: 1,
  primaryColor: "#ffffff",
  secondaryColor: "#f77f00",
  customPalette: ["#000000", "#f5f5f5", "#f77f00", "#fcbf49"],
  brightness: 0,
  contrast: 1,
  backgroundColor: "transparent",
  threshold: 0.5,
  animated: false,
  animationSpeed: 0.02,
  objectFit: "cover",
};

export const DITHER_MODE_LABELS: Record<DitheringMode, string> = {
  bayer: "Bayer",
  halftone: "Halftone",
  noise: "Noise",
  crosshatch: "Crosshatch",
};

export const COLOR_MODE_LABELS: Record<ColorMode, string> = {
  original: "Original",
  grayscale: "Grayscale",
  duotone: "Duotone",
  custom: "Palette",
};

export const PRESET_PALETTES: { name: string; colors: string[] }[] = [
  { name: "Duo", colors: ["#0a0a0a", "#f77f00"] },
  { name: "Mac SE", colors: ["#000000", "#ffffff"] },
  { name: "Game Boy", colors: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"] },
  { name: "CGA", colors: ["#000000", "#0000aa", "#00aa00", "#aa0000", "#ffffff"] },
  { name: "Cyan", colors: ["#0a0a0a", "#22d3ee"] },
  { name: "Magma", colors: ["#000000", "#fb7185", "#fbbf24", "#fef3c7"] },
  { name: "Forest", colors: ["#052e16", "#16a34a", "#bef264", "#f7fee7"] },
  { name: "Cyber", colors: ["#0a0a0a", "#a855f7", "#ec4899", "#fef3c7"] },
  { name: "Blueprint", colors: ["#0c4a6e", "#7dd3fc", "#e0f2fe"] },
];
