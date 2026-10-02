export type BrushType = 'round' | 'square' | 'smooth';

export interface BrushSettings {
  color: string;
  size: number;
  opacity: number;
  type: BrushType;
  hardness: number;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
}

export interface Point {
  x: number;
  y: number;
}
