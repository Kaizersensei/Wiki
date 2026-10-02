export type ElementType = 'image' | 'video' | 'rectangle' | 'ellipse' | 'line' | 'pencil';

export type FillType = 'none' | 'solid' | 'gradient' | 'pattern';
export type PointType = 'corner' | 'curve';

export interface VectorPoint {
  id: string;
  x: number;
  y: number;
  type: PointType;
  handleIn?: { x: number; y: number }; // Relative to point x,y
  handleOut?: { x: number; y: number }; // Relative to point x,y
}

export interface ShapeStyle {
  strokeColor: string;
  strokeWidth: number;
  fillType: FillType;
  fillColor: string;
  fillColor2: string; // Used for gradient end color
  patternImage?: string; // Data URL for pattern
  simplification?: number; // Tolerance for pencil line simplification (0 = none)
}

export interface ColorFilters {
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: number;
  sepia: number;
  hueRotate: number;
  invert: number;
  blur: number;
  exposure: number;
  gamma: number;
  red: number;
  green: number;
  blue: number;
  tintColor: string;
  tintIntensity: number;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  src?: string; // For images/videos
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  zIndex: number;
  filters: ColorFilters;

  // Shape specific
  points?: VectorPoint[];
  rawPoints?: { x: number; y: number }[];
  shapeStyle: ShapeStyle;

  // State for editing
  isEditingPath?: boolean;
}

export interface ViewState {
  x: number;
  y: number;
  scale: number;
}

export type ToolType = 'select' | 'pencil' | 'line' | 'rectangle' | 'ellipse' | 'eraser';

export type BackgroundOverlayType = 'none' | 'pattern' | 'gradient' | 'image';
export type BackgroundPatternPreset = 'checkerboard' | 'dots' | 'grid' | 'diagonal' | 'crosshatch';
export type BackgroundGradientType = 'linear' | 'radial';

export interface BackgroundConfig {
  baseColor: string;
  overlayType: BackgroundOverlayType;
  patternPreset: BackgroundPatternPreset;
  patternColor: string;
  patternSize: number;
  gradientType: BackgroundGradientType;
  gradientColor1: string;
  gradientColor2: string;
  gradientAngle: number;
  repeatImage?: string;
  imageScale: number;
  opacity: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotate: number;
  tintColor: string;
  tintIntensity: number;
}
