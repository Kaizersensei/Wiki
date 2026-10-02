import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Layers, Paintbrush, Eraser, Square, Circle, Download, Upload, Plus, Trash2, Eye, EyeOff, Move } from 'lucide-react';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'motion/react';
import Viewport3D from './components/Viewport3D';
import Viewport2D from './components/Viewport2D';
import { BrushSettings, Layer, BrushType } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [brush, setBrush] = useState<BrushSettings>({
    color: '#ef4444',
    size: 32,
    opacity: 0.85,
    type: 'round',
    hardness: 0.8
  });
  const [objUrl, setObjUrl] = useState<string | null>(null);
  const [textureTexture, setTextureTexture] = useState<THREE.CanvasTexture | null>(null);
  const [useSymmetry, setUseSymmetry] = useState(false);
  const [activeTool, setActiveTool] = useState<'brush' | 'eraser'>('brush');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize layers
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      // Use a mid-gray so it's visible against the dark background
      ctx.fillStyle = '#222226';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const initialLayer: Layer = {
        id: 'bg-layer',
        name: 'Base_Map',
        visible: true,
        canvas,
        context: ctx
      };
      setLayers([initialLayer]);
      setActiveLayerId(initialLayer.id);

      const texture = new THREE.CanvasTexture(canvas);
      texture.flipY = false;
      setTextureTexture(texture);
    }

    // Close menu on click outside
    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const addLayer = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      const newLayer: Layer = {
        id: Math.random().toString(36).substr(2, 9),
        name: `Detail_0${layers.length + 1}`,
        visible: true,
        canvas,
        context: ctx
      };
      setLayers(prev => [newLayer, ...prev]);
      setActiveLayerId(newLayer.id);
    }
  }, [layers]);

  const removeLayer = (id: string) => {
    if (layers.length <= 1) return;
    setLayers(prev => prev.filter(l => l.id !== id));
    if (activeLayerId === id) {
      const remaining = layers.filter(l => l.id !== id);
      setActiveLayerId(remaining[0]?.id || null);
    }
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const updateTexture = useCallback(() => {
    if (!textureTexture) return;
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = 1024;
    compositeCanvas.height = 1024;
    const ctx = compositeCanvas.getContext('2d');
    if (ctx) {
      [...layers].reverse().forEach(layer => {
        if (layer.visible) {
          ctx.drawImage(layer.canvas, 0, 0);
        }
      });
      textureTexture.image = compositeCanvas;
      textureTexture.needsUpdate = true;
    }
  }, [layers, textureTexture]);

  const handleExport = async () => {
    if (!layers.length) return;
    const zip = new JSZip();
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = 1024;
    compositeCanvas.height = 1024;
    const ctx = compositeCanvas.getContext('2d');
    if (ctx) {
      [...layers].reverse().forEach(layer => {
        if (layer.visible) ctx.drawImage(layer.canvas, 0, 0);
      });
      const textureBlob = await new Promise<Blob | null>(resolve => compositeCanvas.toBlob(resolve, 'image/png'));
      if (textureBlob) zip.file("texture.png", textureBlob);
    }
    const content = await zip.generateAsync({type:"blob"});
    saveAs(content, "unwrapp3d_export.zip");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File detected in App.tsx:", file.name);
      if (objUrl) URL.revokeObjectURL(objUrl);
      const url = URL.createObjectURL(file);
      setObjUrl(url);
    }
  };

  const activeLayer = layers.find(l => l.id === activeLayerId);

  return (
    <div className="flex flex-col h-screen w-full bg-workspace-bg text-[#d1d1d1] font-sans overflow-hidden">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".obj"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Header */}
      <header className="h-10 bg-panel-bg border-b border-border flex items-center px-3 justify-between z-30">
        <div className="flex items-center gap-4">
          <span className="font-extrabold text-white text-[13px] tracking-widest uppercase">UnwrApp <span className="text-accent">3D</span></span>
          <nav className="flex gap-4 text-[11px] text-gray-400">
            {['File', 'Edit', 'Selection', 'Texture', 'Render'].map(menu => (
              <div key={menu} className="relative group" onClick={(e) => e.stopPropagation()}>
                <span
                  onClick={() => setActiveMenu(activeMenu === menu ? null : menu)}
                  className={cn("hover:text-white cursor-pointer transition-colors px-2 py-1 rounded select-none", activeMenu === menu && "text-white bg-white/10")}
                >
                  {menu}
                </span>
                {activeMenu === menu && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-[#1a1a1e] border border-border rounded shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-1.5 z-50">
                    {menu === 'File' && (
                      <>
                        <div onClick={() => { fileInputRef.current?.click(); setActiveMenu(null); }} className="menu-item group italic font-medium">
                          <span className="flex items-center gap-2"><Upload size={14} className="text-gray-500 group-hover:text-white" /> Open OBJ...</span>
                          <span className="text-gray-600 text-[9px] font-mono group-hover:text-white/50">Ctrl+O</span>
                        </div>
                        <div className="h-[1px] bg-border my-1 mx-1" />
                        <div onClick={() => { handleExport(); setActiveMenu(null); }} className="menu-item group">
                          <span className="flex items-center gap-2"><Download size={14} className="text-gray-500 group-hover:text-white" /> Export Archive</span>
                          <span className="text-gray-600 text-[9px] font-mono group-hover:text-white/50">Ctrl+E</span>
                        </div>
                      </>
                    )}
                    {menu === 'Edit' && (
                      <>
                        <div className="menu-item group">
                          <span>Undo</span>
                          <span className="text-gray-600 text-[9px] font-mono group-hover:text-white/50">Ctrl+Z</span>
                        </div>
                        <div className="menu-item group">
                          <span>Redo</span>
                          <span className="text-gray-600 text-[9px] font-mono group-hover:text-white/50">Ctrl+Y</span>
                        </div>
                        <div className="h-[1px] bg-border my-1 mx-1" />
                        <div className="menu-item">Project Settings</div>
                      </>
                    )}
                    {menu === 'Selection' && (
                      <>
                        <div className="menu-item">Select All</div>
                        <div className="menu-item">Deselect</div>
                        <div className="menu-item">Invert Selection</div>
                      </>
                    )}
                    {menu === 'Texture' && (
                      <>
                        <div className="menu-item">Resize Texture...</div>
                        <div className="menu-item">Clear Texture</div>
                        <div className="h-[1px] bg-border my-1 mx-1" />
                        <div className="menu-item">Bake Normals</div>
                        <div className="menu-item">Bake AO</div>
                      </>
                    )}
                    {menu === 'Render' && (
                      <>
                        <div className="menu-item">Perspective View</div>
                        <div className="menu-item">Wireframe Mode</div>
                        <div className="menu-item">Studio Lighting</div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
        <div className="flex gap-2">
              <a href="https://docs.google.com/forms/d/e/1FAIpQLSdE0VJq3IeFe8ICOzFE9-TG4YgG1yS0DTwUMKkffUAkCkcWug/viewform?usp=header" target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center rounded border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] text-accent hover:bg-accent/20" aria-label="Report a bug (opens in a new tab)">Report a bug</a>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent px-3 py-1 rounded text-[11px] font-medium transition-all"
          >
            Load Model
          </button>
          <button
            onClick={handleExport}
            className="bg-accent hover:bg-accent/90 text-white px-3 py-1 rounded text-[11px] font-medium transition-all shadow-lg shadow-accent/20"
          >
            Export ZIP
          </button>
        </div>
      </header>


      {/* Tool Settings Bar */}
      <div className="h-9 bg-subpanel-bg border-b border-border flex items-center px-3 gap-6 text-[11px] z-20">
        <div className="flex items-center gap-3">
          <span className="text-gray-500">Brush Size:</span>
          <div className="relative w-24 h-1 bg-[#444] rounded-full group">
            <input
              type="range" min="1" max="100" value={brush.size}
              onChange={(e) => setBrush(b => ({ ...b, size: parseInt(e.target.value) }))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="absolute top-0 left-0 h-full bg-accent rounded-full pointer-events-none" style={{ width: `${brush.size}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md z-0 pointer-events-none" style={{ left: `calc(${brush.size}% - 5px)` }} />
          </div>
          <span className="text-white w-8">{brush.size}px</span>
        </div>

        <div className="w-[1px] h-4 bg-border" />

        <div className="flex items-center gap-2">
          <span className="text-gray-500">Opacity:</span>
          <span className="text-white">{Math.round(brush.opacity * 100)}%</span>
        </div>

        <div className="w-[1px] h-4 bg-border" />

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox" checked={useSymmetry} onChange={() => setUseSymmetry(!useSymmetry)}
              className="bg-panel-bg border-border rounded text-accent focus:ring-0"
            />
            Symmetry X
          </label>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <aside className="w-12 flex-shrink-0 bg-panel-bg border-r border-border flex flex-col items-center py-4 gap-4 z-20">
          <div className="flex flex-col gap-2 w-full px-2">
            <button
              onClick={() => setActiveTool('brush')}
              className={cn("tool-btn w-full h-8", activeTool === 'brush' && "active")}
              title="Brush Tool (B)"
            >
              <Paintbrush size={16} />
            </button>
            <button
              onClick={() => setActiveTool('eraser')}
              className={cn("tool-btn w-full h-8", activeTool === 'eraser' && "active")}
              title="Eraser Tool (E)"
            >
              <Eraser size={16} />
            </button>
          </div>

          <div className="w-6 h-[1px] bg-border my-1" />

          <div className="flex flex-col gap-2 w-full px-2">
            <button className="tool-btn w-full h-8" title="Layers (L)"><Layers size={16} /></button>
            <button className="tool-btn w-full h-8" title="Select (S)"><Square size={16} /></button>
            <button className="tool-btn w-full h-8" title="Move (V)"><Move size={16} /></button>
          </div>

          <div className="mt-auto mb-2 flex flex-col gap-2 w-full px-2">
            <button onClick={addLayer} className="tool-btn w-full h-8 text-accent hover:bg-accent/10" title="New Layer"><Plus size={16} /></button>
          </div>
        </aside>

        {/* Views */}
        <div className="flex-1 min-w-0 bg-border flex gap-[1px]">
          <div className="flex-1 min-w-0 overflow-hidden relative bg-workspace-bg">
            <div className="viewport-label">3D Viewport</div>
            <Viewport3D
              objUrl={objUrl}
              texture={textureTexture}
              brush={brush}
              activeTool={activeTool}
              activeLayer={activeLayer}
              onPaint={updateTexture}
            />
          </div>

          <div className="flex-1 min-w-0 overflow-hidden relative bg-workspace-bg">
            <div className="viewport-label">2D Texture Map</div>
            <Viewport2D
              layers={layers}
              activeLayerId={activeLayerId}
              brush={brush}
              activeTool={activeTool}
              useSymmetry={useSymmetry}
              onPaint={updateTexture}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="w-64 bg-panel-bg border-l border-border flex flex-col z-20 overflow-y-auto custom-scrollbar">
          {/* Layers Panel */}
          <div className="p-3 border-b border-border">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Layers</span>
              <button onClick={addLayer} className="text-[11px] text-accent hover:underline">+ New</button>
            </div>
            <div className="space-y-1">
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  onClick={() => setActiveLayerId(layer.id)}
                  className={cn(
                    "flex items-center gap-3 p-1.5 rounded text-[11px] cursor-pointer transition-all border",
                    activeLayerId === layer.id ? "bg-[#2a2d33] border-accent" : "bg-subpanel-bg border-transparent hover:border-border"
                  )}
                >
                  <button onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }} className="opacity-60 hover:opacity-100">
                    {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <span className="flex-1 truncate">{layer.name}</span>
                  <span className="text-[9px] text-gray-600">Normal</span>
                  {activeLayerId === layer.id && layers.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }} className="text-gray-600 hover:text-red-500">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Brushes Panel */}
          <div className="p-3 border-b border-border">
             <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block mb-3">Brushes</span>
             <div className="grid grid-cols-3 gap-2">
               {(['round', 'square', 'smooth'] as BrushType[]).map((type) => (
                 <button
                   key={type}
                   onClick={() => setBrush(b => ({ ...b, type }))}
                   className={cn(
                     "flex flex-col items-center justify-center h-12 rounded border transition-all gap-1",
                     brush.type === type ? "border-accent bg-accent/5 text-white" : "border-border bg-subpanel-bg text-gray-500"
                   )}
                 >
                   {type === 'round' && <div className="w-3.5 h-3.5 bg-current rounded-full" />}
                   {type === 'square' && <div className="w-3.5 h-3.5 bg-current rounded-sm" />}
                   {type === 'smooth' && <div className="w-3.5 h-3.5 bg-current rounded-full opacity-50 blur-[1px]" />}
                   <span className="text-[9px] capitalize">{type}</span>
                 </button>
               ))}
             </div>
          </div>

          {/* Palette Panel */}
          <div className="p-3 border-b border-border">
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block mb-3">Palette</span>
            <div className="grid grid-cols-6 gap-1.5">
              {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ffffff', '#333333', '#5e4033', '#a8a29e', '#44403c', '#1c1917', '#78716c'].map((color) => (
                <button
                  key={color}
                  onClick={() => setBrush(b => ({ ...b, color }))}
                  className={cn(
                    "aspect-square rounded-sm border transition-all hover:scale-110",
                    brush.color === color ? "border-white scale-110" : "border-white/10"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Properties Panel */}
          <div className="p-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block mb-3">Material</span>
            <div className="text-[11px] space-y-2 flex flex-col">
              <div className="flex justify-between"><span>Metallic</span><span className="text-white">0.15</span></div>
              <div className="flex justify-between"><span>Roughness</span><span className="text-white">0.42</span></div>
              <div className="flex justify-between"><span>Emission</span><span className="text-white">0.00</span></div>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="h-6 bg-workspace-bg border-t border-border flex items-center px-3 justify-between text-[10px] text-gray-600 z-30">
        <div className="flex items-center gap-4">
          <span>Ready</span>
          <span className="bg-border px-1.5 rounded text-gray-400">OBJ</span>
          <span className="bg-border px-1.5 rounded text-gray-400">2048x2048</span>
        </div>
        <div className="flex gap-4">
          <span>Polygons: 142,502</span>
          <span>Vertices: 71,254</span>
          <span>VRAM: 1.2 GB / 8.0 GB</span>
          <span className="text-gray-400">X: 124.5 Y: 432.1</span>
        </div>
      </footer>
    </div>
  );
}
