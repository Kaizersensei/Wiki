import React, { useRef } from 'react';
import {
  MousePointer2,
  Minus,
  Square,
  Circle,
  Pencil,
  Eraser,
  Image as ImageIcon,
  Palette,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { ToolType, ShapeStyle, FillType } from '../types';

interface ToolsPanelProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  currentStyle: ShapeStyle;
  setCurrentStyle: React.Dispatch<React.SetStateAction<ShapeStyle>>;
  isToolsVisible: boolean;
  onToggleToolsVisibility: () => void;
  isStyleVisible: boolean;
  onToggleStyleVisibility: () => void;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  activeTool,
  setActiveTool,
  currentStyle,
  setCurrentStyle,
  isToolsVisible,
  onToggleToolsVisibility,
  isStyleVisible,
  onToggleStyleVisibility
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateStyle = (updates: Partial<ShapeStyle>) => {
    setCurrentStyle(prev => ({ ...prev, ...updates }));
  };

  const handlePatternUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        updateStyle({ patternImage: ev.target?.result as string, fillType: 'pattern' });
      };
      reader.readAsDataURL(file);
    }
  };

  const tools: { id: ToolType; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { id: 'select', icon: <MousePointer2 size={20} />, label: 'Select', shortcut: 'V' },
    { id: 'pencil', icon: <Pencil size={20} />, label: 'Pencil', shortcut: 'P' },
    { id: 'line', icon: <Minus size={20} />, label: 'Line', shortcut: 'L' },
    { id: 'rectangle', icon: <Square size={20} />, label: 'Rectangle', shortcut: 'R' },
    { id: 'ellipse', icon: <Circle size={20} />, label: 'Ellipse', shortcut: 'O' },
    { id: 'eraser', icon: <Eraser size={20} />, label: 'Eraser (Click to Delete)', shortcut: 'E' },
  ];

  const isDrawingTool = activeTool !== 'select' && activeTool !== 'eraser';

  if (!isToolsVisible) {
    return (
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-2 editor-control">
        <button
          onClick={onToggleToolsVisibility}
          className="bg-zinc-900/85 hover:bg-zinc-800 backdrop-blur border border-zinc-700 rounded-xl px-2.5 py-2 flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white shadow-lg transition"
          title="Show Tools Palette"
        >
          <ChevronRight size={14} />
          <span>Tools</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-4 flex flex-col gap-3 z-30 items-start editor-control">
      {/* Tool Selection */}
      <div className="bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-2xl p-2 shadow-xl flex flex-col gap-1">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`p-3 rounded-xl transition group relative flex items-center justify-center ${
              activeTool === tool.id
                ? tool.id === 'eraser'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
            title={`${tool.label} (${tool.shortcut})`}
          >
            {tool.icon}
            <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none border border-zinc-700 z-50">
              {tool.label} <span className="text-zinc-500 ml-1">{tool.shortcut}</span>
            </span>
          </button>
        ))}

        <div className="h-px bg-zinc-800 my-0.5" />

        <button
          onClick={onToggleToolsVisibility}
          className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-800 hover:text-white transition flex items-center justify-center group relative"
          title="Hide Tools Bar"
        >
          <ChevronLeft size={16} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none border border-zinc-700 z-50">
            Hide Tools
          </span>
        </button>
      </div>

      {/* Drawing Properties (Visible when using a drawing tool) */}
      {isDrawingTool && (
        !isStyleVisible ? (
          <button
            onClick={onToggleStyleVisibility}
            className="bg-zinc-900/90 hover:bg-zinc-800 backdrop-blur border border-zinc-700 rounded-xl px-3 py-2 shadow-xl flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition"
            title="Show Drawing Style Palette"
          >
            <span
              className="w-3 h-3 rounded-full border border-zinc-500 shrink-0"
              style={{ backgroundColor: currentStyle.strokeColor }}
            />
            <span>Style ({currentStyle.strokeWidth}px)</span>
            <ChevronDown size={14} className="text-zinc-400" />
          </button>
        ) : (
          <div className="bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-2xl p-4 shadow-xl w-64 animate-in fade-in slide-in-from-left-4 duration-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Palette size={12} /> Drawing Style
              </h3>
              <button
                onClick={onToggleStyleVisibility}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                title="Hide Drawing Style Palette"
              >
                <ChevronUp size={14} />
              </button>
            </div>

            {/* Stroke */}
            <div className="mb-4 space-y-3">
               <div className="flex justify-between items-center text-xs text-zinc-300">
                  <span>Stroke</span>
                  <input
                    type="color"
                    value={currentStyle.strokeColor}
                    onChange={(e) => updateStyle({ strokeColor: e.target.value })}
                    className="w-6 h-6 bg-transparent rounded cursor-pointer"
                  />
               </div>
               <div className="space-y-1">
                 <div className="flex justify-between text-[10px] text-zinc-500">
                   <span>Width</span>
                   <span>{currentStyle.strokeWidth}px</span>
                 </div>
                 <input
                   type="range" min={0} max={20} step={0.5}
                   value={currentStyle.strokeWidth}
                   onChange={(e) => updateStyle({ strokeWidth: parseFloat(e.target.value) })}
                   className="w-full h-1 bg-zinc-700 rounded-lg accent-blue-500"
                 />
               </div>

               {activeTool === 'pencil' && (
                 <div className="space-y-1 pt-1">
                   <div className="flex justify-between text-[10px] text-zinc-500">
                     <span>Line Simplification</span>
                     <span>{(currentStyle.simplification ?? 1) === 0 ? '0 (Exact)' : `${currentStyle.simplification ?? 1}`}</span>
                   </div>
                   <input
                     type="range" min={0} max={10} step={0.1}
                     value={currentStyle.simplification ?? 1}
                     onChange={(e) => updateStyle({ simplification: parseFloat(e.target.value) })}
                     className="w-full h-1 bg-zinc-700 rounded-lg accent-blue-500"
                   />
                 </div>
               )}
            </div>

            <hr className="border-zinc-800 mb-4" />

            {/* Fill */}
            <div className="space-y-3">
               <div className="flex justify-between items-center text-xs text-zinc-300">
                  <span>Fill Type</span>
                  <select
                    value={currentStyle.fillType}
                    onChange={(e) => updateStyle({ fillType: e.target.value as FillType })}
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[10px] focus:outline-none"
                  >
                    <option value="none">None</option>
                    <option value="solid">Solid</option>
                    <option value="gradient">Gradient</option>
                    <option value="pattern">Pattern</option>
                  </select>
               </div>

               {currentStyle.fillType === 'solid' && (
                 <div className="flex justify-between items-center text-xs text-zinc-300">
                    <span>Color</span>
                    <input
                      type="color"
                      value={currentStyle.fillColor}
                      onChange={(e) => updateStyle({ fillColor: e.target.value })}
                      className="w-6 h-6 bg-transparent rounded cursor-pointer"
                    />
                 </div>
               )}

              {currentStyle.fillType === 'gradient' && (
                 <div className="flex justify-between items-center text-xs text-zinc-300 gap-2">
                    <span>Start/End</span>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={currentStyle.fillColor}
                        onChange={(e) => updateStyle({ fillColor: e.target.value })}
                        className="w-6 h-6 bg-transparent rounded cursor-pointer"
                      />
                      <input
                        type="color"
                        value={currentStyle.fillColor2}
                        onChange={(e) => updateStyle({ fillColor2: e.target.value })}
                        className="w-6 h-6 bg-transparent rounded cursor-pointer"
                      />
                    </div>
                 </div>
               )}

               {currentStyle.fillType === 'pattern' && (
                 <div className="text-xs">
                   <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded flex items-center justify-center gap-2 text-zinc-400 hover:text-white transition"
                   >
                     <ImageIcon size={14} /> {currentStyle.patternImage ? 'Change Image' : 'Upload Image'}
                   </button>
                   <input
                     ref={fileInputRef}
                     type="file"
                     accept="image/*"
                     className="hidden"
                     onChange={handlePatternUpload}
                   />
                   {currentStyle.patternImage && (
                      <div className="mt-2 h-16 w-full rounded border border-zinc-700 bg-zinc-800 overflow-hidden relative checkerboard">
                        <img src={currentStyle.patternImage} className="w-full h-full object-cover opacity-80" alt="pattern preview" />
                      </div>
                   )}
                 </div>
               )}
            </div>
          </div>
        )
      )}
    </div>
  );
};
