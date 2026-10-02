import type React from 'react';
import { ColorFilters, ShapeStyle, VectorPoint, BackgroundConfig, BackgroundPatternPreset } from '../types';

export const screenToWorld = (
  screenX: number,
  screenY: number,
  viewX: number,
  viewY: number,
  scale: number
) => {
  return {
    x: (screenX - viewX) / scale,
    y: (screenY - viewY) / scale
  };
};

export const rotatePoint = (x: number, y: number, cx: number, cy: number, angleDeg: number) => {
  const rad = (Math.PI / 180) * angleDeg;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - cx;
  const dy = y - cy;

  return {
    x: cx + (dx * cos - dy * sin),
    y: cy + (dx * sin + dy * cos)
  };
};

// --- Point Simplification & Smoothing ---

// Perpendicular distance from point p to line segment v-w
const pointToLineDistSq = (p: {x: number, y: number}, v: {x: number, y: number}, w: {x: number, y: number}) => {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return (p.x - v.x) ** 2 + (p.y - v.y) ** 2;
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return (p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2;
};

// Ramer-Douglas-Peucker Algorithm
export const simplifyPoints = (points: {x: number, y: number}[], tolerance: number = 1): VectorPoint[] => {
  // Filter out consecutive duplicate points to prevent zero-length tangents
  const uniquePoints = points.filter((p, i) => i === 0 || p.x !== points[i - 1].x || p.y !== points[i - 1].y);

  if (uniquePoints.length <= 2 || tolerance <= 0) {
    return uniquePoints.map(p => ({ id: crypto.randomUUID(), x: p.x, y: p.y, type: 'corner' }));
  }

  const sqTolerance = tolerance * tolerance;

  // Use a stack to avoid recursion depth issues
  const markers = new Uint8Array(uniquePoints.length);
  markers[0] = 1;
  markers[uniquePoints.length - 1] = 1;

  const stack = [0, uniquePoints.length - 1];

  while (stack.length > 0) {
    const end = stack.pop()!;
    const start = stack.pop()!;

    let maxDistSq = 0;
    let index = -1;

    for (let i = start + 1; i < end; i++) {
      const distSq = pointToLineDistSq(uniquePoints[i], uniquePoints[start], uniquePoints[end]);
      if (distSq > maxDistSq) {
        maxDistSq = distSq;
        index = i;
      }
    }

    if (maxDistSq > sqTolerance && index !== -1) {
      markers[index] = 1;
      stack.push(start, index);
      stack.push(index, end);
    }
  }

  const result: VectorPoint[] = [];
  for (let i = 0; i < uniquePoints.length; i++) {
    if (markers[i]) {
      result.push({
        id: crypto.randomUUID(),
        x: uniquePoints[i].x,
        y: uniquePoints[i].y,
        type: 'corner'
      });
    }
  }

  return result;
};

// Calculate handles to make the points smooth (Catmull-Rom to Bezier)
export const generateSmoothPoints = (points: VectorPoint[], tension: number = 0.3): VectorPoint[] => {
  if (points.length < 3 || tension <= 0) return points;

  return points.map((p, i) => {
    // Endpoints remain corners (or one-sided handles if we wanted closed loops, but assumed open for pencil)
    if (i === 0 || i === points.length - 1) {
      return { ...p, type: 'corner' };
    }

    const prev = points[i - 1];
    const next = points[i + 1];

    const dx = next.x - prev.x;
    const dy = next.y - prev.y;

    // Scale each handle by its own adjacent segment length to avoid overshooting on small segments
    const distPrev = Math.hypot(p.x - prev.x, p.y - prev.y);
    const distNext = Math.hypot(next.x - p.x, next.y - p.y);

    const len = Math.hypot(dx, dy);
    if (len === 0) return { ...p, type: 'corner' };

    const ux = dx / len;
    const uy = dy / len;

    return {
      ...p,
      type: 'curve',
      handleIn: { x: -ux * (distPrev * tension), y: -uy * (distPrev * tension) }, // In points backwards
      handleOut: { x: ux * (distNext * tension), y: uy * (distNext * tension) }   // Out points forwards
    };
  });
};

// Calculate the bounding box of a path, including Bezier handles and padding
export const calculatePathBounds = (points: VectorPoint[], padding: number = 0) => {
  if (points.length === 0) return { x: 0, y: 0, width: 1, height: 1 };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  points.forEach(p => {
    // Check anchor point
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);

    // Check handles (convex hull property ensures curve is within handles)
    if (p.handleIn) {
      const hx = p.x + p.handleIn.x;
      const hy = p.y + p.handleIn.y;
      minX = Math.min(minX, hx);
      minY = Math.min(minY, hy);
      maxX = Math.max(maxX, hx);
      maxY = Math.max(maxY, hy);
    }

    if (p.handleOut) {
      const hx = p.x + p.handleOut.x;
      const hy = p.y + p.handleOut.y;
      minX = Math.min(minX, hx);
      minY = Math.min(minY, hy);
      maxX = Math.max(maxX, hx);
      maxY = Math.max(maxY, hy);
    }
  });

  return {
    x: minX - padding,
    y: minY - padding,
    width: Math.max(0.5, (maxX - minX) + (padding * 2)),
    height: Math.max(0.5, (maxY - minY) + (padding * 2))
  };
};

