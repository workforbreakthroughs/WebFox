import React, { useState } from 'react';
import {
  Sliders,
  Database,
  Type,
  Layout,
  Code,
  Palette,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { DBFTable, FormControl, FormDefinition } from '../../types/foxpro';

interface PropertyInspectorProps {
  form: FormDefinition;
  selectedControl: FormControl | null;
  onUpdateControl: (updatedControl: FormControl) => void;
  onUpdateForm: (updatedForm: FormDefinition) => void;
  allTables: DBFTable[];
  onOpenCodeEditor: (eventKey: 'click' | 'init' | 'valid' | 'interactiveChange') => void;
  theme: string;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  form,
  selectedControl,
  onUpdateControl,
  onUpdateForm,
  allTables,
  onOpenCodeEditor,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Data' | 'Layout' | 'Style' | 'Methods'>('All');

  // Helper to update specific control property
  const handlePropChange = (key: keyof FormControl, val: any) => {
    if (!selectedControl) return;
    onUpdateControl({
      ...selectedControl,
      [key]: val,
    });
  };

  // List all available table.field choices
  const availableFields: { label: string; value: string }[] = [];
  allTables.forEach((tbl) => {
    tbl.fields.forEach((f) => {
      availableFields.push({
        label: `${tbl.name}.${f.name} (${f.type})`,
        value: `${tbl.name}.${f.name}`,
      });
    });
  });

  return (
    <div id="vfp_property_inspector" className={`w-72 border-l border-inherit flex flex-col select-none text-xs ${
      theme === 'vfp-classic' ? 'bg-[#d4d0c8]' : 'bg-slate-50/80 dark:bg-neutral-900/80'
    }`}>
      {/* Title Bar */}
      <div className={`p-2 border-b border-inherit font-bold text-xs flex items-center justify-between ${
        theme === 'vfp-classic' ? 'bg-[#000080] text-white' : 'bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200'
      }`}>
        <div className="flex items-center space-x-1.5 truncate">
          <Sliders className="w-3.5 h-3.5" />
          <span className="truncate">
            Properties - {selectedControl ? `${selectedControl.name} (${selectedControl.type})` : form.name}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-inherit px-1 py-1 space-x-0.5 bg-slate-100/50 dark:bg-neutral-900 text-[11px]">
        {(['All', 'Data', 'Layout', 'Style', 'Methods'] as const).map((tab) => (
          <button
            key={tab}
            id={`prop_tab_${tab.toLowerCase()}`}
            onClick={() => setActiveTab(tab)}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-neutral-800 text-orange-600 dark:text-orange-400 shadow-xs border border-slate-200 dark:border-neutral-700'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Properties Table */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 font-mono">
        {selectedControl ? (
          <>
            {/* Control Identification */}
            <div className="space-y-1.5 pb-2 border-b border-inherit">
              <div>
                <label className="text-[10px] text-slate-500 font-sans font-bold block">Name (Object Identifier)</label>
                <input
                  type="text"
                  value={selectedControl.name}
                  onChange={(e) => handlePropChange('name', e.target.value)}
                  className="w-full px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-bold"
                />
              </div>
            </div>

            {/* DATA TAB */}
            {(activeTab === 'All' || activeTab === 'Data') && (
              <div className="space-y-2 pb-2 border-b border-inherit">
                <div className="text-[11px] font-sans font-bold text-orange-600 dark:text-orange-400 flex items-center space-x-1">
                  <Database className="w-3 h-3" />
                  <span>Data Binding & Behavior</span>
                </div>

                {/* ControlSource (VFP's signature feature) */}
                <div>
                  <label className="text-[10px] text-slate-500 font-sans font-semibold block">
                    ControlSource (DBF Field):
                  </label>
                  <div className="flex space-x-1">
                    <select
                      value={selectedControl.controlSource || ''}
                      onChange={(e) => handlePropChange('controlSource', e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[11px]"
                    >
                      <option value="">(None - Unbound)</option>
                      {availableFields.map((af) => (
                        <option key={af.value} value={af.value}>
                          {af.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Format / InputMask */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-sans font-semibold block">Format (@!)</label>
                    <input
                      type="text"
                      value={selectedControl.format || ''}
                      onChange={(e) => handlePropChange('format', e.target.value)}
                      placeholder='e.g. @! or $999.99'
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-sans font-semibold block">InputMask</label>
                    <input
                      type="text"
                      value={selectedControl.inputMask || ''}
                      onChange={(e) => handlePropChange('inputMask', e.target.value)}
                      placeholder='e.g. (999) 999-9999'
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[11px]"
                    />
                  </div>
                </div>

                {/* ReadOnly & Enabled */}
                <div className="flex items-center space-x-4 pt-1">
                  <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] font-sans">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedControl.readOnly)}
                      onChange={(e) => handlePropChange('readOnly', e.target.checked)}
                      className="rounded text-orange-600"
                    />
                    <span>ReadOnly</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] font-sans">
                    <input
                      type="checkbox"
                      checked={selectedControl.enabled !== false}
                      onChange={(e) => handlePropChange('enabled', e.target.checked)}
                      className="rounded text-orange-600"
                    />
                    <span>Enabled</span>
                  </label>
                </div>

                {/* Options for ComboBox / ListBox */}
                {(selectedControl.type === 'combobox' || selectedControl.type === 'optiongroup' || selectedControl.type === 'listbox') && (
                  <div>
                    <label className="text-[10px] text-slate-500 font-sans font-semibold block">
                      Options (comma separated):
                    </label>
                    <input
                      type="text"
                      value={selectedControl.options?.join(', ') || ''}
                      onChange={(e) => handlePropChange('options', e.target.value.split(',').map((s) => s.trim()))}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[11px]"
                    />
                  </div>
                )}

                {/* Grid Specific binding */}
                {selectedControl.type === 'grid' && (
                  <div>
                    <label className="text-[10px] text-slate-500 font-sans font-semibold block">
                      Grid RecordSource Table:
                    </label>
                    <select
                      value={selectedControl.gridTableId || ''}
                      onChange={(e) => handlePropChange('gridTableId', e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[11px]"
                    >
                      <option value="">(Select Table)</option>
                      {allTables.map((tbl) => (
                        <option key={tbl.id} value={tbl.id}>
                          {tbl.name} ({tbl.records.length} recs)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* STYLE TAB */}
            {(activeTab === 'All' || activeTab === 'Style') && (
              <div className="space-y-2 pb-2 border-b border-inherit">
                <div className="text-[11px] font-sans font-bold text-orange-600 dark:text-orange-400 flex items-center space-x-1">
                  <Palette className="w-3 h-3" />
                  <span>Appearance & Style</span>
                </div>

                {/* Caption */}
                {selectedControl.type !== 'grid' && selectedControl.type !== 'shape' && selectedControl.type !== 'separator' && (
                  <div>
                    <label className="text-[10px] text-slate-500 font-sans font-semibold block">Caption</label>
                    <input
                      type="text"
                      value={selectedControl.caption || ''}
                      onChange={(e) => handlePropChange('caption', e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    />
                  </div>
                )}

                {/* Font Size & Weight */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-sans font-semibold block">FontSize (pt)</label>
                    <input
                      type="number"
                      value={selectedControl.fontSize || 13}
                      onChange={(e) => handlePropChange('fontSize', parseInt(e.target.value, 10) || 13)}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[11px]"
                      min={8}
                      max={48}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-sans font-semibold block">FontWeight</label>
                    <select
                      value={selectedControl.fontWeight || 'normal'}
                      onChange={(e) => handlePropChange('fontWeight', e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[11px]"
                    >
                      <option value="normal">Normal</option>
                      <option value="600">SemiBold</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-sans font-semibold block">BackColor</label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="color"
                        value={selectedControl.backColor || '#ffffff'}
                        onChange={(e) => handlePropChange('backColor', e.target.value)}
                        className="w-6 h-6 p-0 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedControl.backColor || ''}
                        onChange={(e) => handlePropChange('backColor', e.target.value)}
                        className="flex-1 px-1.5 py-0.5 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[10px]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-sans font-semibold block">ForeColor</label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="color"
                        value={selectedControl.foreColor || '#000000'}
                        onChange={(e) => handlePropChange('foreColor', e.target.value)}
                        className="w-6 h-6 p-0 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedControl.foreColor || ''}
                        onChange={(e) => handlePropChange('foreColor', e.target.value)}
                        className="flex-1 px-1.5 py-0.5 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[10px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LAYOUT TAB */}
            {(activeTab === 'All' || activeTab === 'Layout') && (
              <div className="space-y-2 pb-2 border-b border-inherit">
                <div className="text-[11px] font-sans font-bold text-orange-600 dark:text-orange-400 flex items-center space-x-1">
                  <Layout className="w-3 h-3" />
                  <span>Position & Dimensions</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-sans font-semibold block">Left (px)</label>
                    <input
                      type="number"
                      value={selectedControl.left}
                      onChange={(e) => handlePropChange('left', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-sans font-semibold block">Top (px)</label>
                    <input
                      type="number"
                      value={selectedControl.top}
                      onChange={(e) => handlePropChange('top', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-sans font-semibold block">Width (px)</label>
                    <input
                      type="number"
                      value={selectedControl.width}
                      onChange={(e) => handlePropChange('width', parseInt(e.target.value, 10) || 10)}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-sans font-semibold block">Height (px)</label>
                    <input
                      type="number"
                      value={selectedControl.height}
                      onChange={(e) => handlePropChange('height', parseInt(e.target.value, 10) || 10)}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* METHODS & EVENTS TAB */}
            {(activeTab === 'All' || activeTab === 'Methods') && (
              <div className="space-y-2">
                <div className="text-[11px] font-sans font-bold text-orange-600 dark:text-orange-400 flex items-center space-x-1">
                  <Code className="w-3 h-3" />
                  <span>Events & Method Scripts</span>
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() => onOpenCodeEditor('click')}
                    className="w-full flex items-center justify-between p-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-orange-500 text-left font-sans text-xs transition-colors"
                  >
                    <span>Click Event</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      selectedControl.events?.click ? 'bg-emerald-500/20 text-emerald-600 font-bold' : 'text-slate-400'
                    }`}>
                      {selectedControl.events?.click ? 'Has Code' : '[Code]'}
                    </span>
                  </button>

                  <button
                    onClick={() => onOpenCodeEditor('valid')}
                    className="w-full flex items-center justify-between p-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-orange-500 text-left font-sans text-xs transition-colors"
                  >
                    <span>Valid Event (Validation)</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      selectedControl.events?.valid ? 'bg-emerald-500/20 text-emerald-600 font-bold' : 'text-slate-400'
                    }`}>
                      {selectedControl.events?.valid ? 'Has Code' : '[Code]'}
                    </span>
                  </button>

                  <button
                    onClick={() => onOpenCodeEditor('interactiveChange')}
                    className="w-full flex items-center justify-between p-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-orange-500 text-left font-sans text-xs transition-colors"
                  >
                    <span>InteractiveChange Event</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      selectedControl.events?.interactiveChange ? 'bg-emerald-500/20 text-emerald-600 font-bold' : 'text-slate-400'
                    }`}>
                      {selectedControl.events?.interactiveChange ? 'Has Code' : '[Code]'}
                    </span>
                  </button>

                  <button
                    onClick={() => onOpenCodeEditor('init')}
                    className="w-full flex items-center justify-between p-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-orange-500 text-left font-sans text-xs transition-colors"
                  >
                    <span>Init Event (Startup)</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      selectedControl.events?.init ? 'bg-emerald-500/20 text-emerald-600 font-bold' : 'text-slate-400'
                    }`}>
                      {selectedControl.events?.init ? 'Has Code' : '[Code]'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Form Global Properties */
          <div className="space-y-3">
            <div className="font-bold border-b pb-1 font-sans">
              Form Properties: {form.name}
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-sans font-semibold block">Form Caption Title:</label>
              <input
                type="text"
                value={form.caption}
                onChange={(e) => onUpdateForm({ ...form, caption: e.target.value })}
                className="w-full px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-sans font-semibold block">Initial Workarea Table:</label>
              <select
                value={form.initialTableId || ''}
                onChange={(e) => onUpdateForm({ ...form, initialTableId: e.target.value })}
                className="w-full px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[11px]"
              >
                <option value="">(None)</option>
                {allTables.map((tbl) => (
                  <option key={tbl.id} value={tbl.id}>
                    {tbl.name} ({tbl.records.length} recs)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-sans font-semibold block">Width (px)</label>
                <input
                  type="number"
                  value={form.width}
                  onChange={(e) => onUpdateForm({ ...form, width: parseInt(e.target.value, 10) || 400 })}
                  className="w-full px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-sans font-semibold block">Height (px)</label>
                <input
                  type="number"
                  value={form.height}
                  onChange={(e) => onUpdateForm({ ...form, height: parseInt(e.target.value, 10) || 300 })}
                  className="w-full px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                />
              </div>
            </div>

            <div className="pt-2 text-slate-500 text-[11px] font-sans">
              Click any control on the canvas to inspect its individual properties.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
