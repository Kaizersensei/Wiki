
export type NoiseMode = 'perlin' | 'cellular' | 'marble' | 'wood' | 'clouds';
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'add' | 'subtract';

export interface NoiseLayer {
  id: string;
  mode: NoiseMode;
  scale: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  seed: number;
  opacity: number;
  blendMode: BlendMode;
  visible: boolean;
}

export function createMixedNoiseCanvas(
  width: number,
  height: number,
  layers: NoiseLayer[],
  gradient: { pos: number, color: string }[]
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Final grayscale buffer initialized to 0 (or first layer base)
  const finalBuffer = new Float32Array(width * height);

  layers.filter(l => l.visible).forEach((layer, layerIdx) => {
    const rand = mulberry32(layer.seed);
    const p = new Uint8Array(512);
    const permutation = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
    }
    for (let i = 0; i < 256; i++) p[i] = p[i + 256] = permutation[i];

    function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(t: number, a: number, b: number) { return a + t * (b - a); }
    function grad(hash: number, x: number, y: number, z: number) {
      const h = hash & 15;
      const u = h < 8 ? x : y;
      const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
      return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    function noise(x: number, y: number, z: number) {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
      x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
      const u = fade(x), v = fade(y), w = fade(z);
      const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
      const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
      return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)),
                             lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z))),
                     lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)),
                             lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1))));
    }

    function fBm(x: number, y: number) {
      let total = 0, frequency = layer.scale / 100, amplitude = 1, maxValue = 0;
      for (let i = 0; i < layer.octaves; i++) {
        total += noise(x * frequency, y * frequency, layer.seed) * amplitude;
        maxValue += amplitude; amplitude *= layer.persistence; frequency *= layer.lacunarity;
      }
      return (total / maxValue + 1) / 2;
    }

    function cellular(x: number, y: number) {
      const frequency = layer.scale / 10;
      const nx = x * frequency, ny = y * frequency;
      const ix = Math.floor(nx), iy = Math.floor(ny);
      let minDist = 1.0;
      for (let j = -1; j <= 1; j++) {
        for (let i = -1; i <= 1; i++) {
          const cx = ix + i, cy = iy + j;
          const pointHash = p[(p[cx & 255] + cy) & 255] / 255;
          const px = cx + pointHash, py = cy + (p[(p[cy & 255] + cx) & 255] / 255);
          const dx = px - nx, dy = py - ny;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) minDist = dist;
        }
      }
      return Math.max(0, Math.min(1, minDist));
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let val = 0;
        if (layer.mode === 'perlin') val = fBm(x, y);
        else if (layer.mode === 'cellular') val = cellular(x, y);
        else if (layer.mode === 'marble') val = (Math.sin(x * (layer.scale/50) + fBm(x, y) * 10) + 1) / 2;
        else if (layer.mode === 'wood') {
          const nx = x - width/2, ny = y - height/2;
          const dist = Math.sqrt(nx*nx + ny*ny) * (layer.scale/50);
          val = (Math.sin(dist * 10 + fBm(x, y) * 2) + 1) / 2;
        }
        else if (layer.mode === 'clouds') val = Math.pow(fBm(x, y), 2);

        const current = finalBuffer[y * width + x];
        const blended = blend(current, val, layer.blendMode, layer.opacity);
        finalBuffer[y * width + x] = Math.max(0, Math.min(1, blended));
      }
    }
  });

  // Apply gradient
  const gradCanvas = document.createElement('canvas');
  gradCanvas.width = 256;
  gradCanvas.height = 1;
  const gCtx = gradCanvas.getContext('2d')!;
  const linearGrad = gCtx.createLinearGradient(0, 0, 256, 0);
  [...gradient].sort((a,b) => a.pos - b.pos).forEach(g => linearGrad.addColorStop(g.pos, g.color));
  gCtx.fillStyle = linearGrad;
  gCtx.fillRect(0, 0, 256, 1);
  const gData = gCtx.getImageData(0, 0, 256, 1).data;

  for (let i = 0; i < width * height; i++) {
    const val = finalBuffer[i];
    const idx = i * 4;
    const gIdx = Math.floor(val * 255) * 4;
    data[idx] = gData[gIdx];
    data[idx + 1] = gData[gIdx + 1];
    data[idx + 2] = gData[gIdx + 2];
    data[idx + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function blend(base: number, blend: number, mode: BlendMode, opacity: number): number {
  let res = 0;
  switch(mode) {
    case 'normal': res = blend; break;
    case 'multiply': res = base * blend; break;
    case 'screen': res = 1 - (1 - base) * (1 - blend); break;
    case 'overlay': res = base < 0.5 ? 2 * base * blend : 1 - 2 * (1 - base) * (1 - blend); break;
    case 'add': res = base + blend; break;
    case 'subtract': res = base - blend; break;
  }
  return base * (1 - opacity) + res * opacity;
}