export const buildPencilPath = (
  worldPoints: { x: number; y: number }[],
  simplification: number,
  strokeWidth: number
) => {
  const simplified = simplifyPoints(worldPoints, simplification);
  const smoothed = simplification > 0 ? generateSmoothPoints(simplified) : simplified;
  const padding = (strokeWidth || 0) / 2;
  const bounds = calculatePathBounds(smoothed, padding);

  const adjustedPoints: VectorPoint[] = smoothed.map(p => ({
    ...p,
    x: p.x - bounds.x,
    y: p.y - bounds.y
  }));

  const adjustedRawPoints = worldPoints.map(p => ({
    x: p.x - bounds.x,
    y: p.y - bounds.y
  }));

  return {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    points: adjustedPoints,
    rawPoints: adjustedRawPoints
  };
};

// Generates a smooth SVG path from raw points using quadratic bezier averaging
// Used for live drawing feedback
export const getSmoothedPath = (points: {x: number, y: number}[]): string => {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
  }

  // Connect last point
  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return d;
};

// Original function for editable points
export const getSvgPathFromPoints = (points: VectorPoint[]): string => {
  if (!points || points.length === 0) return '';

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const curr = points[i];
    const prev = points[i - 1];

    if ((prev.type === 'curve' && prev.handleOut) || (curr.type === 'curve' && curr.handleIn)) {
       const cp1x = prev.handleOut ? prev.x + prev.handleOut.x : prev.x;
       const cp1y = prev.handleOut ? prev.y + prev.handleOut.y : prev.y;

       const cp2x = curr.handleIn ? curr.x + curr.handleIn.x : curr.x;
       const cp2y = curr.handleIn ? curr.y + curr.handleIn.y : curr.y;

       d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    } else {
       d += ` L ${curr.x} ${curr.y}`;
    }
  }

  return d;
};

export const defaultFilters: ColorFilters = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
  invert: 0,
  blur: 0,
  exposure: 0,
  gamma: 1,
  red: 1,
  green: 1,
  blue: 1,
  tintColor: '#ffffff',
  tintIntensity: 0
};

export const defaultShapeStyle: ShapeStyle = {
  strokeColor: '#3b82f6', // blue-500
  strokeWidth: 4,
  fillType: 'none',
  fillColor: '#3b82f6',
  fillColor2: '#9333ea', // purple-600
  simplification: 1,
};

export const defaultBackgroundConfig: BackgroundConfig = {
  baseColor: '#27272a',
  overlayType: 'none',
  patternPreset: 'checkerboard',
  patternColor: '#3f3f46',
  patternSize: 20,
  gradientType: 'linear',
  gradientColor1: '#3b82f6',
  gradientColor2: '#9333ea',
  gradientAngle: 135,
  repeatImage: undefined,
  imageScale: 120,
  opacity: 100,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hueRotate: 0,
  tintColor: '#ffffff',
  tintIntensity: 0,
};

export const getPatternCss = (
  preset: BackgroundPatternPreset,
  color: string,
  size: number
): React.CSSProperties => {
  const safeSize = Math.max(4, size);
  const half = safeSize / 2;

  switch (preset) {
    case 'checkerboard':
      return {
        backgroundImage: `
          linear-gradient(45deg, ${color} 25%, transparent 25%),
          linear-gradient(-45deg, ${color} 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, ${color} 75%),
          linear-gradient(-45deg, transparent 75%, ${color} 75%)
        `,
        backgroundSize: `${safeSize}px ${safeSize}px`,
        backgroundPosition: `0 0, 0 ${half}px, ${half}px -${half}px, -${half}px 0px`,
      };
    case 'dots': {
      const r = Math.max(1.2, safeSize * 0.14);
      return {
        backgroundImage: `radial-gradient(${color} ${r}px, transparent ${r + 0.6}px)`,
        backgroundSize: `${safeSize}px ${safeSize}px`,
      };
    }
    case 'grid':
      return {
        backgroundImage: `
          linear-gradient(to right, ${color} 1px, transparent 1px),
          linear-gradient(to bottom, ${color} 1px, transparent 1px)
        `,
        backgroundSize: `${safeSize}px ${safeSize}px`,
      };
    case 'diagonal':
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${color}, ${color} 1.5px, transparent 1.5px, transparent ${half}px)`,
      };
    case 'crosshatch':
      return {
        backgroundImage: `
          repeating-linear-gradient(45deg, ${color}, ${color} 1px, transparent 1px, transparent ${safeSize}px),
          repeating-linear-gradient(-45deg, ${color}, ${color} 1px, transparent 1px, transparent ${safeSize}px)
        `,
      };
  }
};
