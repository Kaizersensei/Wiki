import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  Scissors,
  Copy,
  Download,
  Wand2,
  RefreshCw,
  Maximize2,
  Move,
  AlertCircle,
  Sparkles,
  Layers,
  Send,
  Scan,
  Cpu,
  Type,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { solveHomography, Point } from './lib/perspective';
import { createMixedNoiseCanvas, NoiseLayer, BlendMode } from './lib/noise';

export default function App() {
  const [activeTab, setActiveTab] = useState<'resampler' | 'generator'>('resampler');
  const [image, setImage] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });
  const [fileName, setFileName] = useState<string>('');
  const [points, setPoints] = useState<Point[]>([
    { x: 0.1, y: 0.1 },
    { x: 0.9, y: 0.1 },
    { x: 0.9, y: 0.9 },
    { x: 0.1, y: 0.9 },
  ]);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedTexture, setExtractedTexture] = useState<string | null>(null);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaleEnabled, setUpscaleEnabled] = useState(false);
  const [pbrEnabled, setPbrEnabled] = useState(false);
  const [outputSize, setOutputSize] = useState({ width: 0, height: 0 });
  const [pbrMaps, setPbrMaps] = useState<{ normal: string, roughness: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Grid & Snapping
  const [gridEnabled, setGridEnabled] = useState(true);
  const [gridDensity, setGridDensity] = useState(10);
  const [snappingEnabled, setSnappingEnabled] = useState(false);

  const innerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      if (innerRef.current) {
        setContainerSize({
          width: innerRef.current.clientWidth,
          height: innerRef.current.clientHeight,
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [image]);

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          setOriginalSize({ width: img.width, height: img.height });
          setImage(ev.target?.result as string);
          setExtractedTexture(null);
          setPoints([
            { x: 0.2, y: 0.2 },
            { x: 0.8, y: 0.2 },
            { x: 0.8, y: 0.8 },
            { x: 0.2, y: 0.8 },
          ]);
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!image) return;
    const delta = -e.deltaY;
    const zoomFactor = delta > 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.max(0.1, Math.min(10, prev * zoomFactor)));
  };

  const lastMiddleClickRef = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle click (1) or Alt + Left click (0 + alt)
    const isMiddleClick = e.button === 1;
    const isAltLeftClick = e.button === 0 && e.altKey;

    if (isMiddleClick) {
      e.preventDefault();
      const now = Date.now();
      if (now - lastMiddleClickRef.current < 300) {
        // Double middle click -> Reset
        setZoom(1);
        setPan({ x: 0, y: 0 });
        return;
      }
      lastMiddleClickRef.current = now;
    }

    if (isMiddleClick || isAltLeftClick) {
       e.preventDefault();
       const startX = e.clientX - pan.x;
       const startY = e.clientY - pan.y;

       const onMouseMove = (moveEvent: MouseEvent) => {
         setPan({
           x: moveEvent.clientX - startX,
           y: moveEvent.clientY - startY
         });
       };

       const onMouseUp = () => {
         document.removeEventListener('mousemove', onMouseMove);
         document.removeEventListener('mouseup', onMouseUp);
       };

       document.addEventListener('mousemove', onMouseMove);
       document.addEventListener('mouseup', onMouseUp);
    }
  };

  const snapValue = (val: number) => {
    if (!snappingEnabled) return val;
    // Snap to grid increments (0.01 or custom)
    const step = 1 / (gridDensity * 2);
    return Math.round(val / step) * step;
  };

  const getNearestPoT = (val: number) => {
    return Math.pow(2, Math.round(Math.log2(val)));
  };

  const generatePBRMaps = (baseImageData: ImageData) => {
    const width = baseImageData.width;
    const height = baseImageData.height;
    const normalData = new ImageData(width, height);
    const roughnessData = new ImageData(width, height);

    const getLuma = (idx: number) => {
      const r = baseImageData.data[idx];
      const g = baseImageData.data[idx + 1];
      const b = baseImageData.data[idx + 2];
      return (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255.0;
    };

    const strength = 2.0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const l = x > 0 ? getLuma((y * width + (x - 1)) * 4) : getLuma(idx);
        const r = x < width - 1 ? getLuma((y * width + (x + 1)) * 4) : getLuma(idx);
        const t = y > 0 ? getLuma(((y - 1) * width + x) * 4) : getLuma(idx);
        const b = y < height - 1 ? getLuma(((y + 1) * width + x) * 4) : getLuma(idx);

        const dx = (r - l) * strength;
        const dy = (b - t) * strength;
        const len = Math.sqrt(dx * dx + dy * dy + 1.0);

        normalData.data[idx] = ((dx / len) * 0.5 + 0.5) * 255;
        normalData.data[idx + 1] = ((dy / len) * 0.5 + 0.5) * 255;
        normalData.data[idx + 2] = (1.0 / len) * 255;
        normalData.data[idx + 3] = 255;

        const luma = getLuma(idx);
        const rough = Math.max(0, Math.min(255, (1.0 - luma) * 255));
        roughnessData.data[idx] = roughnessData.data[idx + 1] = roughnessData.data[idx + 2] = rough;
        roughnessData.data[idx + 3] = 255;
      }
    }

    const nCanvas = document.createElement('canvas');
    nCanvas.width = width; nCanvas.height = height;
    nCanvas.getContext('2d')?.putImageData(normalData, 0, 0);
    const rCanvas = document.createElement('canvas');
    rCanvas.width = width; rCanvas.height = height;
    rCanvas.getContext('2d')?.putImageData(roughnessData, 0, 0);

    return { normal: nCanvas.toDataURL('image/png'), roughness: rCanvas.toDataURL('image/png') };
  };

  const extractTexture = async () => {
    if (!image || !imageRef.current) return;
    setIsExtracting(true);
    setError(null);

    try {
      const srcPoints = points.map(p => ({
        x: p.x * originalSize.width,
        y: p.y * originalSize.height,
      }));

      const w1 = Math.hypot(srcPoints[1].x - srcPoints[0].x, srcPoints[1].y - srcPoints[0].y);
      const w2 = Math.hypot(srcPoints[2].x - srcPoints[3].x, srcPoints[2].y - srcPoints[3].y);
      const h1 = Math.hypot(srcPoints[3].x - srcPoints[0].x, srcPoints[3].y - srcPoints[0].y);
      const h2 = Math.hypot(srcPoints[2].x - srcPoints[1].x, srcPoints[2].y - srcPoints[1].y);

      const avgW = (w1 + w2) / 2;
      const avgH = (h1 + h2) / 2;

      let outWidth = getNearestPoT(avgW);
      let outHeight = getNearestPoT(avgH);

      outWidth = Math.min(4096, Math.max(16, outWidth));
      outHeight = Math.min(4096, Math.max(16, outHeight));

      const canvas = document.createElement('canvas');
      canvas.width = outWidth;
      canvas.height = outHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const img = imageRef.current;
      const dstPoints = [
        { x: 0, y: 0 },
        { x: outWidth, y: 0 },
        { x: outWidth, y: outHeight },
        { x: 0, y: outHeight },
      ];

      const h = solveHomography(dstPoints, srcPoints);
      if (!h) throw new Error("Could not solve perspective transform");

      const offscreen = document.createElement('canvas');
      offscreen.width = originalSize.width;
      offscreen.height = originalSize.height;
      const offCtx = offscreen.getContext('2d');
      offCtx?.drawImage(img, 0, 0);
      const srcData = offCtx?.getImageData(0, 0, originalSize.width, originalSize.height);
      const dstData = ctx.createImageData(outWidth, outHeight);

      if (!srcData) throw new Error("Failed to read image data");

      const [a_h, b_h, c_h, d_h, e_h, f_h, g_h, h_mh] = h;

      for (let y = 0; y < outHeight; y++) {
        for (let x = 0; x < outWidth; x++) {
          const w = g_h * x + h_mh * y + 1;
          const srcX = (a_h * x + b_h * y + c_h) / w;
          const srcY = (d_h * x + e_h * y + f_h) / w;

          const sx = Math.floor(srcX);
          const sy = Math.floor(srcY);

          if (sx >= 0 && sx < originalSize.width && sy >= 0 && sy < originalSize.height) {
            const srcIdx = (sy * originalSize.width + sx) * 4;
            const dstIdx = (y * outWidth + x) * 4;
            dstData.data[dstIdx] = srcData.data[srcIdx];
            dstData.data[dstIdx + 1] = srcData.data[srcIdx + 1];
            dstData.data[dstIdx + 2] = srcData.data[srcIdx + 2];
            dstData.data[dstIdx + 3] = srcData.data[srcIdx + 3];
          }
        }
      }

      let finalW = outWidth;
      let finalH = outHeight;
      let finalData = dstData;

      if (upscaleEnabled) {
          finalData = localScale2x(dstData);
          finalW *= 2;
          finalH *= 2;
      }

      ctx.canvas.width = finalW;
      ctx.canvas.height = finalH;
      ctx.putImageData(finalData, 0, 0);

      const textureUrl = canvas.toDataURL('image/png');
      setExtractedTexture(textureUrl);
      setOutputSize({ width: finalW, height: finalH });
      setAspectRatio(finalW / finalH);

      if (pbrEnabled) {
          setPbrMaps(generatePBRMaps(finalData));
      } else {
          setPbrMaps(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const copyToClipboard = async () => {
    if (!extractedTexture) return;
    try {
      const resp = await fetch(extractedTexture);
      const blob = await resp.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      // Small feedback toast would be better but keeping it simple
    } catch (err) {
      console.error(err);
      setError("Clipboard access failed. Use Save Texture instead.");
    }
  };

  const saveTexture = () => {
    if (!extractedTexture) return;
    const link = document.createElement('a');
    link.download = `texture_${Date.now()}.png`;
    link.href = extractedTexture;
    link.click();
  };

  const handleUpscale = async () => {
    if (!extractedTexture) return;
    setIsUpscaling(true);
    setError(null);
    try {
      const img = new Image();
      img.src = extractedTexture;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const srcData = ctx.getImageData(0, 0, img.width, img.height);

      // Perform Scale2x local upscale
      const upsclaled = localScale2x(srcData);

      const outCanvas = document.createElement('canvas');
      outCanvas.width = upsclaled.width;
      outCanvas.height = upsclaled.height;
      const outCtx = outCanvas.getContext('2d');
      if (!outCtx) return;
      outCtx.putImageData(upsclaled, 0, 0);

      setExtractedTexture(outCanvas.toDataURL('image/png'));
      setOutputSize({ width: upsclaled.width, height: upsclaled.height });
    } catch (err: any) {
      setError("Local upscale failed: " + err.message);
    } finally {
      setIsUpscaling(false);
    }
  };

  const localScale2x = (srcData: ImageData): ImageData => {
    const sw = srcData.width;
    const sh = srcData.height;
    const dw = sw * 2;
    const dh = sh * 2;
    const dstData = new ImageData(dw, dh);
    const src = new Uint32Array(srcData.data.buffer);
    const dst = new Uint32Array(dstData.data.buffer);

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const p = src[y * sw + x];
        const a = src[Math.max(0, y - 1) * sw + x];
        const b = src[y * sw + Math.min(sw - 1, x + 1)];
        const c = src[y * sw + Math.max(0, x - 1)];
        const d = src[Math.min(sh - 1, y + 1) * sw + x];

        let p1 = p, p2 = p, p3 = p, p4 = p;
        if (a === c && a !== d && c !== b) p1 = a;
        if (a === b && a !== c && b !== d) p2 = b;
        if (d === c && d !== b && c !== a) p3 = c;
        if (d === b && d !== c && b !== a) p4 = d;

        const base = (y * 2) * dw + (x * 2);
        dst[base] = p1;
        dst[base + 1] = p2;
        dst[base + dw] = p3;
        dst[base + dw + 1] = p4;
      }
    }
    return dstData;
  };

  return (
    <div className="h-screen w-full bg-brand-bg text-brand-text flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 px-6 border-b border-brand-border flex items-center justify-between bg-brand-surface shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">TeXtract <span className="text-blue-400 font-normal">v3.0</span></h1>
          </div>

          <nav className="flex gap-1 bg-brand-bg p-1 rounded-lg border border-brand-border">
            <button
              onClick={() => setActiveTab('resampler')}
              className={`px-4 py-1.5 rounded-md text-[10px] font-black tracking-widest transition-all ${activeTab === 'resampler' ? 'bg-brand-surface text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              RESAMPLER
            </button>
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-4 py-1.5 rounded-md text-[10px] font-black tracking-widest transition-all ${activeTab === 'generator' ? 'bg-brand-surface text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              GENERATOR
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
              <a href="https://docs.google.com/forms/d/e/1FAIpQLSdE0VJq3IeFe8ICOzFE9-TG4YgG1yS0DTwUMKkffUAkCkcWug/viewform?usp=header" target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center rounded-md border border-brand-border px-3 py-2 text-xs text-slate-300 hover:bg-brand-border" aria-label="Report a bug (opens in a new tab)">Report a bug</a>
          <label className="cursor-pointer">
            <input type="file" className="hidden" onChange={onImageUpload} accept="image/*" />
            <div className="px-4 py-2 bg-brand-border hover:bg-[#383D47] rounded-md text-sm font-medium transition-colors flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </div>
          </label>
          <button
            onClick={copyToClipboard}
            disabled={!extractedTexture}
            className="px-4 py-2 bg-brand-border hover:bg-[#383D47] disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors"
          >
            Copy
          </button>
          <button
            onClick={saveTexture}
            disabled={!extractedTexture}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm font-medium shadow-lg shadow-blue-900/20"
          >
            Save Texture
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'resampler' ? (
          <>
            {/* Canvas Area */}
            <div
              className="flex-1 bg-brand-deep relative flex items-center justify-center p-8 overflow-hidden cursor-crosshair"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
            >
          <div
            className="relative w-full h-full max-w-[800px] max-h-[600px] bg-brand-surface rounded-xl shadow-2xl border border-brand-border flex items-center justify-center"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transition: isExtracting ? 'none' : 'transform 0.15s ease-out'
            }}
          >
            {!image ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-brand-muted opacity-40">
                  <Upload className="w-12 h-12 mb-4" />
                  <p className="text-sm font-medium uppercase tracking-widest">Awaiting Image Source</p>
                </div>
            ) : (
                <div ref={innerRef} className="relative inline-block max-h-full max-w-full">
                    <img
                      ref={imageRef}
                      src={image}
                      alt="Source"
                      className="max-h-full max-w-full select-none block"
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        setContainerSize({ width: img.clientWidth, height: img.clientHeight });
                      }}
                    />

                    {/* SVG Perspective overlay */}
                    <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible">
                      {/* Grid Lines */}
                      {gridEnabled && (() => {
                        const square = [{x:0,y:0}, {x:1,y:0}, {x:1,y:1}, {x:0,y:1}];
                        const h = solveHomography(square, points);
                        if (!h) return null;
                        const [a, b, c, d, e, f, g, h_m] = h;

                        const project = (u: number, v: number) => {
                          const w = g * u + h_m * v + 1;
                          return {
                            x: (a * u + b * v + c) / w,
                            y: (d * u + e * v + f) / w,
                          };
                        };

                        const lines = [];
                        // Horizontal lines
                        for (let i = 0; i <= gridDensity; i++) {
                          const v = i / gridDensity;
                          const pStart = project(0, v);
                          const pEnd = project(1, v);
                          lines.push(
                            <line
                              key={`h-${i}`}
                              x1={pStart.x * containerSize.width}
                              y1={pStart.y * containerSize.height}
                              x2={pEnd.x * containerSize.width}
                              y2={pEnd.y * containerSize.height}
                              stroke="rgba(255, 255, 255, 0.2)"
                              strokeWidth="1"
                            />
                          );
                          lines.push(
                            <line
                              key={`hb-${i}`}
                              x1={pStart.x * containerSize.width}
                              y1={pStart.y * containerSize.height}
                              x2={pEnd.x * containerSize.width}
                              y2={pEnd.y * containerSize.height}
                              stroke="rgba(0, 0, 0, 0.1)"
                              strokeWidth="1"
                              strokeDasharray="2 2"
                            />
                          );
                        }
                        // Vertical lines
                        for (let i = 0; i <= gridDensity; i++) {
                          const u = i / gridDensity;
                          const pTop = project(u, 0);
                          const pBottom = project(u, 1);
                          lines.push(
                            <line
                              key={`v-${i}`}
                              x1={pTop.x * containerSize.width}
                              y1={pTop.y * containerSize.height}
                              x2={pBottom.x * containerSize.width}
                              y2={pBottom.y * containerSize.height}
                              stroke="rgba(255, 255, 255, 0.2)"
                              strokeWidth="1"
                            />
                          );
                          lines.push(
                             <line
                               key={`vb-${i}`}
                               x1={pTop.x * containerSize.width}
                               y1={pTop.y * containerSize.height}
                               x2={pBottom.x * containerSize.width}
                               y2={pBottom.y * containerSize.height}
                               stroke="rgba(0, 0, 0, 0.1)"
                               strokeWidth="1"
                               strokeDasharray="2 2"
                             />
                           );
                        }
                        return <g>{lines}</g>;
                      })()}

                      <polygon
                        points={points.map(p => `${p.x * containerSize.width},${p.y * containerSize.height}`).join(' ')}
                        fill="rgba(59, 130, 246, 0.1)"
                        stroke="#3B82F6"
                        strokeWidth="2"
                        strokeDasharray="4"
                      />
                    </svg>

                    {/* Handles */}
                    {points.map((p, i) => (
                      <div
                        key={i}
                        style={{
                          left: `${p.x * 100}%`,
                          top: `${p.y * 100}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className="absolute w-8 h-8 z-30 cursor-move flex items-center justify-center group"
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startY = e.clientY;
                            const startPx = { ...p };

                            const onMouseMove = (moveEvent: MouseEvent) => {
                                // Account for zoom in the delta calculation
                                const dx = (moveEvent.clientX - startX) / (containerSize.width * zoom);
                                const dy = (moveEvent.clientY - startY) / (containerSize.height * zoom);
                                const newPoints = [...points];
                                newPoints[i] = {
                                    x: snapValue(Math.max(0, Math.min(1, startPx.x + dx))),
                                    y: snapValue(Math.max(0, Math.min(1, startPx.y + dy))),
                                };
                                setPoints(newPoints);
                            };

                            const onMouseUp = () => {
                                document.removeEventListener('mousemove', onMouseMove);
                                document.removeEventListener('mouseup', onMouseUp);
                            };

                            document.addEventListener('mousemove', onMouseMove);
                            document.addEventListener('mouseup', onMouseUp);
                        }}
                      >
                        <div
                          className="w-1.5 h-1.5 bg-white border border-blue-500 rounded-full shadow-lg group-hover:scale-150 transition-transform"
                          style={{ transform: `scale(${1/zoom})` }}
                        />
                        <div className="absolute top-full mt-1 bg-black/80 text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {p.x.toFixed(3)}, {p.y.toFixed(3)}
                        </div>
                      </div>
                    ))}

                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold">
                        Source: {fileName || "Reference.jpg"}
                    </div>
                </div>
            )}
          </div>

          <div className="absolute bottom-8 flex gap-2">
            <div className={`bg-brand-surface/80 backdrop-blur-md px-4 py-2 rounded-full border border-brand-border text-xs flex items-center gap-2 transition-opacity ${image ? 'opacity-100' : 'opacity-0'}`}>
              <span className={`w-2 h-2 rounded-full ${image ? 'bg-green-500 animate-pulse' : 'bg-brand-muted'}`}></span>
              {image ? 'Perspective Grid Active' : 'Waiting for input'}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-80 bg-brand-surface border-l border-brand-border flex flex-col p-6 shrink-0 overflow-y-auto">
          {/* Preview Section */}
          <div className="mb-8">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 block">Output Preview</label>
            <div className="w-full aspect-square bg-brand-bg rounded-lg border border-brand-border flex items-center justify-center relative overflow-hidden group">
              <AnimatePresence mode="wait">
                {extractedTexture ? (
                  <motion.div
                    key="texture"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 w-full h-full"
                  >
                    <img
                      src={extractedTexture}
                      alt="Output"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-2 left-2 text-[10px] text-white/70 font-mono">
                        {outputSize.width} x {outputSize.height} PX
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center gap-2 opacity-20">
                    <Maximize2 className="w-8 h-8" />
                    <span className="text-[10px] uppercase tracking-tighter">No Output</span>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {pbrMaps && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-brand-bg border border-brand-border rounded aspect-square overflow-hidden relative group">
                  <img src={pbrMaps.normal} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 text-[8px] bg-black/60 px-1 rounded text-white font-mono uppercase tracking-tighter">Norm</span>
                </div>
                <div className="bg-brand-bg border border-brand-border rounded aspect-square overflow-hidden relative group">
                  <img src={pbrMaps.roughness} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 text-[8px] bg-black/60 px-1 rounded text-white font-mono uppercase tracking-tighter">Rgh</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col space-y-8">
            {/* Aspect Ratio Section */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">Target Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-2">
                {[1, 1.333, 1.777, 0.75].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAspectRatio(val)}
                    className={`px-3 py-2 rounded text-xs transition-all border ${
                        Math.abs(aspectRatio - val) < 0.01
                        ? 'bg-blue-600/20 border-blue-600/50 text-blue-400'
                        : 'bg-brand-bg border-brand-border hover:border-slate-500 text-slate-400'
                    }`}
                  >
                    {val === 1 ? '1 : 1 Square' : val === 1.333 ? '4 : 3 Photo' : val === 1.777 ? '16 : 9 Wide' : '3 : 4 Protrait'}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <input
                  type="range"
                  min="0.2"
                  max="5"
                  step="0.01"
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(parseFloat(e.target.value))}
                  className="w-full h-1 bg-brand-border rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[9px] text-brand-muted mt-1 uppercase">
                    <span>Slim</span>
                    <span>{aspectRatio.toFixed(2)}:1</span>
                    <span>Wide</span>
                </div>
              </div>
            </div>

            {/* Grid & Snapping Section */}
            <div className="pt-6 border-t border-brand-border space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Perspective Grid</p>
                <button
                  onClick={() => setGridEnabled(!gridEnabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${gridEnabled ? 'bg-blue-600' : 'bg-brand-bg border-brand-border'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${gridEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {gridEnabled && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-brand-muted uppercase">
                    <span>Grid Density</span>
                    <span>{gridDensity}x{gridDensity}</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="20"
                    step="1"
                    value={gridDensity}
                    onChange={(e) => setGridDensity(parseInt(e.target.value))}
                    className="w-full h-1 bg-brand-border rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <p className="text-sm font-medium">Point Snapping</p>
                <button
                  onClick={() => setSnappingEnabled(!snappingEnabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${snappingEnabled ? 'bg-blue-600' : 'bg-brand-bg border-brand-border'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${snappingEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Processing Section */}
            <div className="pt-6 border-t border-brand-border space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-tight">Scale-x2 Resampler</p>
                  <p className="text-[11px] text-slate-500">Local Edge-Directed Upscale</p>
                </div>
                <button
                  onClick={() => setUpscaleEnabled(!upscaleEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${upscaleEnabled ? 'bg-blue-600' : 'bg-brand-bg border-brand-border'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${upscaleEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">PBR Map Generation</p>
                  <p className="text-[11px] text-slate-500">Auto-create Normals/Roughness</p>
                </div>
                <button
                  onClick={() => setPbrEnabled(!pbrEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${pbrEnabled ? 'bg-indigo-600' : 'bg-brand-bg border-brand-border'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${pbrEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

              <div className="mt-auto pt-6 flex flex-col gap-3">
                <button
                  onClick={() => {
                    setPoints([
                      { x: 0.2, y: 0.2 },
                      { x: 0.8, y: 0.2 },
                      { x: 0.8, y: 0.8 },
                      { x: 0.2, y: 0.8 },
                    ]);
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="w-full py-2 bg-brand-bg hover:bg-brand-border border border-brand-border rounded text-[10px] uppercase font-bold tracking-widest text-brand-muted transition-colors"
                >
                  Reset Layout
                </button>
                <button
                  onClick={extractTexture}
                  disabled={!image || isExtracting}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold text-sm tracking-wide shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                >
                  {isExtracting ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                      <>
                          <Maximize2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          EXTRACT TEXTURE
                      </>
                  )}
                </button>
              </div>
          </div>
        </aside>
          </>
        ) : (
          <GeneratorView onSendToResampler={(img) => {
            setImage(img);
            setActiveTab('resampler');
          }} />
        )}
      </main>

      {/* Footer */}
      <footer className="h-8 bg-brand-deep border-t border-brand-border px-6 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest shrink-0">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> GPU Acceleration: Active</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span>Format: PNG 24-bit</span>
        </div>
        <div className="flex gap-4">
          <span>Points: 4 connected</span>
          <span className="flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> High Fidelity Mode</span>
        </div>
      </footer>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-red-950 border border-red-900 px-6 py-3 rounded-full flex items-center gap-3 text-red-200 shadow-2xl z-50 cursor-pointer"
            onClick={() => setError(null)}
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GeneratorView({ onSendToResampler }: { onSendToResampler: (img: string) => void }) {
  const [layers, setLayers] = useState<NoiseLayer[]>([
    {
      id: '1',
      mode: 'perlin',
      scale: 10,
      octaves: 6,
      persistence: 0.5,
      lacunarity: 2.0,
      seed: Math.random() * 1000,
      opacity: 1,
      blendMode: 'normal',
      visible: true
    }
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('1');
  const [gradient, setGradient] = useState([
    { pos: 0, color: '#000000' },
    { pos: 1, color: '#ffffff' }
  ]);
  const [preview, setPreview] = useState<string>('');

  useEffect(() => {
    const img = createMixedNoiseCanvas(512, 512, layers, gradient);
    setPreview(img);
  }, [layers, gradient]);

  const selectedLayer = layers.find(l => l.id === selectedLayerId) || layers[0];

  const updateLayer = (id: string, updates: Partial<NoiseLayer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const addLayer = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newLayer: NoiseLayer = {
      ...selectedLayer,
      id: newId,
      seed: Math.random() * 1000,
      opacity: 0.5,
      blendMode: 'add',
      visible: true
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newId);
  };

  const deleteLayer = (id: string) => {
    if (layers.length <= 1) return;
    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(layers[0].id);
  };

  const moveLayer = (idx: number, dir: number) => {
    const newLayers = [...layers];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= layers.length) return;
    [newLayers[idx], newLayers[targetIdx]] = [newLayers[targetIdx], newLayers[idx]];
    setLayers(newLayers);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `procedural_texture_${Date.now()}.png`;
    link.href = preview;
    link.click();
  };

  const noiseModes = [
    { id: 'perlin', name: 'Fractal fBm', icon: <Sparkles className="w-3 h-3" /> },
    { id: 'cellular', name: 'Voronoi', icon: <Layers className="w-3 h-3" /> },
    { id: 'marble', name: 'Marble', icon: <RefreshCw className="w-3 h-3" /> },
    { id: 'wood', name: 'Cross-Sect', icon: <Scan className="w-3 h-3" /> },
    { id: 'clouds', name: 'Nebular', icon: <Wand2 className="w-3 h-3" /> },
  ];

  const blendModes: BlendMode[] = ['normal', 'multiply', 'screen', 'overlay', 'add', 'subtract'];

  return (
    <div className="flex-1 flex bg-brand-deep overflow-hidden">
      {/* Left Sidebar: Layer Management */}
      <aside className="w-64 bg-brand-surface border-r border-brand-border p-4 flex flex-col space-y-4 shrink-0 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Synthesis Layers</h2>
          <button
            onClick={addLayer}
            className="p-1.5 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {[...layers].reverse().map((layer, revIdx) => {
            const idx = layers.length - 1 - revIdx;
            return (
              <div
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                className={`p-2 rounded-lg border cursor-pointer transition-all ${
                  selectedLayerId === layer.id
                    ? 'bg-blue-600/10 border-blue-500 shadow-lg'
                    : 'bg-brand-bg border-brand-border hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <button
                      onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}
                      className={`shrink-0 ${layer.visible ? 'text-blue-400' : 'text-slate-600'}`}
                    >
                      {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                    <span className="text-[9px] font-black uppercase tracking-tighter truncate text-slate-300">
                      {layer.mode} Layer {idx + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveLayer(idx, 1); }}
                      className="p-1 hover:text-blue-400 transition-colors disabled:opacity-20"
                      disabled={idx === layers.length - 1}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveLayer(idx, -1); }}
                      className="p-1 hover:text-blue-400 transition-colors disabled:opacity-20"
                      disabled={idx === 0}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                      className="p-1 text-red-500/50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                   <span className="text-[7px] text-slate-500 uppercase font-bold tracking-widest">{layer.blendMode}</span>
                   <span className="text-[7px] text-slate-500 font-mono">{(layer.opacity * 100).toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <div className="flex-1 p-8 flex items-center justify-center relative">
        <div className="relative aspect-square w-full max-w-[600px] bg-brand-surface rounded-xl shadow-2xl border border-brand-border overflow-hidden">
          {preview ? (
            <img src={preview} className="w-full h-full object-contain" alt="Noise Preview" />
          ) : (
            <div className="flex items-center justify-center h-full text-brand-muted uppercase text-xs tracking-widest">
              Synthesizing Texture...
            </div>
          )}
        </div>
      </div>

      <aside className="w-96 bg-brand-surface border-l border-brand-border p-6 flex flex-col space-y-6 overflow-y-auto shrink-0">
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xs font-black uppercase tracking-widest text-blue-400">Layer Properties</h2>
            <p className="text-[11px] text-slate-500">Modify the selected noise generator layer</p>
          </div>

          <div className="grid grid-cols-5 gap-1 p-1 bg-brand-bg rounded-lg border border-brand-border">
            {noiseModes.map(mode => (
              <button
                key={mode.id}
                onClick={() => updateLayer(selectedLayerId, { mode: mode.id as any })}
                className={`p-2 rounded-md transition-all flex flex-col items-center gap-1 ${
                  selectedLayer.mode === mode.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-500 hover:bg-brand-border'
                }`}
                title={mode.name}
              >
                {mode.icon}
                <span className="text-[6px] font-black uppercase tracking-tighter">{mode.id}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-brand-muted uppercase font-bold">Blend Mode</label>
              <select
                value={selectedLayer.blendMode}
                onChange={(e) => updateLayer(selectedLayerId, { blendMode: e.target.value as BlendMode })}
                className="w-full bg-brand-bg border border-brand-border rounded px-2 py-1.5 text-[10px] font-bold text-slate-300 outline-none focus:border-blue-500"
              >
                {blendModes.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] text-brand-muted uppercase font-bold">
                <span>Opacity</span>
                <span>{(selectedLayer.opacity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.01"
                value={selectedLayer.opacity}
                onChange={(e) => updateLayer(selectedLayerId, { opacity: parseFloat(e.target.value) })}
                className="w-full h-1 bg-brand-border rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-4">
            {[
              { label: 'Density / Scale', key: 'scale', min: 1, max: 200, step: 0.5 },
              { label: 'Complexity (Octaves)', key: 'octaves', min: 1, max: 8, step: 1 },
              { label: 'Persistence', key: 'persistence', min: 0.1, max: 0.9, step: 0.01 },
              { label: 'Lacunarity', key: 'lacunarity', min: 1, max: 4, step: 0.1 },
            ].map(p => (
              <div key={p.key} className="space-y-2">
                <div className="flex justify-between text-[10px] text-brand-muted uppercase font-bold">
                  <span>{p.label}</span>
                  <span>{(selectedLayer as any)[p.key]}</span>
                </div>
                <input
                  type="range"
                  min={p.min} max={p.max} step={p.step}
                  value={(selectedLayer as any)[p.key]}
                  onChange={(e) => updateLayer(selectedLayerId, { [p.key]: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-brand-border rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            ))}
            <button
              onClick={() => updateLayer(selectedLayerId, { seed: Math.random() * 1000 })}
              className="w-full py-2 bg-brand-bg hover:bg-brand-border border border-brand-border rounded text-[10px] uppercase font-black tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3 h-3" /> Randomize Seed
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xs font-black uppercase tracking-widest text-blue-400">Master Gradient</h2>
            <p className="text-[11px] text-slate-500">Spectral mapping for final output</p>
          </div>

          <div className="p-3 bg-brand-bg border border-brand-border rounded-lg space-y-4 shadow-inner">
            <div className="h-10 w-full rounded-md border border-brand-border shadow-sm" style={{
              background: `linear-gradient(to right, ${[...gradient].sort((a,b)=>a.pos-b.pos).map(g => `${g.color} ${g.pos*100}%`).join(', ')})`
            }} />

            <div className="flex gap-4">
              {gradient.map((g, i) => (
                <div key={i} className="flex flex-col gap-2 flex-1">
                  <div className="flex justify-between items-center text-[8px] text-brand-muted uppercase font-black">
                    <span>Node {i+1}</span>
                    <span>{(g.pos * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="color"
                    value={g.color}
                    onChange={(e) => {
                      const newGrad = [...gradient];
                      newGrad[i].color = e.target.value;
                      setGradient(newGrad);
                    }}
                    className="w-full h-10 bg-brand-surface border border-brand-border rounded-lg cursor-pointer"
                  />
                  <input
                    type="range" min="0" max="1" step="0.01" value={g.pos}
                    onChange={(e) => {
                      const newGrad = [...gradient];
                      newGrad[i].pos = parseFloat(e.target.value);
                      setGradient(newGrad);
                    }}
                    className="w-full h-1 accent-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 flex flex-col gap-3">
          <button
            onClick={() => onSendToResampler(preview)}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-bold text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-500/20 active:scale-95 uppercase"
          >
            <Send className="w-4 h-4" /> Finalize Output
          </button>
          <button
            onClick={handleDownload}
            className="w-full py-3 bg-brand-bg hover:bg-brand-border border border-brand-border rounded-xl font-bold text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all uppercase"
          >
            <Download className="w-4 h-4" /> Save as PNG
          </button>
        </div>
      </aside>
    </div>
  );
}
