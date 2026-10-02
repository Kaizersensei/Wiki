import React, { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { BackgroundPanel } from './components/BackgroundPanel';
import { Toolbar } from './components/Toolbar';
import { ToolsPanel } from './components/ToolsPanel';
import { CanvasElement, ViewState, ToolType, ShapeStyle, BackgroundConfig } from './types';
import { defaultFilters, screenToWorld, defaultShapeStyle, defaultBackgroundConfig } from './utils/math';

const App: React.FC = () => {
  const [elements, setElements] = useState<CanvasElement[]>([]);

  // History State
  const [past, setPast] = useState<CanvasElement[][]>([]);
  const [future, setFuture] = useState<CanvasElement[][]>([]);

  // Snapshots for continuous actions (dragging)
  const dragStartElements = useRef<CanvasElement[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  const [activeTool, setActiveToolState] = useState<ToolType>('select');
  const [currentStyle, setCurrentStyle] = useState<ShapeStyle>(defaultShapeStyle);
  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig>(defaultBackgroundConfig);
  const [editingPointId, setEditingPointId] = useState<string | null>(null);

  // Panel & Bar visibility states
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [isToolsVisible, setIsToolsVisible] = useState(true);
  const [isStyleVisible, setIsStyleVisible] = useState(true);
  const [isPropertiesVisible, setIsPropertiesVisible] = useState(true);
  const [isBackgroundVisible, setIsBackgroundVisible] = useState(true);

  const setActiveTool = useCallback((tool: ToolType) => {
    setActiveToolState(tool);
    if (tool !== 'select') {
      setSelectedId(null);
      setEditingPointId(null);
      setElements(prev =>
        prev.some(el => el.isEditingPath)
          ? prev.map(el => (el.isEditingPath ? { ...el, isEditingPath: false } : el))
          : prev
      );
    }
  }, []);

  // Drawing bounds & element adjustments only show when explicitly selected with the select tool
  const selectedElement = activeTool === 'select'
    ? (elements.find(el => el.id === selectedId) || null)
    : null;

  // History Helpers
  const saveHistory = useCallback(() => {
    setPast(prev => [...prev, elements]);
    setFuture([]);
  }, [elements]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    setFuture(prev => [elements, ...prev]);
    setElements(previous);
    setPast(newPast);
    setSelectedId(null);
    setEditingPointId(null);
  }, [elements, past]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    setPast(prev => [...prev, elements]);
    setElements(next);
    setFuture(newFuture);
    setSelectedId(null);
    setEditingPointId(null);
  }, [elements, future]);

  const onDragStart = useCallback(() => {
    dragStartElements.current = elements;
  }, [elements]);

  const onDragEnd = useCallback(() => {
    if (elements !== dragStartElements.current) {
      setPast(prev => [...prev, dragStartElements.current]);
      setFuture([]);
    }
  }, [elements]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) { e.preventDefault(); redo(); }
        else { e.preventDefault(); undo(); }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault(); redo(); return;
      }

      if ((e.metaKey || e.ctrlKey)) return;

      switch(e.key.toLowerCase()) {
        case 'v': setActiveTool('select'); break;
        case 'p': setActiveTool('pencil'); break;
        case 'l': setActiveTool('line'); break;
        case 'r': setActiveTool('rectangle'); break;
        case 'o': setActiveTool('ellipse'); break;
        case 'e': setActiveTool('eraser'); break;
        case 'tab': {
          e.preventDefault();
          const anyVisible = isToolbarVisible || isToolsVisible || (selectedElement ? isPropertiesVisible : isBackgroundVisible);
          setIsToolbarVisible(!anyVisible);
          setIsToolsVisible(!anyVisible);
          setIsPropertiesVisible(!anyVisible);
          setIsBackgroundVisible(!anyVisible);
          break;
        }
        case 'backspace':
        case 'delete':
           if (activeTool === 'select' && selectedId) {
             const el = elements.find(e => e.id === selectedId);
             if (el?.isEditingPath && editingPointId) {
                const newPoints = el.points?.filter(p => p.id !== editingPointId);
                if (newPoints && newPoints.length > 0) {
                   saveHistory();
                   setElements(prev => prev.map(item => item.id === selectedId ? { ...item, points: newPoints } : item));
                   setEditingPointId(null);
                }
             } else {
                saveHistory();
                setElements(prev => prev.filter(el => el.id !== selectedId));
                setSelectedId(null);
             }
           }
           break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, selectedId, selectedElement, elements, editingPointId, undo, redo, saveHistory, isToolbarVisible, isToolsVisible, isPropertiesVisible, isBackgroundVisible, setActiveTool]);

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id: string) => {
    saveHistory();
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedId(null);
  };

  const duplicateElement = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (el) {
      saveHistory();
      const newEl = {
        ...el,
        id: crypto.randomUUID(),
        x: el.x + 20,
        y: el.y + 20,
        zIndex: elements.length + 1,
      };
      setElements(prev => [...prev, newEl]);
      setSelectedId(newEl.id);
    }
  };


  const handleSave = () => {
    const data = JSON.stringify(elements);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mockup-project-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const loadedElements = JSON.parse(ev.target?.result as string);
        setPast([]);
        setFuture([]);
        setElements(loadedElements);
      } catch (err) {
        alert("Failed to load project file.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClear = () => {
    saveHistory();
    setElements([]);
    setSelectedId(null);
    setEditingPointId(null);
    setView({ x: 0, y: 0, scale: 1 });
    setActiveTool('select');
    setCurrentStyle(defaultShapeStyle);
  };

  const handleExportPng = async () => {
    setSelectedId(null);
    setEditingPointId(null);

    setTimeout(async () => {
        const element = document.querySelector('.canvas-export-root') as HTMLElement;
        if (!element) return;
        const originalClasses = element.className;
        const originalBgColor = element.style.backgroundColor;
        const originalBgImage = element.style.backgroundImage;
        element.style.backgroundColor = 'transparent';
        element.style.backgroundImage = 'none';

        try {
            const canvas = await html2canvas(element, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                scale: 2,
                logging: false,
                ignoreElements: (el) => el.classList.contains('editor-control')
            });
            const link = document.createElement('a');
            link.download = 'mockup.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error("Export failed", error);
            alert("Export failed.");
        } finally {
             element.className = originalClasses;
             element.style.backgroundColor = originalBgColor;
             element.style.backgroundImage = originalBgImage;
        }
    }, 100);
  };

  return (
    <div className="w-full h-screen flex flex-row overflow-hidden font-sans bg-zinc-900 text-white">
      {/* Left/Main Area: Canvas */}
      <div className="relative flex-1 h-full bg-zinc-900 flex flex-col">

        {/* Absolute Toolbar (Floating) */}
        <Toolbar
          onExportPng={handleExportPng}
          onSave={handleSave}
          onLoad={handleLoad}
          onClear={handleClear}
          onUndo={undo}
          onRedo={redo}
          canUndo={past.length > 0}
          canRedo={future.length > 0}
          isVisible={isToolbarVisible}
          onToggleVisibility={() => setIsToolbarVisible(prev => !prev)}
        />

        {/* Absolute Tools (Floating Left) */}
        <ToolsPanel
           activeTool={activeTool}
           setActiveTool={setActiveTool}
           currentStyle={currentStyle}
           setCurrentStyle={setCurrentStyle}
           isToolsVisible={isToolsVisible}
           onToggleToolsVisibility={() => setIsToolsVisible(prev => !prev)}
           isStyleVisible={isStyleVisible}
           onToggleStyleVisibility={() => setIsStyleVisible(prev => !prev)}
        />

        {/* Background Customization Panel (when no element is explicitly selected with the select tool) */}
        {!selectedElement && (
          <BackgroundPanel
            config={backgroundConfig}
            onChange={setBackgroundConfig}
            isOpen={isBackgroundVisible}
            onToggleOpen={() => setIsBackgroundVisible(prev => !prev)}
          />
        )}

        {/* Canvas takes remaining space */}
        <div className="w-full h-full">
          <Canvas
            elements={elements}
            setElements={setElements}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            view={view}
            setView={setView}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            currentStyle={currentStyle}
            editingPointId={editingPointId}
            setEditingPointId={setEditingPointId}
            backgroundConfig={backgroundConfig}
            onActionStart={onDragStart}
            onActionEnd={onDragEnd}
            onDiscreteAction={saveHistory}
          />
        </div>
      </div>

      {/* Right Sidebar: Properties (only when an element is explicitly selected with the select tool) */}
      <PropertiesPanel
        element={selectedElement}
        allElements={elements}
        updateElement={updateElement}
        deleteElement={deleteElement}
        duplicateElement={duplicateElement}
        onClose={() => setSelectedId(null)}
        editingPointId={editingPointId}
        isOpen={isPropertiesVisible}
        onToggleOpen={() => setIsPropertiesVisible(prev => !prev)}
      />


    </div>
  );
};

export default App;
