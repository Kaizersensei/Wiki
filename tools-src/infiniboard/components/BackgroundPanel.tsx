import React, { useRef } from 'react';
import {
  Layers,
  Image as ImageIcon,
  EyeOff,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Grid,
  Sparkles,
  Sliders,
} from 'lucide-react';
import {
  BackgroundConfig,
  BackgroundOverlayType,
  BackgroundPatternPreset,
  BackgroundGradientType,
} from '../types';
import { defaultBackgroundConfig } from '../utils/math';

interface BackgroundPanelProps {
  config: BackgroundConfig;
  onChange: React.Dispatch<React.SetStateAction<BackgroundConfig>>;
  isOpen: boolean;
  onToggleOpen: () => void;
}

const BASE_COLOR_SWATCHES = [
  '#09090b',
  '#18181b',
  '#27272a',
  '#52525b',
  '#f4f4f5',
  '#ffffff',
  '#0f172a',
  '#1e1b4b',
];

const BUILTIN_TILES: { label: string; url: string }[] = [
  {
    label: 'Blueprint Tile',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
        <rect width="80" height="80" fill="#1e3a8a" fill-opacity="0.35"/>
        <path d="M 20 0 L 20 80 M 40 0 L 40 80 M 60 0 L 60 80 M 0 20 L 80 20 M 0 40 L 80 40 M 0 60 L 80 60" stroke="#60a5fa" stroke-opacity="0.2" stroke-width="1"/>
        <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#93c5fd" stroke-opacity="0.45" stroke-width="1.5"/>
      </svg>`
    )}`,
  },
  {
    label: 'Iso Cubes',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="52" viewBox="0 0 60 52">
        <g fill="none" stroke="#a1a1aa" stroke-opacity="0.35" stroke-width="1">
          <path d="M30 0 L60 17.3 L60 52 L30 34.6 L0 52 L0 17.3 Z"/>
          <path d="M0 17.3 L30 34.6 L60 17.3 M30 0 L30 34.6"/>
        </g>
      </svg>`
    )}`,
  },
  {
    label: 'Cross Markers',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <path d="M24 18v12M18 24h12" stroke="#a1a1aa" stroke-opacity="0.45" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="24" cy="24" r="1.5" fill="#e4e4e7" fill-opacity="0.5"/>
      </svg>`
    )}`,
  },
];

