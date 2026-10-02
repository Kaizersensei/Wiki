import React, { useRef } from 'react';
import { CanvasElement, ColorFilters, FillType } from '../types';
import { defaultFilters, buildPencilPath } from '../utils/math';
import { Trash2, Copy, ArrowUpFromLine, ArrowDownToLine, X, Image as ImageIcon, Edit3, Spline, CornerUpRight, ChevronRight, ChevronLeft, SlidersHorizontal } from 'lucide-react';

interface Props {
  element: CanvasElement | null;
  allElements: CanvasElement[];
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  onClose?: () => void;
  editingPointId?: string | null;
  isOpen: boolean;
  onToggleOpen: () => void;
}

interface SliderProps {
  label: string;
  prop: keyof ColorFilters;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  value: number;
  onChange: (key: keyof ColorFilters, value: number) => void;
}

const Slider: React.FC<SliderProps> = ({ label, prop, min, max, step = 1, unit = '', value, onChange }) => (
  <div className="mb-3">
    <div className="flex justify-between text-xs text-zinc-400 mb-1">
      <span>{label}</span>
      <span>{value}{unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(prop, parseFloat(e.target.value))}
      className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
    />
  </div>
);

export const PropertiesPanel: React.FC<Props> = ({ element, allElements, updateElement, deleteElement, duplicateElement, onClose, editingPointId, isOpen, onToggleOpen }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!element) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="absolute top-4 right-4 bg-zinc-900/85 hover:bg-zinc-800 backdrop-blur border border-zinc-700 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-zinc-300 hover:text-white shadow-xl z-30 transition editor-control"
        title="Show Properties Panel"
      >
        <ChevronLeft size={14} />
        <SlidersHorizontal size={14} />
        <span>Properties</span>
      </button>
    );
  }

  const isShape = ['rectangle', 'ellipse', 'line', 'pencil'].includes(element.type);
  const isVectorPath = element.type === 'pencil' || element.type === 'line';

  const updateFilter = (key: keyof ColorFilters, value: number | string) => {
    updateElement(element.id, {
      filters: { ...element.filters, [key]: value }
    });
  };

  const updateShapeStyle = (updates: any) => {
    updateElement(element.id, {
      shapeStyle: { ...element.shapeStyle, ...updates }
    });
  };

  const handlePatternUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        updateShapeStyle({ patternImage: ev.target?.result as string, fillType: 'pattern' });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleEditMode = () => {
    updateElement(element.id, { isEditingPath: !element.isEditingPath });
  };

  const handleSimplificationChange = (newSimplification: number) => {
    const sourcePoints = element.rawPoints && element.rawPoints.length > 1
      ? element.rawPoints
      : element.points?.map(p => ({ x: p.x, y: p.y }));

    if (!sourcePoints || sourcePoints.length < 2) {
      updateShapeStyle({ simplification: newSimplification });
      return;
    }

    const worldPoints = sourcePoints.map(p => ({
      x: p.x + element.x,
      y: p.y + element.y
    }));

    const rebuilt = buildPencilPath(
      worldPoints,
      newSimplification,
      element.shapeStyle.strokeWidth || 1
    );

    updateElement(element.id, {
      ...rebuilt,
      shapeStyle: {
        ...element.shapeStyle,
        simplification: newSimplification
      }
    });
  };

  const togglePointType = () => {
    if (!editingPointId || !element.points) return;
    const newPoints = element.points.map(p => {
      if (p.id === editingPointId) {
        const newType: 'corner' | 'curve' = p.type === 'corner' ? 'curve' : 'corner';
        // Initialize handles if switching to curve
        return {
          ...p,
          type: newType,
          handleIn: newType === 'curve' ? { x: -20, y: 0 } : undefined,
          handleOut: newType === 'curve' ? { x: 20, y: 0 } : undefined
        };
      }
      return p;
    });
    updateElement(element.id, { points: newPoints });
  };

  const bringToFront = () => {
    const maxZ = Math.max(...allElements.map(e => e.zIndex), 0);
    updateElement(element.id, { zIndex: maxZ + 1 });
  };

  const sendToBack = () => {
    const minZ = Math.min(...allElements.map(e => e.zIndex), 0);
    updateElement(element.id, { zIndex: minZ - 1 });
  };

  return (
    <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full text-zinc-300 shadow-xl z-20 editor-control">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
        <div className="flex items-center gap-2 overflow-hidden">
            <span className="font-bold text-sm truncate max-w-[110px]" title={element.name}>{element.name || "Element"}</span>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded uppercase">{element.type}</span>
        </div>

        <div className="flex gap-1 items-center">
           <button onClick={() => duplicateElement(element.id)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition" title="Duplicate"><Copy size={14}/></button>
           <button onClick={() => deleteElement(element.id)} className="p-1.5 hover:bg-red-900/30 rounded text-zinc-400 hover:text-red-400 transition" title="Delete"><Trash2 size={14}/></button>
           <div className="w-px h-4 bg-zinc-800 mx-0.5 self-center"></div>
           <button onClick={onToggleOpen} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition" title="Hide Properties Panel"><ChevronRight size={14}/></button>
           {onClose && (
             <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition" title="Deselect Element"><X size={14}/></button>
           )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* Path Editing Controls */}
        {isVectorPath && (
          <section className="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/50">
            <div className="flex justify-between items-center mb-2">
               <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Path</h3>
               <button
                  onClick={toggleEditMode}
                  className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded transition ${element.isEditingPath ? 'bg-purple-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700'}`}
               >
                 <Edit3 size={12} /> {element.isEditingPath ? 'Done Editing' : 'Edit Points'}
               </button>
            </div>

            {element.type === 'pencil' && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Line Simplification</span>
                  <span>{(element.shapeStyle.simplification ?? 1) === 0 ? '0 (Exact)' : `${element.shapeStyle.simplification ?? 1}`}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={0.1}
                  value={element.shapeStyle.simplification ?? 1}
                  onChange={(e) => handleSimplificationChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-700 rounded-lg accent-blue-500 cursor-pointer"
                />
              </div>
            )}

            {element.isEditingPath && (
               <div className="mt-3 p-2 bg-zinc-950/50 rounded border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 mb-2 uppercase font-bold">Selected Point</p>
                  {editingPointId ? (
                    <div className="flex gap-2">
                       <button
                         onClick={togglePointType}
                         className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-xs py-1.5 rounded border border-zinc-700 flex flex-col items-center gap-1 transition"
                       >
                         {element.points?.find(p => p.id === editingPointId)?.type === 'curve' ? (
                           <><CornerUpRight size={14} className="text-blue-400"/> Make Corner</>
                         ) : (
                           <><Spline size={14} className="text-purple-400"/> Make Curve</>
                         )}
                       </button>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 italic text-center py-2">Select a point on canvas</div>
                  )}
               </div>
            )}
          </section>
        )}

        {/* Transform & Arrange */}
        <section>
          <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3 tracking-wider">Arrange</h3>

          <div className="flex gap-2 mb-4">
            <button onClick={bringToFront} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded text-xs flex items-center justify-center gap-2 transition border border-zinc-700">
              <ArrowUpFromLine size={14} /> To Front
            </button>
            <button onClick={sendToBack} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded text-xs flex items-center justify-center gap-2 transition border border-zinc-700">
              <ArrowDownToLine size={14} /> To Back
            </button>
          </div>

           <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Dimensions */}
            <label className="flex flex-col">
               <span className="mb-1 text-zinc-500">Z-Index</span>
               <input
                 type="number"
                 value={element.zIndex}
                 onChange={(e) => updateElement(element.id, { zIndex: parseInt(e.target.value) })}
                 className="bg-zinc-800 border border-zinc-700 rounded p-1.5 text-zinc-200"
               />
             </label>
             <label className="flex flex-col">
               <span className="mb-1 text-zinc-500">Rotation</span>
               <input
                 type="number"
                 value={Math.round(element.rotation)}
                 onChange={(e) => updateElement(element.id, { rotation: parseFloat(e.target.value) })}
                 className="bg-zinc-800 border border-zinc-700 rounded p-1.5 text-zinc-200"
               />
             </label>
           </div>
        </section>

        <hr className="border-zinc-800" />

        {/* Shape Appearance */}
        {isShape && (
          <section>
            <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3 tracking-wider">Appearance</h3>

            {/* Stroke */}
            <div className="mb-4 space-y-3">
               <div className="flex justify-between items-center text-xs text-zinc-300">
                  <span>Stroke</span>
                  <input
                    type="color"
                    value={element.shapeStyle.strokeColor}
                    onChange={(e) => updateShapeStyle({ strokeColor: e.target.value })}
                    className="w-6 h-6 bg-transparent rounded cursor-pointer"
                  />
               </div>
               <div className="space-y-1">
                 <div className="flex justify-between text-[10px] text-zinc-500">
                   <span>Width</span>
                   <span>{element.shapeStyle.strokeWidth}px</span>
                 </div>
                 <input
                   type="range" min={0} max={20} step={0.5}
                   value={element.shapeStyle.strokeWidth}
                   onChange={(e) => updateShapeStyle({ strokeWidth: parseFloat(e.target.value) })}
                   className="w-full h-1 bg-zinc-700 rounded-lg accent-blue-500"
                 />
               </div>
            </div>

            {/* Fill */}
            <div className="space-y-3">
               <div className="flex justify-between items-center text-xs text-zinc-300">
                  <span>Fill Type</span>
                  <select
                    value={element.shapeStyle.fillType}
                    onChange={(e) => updateShapeStyle({ fillType: e.target.value as FillType })}
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[10px] focus:outline-none"
                  >
                    <option value="none">None</option>
                    <option value="solid">Solid</option>
                    <option value="gradient">Gradient</option>
                    <option value="pattern">Pattern</option>
                  </select>
               </div>

               {element.shapeStyle.fillType === 'solid' && (
                 <div className="flex justify-between items-center text-xs text-zinc-300">
                    <span>Color</span>
                    <input
                      type="color"
                      value={element.shapeStyle.fillColor}
                      onChange={(e) => updateShapeStyle({ fillColor: e.target.value })}
                      className="w-6 h-6 bg-transparent rounded cursor-pointer"
                    />
                 </div>
               )}

              {element.shapeStyle.fillType === 'gradient' && (
                 <div className="flex justify-between items-center text-xs text-zinc-300 gap-2">
                    <span>Start/End</span>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={element.shapeStyle.fillColor}
                        onChange={(e) => updateShapeStyle({ fillColor: e.target.value })}
                        className="w-6 h-6 bg-transparent rounded cursor-pointer"
                      />
                      <input
                        type="color"
                        value={element.shapeStyle.fillColor2}
                        onChange={(e) => updateShapeStyle({ fillColor2: e.target.value })}
                        className="w-6 h-6 bg-transparent rounded cursor-pointer"
                      />
                    </div>
                 </div>
               )}

               {element.shapeStyle.fillType === 'pattern' && (
                 <div className="text-xs">
                   <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded flex items-center justify-center gap-2 text-zinc-400 hover:text-white transition"
                   >
                     <ImageIcon size={14} /> Update Texture
                   </button>
                   <input
                     ref={fileInputRef}
                     type="file"
                     accept="image/*"
                     className="hidden"
                     onChange={handlePatternUpload}
                   />
                 </div>
               )}
            </div>
          </section>
        )}

        {/* Basic Corrections (Images/Videos Only) */}
        {!isShape && (
          <>
            <section>
              <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3 tracking-wider">Tone & Color</h3>
              <Slider label="Brightness" prop="brightness" min={0} max={200} unit="%" value={element.filters.brightness} onChange={updateFilter} />
              <Slider label="Contrast" prop="contrast" min={0} max={200} unit="%" value={element.filters.contrast} onChange={updateFilter} />
              <Slider label="Saturation" prop="saturate" min={0} max={200} unit="%" value={element.filters.saturate} onChange={updateFilter} />
              <Slider label="Exposure" prop="exposure" min={-100} max={100} value={element.filters.exposure} onChange={updateFilter} />
            </section>

            <section>
              <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3 tracking-wider">Color Balance</h3>
              <Slider label="Red" prop="red" min={0} max={2} step={0.05} value={element.filters.red} onChange={updateFilter} />
              <Slider label="Green" prop="green" min={0} max={2} step={0.05} value={element.filters.green} onChange={updateFilter} />
              <Slider label="Blue" prop="blue" min={0} max={2} step={0.05} value={element.filters.blue} onChange={updateFilter} />
            </section>

            <section>
              <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3 tracking-wider">Effects</h3>
              <Slider label="Hue" prop="hueRotate" min={0} max={360} unit="°" value={element.filters.hueRotate} onChange={updateFilter} />
              <Slider label="Blur" prop="blur" min={0} max={20} unit="px" step={0.5} value={element.filters.blur} onChange={updateFilter} />
              <Slider label="Sepia" prop="sepia" min={0} max={100} unit="%" value={element.filters.sepia} onChange={updateFilter} />
            </section>

            <button
              onClick={() => updateElement(element.id, { filters: { ...defaultFilters } })}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-400 hover:text-white transition font-medium border border-zinc-700 mt-4"
            >
              Reset Filters
            </button>
          </>
        )}

        <div className="h-4"></div>
      </div>
    </div>
  );
};
