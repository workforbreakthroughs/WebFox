import React from 'react';
import {
  Type,
  AlignLeft,
  Square,
  CheckSquare,
  Radio,
  ChevronDown,
  List,
  Table as TableIcon,
  Image,
  Box,
  Sliders,
  Calendar,
  Layers,
  Divide,
  MousePointer
} from 'lucide-react';
import { FormControlType } from '../../types/foxpro';

interface FormToolboxProps {
  onSelectTool: (type: FormControlType | null) => void;
  activeTool: FormControlType | null;
  theme: string;
}

export const FormToolbox: React.FC<FormToolboxProps> = ({
  onSelectTool,
  activeTool,
  theme,
}) => {
  const tools: { type: FormControlType; label: string; icon: any; hint: string }[] = [
    { type: 'label', label: 'Label', icon: Type, hint: 'Static text or title (lbl)' },
    { type: 'textbox', label: 'TextBox', icon: AlignLeft, hint: 'Single-line data input (txt)' },
    { type: 'editbox', label: 'EditBox', icon: AlignLeft, hint: 'Multi-line memo input (edt)' },
    { type: 'button', label: 'CommandButton', icon: Square, hint: 'Push button with click event (cmd)' },
    { type: 'navgroup', label: 'VCR Nav Toolbar', icon: Sliders, hint: 'First, Prev, Next, Last, New, Delete navigation bar' },
    { type: 'checkbox', label: 'CheckBox', icon: CheckSquare, hint: 'Logical True/False switch (chk)' },
    { type: 'optiongroup', label: 'OptionGroup', icon: Radio, hint: 'Radio buttons group (opt)' },
    { type: 'combobox', label: 'ComboBox', icon: ChevronDown, hint: 'Dropdown select list (cmb)' },
    { type: 'listbox', label: 'ListBox', icon: List, hint: 'Multi-item list view (lst)' },
    { type: 'grid', label: 'Grid', icon: TableIcon, hint: 'Data-bound tabular grid (grd)' },
    { type: 'datepicker', label: 'DatePicker', icon: Calendar, hint: 'Calendar date picker' },
    { type: 'image', label: 'Image', icon: Image, hint: 'Picture / photo viewer (img)' },
    { type: 'shape', label: 'Shape / Box', icon: Box, hint: 'Rectangle or panel container (shp)' },
    { type: 'separator', label: 'Line Separator', icon: Divide, hint: 'Horizontal line divider' },
  ];

  return (
    <div id="vfp_form_toolbox" className={`w-44 border-r border-inherit flex flex-col select-none text-xs ${
      theme === 'vfp-classic' ? 'bg-[#d4d0c8]' : 'bg-slate-50/70 dark:bg-neutral-900/70'
    }`}>
      <div className={`p-2 border-b border-inherit font-bold text-xs flex items-center justify-between ${
        theme === 'vfp-classic' ? 'bg-[#000080] text-white' : 'bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200'
      }`}>
        <div className="flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>Form Controls</span>
        </div>
      </div>

      {/* Pointer / Select tool */}
      <div className="p-2 border-b border-inherit">
        <button
          onClick={() => onSelectTool(null)}
          className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded font-medium transition-all ${
            activeTool === null
              ? 'bg-orange-600 text-white shadow-sm'
              : 'hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-neutral-300'
          }`}
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>Pointer (Select)</span>
        </button>
      </div>

      {/* Control Pallet Grid */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.type;
          return (
            <button
              key={tool.type}
              id={`tool_${tool.type}`}
              onClick={() => onSelectTool(tool.type)}
              title={tool.hint}
              className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded text-left transition-all ${
                isActive
                  ? 'bg-orange-600 text-white shadow-sm font-semibold'
                  : 'hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-neutral-300'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-orange-600 dark:text-orange-400'}`} />
              <span className="truncate">{tool.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-2 border-t border-inherit text-[10px] text-slate-500 dark:text-neutral-400 text-center">
        Click tool, then click or drag on canvas to place.
      </div>
    </div>
  );
};