export const BackgroundPanel: React.FC<BackgroundPanelProps> = ({
  config,
  onChange,
  isOpen,
  onToggleOpen,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (updates: Partial<BackgroundConfig>) => {
    onChange((prev) => ({ ...prev, ...updates }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      update({
        repeatImage: ev.target?.result as string,
        overlayType: 'image',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const resetCorrections = () => {
    update({
      opacity: 100,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hueRotate: 0,
      tintColor: '#ffffff',
      tintIntensity: 0,
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="absolute top-4 right-4 bg-zinc-900/85 hover:bg-zinc-800 backdrop-blur border border-zinc-700 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-zinc-300 hover:text-white shadow-xl z-30 transition editor-control"
        title="Show Canvas Background Controls"
      >
        <span
          className="w-3 h-3 rounded-full border border-zinc-500 shrink-0"
          style={{ backgroundColor: config.baseColor }}
        />
        <Layers size={14} />
        <span>Background</span>
        <ChevronDown size={14} className="text-zinc-400" />
      </button>
    );
  }

  return (
    <div className="absolute top-4 right-4 w-76 max-w-[310px] max-h-[calc(100vh-2rem)] bg-zinc-900/95 backdrop-blur border border-zinc-700 rounded-2xl shadow-2xl z-30 flex flex-col overflow-hidden editor-control animate-in fade-in duration-150">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-blue-400" />
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
            Canvas Background
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChange(defaultBackgroundConfig)}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            title="Reset Background to Defaults"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={onToggleOpen}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            title="Hide Background Panel"
          >
            <ChevronUp size={15} />
          </button>
        </div>
      </div>

      {/* Non-Exporting Preview Warning Banner */}
      <div className="px-3.5 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-start gap-2">
        <EyeOff size={13} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-snug text-amber-200/90">
          <strong>Preview &amp; presentation only:</strong> This background does not export. Exported PNGs remain transparent.
        </p>
      </div>

      {/* Scrollable Body */}
      <div className="p-4 overflow-y-auto space-y-4 text-xs">
        {/* Lowest / Default Background Layer Color */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-zinc-200 block">
                Base Color (Lowest Layer)
              </span>
              <span className="text-[10px] text-zinc-500">
                Default background &amp; bottom-most layer
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-zinc-400 uppercase">
                {config.baseColor}
              </span>
              <input
                type="color"
                value={config.baseColor}
                onChange={(e) => update({ baseColor: e.target.value })}
                className="w-7 h-7 bg-transparent rounded cursor-pointer border border-zinc-700"
                title="Choose lowest background layer color"
              />
            </div>
          </div>

          {/* Quick Base Color Swatches */}
          <div className="flex items-center gap-1.5 pt-0.5">
            {BASE_COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch}
                onClick={() => update({ baseColor: swatch })}
                className={`w-5 h-5 rounded-md border transition ${
                  config.baseColor.toLowerCase() === swatch.toLowerCase()
                    ? 'border-blue-400 scale-110 ring-1 ring-blue-400/50'
                    : 'border-zinc-700 hover:border-zinc-500'
                }`}
                style={{ backgroundColor: swatch }}
                title={`Base color ${swatch}`}
              />
            ))}
          </div>
        </section>

        <hr className="border-zinc-800" />

        {/* Overlay Type Selector */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Grid size={12} className="text-zinc-400" /> Overlay Fill
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {(
              [
                { id: 'none', label: 'Solid' },
                { id: 'pattern', label: 'Pattern' },
                { id: 'gradient', label: 'Gradient' },
                { id: 'image', label: 'Image' },
              ] as { id: BackgroundOverlayType; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'image' && !config.repeatImage) {
                    update({
                      overlayType: 'image',
                      repeatImage: BUILTIN_TILES[0].url,
                    });
                  } else {
                    update({ overlayType: tab.id });
                  }
                }}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition ${
                  config.overlayType === tab.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Pattern Settings */}
          {config.overlayType === 'pattern' && (
            <div className="space-y-3 bg-zinc-800/40 p-3 rounded-xl border border-zinc-800">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Pattern Style</span>
                <select
                  value={config.patternPreset}
                  onChange={(e) =>
                    update({
                      patternPreset: e.target.value as BackgroundPatternPreset,
                    })
                  }
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="checkerboard">Checkerboard</option>
                  <option value="dots">Dots</option>
                  <option value="grid">Grid</option>
                  <option value="diagonal">Diagonal Lines</option>
                  <option value="crosshatch">Crosshatch</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Pattern Color</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    {config.patternColor}
                  </span>
                  <input
                    type="color"
                    value={config.patternColor}
                    onChange={(e) => update({ patternColor: e.target.value })}
                    className="w-6 h-6 bg-transparent rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Pattern Scale</span>
                  <span>{config.patternSize}px</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={80}
                  step={2}
                  value={config.patternSize}
                  onChange={(e) =>
                    update({ patternSize: parseInt(e.target.value, 10) })
                  }
                  className="w-full h-1 bg-zinc-700 rounded-lg accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Gradient Settings */}
          {config.overlayType === 'gradient' && (
            <div className="space-y-3 bg-zinc-800/40 p-3 rounded-xl border border-zinc-800">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Type</span>
                <div className="flex gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-700">
                  {(['linear', 'radial'] as BackgroundGradientType[]).map(
                    (gType) => (
                      <button
                        key={gType}
                        onClick={() => update({ gradientType: gType })}
                        className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-semibold transition ${
                          config.gradientType === gType
                            ? 'bg-zinc-700 text-white'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {gType}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Colors</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.gradientColor1}
                    onChange={(e) => update({ gradientColor1: e.target.value })}
                    className="w-6 h-6 bg-transparent rounded cursor-pointer"
                    title="Gradient Start Color"
                  />
                  <span className="text-zinc-500">→</span>
                  <input
                    type="color"
                    value={config.gradientColor2}
                    onChange={(e) => update({ gradientColor2: e.target.value })}
                    className="w-6 h-6 bg-transparent rounded cursor-pointer"
                    title="Gradient End Color"
                  />
                </div>
              </div>

              {config.gradientType === 'linear' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Angle</span>
                    <span>{config.gradientAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={5}
                    value={config.gradientAngle}
                    onChange={(e) =>
                      update({ gradientAngle: parseInt(e.target.value, 10) })
                    }
                    className="w-full h-1 bg-zinc-700 rounded-lg accent-blue-500 cursor-pointer"
                  />
                </div>
              )}
            </div>
          )}

          {/* Repeated Image Settings */}
          {config.overlayType === 'image' && (
            <div className="space-y-3 bg-zinc-800/40 p-3 rounded-xl border border-zinc-800">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg flex items-center justify-center gap-2 text-zinc-200 hover:text-white transition font-medium"
              >
                <ImageIcon size={14} />
                <span>Upload Repeated Image</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 block">
                  Preset Repeatable Tiles
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {BUILTIN_TILES.map((tile) => (
                    <button
                      key={tile.label}
                      onClick={() => update({ repeatImage: tile.url })}
                      className={`py-1.5 px-1.5 rounded border text-[10px] truncate transition ${
                        config.repeatImage === tile.url
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                      }`}
                      title={tile.label}
                    >
                      {tile.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Tile Repeat Size</span>
                  <span>{config.imageScale}px</span>
                </div>
                <input
                  type="range"
                  min={24}
                  max={400}
                  step={4}
                  value={config.imageScale}
                  onChange={(e) =>
                    update({ imageScale: parseInt(e.target.value, 10) })
                  }
                  className="w-full h-1 bg-zinc-700 rounded-lg accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </section>

        <hr className="border-zinc-800" />

        {/* Color / Brightness / Opacity Correction Controls */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Sliders size={12} className="text-zinc-400" /> Color, Brightness &amp; Opacity
            </span>
            <button
              onClick={resetCorrections}
              className="text-[10px] text-zinc-400 hover:text-white transition"
              title="Reset Color, Brightness & Opacity Corrections"
            >
              Reset
            </button>
          </div>

          {/* Opacity */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>Overlay Opacity</span>
              <span>{config.opacity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={config.opacity}
              onChange={(e) => update({ opacity: parseInt(e.target.value, 10) })}
              className="w-full h-1 bg-zinc-700 rounded-lg accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Brightness */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>Brightness</span>
              <span>{config.brightness}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={200}
              step={1}
              value={config.brightness}
              onChange={(e) =>
                update({ brightness: parseInt(e.target.value, 10) })
              }
              className="w-full h-1 bg-zinc-700 rounded-lg accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Contrast */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>Contrast</span>
              <span>{config.contrast}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={200}
              step={1}
              value={config.contrast}
              onChange={(e) =>
                update({ contrast: parseInt(e.target.value, 10) })
              }
              className="w-full h-1 bg-zinc-700 rounded-lg accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Saturation */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>Saturation</span>
              <span>{config.saturation}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={200}
              step={1}
              value={config.saturation}
              onChange={(e) =>
                update({ saturation: parseInt(e.target.value, 10) })
              }
              className="w-full h-1 bg-zinc-700 rounded-lg accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Hue Shift */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>Hue Shift</span>
              <span>{config.hueRotate}°</span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={config.hueRotate}
              onChange={(e) =>
                update({ hueRotate: parseInt(e.target.value, 10) })
              }
              className="w-full h-1 bg-zinc-700 rounded-lg accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Color Tint */}
          <div className="pt-1 space-y-2">
            <div className="flex justify-between items-center text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                <Sparkles size={11} /> Color Correction Tint
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px]">{config.tintIntensity}%</span>
                <input
                  type="color"
                  value={config.tintColor}
                  onChange={(e) => update({ tintColor: e.target.value })}
                  className="w-5 h-5 bg-transparent rounded cursor-pointer"
                  title="Tint Color"
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={config.tintIntensity}
              onChange={(e) =>
                update({ tintIntensity: parseInt(e.target.value, 10) })
              }
              className="w-full h-1 bg-zinc-700 rounded-lg accent-blue-500 cursor-pointer"
            />
          </div>
        </section>
      </div>
    </div>
  );
};
