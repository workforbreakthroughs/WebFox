import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Copy,
  Trash2,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  Maximize2,
  Grid,
  Download,
  Eye,
  Sliders,
  Code,
  Sparkles
} from 'lucide-react';
import { DBFTable, FormControl, FormControlType, FormDefinition } from '../../types/foxpro';

interface FormDesignerCanvasProps {
  form: FormDefinition;
  onUpdateForm: (updatedForm: FormDefinition) => void;
  selectedControlId: string | null;
  onSelectControl: (controlId: string | null) => void;
  activeTool: FormControlType | null;
  onToolPlaced: () => void;
  onRunForm: () => void;
  onExportForm: () => void;
  allTables: DBFTable[];
  theme: string;
}

export const FormDesignerCanvas: React.FC<FormDesignerCanvasProps> = ({
  form,
  onUpdateForm,
  selectedControlId,
  onSelectControl,
  activeTool,
  onToolPlaced,
  onRunForm,
  onExportForm,
  allTables,
  theme,
}) => {
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<number>(8);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Dragging / Resizing state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState<string | null>(null); // handle name: 'se', 'e', 's'
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; w: number; h: number }>({ x: 0, y: 0, w: 0, h: 0 });

  const selectedControl = form.controls.find((c) => c.id === selectedControlId);

  // Snap calculation helper
  const snap = (val: number) => (snapToGrid ? Math.round(val / gridSize) * gridSize : val);

  // Canvas Click: If active tool is chosen, place new control
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== canvasRef.current && (e.target as HTMLElement).id !== 'vfp_form_surface') {
      return;
    }

    if (activeTool) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clickX = snap(e.clientX - rect.left);
      const clickY = snap(e.clientY - rect.top);

      let defaultWidth = 140;
      let defaultHeight = 32;
      let defaultCaption = `${activeTool.toUpperCase()}`;

      if (activeTool === 'label') {
        defaultCaption = 'Label Text:';
        defaultWidth = 120;
        defaultHeight = 20;
      } else if (activeTool === 'button') {
        defaultCaption = 'CommandButton';
        defaultWidth = 120;
        defaultHeight = 36;
      } else if (activeTool === 'editbox') {
        defaultWidth = 240;
        defaultHeight = 80;
      } else if (activeTool === 'grid') {
        defaultWidth = 360;
        defaultHeight = 160;
      } else if (activeTool === 'navgroup') {
        defaultWidth = 480;
        defaultHeight = 44;
      } else if (activeTool === 'separator') {
        defaultWidth = 300;
        defaultHeight = 4;
      }

      const newControl: FormControl = {
        id: 'ctrl_' + Math.random().toString(36).substr(2, 9),
        name: `${activeTool.substring(0, 3)}_${form.controls.length + 1}`,
        type: activeTool,
        left: Math.max(8, clickX),
        top: Math.max(8, clickY),
        width: defaultWidth,
        height: defaultHeight,
        caption: defaultCaption,
        enabled: true,
        visible: true,
      };

      onUpdateForm({
        ...form,
        controls: [...form.controls, newControl],
      });
      onSelectControl(newControl.id);
      onToolPlaced();
    } else {
      onSelectControl(null);
    }
  };

  // Mouse down on control to start dragging
  const handleControlMouseDown = (e: React.MouseEvent, ctrl: FormControl) => {
    e.stopPropagation();
    onSelectControl(ctrl.id);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - rect.left - ctrl.left,
      y: e.clientY - rect.top - ctrl.top,
    });
  };

  // Global mouse move & up for smooth dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || (!isDragging && !isResizing) || !selectedControl) return;
      const rect = canvasRef.current.getBoundingClientRect();

      if (isDragging) {
        const newLeft = Math.max(0, snap(e.clientX - rect.left - dragOffset.x));
        const newTop = Math.max(0, snap(e.clientY - rect.top - dragOffset.y));

        onUpdateForm({
          ...form,
          controls: form.controls.map((c) => (c.id === selectedControl.id ? { ...c, left: newLeft, top: newTop } : c)),
        });
      } else if (isResizing) {
        const deltaX = e.clientX - rect.left - resizeStart.x;
        const deltaY = e.clientY - rect.top - resizeStart.y;

        let newW = resizeStart.w;
        let newH = resizeStart.h;

        if (isResizing.includes('e')) newW = Math.max(20, snap(resizeStart.w + deltaX));
        if (isResizing.includes('s')) newH = Math.max(16, snap(resizeStart.h + deltaY));

        onUpdateForm({
          ...form,
          controls: form.controls.map((c) => (c.id === selectedControl.id ? { ...c, width: newW, height: newH } : c)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, selectedControl, form, snapToGrid, gridSize]);

  // Alignment helpers
  const handleAlign = (type: 'left' | 'top' | 'sameWidth' | 'sameHeight') => {
    if (!selectedControl) return;
    // Align relative to canvas or other controls
    if (type === 'left') {
      onUpdateForm({
        ...form,
        controls: form.controls.map((c) => (c.id === selectedControl.id ? { ...c, left: snap(24) } : c)),
      });
    } else if (type === 'top') {
      onUpdateForm({
        ...form,
        controls: form.controls.map((c) => (c.id === selectedControl.id ? { ...c, top: snap(24) } : c)),
      });
    }
  };

  // Clone / Duplicate selected control
  const handleDuplicate = () => {
    if (!selectedControl) return;
    const cloned: FormControl = {
      ...JSON.parse(JSON.stringify(selectedControl)),
      id: 'ctrl_' + Math.random().toString(36).substr(2, 9),
      name: `${selectedControl.name}_copy`,
      left: selectedControl.left + 16,
      top: selectedControl.top + 16,
    };
    onUpdateForm({
      ...form,
      controls: [...form.controls, cloned],
    });
    onSelectControl(cloned.id);
  };

  // Delete selected control
  const handleDelete = () => {
    if (!selectedControl) return;
    onUpdateForm({
      ...form,
      controls: form.controls.filter((c) => c.id !== selectedControl.id),
    });
    onSelectControl(null);
  };

  return (
    <div id="vfp_form_designer_canvas" className="flex-1 flex flex-col h-full bg-slate-200/60 dark:bg-neutral-950 overflow-hidden select-none">
      {/* Design Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 border-b border-slate-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs gap-2">
        <div className="flex items-center space-x-1.5">
          {/* Snap to Grid */}
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded font-medium border transition-colors ${
              snapToGrid
                ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30'
                : 'hover:bg-black/5 dark:hover:bg-white/5 border-slate-300 dark:border-neutral-700'
            }`}
            title="Snap controls to 8px grid"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Snap Grid (8px)</span>
          </button>

          {/* Duplicate */}
          <button
            onClick={handleDuplicate}
            disabled={!selectedControl}
            className="flex items-center space-x-1 px-2.5 py-1 rounded border border-slate-300 dark:border-neutral-700 hover:bg-black/5 disabled:opacity-30"
            title="Duplicate Control"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={!selectedControl}
            className="flex items-center space-x-1 px-2.5 py-1 rounded text-rose-600 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-30"
            title="Delete Control (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>

        {/* Action Buttons: Run & Export */}
        <div className="flex items-center space-x-2">
          {/* Coordinates indicator */}
          {selectedControl && (
            <div className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
              X:{selectedControl.left} Y:{selectedControl.top} W:{selectedControl.width} H:{selectedControl.height}
            </div>
          )}

          {/* Export to Standalone Linux App */}
          <button
            id="btn_form_export_linux"
            onClick={onExportForm}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium shadow-sm transition-all"
            title="Generate runnable Standalone App for Ubuntu Linux"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Linux App</span>
          </button>

          {/* Run Form (DO FORM) */}
          <button
            id="btn_form_do_form"
            onClick={onRunForm}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-all animate-pulse"
            title="Execute and test form with live DBF data (DO FORM)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>DO FORM (Run)</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
        {/* The Form Window Frame */}
        <div
          style={{ width: `${form.width}px`, minHeight: `${form.height}px` }}
          className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl border border-slate-300 dark:border-neutral-700 flex flex-col relative transition-all"
        >
          {/* Form Window Title Bar (VFP Style) */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-t-lg bg-[#000080] text-white text-xs font-bold select-none">
            <div className="flex items-center space-x-2 truncate">
              <span className="truncate">{form.caption || form.name}</span>
            </div>
            <div className="flex items-center space-x-1 text-[10px]">
              <span className="w-3.5 h-3.5 bg-white/20 rounded flex items-center justify-center">_</span>
              <span className="w-3.5 h-3.5 bg-white/20 rounded flex items-center justify-center">□</span>
              <span className="w-3.5 h-3.5 bg-rose-600 rounded flex items-center justify-center">✕</span>
            </div>
          </div>

          {/* Form Surface Area with Grid Dots */}
          <div
            id="vfp_form_surface"
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{
              height: `${form.height}px`,
              backgroundColor: form.backColor || '#f8fafc',
              backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
            className="relative flex-1 overflow-hidden"
          >
            {form.controls.map((ctrl) => {
              const isSelected = ctrl.id === selectedControlId;

              return (
                <div
                  key={ctrl.id}
                  id={`ctrl_render_${ctrl.id}`}
                  onMouseDown={(e) => handleControlMouseDown(e, ctrl)}
                  style={{
                    left: `${ctrl.left}px`,
                    top: `${ctrl.top}px`,
                    width: `${ctrl.width}px`,
                    height: `${ctrl.height}px`,
                    fontSize: ctrl.fontSize ? `${ctrl.fontSize}px` : undefined,
                    fontWeight: ctrl.fontWeight,
                    backgroundColor: ctrl.backColor,
                    color: ctrl.foreColor,
                  }}
                  className={`absolute group cursor-move select-none transition-shadow ${
                    isSelected
                      ? 'ring-2 ring-orange-500 shadow-md z-20'
                      : 'hover:ring-1 hover:ring-blue-400 z-10'
                  }`}
                >
                  {/* Render Visual Representation based on Control Type */}
                  {ctrl.type === 'label' && (
                    <div className="w-full h-full flex items-center text-slate-800 dark:text-neutral-200 px-1 truncate">
                      {ctrl.caption || 'Label'}
                    </div>
                  )}

                  {ctrl.type === 'textbox' && (
                    <div className="w-full h-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded px-2 flex items-center text-slate-700 dark:text-neutral-300 font-mono text-xs shadow-inner truncate">
                      {ctrl.controlSource ? (
                        <span className="text-orange-600 font-bold text-[11px] truncate">[{ctrl.controlSource}]</span>
                      ) : (
                        <span className="opacity-60">{ctrl.caption || 'TextBox'}</span>
                      )}
                    </div>
                  )}

                  {ctrl.type === 'editbox' && (
                    <div className="w-full h-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded p-2 text-slate-600 dark:text-neutral-400 font-mono text-[11px] shadow-inner overflow-hidden">
                      <div className="text-orange-600 font-bold mb-1">
                        {ctrl.controlSource ? `[MEMO: ${ctrl.controlSource}]` : '[EditBox / Memo]'}
                      </div>
                      <div className="opacity-50">Multi-line text editor data buffer...</div>
                    </div>
                  )}

                  {ctrl.type === 'button' && (
                    <div className="w-full h-full bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 border border-slate-300 dark:border-neutral-600 rounded font-semibold text-slate-800 dark:text-neutral-200 flex items-center justify-center shadow-xs px-2 truncate">
                      {ctrl.caption || 'CommandButton'}
                    </div>
                  )}

                  {ctrl.type === 'checkbox' && (
                    <div className="w-full h-full flex items-center space-x-2 text-slate-800 dark:text-neutral-200 px-1">
                      <input type="checkbox" readOnly checked={true} className="rounded text-orange-600" />
                      <span className="truncate">{ctrl.caption || 'CheckBox'}</span>
                    </div>
                  )}

                  {ctrl.type === 'combobox' && (
                    <div className="w-full h-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded px-2 flex items-center justify-between text-slate-700 dark:text-neutral-300 text-xs shadow-inner">
                      <span className="truncate">{ctrl.controlSource ? `[${ctrl.controlSource}]` : 'Select Option...'}</span>
                      <span className="text-[10px] opacity-60">▼</span>
                    </div>
                  )}

                  {ctrl.type === 'grid' && (
                    <div className="w-full h-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded shadow-xs flex flex-col overflow-hidden">
                      <div className="bg-slate-100 dark:bg-neutral-700 px-2 py-1 text-[11px] font-bold border-b border-inherit flex items-center justify-between">
                        <span>Grid - {ctrl.gridTableId || 'Data Bound'}</span>
                        <span className="text-[10px] font-normal opacity-70">FoxPro Grid Control</span>
                      </div>
                      <div className="flex-1 p-2 font-mono text-[10px] opacity-75">
                        <div className="grid grid-cols-3 border-b pb-1 font-bold">
                          <span>Column 1</span>
                          <span>Column 2</span>
                          <span>Column 3</span>
                        </div>
                        <div className="py-1 opacity-50">Bound records list...</div>
                      </div>
                    </div>
                  )}

                  {ctrl.type === 'navgroup' && (
                    <div className="w-full h-full bg-slate-100 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg flex items-center justify-between px-3 shadow-xs font-semibold text-xs">
                      <div className="flex items-center space-x-1">
                        <span className="px-2 py-1 bg-white dark:bg-neutral-700 rounded border">|&lt;&lt;</span>
                        <span className="px-2 py-1 bg-white dark:bg-neutral-700 rounded border">&lt;&lt;</span>
                        <span className="px-2 py-1 bg-white dark:bg-neutral-700 rounded border">&gt;&gt;</span>
                        <span className="px-2 py-1 bg-white dark:bg-neutral-700 rounded border">&gt;&gt;|</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="px-2 py-1 bg-emerald-600 text-white rounded">+ New</span>
                        <span className="px-2 py-1 bg-rose-600 text-white rounded">Delete</span>
                        <span className="px-2 py-1 bg-blue-600 text-white rounded">Save</span>
                      </div>
                    </div>
                  )}

                  {ctrl.type === 'shape' && (
                    <div
                      style={{
                        backgroundColor: ctrl.backColor || '#f1f5f9',
                        borderRadius: `${ctrl.borderRadius || 6}px`,
                      }}
                      className="w-full h-full border border-slate-300 dark:border-neutral-700 opacity-60"
                    />
                  )}

                  {ctrl.type === 'separator' && (
                    <div className="w-full h-full flex items-center">
                      <hr className="w-full border-t border-slate-400 dark:border-neutral-600" />
                    </div>
                  )}

                  {/* Resize Handles (Shown when control is selected) */}
                  {isSelected && (
                    <>
                      {/* East Handle */}
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setIsResizing('e');
                          const rect = canvasRef.current?.getBoundingClientRect();
                          if (rect) setResizeStart({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: ctrl.width, h: ctrl.height });
                        }}
                        className="absolute -right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-orange-600 border border-white rounded-xs cursor-e-resize z-30"
                      />
                      {/* South Handle */}
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setIsResizing('s');
                          const rect = canvasRef.current?.getBoundingClientRect();
                          if (rect) setResizeStart({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: ctrl.width, h: ctrl.height });
                        }}
                        className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2.5 h-2.5 bg-orange-600 border border-white rounded-xs cursor-s-resize z-30"
                      />
                      {/* South-East Handle */}
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setIsResizing('se');
                          const rect = canvasRef.current?.getBoundingClientRect();
                          if (rect) setResizeStart({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: ctrl.width, h: ctrl.height });
                        }}
                        className="absolute -right-1 -bottom-1 w-3 h-3 bg-orange-600 border border-white rounded-xs cursor-se-resize z-30"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
