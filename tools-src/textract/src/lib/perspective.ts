/**
 * Perspective Warp using Homography Matrix
 * Maps 4 points from source to 4 points in destination
 */

export interface Point {
  x: number;
  y: number;
}

export function solveHomography(src: Point[], dst: Point[]): number[] | null {
  const A: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i];
    const { x: u, y: v } = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }

  // We have 8 equations and 9 coefficients (a, b, c, d, e, f, g, h, 1)
  // Equation: ax + by + c - ugx - uhy = u
  const matrix: number[][] = A.map(row => row.slice(0, 8));
  const b: number[] = A.map(row => row[8]);

  const h = gaussianElimination(matrix, b);
  if (!h) return null;

  return [...h, 1]; // [a, b, c, d, e, f, g, h, 1]
}

function gaussianElimination(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  for (let i = 0; i < n; i++) {
    let max = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(A[j][i]) > Math.abs(A[max][i])) max = j;
    }

    [A[i], A[max]] = [A[max], A[i]];
    [b[i], b[max]] = [b[max], b[i]];

    const pivot = A[i][i];
    if (Math.abs(pivot) < 1e-10) return null;

    for (let j = i + 1; j < n; j++) {
      const factor = A[j][i] / pivot;
      b[j] -= factor * b[i];
      for (let k = i; k < n; k++) {
        A[j][k] -= factor * A[i][k];
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += A[i][j] * x[j];
    }
    x[i] = (b[i] - sum) / A[i][i];
  }
  return x;
}

export function warpPixel(h: number[], x: number, y: number): Point {
  const [a, b, c, d, e, f, g, h_] = h;
  const w = g * x + h_ * y + 1;
  return {
    x: (a * x + b * y + c) / w,
    y: (d * x + e * y + f) / w,
  };
}
