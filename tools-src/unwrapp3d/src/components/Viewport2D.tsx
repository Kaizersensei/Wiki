import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Layer, BrushSettings } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Viewport2DProps {
  layers: Layer[];
  activeLayerId: string | null;
  brush: BrushSettings;
  activeTool: 'brush' | 'eraser';
  useSymmetry: boolean;
  onPaint: () => void;
}

export default function Viewport2D({ layers, activeLayerId, brush, activeTool, useSymmetry, onPaint }: Viewport2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scale, setScale] = useState(0.85);

  // Auto-fit and resize handling
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const fitScale = Math.min(
          (containerWidth - 80) / 1024,
          (containerHeight - 80) / 1024,
          1.5 // Max scale
        );
        setScale(Math.max(0.1, fitScale));
      }
    };

    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    handleResize();

    return () => observer.disconnect();
  }, []);

  const activeLayer = layers.find(l => l.id === activeLayerId);

  // Render composite for display
  useEffect(() => {
    const canvas = compositeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    [...layers].reverse().forEach(layer => {
      if (layer.visible) {
        ctx.globalAlpha = 1.0;
        ctx.drawImage(layer.canvas, 0, 0);
      }
    });
  }, [layers, onPaint]);

  const paintAt = (x: number, y: number) => {
    if (!activeLayer) return;
    const ctx = activeLayer.context;

    const drawBrush = (targetX: number, targetY: number) => {
      ctx.save();
      if (activeTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = brush.opacity;
      } else {
        ctx.globalAlpha = brush.opacity;
        ctx.fillStyle = brush.color;
      }

      if (brush.type === 'round') {
        ctx.beginPath();
        ctx.arc(targetX, targetY, brush.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (brush.type === 'square') {
        ctx.fillRect(targetX - brush.size / 2, targetY - brush.size / 2, brush.size, brush.size);
      } else if (brush.type === 'smooth') {
        const gradient = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, brush.size / 2);
        if (activeTool === 'eraser') {
          gradient.addColorStop(0, 'rgba(0,0,0,1)');
          gradient.addColorStop(1, 'rgba(0,0,0,0)');
        } else {
          gradient.addColorStop(0, brush.color);
          gradient.addColorStop(1, 'transparent');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(targetX - brush.size / 2, targetY - brush.size / 2, brush.size, brush.size);
      }
      ctx.restore();
    };

    drawBrush(x, y);
    if (useSymmetry) {
      drawBrush(activeLayer.canvas.width - x, y);
    }

    onPaint();
  };

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !activeLayer) return;
    const canvas = compositeCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    paintAt(x, y);
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-[#121212] flex items-center justify-center overflow-hidden relative">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #2a2a2a 25%, transparent 25%),
            linear-gradient(-45deg, #2a2a2a 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #2a2a2a 75%),
            linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}
      />

      <div className="absolute top-10 right-4 z-10 flex gap-1">
        <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="w-6 h-6 bg-panel-bg border border-border rounded text-[10px] flex items-center justify-center hover:bg-white/5">-</button>
        <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="w-6 h-6 bg-panel-bg border border-border rounded text-[10px] flex items-center justify-center hover:bg-white/5">+</button>
      </div>

      <div
        className="relative shadow-2xl transition-transform duration-200 ease-out border border-white/5"
        style={{ transform: `scale(${scale})`, width: '1024px', height: '1024px' }}
      >
        <canvas
          ref={compositeCanvasRef}
          width={1024}
          height={1024}
          onMouseDown={() => setIsDrawing(true)}
          onMouseMove={handleInteraction}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
          className="relative w-full h-full cursor-crosshair"
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-6 bg-panel-bg/80 backdrop-blur-sm border-t border-border flex items-center px-3 gap-4 text-[9px] text-gray-500">
        <span className="text-accent">● Snap to Pixel</span>
        <span>Grid Intensity: 15%</span>
        <span>Show Wireframe: OFF</span>
      </div>
    </div>
  );
}
