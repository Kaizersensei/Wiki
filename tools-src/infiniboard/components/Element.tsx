import React, { useRef, useEffect } from 'react';
import { CanvasElement } from '../types';
import { FilterDefs } from './FilterDefs';
import { getSvgPathFromPoints, getSmoothedPath } from '../utils/math';

interface ElementProps {
  element: CanvasElement;
  isSelected: boolean;
  isSelectTool?: boolean;
  isDrawing?: boolean;
  isEraser?: boolean;
  viewScale?: number;
  onMouseDown: (e: React.MouseEvent, id: string, handle?: string) => void;
  onDoubleClick?: (id: string) => void;
}

export const ElementComponent: React.FC<ElementProps> = ({ element, isSelected, isSelectTool = false, isDrawing = false, isEraser = false, viewScale = 1, onMouseDown, onDoubleClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-play videos
  useEffect(() => {
    if (element.type === 'video' && videoRef.current) {
      videoRef.current.play().catch(e => console.warn("Autoplay failed", e));
      videoRef.current.loop = true;
    }
  }, [element.src, element.type]);

  // CSS Filters string (only used for image/video content)
  const cssFilters = `
    brightness(${element.filters.brightness}%)
    contrast(${element.filters.contrast}%)
    saturate(${element.filters.saturate}%)
    grayscale(${element.filters.grayscale}%)
    sepia(${element.filters.sepia}%)
    hue-rotate(${element.filters.hueRotate}deg)
    invert(${element.filters.invert}%)
    blur(${element.filters.blur}px)
    url(#filter-${element.id})
  `;

  // Render SVG Shape
  const renderShape = () => {
    const { shapeStyle, points, width, height, id } = element;
    const { strokeColor, strokeWidth, fillType, fillColor, fillColor2, patternImage } = shapeStyle;

    // Determine Fill ID
    const fillId = `fill-${id}`;
    let fillValue = 'none';

    if (fillType === 'solid') fillValue = fillColor;
    else if (fillType === 'gradient') fillValue = `url(#grad-${id})`;
    else if (fillType === 'pattern') fillValue = `url(#pat-${id})`;

    const commonProps = {
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      fill: fillValue,
      vectorEffect: "non-scaling-stroke" // Keeps stroke width constant when scaling if we used transform, but we resize bbox
    };

    let d = '';
    if (element.type === 'rectangle') {
       // Rendered via rect tag below
    } else if (element.type === 'ellipse') {
       // Rendered via ellipse tag below
    } else if ((element.type === 'line' || element.type === 'pencil') && points) {
       const useLiveSmoothing = isDrawing && element.type === 'pencil' && (element.shapeStyle.simplification ?? 1) > 0;
       if (useLiveSmoothing) {
         d = getSmoothedPath(points);
       } else {
         d = getSvgPathFromPoints(points);
       }
    }

    const safeWidth = Math.max(0.1, width);
    const safeHeight = Math.max(0.1, height);
    const hitStrokeWidth = Math.max(strokeWidth + 6, 14);

    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${safeWidth} ${safeHeight}`}
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      >
        <defs>
          {fillType === 'gradient' && (
            <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={fillColor} />
              <stop offset="100%" stopColor={fillColor2} />
            </linearGradient>
          )}
          {fillType === 'pattern' && patternImage && (
            <pattern id={`pat-${id}`} patternUnits="userSpaceOnUse" width={safeWidth} height={safeHeight}>
               <image href={patternImage} x="0" y="0" width={safeWidth} height={safeHeight} preserveAspectRatio="xMidYMid slice" />
            </pattern>
          )}
        </defs>

        {element.type === 'rectangle' && (
          <>
            <rect x={0} y={0} width={safeWidth} height={safeHeight} {...commonProps} />
            {isEraser && (
              <rect
                x={0}
                y={0}
                width={safeWidth}
                height={safeHeight}
                stroke="transparent"
                strokeWidth={hitStrokeWidth}
                fill="rgba(0,0,0,0.001)"
                vectorEffect="non-scaling-stroke"
                style={{ pointerEvents: 'all', cursor: 'pointer' }}
                onMouseDown={(e) => onMouseDown(e, element.id)}
              />
            )}
          </>
        )}
        {element.type === 'ellipse' && (
          <>
            <ellipse cx={safeWidth/2} cy={safeHeight/2} rx={safeWidth/2} ry={safeHeight/2} {...commonProps} />
            {isEraser && (
              <ellipse
                cx={safeWidth/2}
                cy={safeHeight/2}
                rx={safeWidth/2}
                ry={safeHeight/2}
                stroke="transparent"
                strokeWidth={hitStrokeWidth}
                fill="rgba(0,0,0,0.001)"
                vectorEffect="non-scaling-stroke"
                style={{ pointerEvents: 'all', cursor: 'pointer' }}
                onMouseDown={(e) => onMouseDown(e, element.id)}
              />
            )}
          </>
        )}
        {d && (
          <>
            <path
              d={d}
              {...commonProps}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {isEraser && (
              <path
                d={d}
                stroke="transparent"
                strokeWidth={hitStrokeWidth}
                fill={fillType !== 'none' ? 'rgba(0,0,0,0.001)' : 'none'}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                style={{ pointerEvents: fillType !== 'none' ? 'all' : 'stroke', cursor: 'pointer' }}
                onMouseDown={(e) => onMouseDown(e, element.id)}
              />
            )}
          </>
        )}
      </svg>
    );
  };

  const isShape = ['rectangle', 'ellipse', 'line', 'pencil'].includes(element.type);
  const showTransformControls = isSelectTool && isSelected && !element.isEditingPath && !isDrawing && !isEraser;
  const invScale = 1 / Math.max(0.1, viewScale);

  const elementPointerEvents = isDrawing
    ? 'none'
    : isEraser
      ? (isShape ? 'none' : 'auto')
      : isSelectTool
        ? 'auto'
        : 'none';

  return (
    <div
      className={`absolute group select-none ${isEraser ? 'hover:opacity-75 transition-opacity' : ''}`}
      style={{
        transform: `translate(${element.x}px, ${element.y}px) rotate(${element.rotation}deg) scale(${element.scaleX}, ${element.scaleY})`,
        width: element.width,
        height: element.height,
        zIndex: element.zIndex,
        transformOrigin: 'center center',
        pointerEvents: elementPointerEvents,
        cursor: isEraser && !isShape ? 'pointer' : undefined,
      }}
      onMouseDown={(e) => {
        if (isEraser && isShape) return;
        if (!isSelectTool && !isEraser) return;
        onMouseDown(e, element.id);
      }}
      onDoubleClick={(e) => {
        if (!isSelectTool) return;
        e.stopPropagation();
        onDoubleClick?.(element.id);
      }}
    >
      {/* SVG Advanced Filters Definition (Mainly for Image/Video) */}
      {!isShape && <FilterDefs id={element.id} filters={element.filters} />}

      {/* Content */}
      <div className={`w-full h-full pointer-events-none ${isShape ? '' : 'overflow-hidden'}`}>
        {isShape ? renderShape() : (
           element.type === 'video' ? (
            <video
              ref={videoRef}
              src={element.src}
              className="w-full h-full object-fill"
              style={{ filter: cssFilters }}
              muted
              playsInline
            />
          ) : (
            <img
              src={element.src}
              alt="element"
              className="w-full h-full object-fill"
              style={{ filter: cssFilters }}
              draggable={false}
            />
          )
        )}
      </div>

      {/* Selection Ring & Handles (Only when finished drawing and NOT editing path) */}
      {showTransformControls && (
        <div
          className="absolute inset-0 border-blue-500 pointer-events-none"
          style={{ borderWidth: `${2 * invScale}px`, borderStyle: 'solid' }}
        >
          {/* Resize Handles */}
          {/* Top Left (NW) */}
          <div
            className="absolute top-0 left-0 w-3.5 h-3.5 bg-white border border-blue-500 rounded-full pointer-events-auto cursor-nw-resize"
            style={{ transform: `translate(-50%, -50%) scale(${invScale})` }}
            onMouseDown={(e) => onMouseDown(e, element.id, 'nw')}
          />
          {/* Top Right (NE) */}
          <div
            className="absolute top-0 right-0 w-3.5 h-3.5 bg-white border border-blue-500 rounded-full pointer-events-auto cursor-ne-resize"
            style={{ transform: `translate(50%, -50%) scale(${invScale})` }}
            onMouseDown={(e) => onMouseDown(e, element.id, 'ne')}
          />
          {/* Bottom Left (SW) */}
          <div
            className="absolute bottom-0 left-0 w-3.5 h-3.5 bg-white border border-blue-500 rounded-full pointer-events-auto cursor-sw-resize"
            style={{ transform: `translate(-50%, 50%) scale(${invScale})` }}
            onMouseDown={(e) => onMouseDown(e, element.id, 'sw')}
          />
          {/* Bottom Right (SE) */}
          <div
            className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-white border border-blue-500 rounded-full pointer-events-auto cursor-se-resize"
            style={{ transform: `translate(50%, 50%) scale(${invScale})` }}
            onMouseDown={(e) => onMouseDown(e, element.id, 'se')}
          />

          {/* Rotation Handle */}
          <div
            className="absolute top-0 left-1/2 pointer-events-none"
            style={{ transform: `translateX(-50%) scale(${invScale})`, transformOrigin: 'bottom center' }}
          >
            <div
              className="absolute -top-9 left-1/2 -translate-x-1/2 w-5 h-5 bg-blue-500 rounded-full pointer-events-auto cursor-grab flex items-center justify-center text-white text-xs"
              onMouseDown={(e) => onMouseDown(e, element.id, 'rot')}
            >
              ↻
            </div>
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 h-9 w-px bg-blue-500" />
          </div>
        </div>
      )}

      {/* Visual indicator for edit mode */}
      {isSelectTool && isSelected && element.isEditingPath && (
         <div
           className="absolute inset-0 border-purple-500/50 pointer-events-none"
           style={{ borderWidth: `${1 * invScale}px`, borderStyle: 'solid' }}
         />
      )}
    </div>
  );
};
