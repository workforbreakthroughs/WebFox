import React, { useState } from 'react';
import {
  Layers,
  Save,
  Play,
  X,
  Plus,
  Sliders,
  CheckCircle,
  Download,
  Database
} from 'lucide-react';
import { DBFTable, FormControl, FormControlType, FormDefinition, QueryDefinition } from '../../types/foxpro';
import { FormToolbox } from './FormToolbox';
import { PropertyInspector } from './PropertyInspector';
import { FormDesignerCanvas } from './FormDesignerCanvas';
import { MethodCodeEditor } from './MethodCodeEditor';
import { FormRunner } from './FormRunner';
import { FormExportModal } from './FormExportModal';

interface FormDesignerProps {
  form: FormDefinition;
  onSaveForm: (updatedForm: FormDefinition) => void;
  onClose: () => void;
  allTables: DBFTable[];
  onUpdateTable: (updatedTable: DBFTable) => void;
  queries: QueryDefinition[];
  onRunQuery: (queryId: string) => void;
  theme: string;
}

export const FormDesigner: React.FC<FormDesignerProps> = ({
  form,
  onSaveForm,
  onClose,
  allTables,
  onUpdateTable,
  queries,
  onRunQuery,
  theme,
}) => {
  const [currentForm, setCurrentForm] = useState<FormDefinition>(JSON.parse(JSON.stringify(form)));
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<FormControlType | null>(null);
  const [isRunningForm, setIsRunningForm] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Method Code Editor State
  const [codeEditorState, setCodeEditorState] = useState<{
    open: boolean;
    control: FormControl | null;
    eventKey: 'click' | 'init' | 'valid' | 'interactiveChange' | 'gotFocus' | 'lostFocus';
  } | null>(null);

  const selectedControl = currentForm.controls.find((c) => c.id === selectedControlId) || null;

  // Handle Save
  const handleSave = () => {
    onSaveForm(currentForm);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Update a single control in form
  const handleUpdateControl = (updatedCtrl: FormControl) => {
    setCurrentForm((prev) => ({
      ...prev,
      controls: prev.controls.map((c) => (c.id === updatedCtrl.id ? updatedCtrl : c)),
    }));
  };

  // Open method code editor for active control
  const handleOpenCodeEditor = (eventKey: 'click' | 'init' | 'valid' | 'interactiveChange') => {
    setCodeEditorState({
      open: true,
      control: selectedControl,
      eventKey,
    });
  };

  // Save method code from editor
  const handleSaveCode = (eventKey: string, code: string) => {
    if (codeEditorState?.control) {
      const updatedCtrl: FormControl = {
        ...codeEditorState.control,
        events: {
          ...codeEditorState.control.events,
          [eventKey]: code,
        },
      };
      handleUpdateControl(updatedCtrl);
    } else {
      // Form level event
      setCurrentForm((prev) => ({
        ...prev,
        events: {
          ...prev.events,
          [eventKey]: code,
        },
      }));
    }
  };

  return (
    <div id="vfp_form_designer_wrapper" className="flex flex-col h-full bg-inherit select-none text-xs">
      {/* Top Header Bar */}
      <div className={`flex items-center justify-between px-4 py-2 border-b font-bold ${
        theme === 'vfp-classic' ? 'bg-[#000080] text-white' : 'bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200'
      }`}>
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-orange-500" />
          <span>Form Designer (MODIFY FORM) - {currentForm.name}.SCX</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-inherit border border-white/20"
          >
            Close
          </button>
          <button
            id="btn_save_form_def"
            onClick={handleSave}
            className="px-3.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center space-x-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Form (Ctrl+S)</span>
          </button>
          <button
            id="btn_run_form_preview"
            onClick={() => setIsRunningForm(true)}
            className="px-4 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>DO FORM (Run)</span>
          </button>
        </div>
      </div>

      {/* Main Designer 3-Pane Layout: Toolbox | Canvas | Property Sheet */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Form Toolbox */}
        <FormToolbox
          activeTool={activeTool}
          onSelectTool={(tool) => setActiveTool(tool)}
          theme={theme}
        />

        {/* Center: Interactive Visual Stage */}
        <FormDesignerCanvas
          form={currentForm}
          onUpdateForm={(updated) => setCurrentForm(updated)}
          selectedControlId={selectedControlId}
          onSelectControl={(id) => setSelectedControlId(id)}
          activeTool={activeTool}
          onToolPlaced={() => setActiveTool(null)}
          onRunForm={() => setIsRunningForm(true)}
          onExportForm={() => setIsExporting(true)}
          allTables={allTables}
          theme={theme}
        />

        {/* Right: Property Inspector / Sheet */}
        <PropertyInspector
          form={currentForm}
          selectedControl={selectedControl}
          onUpdateControl={handleUpdateControl}
          onUpdateForm={(updated) => setCurrentForm(updated)}
          allTables={allTables}
          onOpenCodeEditor={handleOpenCodeEditor}
          theme={theme}
        />
      </div>

      {/* Interactive Form Runner Modal (DO FORM) */}
      {isRunningForm && (
        <FormRunner
          form={currentForm}
          tables={allTables}
          onUpdateTable={onUpdateTable}
          onClose={() => setIsRunningForm(false)}
          onEditDesign={() => setIsRunningForm(false)}
          queries={queries}
          onRunQuery={onRunQuery}
          theme={theme}
        />
      )}

      {/* Export to Standalone Linux Application Modal */}
      {isExporting && (
        <FormExportModal
          form={currentForm}
          table={allTables.find((t) => t.id === currentForm.initialTableId) || allTables[0] || null}
          onClose={() => setIsExporting(false)}
          theme={theme}
        />
      )}

      {/* Method Code Editor Modal */}
      {codeEditorState && codeEditorState.open && (
        <MethodCodeEditor
          form={currentForm}
          control={codeEditorState.control}
          eventKey={codeEditorState.eventKey}
          onSaveCode={handleSaveCode}
          onClose={() => setCodeEditorState(null)}
          theme={theme}
        />
      )}

      {saveSuccess && (
        <div className="absolute bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 text-xs font-semibold z-50">
          <CheckCircle className="w-4 h-4" />
          <span>Form saved successfully!</span>
        </div>
      )}
    </div>
  );
};
