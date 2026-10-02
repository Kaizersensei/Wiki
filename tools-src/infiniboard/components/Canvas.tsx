import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CanvasElement, ViewState, ToolType, ShapeStyle, VectorPoint, BackgroundConfig } from '../types';
import { ElementComponent } from './Element';
import { screenToWorld, defaultFilters, buildPencilPath, getPatternCss } from '../utils/math';

interface CanvasProps {
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  view: ViewState;
  setView: React.Dispatch<React.SetStateAction<ViewState>>;
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  currentStyle: ShapeStyle;
  editingPointId: string | null;
  setEditingPointId: (id: string | null) => void;
  backgroundConfig: BackgroundConfig;

  // History Hooks
  onActionStart: () => void;
  onActionEnd: () => void;
  onDiscreteAction: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  elements, setElements, selectedId, setSelectedId, view, setView, activeTool, setActiveTool, currentStyle, editingPointId, setEditingPointId, backgroundConfig,
  onActionStart, onActionEnd, onDiscreteAction
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Ghost element being drawn
  const [drawingElement, setDrawingElement] = useState<CanvasElement | null>(null);

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    mode: 'pan' | 'move' | 'resize' | 'rotate' | 'draw' | 'edit-point' | 'edit-handle';
    startX: number;
    startY: number;
    initialView: ViewState;
    initialElem?: CanvasElement;
    handle?: string; // Resize handle OR Control handle (in, out)
    points?: {x: number, y: number}[]; // Raw world points for drawing
    pointId?: string; // For point editing
  } | null>(null);

  // Handle Drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length === 0) return;

    // Save history before adding dropped items
    onDiscreteAction();

    const dropX = e.clientX;
    const dropY = e.clientY;
    const worldPos = screenToWorld(dropX, dropY, view.x, view.y, view.scale);

    const newElements: CanvasElement[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;

      // Use DataURL so saved JSON contains the image data
      const url = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      const isVideo = file.type.startsWith('video/');

      let width = 300;
      let height = 300;

      if (!isVideo) {
         const img = new Image();
         img.src = url;
         await new Promise((resolve) => {
             img.onload = resolve;
             img.onerror = resolve;
         });
         width = img.naturalWidth || 300;
         height = img.naturalHeight || 300;
         if (width > 1000) {
           const ratio = 1000 / width;
           width = 1000;
           height = height * ratio;
         }
      }

      newElements.push({
        id: crypto.randomUUID(),
        type: isVideo ? 'video' : 'image',
        src: url,
        name: file.name,
        x: worldPos.x - (width/2),
        y: worldPos.y - (height/2),
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        zIndex: elements.length + newElements.length + 1,
        filters: { ...defaultFilters },
        shapeStyle: { ...currentStyle, fillType: 'none' }
      });
    }

    setElements(prev => [...prev, ...newElements]);
    if (newElements.length > 0) setActiveTool('select');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onMouseDown = (e: React.MouseEvent) => {
    // If clicking on a point/handle in the editor, stop here
    if ((e.target as HTMLElement).classList.contains('editor-control')) return;

    // Middle mouse always pans; in select or eraser mode, left-dragging empty canvas also pans
    if (e.button === 1 || ((activeTool === 'select' || activeTool === 'eraser') && e.button === 0 && e.target === containerRef.current)) {
      // If clicking on canvas background while editing path, deselect path editing
      const selectedEl = elements.find(el => el.id === selectedId);
      if (selectedEl?.isEditingPath) {
         setElements(prev => prev.map(el => el.id === selectedId ? { ...el, isEditingPath: false } : el));
         return;
      }

      setDragState({
        isDragging: true,
        mode: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        initialView: { ...view }
      });
      if (activeTool === 'select') {
        setSelectedId(null);
      }
      return;
    }

    // Drawing Logic
    if (activeTool !== 'select' && activeTool !== 'eraser' && e.button === 0) {
      const worldPos = screenToWorld(e.clientX, e.clientY, view.x, view.y, view.scale);

      const newId = crypto.randomUUID();
      const startPoints = [{ x: worldPos.x, y: worldPos.y }];

      // Initialize the drawing element
      const newElem: CanvasElement = {
        id: newId,
        type: activeTool as any,
        name: `${activeTool} ${elements.length + 1}`,
        x: worldPos.x,
        y: worldPos.y,
        width: 0,
        height: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        zIndex: elements.length + 1,
        filters: { ...defaultFilters },
        shapeStyle: { ...currentStyle },
        // For drawing, we use raw points initially, simplify later
        points: (activeTool === 'pencil' || activeTool === 'line')
          ? [{id: '0', x: 0, y: 0, type: 'corner'}]
          : undefined
      };

      setDrawingElement(newElem);
      setDragState({
        isDragging: true,
        mode: 'draw',
        startX: e.clientX,
        startY: e.clientY,
        initialView: { ...view },
        points: startPoints
      });
      setSelectedId(null);
    }
  };

  const onElementMouseDown = (e: React.MouseEvent, id: string, handle?: string) => {
    if (activeTool === 'eraser') {
      if (e.button !== 0) return;
      e.stopPropagation();
      onDiscreteAction();
      setElements(prev => prev.filter(item => item.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setEditingPointId(null);
      }
      return;
    }

    if (activeTool !== 'select') return;
    e.stopPropagation();

    // If editing path, don't drag element
    const el = elements.find(item => item.id === id);
    if (el?.isEditingPath) return;

    setSelectedId(id);
    if (!el) return;

    // Start History Snapshot for Dragging
    onActionStart();

    if (handle === 'rot') {
       setDragState({
        isDragging: true,
        mode: 'rotate',
        startX: e.clientX,
        startY: e.clientY,
        initialView: { ...view },
        initialElem: { ...el },
        handle
      });
    } else if (handle) {
      setDragState({
        isDragging: true,
        mode: 'resize',
        startX: e.clientX,
        startY: e.clientY,
        initialView: { ...view },
        initialElem: { ...el },
        handle
      });
    } else {
       setDragState({
        isDragging: true,
        mode: 'move',
        startX: e.clientX,
        startY: e.clientY,
        initialView: { ...view },
        initialElem: { ...el }
      });
    }
  };

  const onElementDoubleClick = (id: string) => {
    if (activeTool !== 'select') return;
    const el = elements.find(item => item.id === id);
    if (el && (el.type === 'pencil' || el.type === 'line')) {
        setElements(prev => prev.map(item => item.id === id ? { ...item, isEditingPath: !item.isEditingPath } : item));
    }
  };

  // Point Editor Handlers
  const onPointMouseDown = (e: React.MouseEvent, elementId: string, pointId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingPointId(pointId);

    // Start History Snapshot for Point Edit
    onActionStart();

    setDragState({
      isDragging: true,
      mode: 'edit-point',
      startX: e.clientX,
      startY: e.clientY,
      initialView: view,
      pointId
    });
  };

  const onHandleMouseDown = (e: React.MouseEvent, elementId: string, pointId: string, type: 'in' | 'out') => {
    e.stopPropagation();
    e.preventDefault();
    setEditingPointId(pointId);

    // Start History Snapshot for Handle Edit
    onActionStart();

    setDragState({
      isDragging: true,
      mode: 'edit-handle',
      startX: e.clientX,
      startY: e.clientY,
      initialView: view,
      pointId,
      handle: type
    });
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState || !dragState.isDragging) return;

    // Pan
    if (dragState.mode === 'pan') {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      setView({
        ...dragState.initialView,
        x: dragState.initialView.x + dx,
        y: dragState.initialView.y + dy
      });
      return;
    }

    // Path Editing
    if ((dragState.mode === 'edit-point' || dragState.mode === 'edit-handle') && selectedId && dragState.pointId) {
       const el = elements.find(x => x.id === selectedId);
       if (!el || !el.points) return;

       const dx = (e.clientX - dragState.startX) / view.scale;
       const dy = (e.clientY - dragState.startY) / view.scale;

       setElements(prev => prev.map(elem => {
         if (elem.id !== selectedId) return elem;

         const newPoints = elem.points!.map(p => {
           if (p.id !== dragState.pointId) return p;

           if (dragState.mode === 'edit-point') {
             // Moving the point moves handles too
             return { ...p, x: p.x + dx, y: p.y + dy };
           } else if (dragState.mode === 'edit-handle') {
             // Moving just a handle
             if (dragState.handle === 'in') {
                const oldHin = p.handleIn || {x: 0, y: 0};
                return { ...p, handleIn: { x: oldHin.x + dx, y: oldHin.y + dy } };
             } else {
                const oldHout = p.handleOut || {x: 0, y: 0};
                return { ...p, handleOut: { x: oldHout.x + dx, y: oldHout.y + dy } };
             }
           }
           return p;
         });
         return { ...elem, points: newPoints };
       }));

       // Reset start for continuous delta
       setDragState(prev => prev ? { ...prev, startX: e.clientX, startY: e.clientY } : null);
       return;
    }

    // Draw
    if (dragState.mode === 'draw' && drawingElement && dragState.points) {
      const currentWorld = screenToWorld(e.clientX, e.clientY, view.x, view.y, view.scale);
      const startWorld = dragState.points[0];
      const strokePadding = (currentStyle.strokeWidth || 0) / 2;

      if (activeTool === 'pencil') {
        const newPoints = [...dragState.points, { x: currentWorld.x, y: currentWorld.y }];
        const minX = Math.min(...newPoints.map(p => p.x)) - strokePadding;
        const minY = Math.min(...newPoints.map(p => p.y)) - strokePadding;
        const maxX = Math.max(...newPoints.map(p => p.x)) + strokePadding;
        const maxY = Math.max(...newPoints.map(p => p.y)) + strokePadding;

        // Render temporarily as corners. ElementComponent will visually smooth them if no handles exist.
        const renderPoints: VectorPoint[] = newPoints.map((p, i) => ({
          id: i.toString(),
          x: p.x - minX,
          y: p.y - minY,
          type: 'corner'
        }));

        setDrawingElement({
          ...drawingElement,
          x: minX,
          y: minY,
          width: Math.max(0.1, maxX - minX),
          height: Math.max(0.1, maxY - minY),
          points: renderPoints
        });
        setDragState(prev => prev ? { ...prev, points: newPoints } : null);

      } else if (activeTool === 'line') {
         const minX = Math.min(startWorld.x, currentWorld.x) - strokePadding;
         const minY = Math.min(startWorld.y, currentWorld.y) - strokePadding;
         const width = Math.abs(currentWorld.x - startWorld.x) + (strokePadding * 2);
         const height = Math.abs(currentWorld.y - startWorld.y) + (strokePadding * 2);

         setDrawingElement({
           ...drawingElement,
           x: minX,
           y: minY,
           width: Math.max(0.1, width),
           height: Math.max(0.1, height),
           points: [
             { id: '1', x: startWorld.x - minX, y: startWorld.y - minY, type: 'corner' },
             { id: '2', x: currentWorld.x - minX, y: currentWorld.y - minY, type: 'corner' }
           ]
         });
      } else {
        // Shapes (rect/ellipse) don't have editable points in this version, just bounds
        const minX = Math.min(startWorld.x, currentWorld.x);
        const minY = Math.min(startWorld.y, currentWorld.y);
        const width = Math.abs(currentWorld.x - startWorld.x);
        const height = Math.abs(currentWorld.y - startWorld.y);

        setDrawingElement({
          ...drawingElement,
          x: minX,
          y: minY,
          width: Math.max(0.1, width),
          height: Math.max(0.1, height)
        });
      }
      return;
    }

    // Move
    if (dragState.mode === 'move' && dragState.initialElem) {
      const dx = (e.clientX - dragState.startX) / view.scale;
      const dy = (e.clientY - dragState.startY) / view.scale;

      setElements(prev => prev.map(el =>
        el.id === dragState.initialElem?.id
          ? { ...el, x: dragState.initialElem!.x + dx, y: dragState.initialElem!.y + dy }
          : el
      ));
    }

    // Resize & Rotate
    if (dragState.mode === 'resize' && dragState.initialElem && dragState.handle) {
      const el = dragState.initialElem;
      const currentMouseX = (e.clientX - view.x) / view.scale;
      const currentMouseY = (e.clientY - view.y) / view.scale;
      const startMouseX = (dragState.startX - view.x) / view.scale;
      const startMouseY = (dragState.startY - view.y) / view.scale;

      const dxWorld = currentMouseX - startMouseX;
      const dyWorld = currentMouseY - startMouseY;
      const angleRad = (el.rotation * Math.PI) / 180;
      const cos = Math.cos(-angleRad);
      const sin = Math.sin(-angleRad);
      const dxLocal = dxWorld * cos - dyWorld * sin;
      const dyLocal = dxWorld * sin + dyWorld * cos;

      let newW = el.width;
      let newH = el.height;
      let shiftXLocal = 0;
      let shiftYLocal = 0;

      if (dragState.handle.includes('e')) { newW = Math.max(1, el.width + dxLocal); shiftXLocal = (newW - el.width) / 2; }
      else if (dragState.handle.includes('w')) { newW = Math.max(1, el.width - dxLocal); shiftXLocal = -(newW - el.width) / 2; }
      if (dragState.handle.includes('s')) { newH = Math.max(1, el.height + dyLocal); shiftYLocal = (newH - el.height) / 2; }
      else if (dragState.handle.includes('n')) { newH = Math.max(1, el.height - dyLocal); shiftYLocal = -(newH - el.height) / 2; }

      const cosW = Math.cos(angleRad);
      const sinW = Math.sin(angleRad);
      const shiftXWorld = shiftXLocal * cosW - shiftYLocal * sinW;
      const shiftYWorld = shiftXLocal * sinW + shiftYLocal * cosW;

      const cx = el.x + el.width/2;
      const cy = el.y + el.height/2;
      const newX = (cx + shiftXWorld) - newW/2;
      const newY = (cy + shiftYWorld) - newH/2;

      // Handle scaling for vector points
      let newPoints = el.points;
      let newRawPoints = el.rawPoints;
      if ((el.type === 'pencil' || el.type === 'line') && el.points) {
          const scaleX = newW / Math.max(0.1, el.width);
          const scaleY = newH / Math.max(0.1, el.height);

          newPoints = el.points.map(p => ({
              ...p,
              x: p.x * scaleX,
              y: p.y * scaleY,
              handleIn: p.handleIn ? { x: p.handleIn.x * scaleX, y: p.handleIn.y * scaleY } : undefined,
              handleOut: p.handleOut ? { x: p.handleOut.x * scaleX, y: p.handleOut.y * scaleY } : undefined,
          }));

          if (el.rawPoints) {
            newRawPoints = el.rawPoints.map(p => ({
              x: p.x * scaleX,
              y: p.y * scaleY,
            }));
          }
      }

      setElements(prev => prev.map(item => item.id === el.id ? {
          ...item,
          width: newW,
          height: newH,
          x: newX,
          y: newY,
          points: newPoints,
          rawPoints: newRawPoints
      } : item));
    }

    if (dragState.mode === 'rotate' && dragState.initialElem) {
      const rect = containerRef.current?.getBoundingClientRect();
      if(!rect) return;
      const cx = view.x + (dragState.initialElem.x + dragState.initialElem.width/2) * view.scale;
      const cy = view.y + (dragState.initialElem.y + dragState.initialElem.height/2) * view.scale;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
      const rotation = angle + 90;
      setElements(prev => prev.map(item => item.id === dragState.initialElem?.id ? { ...item, rotation } : item));
    }

  }, [dragState, view, setView, setElements, drawingElement, activeTool, selectedId, elements, currentStyle.strokeWidth]);

  const onMouseUp = useCallback(() => {
    if (dragState?.mode === 'draw' && drawingElement) {
       const hasPoints = activeTool === 'pencil' && dragState.points && dragState.points.length >= 2;
       const hasSize = drawingElement.width > 0.5 || drawingElement.height > 0.5;

       if (hasPoints || hasSize) {
          // Save History BEFORE adding the new element
          onDiscreteAction();

          let finalElement = drawingElement;

          // Simplify and Smooth pencil path using configured simplification
          if (activeTool === 'pencil' && dragState.points && dragState.points.length >= 2) {
             const strokeWidth = drawingElement.shapeStyle.strokeWidth || 1;
             const simplification = drawingElement.shapeStyle.simplification ?? 1;
             const built = buildPencilPath(dragState.points, simplification, strokeWidth);

             finalElement = {
               ...drawingElement,
               ...built
             };
          }

          setElements(prev => [...prev, finalElement]);
       }
       setDrawingElement(null);
    }
    else if (dragState && (dragState.mode === 'move' || dragState.mode === 'resize' || dragState.mode === 'rotate' || dragState.mode === 'edit-point' || dragState.mode === 'edit-handle')) {
      // Continuous action ended, save history if changed
      onActionEnd();
    }

    setDragState(null);
  }, [dragState, drawingElement, setElements, activeTool, onDiscreteAction, onActionEnd]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const direction = e.deltaY < 0 ? 1 : -1;
    const factor = Math.exp(direction * zoomIntensity);
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const newScale = Math.max(0.1, Math.min(view.scale * factor, 20));
    const worldPos = screenToWorld(mouseX, mouseY, view.x, view.y, view.scale);
    const newX = mouseX - worldPos.x * newScale;
    const newY = mouseY - worldPos.y * newScale;
    setView({ scale: newScale, x: newX, y: newY });
  }, [view, setView]);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // Render Editor Overlay
  const renderPathEditor = () => {
    if (activeTool !== 'select') return null;
    const el = elements.find(e => e.id === selectedId);
    if (!el || !el.isEditingPath || !el.points) return null;

    const invScale = 1 / Math.max(0.1, view.scale);

    return (
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${el.x}px, ${el.y}px) rotate(${el.rotation}deg) scale(${el.scaleX}, ${el.scaleY})`,
          width: el.width,
          height: el.height,
          pointerEvents: 'none', // Let clicks pass to handles
          zIndex: (el.zIndex || 0) + 10 // Ensure editor is always above the element
        }}
      >
        <svg className="w-full h-full overflow-visible">
           {/* Draw connection lines for handles */}
           {el.points.map(p => (
             <g key={`lines-${p.id}`}>
               {p.type === 'curve' && p.handleIn && (
                 <line x1={p.x} y1={p.y} x2={p.x + p.handleIn.x} y2={p.y + p.handleIn.y} stroke="#8b5cf6" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
               )}
               {p.type === 'curve' && p.handleOut && (
                 <line x1={p.x} y1={p.y} x2={p.x + p.handleOut.x} y2={p.y + p.handleOut.y} stroke="#8b5cf6" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
               )}
             </g>
           ))}
        </svg>

        {el.points.map(p => (
           <React.Fragment key={p.id}>
             {/* Anchor Point */}
             <div
               className={`absolute w-3 h-3 border border-white rounded-full cursor-move pointer-events-auto editor-control shadow-sm ${editingPointId === p.id ? 'bg-blue-500' : 'bg-white'}`}
               style={{
                 left: p.x,
                 top: p.y,
                 transform: `translate(-50%, -50%) scale(${(editingPointId === p.id ? 1.25 : 1) * invScale})`
               }}
               onMouseDown={(e) => onPointMouseDown(e, el.id, p.id)}
             />

             {/* Handles (Only if curve) */}
             {p.type === 'curve' && editingPointId === p.id && (
               <>
                 {/* Default handles if not present, but usually they are if type is curve */}
                 <div
                   className="absolute w-2.5 h-2.5 bg-purple-500 border border-white rounded-full cursor-move pointer-events-auto editor-control transition-transform"
                   style={{
                     left: p.x + (p.handleIn?.x || -20),
                     top: p.y + (p.handleIn?.y || 0),
                     transform: `translate(-50%, -50%) scale(${invScale})`
                   }}
                   onMouseDown={(e) => onHandleMouseDown(e, el.id, p.id, 'in')}
                   title="Handle In"
                 />
                 <div
                   className="absolute w-2.5 h-2.5 bg-purple-500 border border-white rounded-full cursor-move pointer-events-auto editor-control transition-transform"
                   style={{
                     left: p.x + (p.handleOut?.x || 20),
                     top: p.y + (p.handleOut?.y || 0),
                     transform: `translate(-50%, -50%) scale(${invScale})`
                   }}
                   onMouseDown={(e) => onHandleMouseDown(e, el.id, p.id, 'out')}
                   title="Handle Out"
                 />
               </>
             )}
           </React.Fragment>
        ))}
      </div>
    );
  };

  // Compute overlay style for the non-exporting preview background
  const getOverlayStyle = (): React.CSSProperties => {
    const filterStr = `brightness(${backgroundConfig.brightness}%) contrast(${backgroundConfig.contrast}%) saturate(${backgroundConfig.saturation}%) hue-rotate(${backgroundConfig.hueRotate}deg)`;
    const baseStyle: React.CSSProperties = {
      opacity: backgroundConfig.opacity / 100,
      filter: filterStr,
    };

    if (backgroundConfig.overlayType === 'pattern') {
      return {
        ...baseStyle,
        ...getPatternCss(
          backgroundConfig.patternPreset,
          backgroundConfig.patternColor,
          backgroundConfig.patternSize
        ),
      };
    }

    if (backgroundConfig.overlayType === 'gradient') {
      const bgImg =
        backgroundConfig.gradientType === 'radial'
          ? `radial-gradient(circle, ${backgroundConfig.gradientColor1}, ${backgroundConfig.gradientColor2})`
          : `linear-gradient(${backgroundConfig.gradientAngle}deg, ${backgroundConfig.gradientColor1}, ${backgroundConfig.gradientColor2})`;
      return {
        ...baseStyle,
        backgroundImage: bgImg,
      };
    }

    if (backgroundConfig.overlayType === 'image' && backgroundConfig.repeatImage) {
      return {
        ...baseStyle,
        backgroundImage: `url("${backgroundConfig.repeatImage}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: `${Math.max(12, backgroundConfig.imageScale)}px auto`,
      };
    }

    // 'none' — solid baseColor with any active brightness/hue/contrast corrections
    return {
      ...baseStyle,
      backgroundColor: backgroundConfig.baseColor,
    };
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative overflow-hidden canvas-export-root outline-none ${activeTool !== 'select' ? 'cursor-crosshair' : 'cursor-default'}`}
      onMouseDown={onMouseDown}
      onWheel={onWheel}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Non-Exporting Preview / Presentation Background Layers (ignored on export via editor-control) */}
      <div className="absolute inset-0 pointer-events-none editor-control z-0 overflow-hidden">
        {/* Lowest background layer: always a solid color of the user's choice */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: backgroundConfig.baseColor }}
        />

        {/* Customizable overlay layer (Pattern / Gradient / Repeated Image / Corrected Base) */}
        <div className="absolute inset-0" style={getOverlayStyle()} />

        {/* Color Tint Correction Layer */}
        {backgroundConfig.tintIntensity > 0 && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: backgroundConfig.tintColor,
              opacity:
                (backgroundConfig.tintIntensity / 100) *
                (backgroundConfig.opacity / 100),
            }}
          />
        )}
      </div>

      <div
        className="absolute origin-top-left will-change-transform z-10"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`
        }}
      >
        {elements
          .sort((a, b) => a.zIndex - b.zIndex)
          .map(el => (
            <ElementComponent
              key={el.id}
              element={el}
              isSelected={activeTool === 'select' && selectedId === el.id && !drawingElement}
              isSelectTool={activeTool === 'select'}
              isEraser={activeTool === 'eraser'}
              viewScale={view.scale}
              onMouseDown={onElementMouseDown}
              onDoubleClick={onElementDoubleClick}
            />
          ))
        }
        {drawingElement && (
          <ElementComponent
            key="ghost"
            element={drawingElement}
            isSelected={false}
            isSelectTool={false}
            isDrawing={true}
            viewScale={view.scale}
            onMouseDown={() => {}}
          />
        )}

        {renderPathEditor()}
      </div>

      {elements.length === 0 && !drawingElement && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8 z-0 opacity-50 editor-control">
           <div className="text-zinc-500 font-bold text-4xl tracking-tighter opacity-25">
              InfiniBoard
           </div>
        </div>
      )}
    </div>
  );
};
