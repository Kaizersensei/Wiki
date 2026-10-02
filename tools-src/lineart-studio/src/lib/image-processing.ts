/**
 * Image processing utilities for LineArt Studio
 */

export function applyColorAdjustments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  adjustments: {
    exposure: number;
    contrast: number;
    saturation: number;
    highlights: number;
    shadows: number;
    whites: number;
    blacks: number;
  }
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const exp = Math.pow(2, adjustments.exposure / 50);
  const cont = (adjustments.contrast + 100) / 100;
  const sat = (adjustments.saturation + 100) / 100;

  // Simple highlight/shadow adjustment factors
  const high = adjustments.highlights / 100;
  const shad = adjustments.shadows / 100;
  const whi = adjustments.whites / 100;
  const bla = adjustments.blacks / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;

    // Exposure
    r *= exp;
    g *= exp;
    b *= exp;

    // Contrast
    r = (r - 0.5) * cont + 0.5;
    g = (g - 0.5) * cont + 0.5;
    b = (b - 0.5) * cont + 0.5;

    // Highlights / Shadows (Simplified)
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (luminance > 0.5) {
      const factor = (luminance - 0.5) * 2;
      r += r * high * factor;
      g += g * high * factor;
      b += b * high * factor;
    } else {
      const factor = (0.5 - luminance) * 2;
      r += r * shad * factor;
      g += g * shad * factor;
      b += b * shad * factor;
    }

    // Whites / Blacks
    r = r + (r > 0.8 ? (r - 0.8) * 5 * whi : 0);
    r = r + (r < 0.2 ? (0.2 - r) * 5 * bla : 0);
    // (Apply same to G and B for simplicity in this pass)
    g = g + (g > 0.8 ? (g - 0.8) * 5 * whi : 0);
    g = g + (g < 0.2 ? (0.2 - g) * 5 * bla : 0);
    b = b + (b > 0.8 ? (b - 0.8) * 5 * whi : 0);
    b = b + (b < 0.2 ? (0.2 - b) * 5 * bla : 0);

    // Saturation
    const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * sat;
    g = gray + (g - gray) * sat;
    b = gray + (b - gray) * sat;

    data[i] = Math.min(255, Math.max(0, r * 255));
    data[i + 1] = Math.min(255, Math.max(0, g * 255));
    data[i + 2] = Math.min(255, Math.max(0, b * 255));
  }

  ctx.putImageData(imageData, 0, 0);
}

export function applyBlur(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  type: 'none' | 'box' | 'gaussian' | 'cross',
  radius: number
) {
  if (type === 'none' || radius <= 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const output = new Uint8ClampedArray(data.length);

  // Simplified Box Blur for performance
  if (type === 'box' || type === 'gaussian') {
    const r = Math.floor(radius);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const idx = (ny * width + nx) * 4;
              rSum += data[idx];
              gSum += data[idx + 1];
              bSum += data[idx + 2];
              count++;
            }
          }
        }
        const idx = (y * width + x) * 4;
        output[idx] = rSum / count;
        output[idx + 1] = gSum / count;
        output[idx + 2] = bSum / count;
        output[idx + 3] = data[idx + 3];
      }
    }
  } else if (type === 'cross') {
    const r = Math.floor(radius);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        // Horizontal
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          if (nx >= 0 && nx < width) {
            const idx = (y * width + nx) * 4;
            rSum += data[idx];
            gSum += data[idx + 1];
            bSum += data[idx + 2];
            count++;
          }
        }
        // Vertical
        for (let dy = -r; dy <= r; dy++) {
          const ny = y + dy;
          if (ny >= 0 && ny < height) {
            const idx = (ny * width + x) * 4;
            rSum += data[idx];
            gSum += data[idx + 1];
            bSum += data[idx + 2];
            count++;
          }
        }
        const idx = (y * width + x) * 4;
        output[idx] = rSum / count;
        output[idx + 1] = gSum / count;
        output[idx + 2] = bSum / count;
        output[idx + 3] = data[idx + 3];
      }
    }
  }

  ctx.putImageData(new ImageData(output, width, height), 0, 0);
}

export function applyEdgeDetection(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  threshold: number,
  strength: number,
  invert: boolean
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const output = new Uint8ClampedArray(data.length);

  // Sobel Kernels
  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let valX = 0;
      let valY = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const luminance = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          valX += luminance * gx[(ky + 1) * 3 + (kx + 1)];
          valY += luminance * gy[(ky + 1) * 3 + (kx + 1)];
        }
      }

      let magnitude = Math.sqrt(valX * valX + valY * valY) * (strength / 5);

      // Thresholding
      if (magnitude < threshold) magnitude = 0;
      else magnitude = Math.min(255, magnitude);

      if (invert) magnitude = 255 - magnitude;

      const idx = (y * width + x) * 4;
      output[idx] = magnitude;
      output[idx + 1] = magnitude;
      output[idx + 2] = magnitude;
      output[idx + 3] = 255;
    }
  }

  ctx.putImageData(new ImageData(output, width, height), 0, 0);
}

export function detectPerspectiveLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  granularity: number,
  opacity: number,
  color: string
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Simplified line detection using gradient direction
  // We'll draw lines that follow strong gradients
  ctx.strokeStyle = color;
  ctx.globalAlpha = opacity;
  ctx.lineWidth = 1;

  const step = Math.max(5, Math.floor(100 - granularity));

  for (let y = step; y < height - step; y += step) {
    for (let x = step; x < width - step; x += step) {
      const idx = (y * width + x) * 4;

      // Calculate gradient
      const idxR = (y * width + (x + 1)) * 4;
      const idxL = (y * width + (x - 1)) * 4;
      const idxD = ((y + 1) * width + x) * 4;
      const idxU = ((y - 1) * width + x) * 4;

      const lumR = (data[idxR] + data[idxR+1] + data[idxR+2]) / 3;
      const lumL = (data[idxL] + data[idxL+1] + data[idxL+2]) / 3;
      const lumD = (data[idxD] + data[idxD+1] + data[idxD+2]) / 3;
      const lumU = (data[idxU] + data[idxU+1] + data[idxU+2]) / 3;

      const dx = lumR - lumL;
      const dy = lumD - lumU;
      const mag = Math.sqrt(dx * dx + dy * dy);

      if (mag > 20) {
        // Draw a line perpendicular to the gradient (along the edge)
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        const length = step * 2;

        ctx.beginPath();
        ctx.moveTo(x - Math.cos(angle) * length, y - Math.sin(angle) * length);
        ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
        ctx.stroke();
      }
    }
  }

  ctx.globalAlpha = 1.0;
}
