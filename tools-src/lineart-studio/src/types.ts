export interface Adjustments {
  exposure: number;
  contrast: number;
  saturation: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
}

export interface FilterState {
  // Pre Adjustments
  pre: Adjustments;

  // Blur
  blurType: 'none' | 'box' | 'gaussian' | 'cross';
  blurRadius: number;

  // Edge Detection
  edgeThreshold: number;
  edgeStrength: number;
  invertEdges: boolean;

  // Post Adjustments
  post: Adjustments;

  // Perspective
  showPerspective: boolean;
  perspectiveOpacity: number;
  perspectiveGranularity: number;
  perspectiveColor: string;
}

const DEFAULT_ADJUSTMENTS: Adjustments = {
  exposure: 0,
  contrast: 0,
  saturation: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
};

export const DEFAULT_FILTERS: FilterState = {
  pre: { ...DEFAULT_ADJUSTMENTS },
  post: { ...DEFAULT_ADJUSTMENTS },
  blurType: 'none',
  blurRadius: 0,
  edgeThreshold: 30,
  edgeStrength: 5,
  invertEdges: true, // Default to inverted (black lines on white)
  showPerspective: false,
  perspectiveOpacity: 0.5,
  perspectiveGranularity: 50,
  perspectiveColor: '#00ff00',
};
