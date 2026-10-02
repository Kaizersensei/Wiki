import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Download,
  Settings2,
  Layers,
  Eye,
  EyeOff,
  RotateCcw,
  Image as ImageIcon,
  Zap,
  Grid3X3,
  Maximize
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { FilterState, DEFAULT_FILTERS } from './types';
import {
  applyColorAdjustments,
  applyBlur,
  applyEdgeDetection,
  detectPerspectiveLines
} from './lib/image-processing';

export default function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        // Reset filters on new image
        setFilters(DEFAULT_FILTERS);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const processImage = useCallback(() => {
    if (!image || !canvasRef.current) return;

    setIsProcessing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = image.width;
    canvas.height = image.height;

    // Draw original
    ctx.drawImage(image, 0, 0);

    // 1. Pre Adjustments (Color/Light prep)
    applyColorAdjustments(ctx, canvas.width, canvas.height, filters.pre);

    // 2. Blur (Pre-processing for edge detection)
    applyBlur(ctx, canvas.width, canvas.height, filters.blurType, filters.blurRadius);

    // 3. Edge Detection & Inversion (The core line extraction)
    applyEdgeDetection(
      ctx,
      canvas.width,
      canvas.height,
      filters.edgeThreshold,
      filters.edgeStrength,
      filters.invertEdges
    );

    // 4. Post Adjustments (Refining the extracted lines)
    applyColorAdjustments(ctx, canvas.width, canvas.height, filters.post);

    // 5. Perspective Overlay
    if (filters.showPerspective) {
      detectPerspectiveLines(
        ctx,
        canvas.width,
        canvas.height,
        filters.perspectiveGranularity,
        filters.perspectiveOpacity,
        filters.perspectiveColor
      );
    }

    setIsProcessing(false);
  }, [image, filters]);

  useEffect(() => {
    if (image) {
      const timer = setTimeout(processImage, 100);
      return () => clearTimeout(timer);
    }
  }, [processImage]);

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'line-art.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const updatePreFilter = (key: keyof FilterState['pre'], value: any) => {
    setFilters(prev => ({
      ...prev,
      pre: { ...prev.pre, [key]: value }
    }));
  };

  const updatePostFilter = (key: keyof FilterState['post'], value: any) => {
    setFilters(prev => ({
      ...prev,
      post: { ...prev.post, [key]: value }
    }));
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full bg-[#121212] text-zinc-100 overflow-hidden font-sans">
        {/* Sidebar */}
        <aside className="w-80 border-r border-zinc-800 bg-[#18181b] flex flex-col shadow-xl z-20">
          <div className="p-6 flex items-center justify-between border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="font-bold text-lg tracking-tight">LineArt Studio</h1>
            </div>
            <Tooltip>
              <TooltipTrigger
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "text-zinc-400 hover:text-white hover:bg-zinc-800"
                )}
              >
                <RotateCcw className="w-4 h-4" />
              </TooltipTrigger>
              <TooltipContent>Reset all filters</TooltipContent>
            </Tooltip>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
              <Tabs defaultValue="pre" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-zinc-900 border border-zinc-800">
                  <TabsTrigger value="pre" className="data-[state=active]:bg-zinc-800 text-[10px]">Pre</TabsTrigger>
                  <TabsTrigger value="edge" className="data-[state=active]:bg-zinc-800 text-[10px]">Edge</TabsTrigger>
                  <TabsTrigger value="post" className="data-[state=active]:bg-zinc-800 text-[10px]">Post</TabsTrigger>
                  <TabsTrigger value="lines" className="data-[state=active]:bg-zinc-800 text-[10px]">Lines</TabsTrigger>
                </TabsList>

                <TabsContent value="pre" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pre-Adjustments</Label>
                    <AdjustmentSliders adjustments={filters.pre} onChange={updatePreFilter} />
                  </div>

                  <Separator className="bg-zinc-800" />

                  <div className="space-y-4">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pre-Blur</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['none', 'box', 'gaussian', 'cross'].map((type) => (
                        <Button
                          key={type}
                          variant={filters.blurType === type ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateFilter('blurType', type)}
                          className={`capitalize text-xs ${filters.blurType === type ? 'bg-indigo-600 hover:bg-indigo-700' : 'border-zinc-800 hover:bg-zinc-800'}`}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                    <FilterSlider
                      label="Radius"
                      value={filters.blurRadius}
                      min={0} max={20}
                      onChange={(v) => updateFilter('blurRadius', v)}
                      disabled={filters.blurType === 'none'}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="edge" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Edge Detection</Label>
                    <FilterSlider
                      label="Threshold"
                      value={filters.edgeThreshold}
                      min={0} max={255}
                      onChange={(v) => updateFilter('edgeThreshold', v)}
                    />
                    <FilterSlider
                      label="Strength"
                      value={filters.edgeStrength}
                      min={1} max={10}
                      onChange={(v) => updateFilter('edgeStrength', v)}
                    />
                    <div className="flex items-center justify-between pt-2">
                      <Label htmlFor="invert" className="text-sm">Invert (Black on White)</Label>
                      <Switch
                        id="invert"
                        checked={filters.invertEdges}
                        onCheckedChange={(v) => updateFilter('invertEdges', v)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="post" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Post-Adjustments</Label>
                    <AdjustmentSliders adjustments={filters.post} onChange={updatePostFilter} />
                  </div>
                </TabsContent>

                <TabsContent value="lines" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Perspective Lines</Label>
                      <Switch
                        checked={filters.showPerspective}
                        onCheckedChange={(v) => updateFilter('showPerspective', v)}
                      />
                    </div>

                    <FilterSlider
                      label="Opacity"
                      value={filters.perspectiveOpacity * 100}
                      min={0} max={100}
                      onChange={(v) => updateFilter('perspectiveOpacity', v / 100)}
                      disabled={!filters.showPerspective}
                    />
                    <FilterSlider
                      label="Granularity"
                      value={filters.perspectiveGranularity}
                      min={1} max={100}
                      onChange={(v) => updateFilter('perspectiveGranularity', v)}
                      disabled={!filters.showPerspective}
                    />

                    <div className="space-y-2">
                      <Label className="text-xs text-zinc-400">Line Color</Label>
                      <div className="flex gap-2">
                        {['#00ff00', '#ff0000', '#0000ff', '#ffffff', '#ffff00'].map(c => (
                          <button
                            key={c}
                            onClick={() => updateFilter('perspectiveColor', c)}
                            className={`w-6 h-6 rounded-full border-2 ${filters.perspectiveColor === c ? 'border-white' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>

          <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
              onClick={downloadImage}
              disabled={!image}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Image
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* Toolbar */}
          <header className="h-16 border-b border-zinc-800 bg-[#18181b]/80 backdrop-blur-md flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Open Image
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleUpload}
              />
              {image && (
                <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
                  <ImageIcon className="w-3 h-3" />
                  <span>{image.width} × {image.height}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger
                  onMouseDown={() => setShowOriginal(true)}
                  onMouseUp={() => setShowOriginal(false)}
                  onMouseLeave={() => setShowOriginal(false)}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "text-zinc-400 hover:text-white hover:bg-zinc-800",
                    showOriginal && "bg-zinc-800 text-white"
                  )}
                >
                  {showOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </TooltipTrigger>
                <TooltipContent>Hold to see original</TooltipContent>
              </Tooltip>
              <Separator orientation="vertical" className="h-4 bg-zinc-800 mx-2" />
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Canvas Area */}
          <div className="flex-1 relative flex items-center justify-center p-8 overflow-auto bg-[radial-gradient(#1e1e1e_1px,transparent_1px)] [background-size:20px_20px]">
            <AnimatePresence mode="wait">
              {!image ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-md w-full"
                >
                  <Card
                    className="p-12 border-2 border-dashed border-zinc-800 bg-zinc-900/50 hover:border-indigo-500/50 transition-colors cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                        <Upload className="w-8 h-8 text-zinc-500 group-hover:text-indigo-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-zinc-200">Drop an image here</h3>
                        <p className="text-sm text-zinc-500">Supports JPG, PNG, and WebP formats</p>
                      </div>
                      <Button variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300">
                        Choose File
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative shadow-2xl rounded-lg overflow-hidden ring-1 ring-zinc-800"
                >
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-10 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-indigo-500 animate-pulse" />
                    </div>
                  )}

                  {/* Original Preview Overlay */}
                  {showOriginal && (
                    <img
                      src={image.src}
                      alt="Original"
                      className="absolute inset-0 w-full h-full object-contain z-20"
                    />
                  )}

                  <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-[calc(100vh-12rem)] object-contain bg-black"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status Bar */}
          <footer className="h-10 border-t border-zinc-800 bg-[#18181b] flex items-center justify-between px-4 text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                {isProcessing ? 'Processing...' : 'Ready'}
              </span>
              <span>•</span>
              <span>GPU Acceleration Active</span>
            </div>
            <div className="flex items-center gap-4">
              <span>LineArt Engine v1.0.4</span>
              <span>•</span>
              <span>© 2026 Studio</span>
            </div>
          </footer>
        </main>
      </div>
    </TooltipProvider>
  );
}

function AdjustmentSliders({ adjustments, onChange }: { adjustments: FilterState['pre'], onChange: (key: any, val: any) => void }) {
  return (
    <div className="space-y-6">
      <FilterSlider label="Exposure" value={adjustments.exposure} min={-100} max={100} onChange={(v) => onChange('exposure', v)} />
      <FilterSlider label="Contrast" value={adjustments.contrast} min={-100} max={100} onChange={(v) => onChange('contrast', v)} />
      <FilterSlider label="Highlights" value={adjustments.highlights} min={-100} max={100} onChange={(v) => onChange('highlights', v)} />
      <FilterSlider label="Shadows" value={adjustments.shadows} min={-100} max={100} onChange={(v) => onChange('shadows', v)} />
      <FilterSlider label="Whites" value={adjustments.whites} min={-100} max={100} onChange={(v) => onChange('whites', v)} />
      <FilterSlider label="Blacks" value={adjustments.blacks} min={-100} max={100} onChange={(v) => onChange('blacks', v)} />
      <FilterSlider label="Saturation" value={adjustments.saturation} min={-100} max={100} onChange={(v) => onChange('saturation', v)} />
    </div>
  );
}

function FilterSlider({
  label,
  value,
  min,
  max,
  onChange,
  disabled = false
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`space-y-3 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between">
        <Label className="text-xs text-zinc-400">{label}</Label>
        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={1}
        onValueChange={(vals) => {
          const nextValue = Array.isArray(vals) ? vals[0] : vals;
          if (typeof nextValue === 'number') {
            onChange(nextValue);
          }
        }}
        className="py-2"
      />
    </div>
  );
}
