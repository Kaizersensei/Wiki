import React, { useState, useEffect } from 'react';
import { Download, FileJson, FolderOpen, RotateCcw, AlertTriangle, Undo2, Redo2, ChevronUp, ChevronDown } from 'lucide-react';

interface ToolbarProps {
  onExportPng: () => void;
  onSave: () => void;
  onLoad: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onExportPng, onSave, onLoad, onClear,
  onUndo, onRedo, canUndo, canRedo,
  isVisible, onToggleVisibility
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    let timer: number;
    if (confirmReset) {
      timer = window.setTimeout(() => {
        setConfirmReset(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [confirmReset]);

  const handleResetClick = () => {
    if (confirmReset) {
      onClear();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
    }
  };

  if (!isVisible) {
    return (


      <button
        onClick={onToggleVisibility}
        className="absolute top-2 left-1/2 -translate-x-1/2 bg-zinc-900/85 hover:bg-zinc-800 backdrop-blur border border-zinc-700 rounded-full px-3 py-1 flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white shadow-lg z-[9999] transition editor-control"
        title="Show Top Toolbar (Tab)"
      >
        <ChevronDown size={14} />
        <span>Toolbar</span>
      </button>
    );
  }

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-full px-5 py-2 flex items-center gap-3 shadow-xl z-[9999] touch-auto editor-control">

      {/* Undo / Redo Group */}
      <div className="flex gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded transition ${canUndo ? 'text-zinc-300 hover:text-white hover:bg-zinc-800' : 'text-zinc-700 cursor-not-allowed'}`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded transition ${canRedo ? 'text-zinc-300 hover:text-white hover:bg-zinc-800' : 'text-zinc-700 cursor-not-allowed'}`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </button>
      </div>

      <div className="w-px h-4 bg-zinc-700"></div>



      <button onClick={onSave} className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white px-2 py-1 hover:bg-zinc-800 rounded transition" title="Save Project">
        <FileJson size={16} />
        <span className="hidden sm:inline">Save</span>
      </button>

      <label className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white px-2 py-1 hover:bg-zinc-800 rounded transition cursor-pointer" title="Load Project">
        <FolderOpen size={16} />
        <span className="hidden sm:inline">Load</span>
        <input type="file" accept=".json" onChange={onLoad} className="hidden" />
      </label>

      <div className="w-px h-4 bg-zinc-700"></div>

      <button onClick={onExportPng} className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 font-semibold px-2 py-1 hover:bg-zinc-800 rounded transition" title="Export as PNG">
        <Download size={16} />
        <span className="hidden sm:inline">Export</span>
      </button>

      <div className="w-px h-4 bg-zinc-700"></div>

      <button
        onClick={handleResetClick}
        className={`flex items-center gap-2 text-sm px-2 py-1 rounded transition cursor-pointer min-w-[32px] justify-center ${
          confirmReset
            ? "bg-red-500/20 text-red-400 font-bold animate-pulse"
            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
        }`}
        title={confirmReset ? "Click again to confirm reset" : "Reset Application"}
      >
        {confirmReset ? <AlertTriangle size={16} /> : <RotateCcw size={16} />}
        {confirmReset && <span className="text-xs ml-1">Confirm?</span>}
      </button>

      <div className="w-px h-4 bg-zinc-700"></div>

      <a href="https://docs.google.com/forms/d/e/1FAIpQLSdE0VJq3IeFe8ICOzFE9-TG4YgG1yS0DTwUMKkffUAkCkcWug/viewform?usp=header" target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center rounded px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white editor-control" aria-label="Report a bug (opens in a new tab)">Report a bug</a>

      <button
        onClick={onToggleVisibility}
        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        title="Hide Toolbar (Tab)"
      >
        <ChevronUp size={16} />
      </button>
    </div>
  );
};
