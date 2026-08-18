import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
  Printer,
  Sparkles,
  Database,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { DBFRecord, DBFTable, FormControl, FormDefinition, QueryDefinition } from '../../types/foxpro';
import { VFPExpressionEngine } from '../../services/dbfEngine';

interface FormRunnerProps {
  form: FormDefinition;
  tables: DBFTable[];
  onUpdateTable: (updatedTable: DBFTable) => void;
  onClose: () => void;
  onEditDesign: () => void;
  queries: QueryDefinition[];
  onRunQuery: (queryId: string) => void;
  theme: string;
}

export const FormRunner: React.FC<FormRunnerProps> = ({
  form,
  tables,
  onUpdateTable,
  onClose,
  onEditDesign,
  queries,
  onRunQuery,
  theme,
}) => {
  // Determine Primary Table
  const primaryTableId = form.initialTableId || tables[0]?.id;
  const currentTable = tables.find((t) => t.id === primaryTableId) || tables[0];

  const [activeRecno, setActiveRecno] = useState<number>(1);
  const [recordBuffer, setRecordBuffer] = useState<Record<string, any>>({});
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [messageBoxModal, setMessageBoxModal] = useState<{ open: boolean; title: string; message: string; type: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Ready');

  // Load record into buffer when recno or table changes
  useEffect(() => {
    if (!currentTable || currentTable.records.length === 0) {
      setRecordBuffer({});
      setIsDirty(false);
      return;
    }

    const rec = currentTable.records.find((r) => r._recno === activeRecno) || currentTable.records[0];
    if (rec) {
      setActiveRecno(rec._recno);
      setRecordBuffer({ ...rec });
      setIsDirty(false);
      setStatusMessage(`Record ${rec._recno} of ${currentTable.records.length} loaded.`);
    }
  }, [activeRecno, currentTable]);

  // Handle Input Changes with two-way binding to record buffer
  const handleInputChange = (controlSource: string | undefined, val: any) => {
    if (!controlSource) return;

    let fieldName = controlSource;
    if (controlSource.includes('.')) {
      fieldName = controlSource.split('.')[1];
    }

    setRecordBuffer((prev) => ({
      ...prev,
      [fieldName]: val,
    }));
    setIsDirty(true);
  };

  // Save changes to DBF table
  const handleSave = () => {
    if (!currentTable || !isDirty) return;

    const updatedRecords = currentTable.records.map((r) => {
      if (r._recno === activeRecno) {
        return {
          ...r,
          ...recordBuffer,
        };
      }
      return r;
    });

    onUpdateTable({
      ...currentTable,
      records: updatedRecords,
      lastModified: new Date().toISOString().split('T')[0],
    });

    setIsDirty(false);
    setStatusMessage('Record saved to DBF table successfully.');
  };

  // Revert / Cancel changes
  const handleRevert = () => {
    if (!currentTable) return;
    const rec = currentTable.records.find((r) => r._recno === activeRecno);
    if (rec) {
      setRecordBuffer({ ...rec });
      setIsDirty(false);
      setStatusMessage('Changes reverted.');
    }
  };

  // Append new record
  const handleAppendNew = () => {
    if (!currentTable) return;
    if (isDirty) handleSave();

    const newRecno = currentTable.records.length + 1;
    const newRec: DBFRecord = {
      _recno: newRecno,
      _deleted: false,
    };

    currentTable.fields.forEach((f) => {
      newRec[f.name] = f.type === 'N' || f.type === 'Y' ? 0 : f.type === 'L' ? false : '';
    });

    onUpdateTable({
      ...currentTable,
      records: [...currentTable.records, newRec],
    });

    setActiveRecno(newRecno);
    setStatusMessage(`Appended new blank record #${newRecno}.`);
  };

  // Delete Record
  const handleDeleteRecord = () => {
    if (!currentTable) return;
    const isDeleted = recordBuffer._deleted;
    const updatedRecords = currentTable.records.map((r) => {
      if (r._recno === activeRecno) {
        return { ...r, _deleted: !isDeleted };
      }
      return r;
    });

    onUpdateTable({
      ...currentTable,
      records: updatedRecords,
    });

    setRecordBuffer((prev) => ({ ...prev, _deleted: !isDeleted }));
    setStatusMessage(isDeleted ? 'Record recalled.' : 'Record marked for deletion.');
  };

  // Navigation handlers
  const handleGoFirst = () => {
    if (isDirty) handleSave();
    setActiveRecno(1);
  };
  const handleGoPrev = () => {
    if (isDirty) handleSave();
    setActiveRecno((prev) => Math.max(1, prev - 1));
  };
  const handleGoNext = () => {
    if (isDirty) handleSave();
    if (currentTable) setActiveRecno((prev) => Math.min(currentTable.records.length, prev + 1));
  };
  const handleGoLast = () => {
    if (isDirty) handleSave();
    if (currentTable) setActiveRecno(currentTable.records.length);
  };

  // Execute Button Click script or action
  const handleButtonClick = (ctrl: FormControl) => {
    if (ctrl.buttonAction === 'first') handleGoFirst();
    else if (ctrl.buttonAction === 'prev') handleGoPrev();
    else if (ctrl.buttonAction === 'next') handleGoNext();
    else if (ctrl.buttonAction === 'last') handleGoLast();
    else if (ctrl.buttonAction === 'new') handleAppendNew();
    else if (ctrl.buttonAction === 'save') handleSave();
    else if (ctrl.buttonAction === 'cancel') handleRevert();
    else if (ctrl.buttonAction === 'delete') handleDeleteRecord();
    else if (ctrl.buttonAction === 'close') onClose();
    else if (ctrl.buttonAction === 'run_query' && ctrl.buttonQueryId) {
      onRunQuery(ctrl.buttonQueryId);
    } else if (ctrl.events?.click) {
      // Execute FoxPro script snippet
      const script = ctrl.events.click;
      if (script.includes('MESSAGEBOX')) {
        const msgMatch = /MESSAGEBOX\s*\(\s*(.*?)\s*(?:,\s*(\d+))?\s*(?:,\s*(.*?))?\s*\)/i.exec(script);
        if (msgMatch) {
          const rawMsg = msgMatch[1];
          const type = parseInt(msgMatch[2] || '0', 10);
          const rawTitle = msgMatch[3] || '"Visual FoxPro"';

          const msgVal = VFPExpressionEngine.evaluate(rawMsg, {
            currentRecord: recordBuffer,
            table: currentTable,
            allTables: tables,
          });
          const titleVal = VFPExpressionEngine.evaluate(rawTitle, { currentRecord: recordBuffer });

          setMessageBoxModal({
            open: true,
            title: String(titleVal).replace(/^["']|["']$/g, ''),
            message: String(msgVal).replace(/^["']|["']$/g, ''),
            type,
          });
          return;
        }
      }

      // Default evaluation
      const result = VFPExpressionEngine.evaluate(script, {
        currentRecord: recordBuffer,
        table: currentTable,
        allTables: tables,
      });
      setStatusMessage(`Script executed: ${String(result)}`);
    }
  };

  return (
    <div id="vfp_form_runner_modal" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        style={{ width: `${Math.max(form.width + 32, 600)}px` }}
        className="max-w-[95vw] max-h-[90vh] bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-slate-300 dark:border-neutral-700 flex flex-col overflow-hidden text-xs"
      >
        {/* FoxPro Window Title Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#000080] text-white text-xs font-bold select-none">
          <div className="flex items-center space-x-2 truncate">
            <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
            <span className="truncate">{form.caption || form.name} (Running Form)</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onEditDesign}
              className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold flex items-center space-x-1"
              title="Return to visual form designer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Modify Form</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-rose-600 text-white"
              title="Close Form (Ctrl+W)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Runtime Navigation / VCR Ribbon */}
        <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-inherit bg-slate-100 dark:bg-neutral-800 text-xs gap-2">
          {/* VCR Navigation */}
          <div className="flex items-center space-x-1 bg-white dark:bg-neutral-700 p-0.5 rounded border border-slate-300 dark:border-neutral-600">
            <button
              onClick={handleGoFirst}
              disabled={activeRecno <= 1}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-600 disabled:opacity-30"
              title="First Record (GO TOP)"
            >
              <ChevronFirst className="w-4 h-4" />
            </button>
            <button
              onClick={handleGoPrev}
              disabled={activeRecno <= 1}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-600 disabled:opacity-30"
              title="Previous Record (SKIP -1)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2 font-mono font-bold text-slate-800 dark:text-neutral-200">
              {activeRecno} / {currentTable?.records.length || 0}
            </div>
            <button
              onClick={handleGoNext}
              disabled={!currentTable || activeRecno >= currentTable.records.length}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-600 disabled:opacity-30"
              title="Next Record (SKIP 1)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleGoLast}
              disabled={!currentTable || activeRecno >= currentTable.records.length}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-600 disabled:opacity-30"
              title="Last Record (GO BOTTOM)"
            >
              <ChevronLast className="w-4 h-4" />
            </button>
          </div>

          {/* Form Buffer Actions */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleAppendNew}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
              title="Append Blank Record"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            <button
              onClick={handleSave}
              disabled={!isDirty}
              className={`flex items-center space-x-1 px-3 py-1 rounded font-semibold shadow-sm transition-all ${
                isDirty
                  ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
                  : 'bg-slate-200 dark:bg-neutral-700 text-slate-400 cursor-not-allowed'
              }`}
              title="Commit Buffer to Table"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>

            <button
              onClick={handleRevert}
              disabled={!isDirty}
              className="flex items-center space-x-1 px-2.5 py-1 rounded border border-slate-300 dark:border-neutral-600 hover:bg-slate-200 dark:hover:bg-neutral-700 disabled:opacity-30"
              title="Revert modifications"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Revert</span>
            </button>

            <button
              onClick={handleDeleteRecord}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded font-medium border ${
                recordBuffer._deleted
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
              title="Toggle deletion mark"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{recordBuffer._deleted ? 'Recall' : 'Delete'}</span>
            </button>
          </div>
        </div>

        {/* Form Interactive Body Canvas */}
        <div className="flex-1 overflow-auto p-4 bg-slate-100 dark:bg-neutral-950 flex items-center justify-center">
          <div
            style={{
              width: `${form.width}px`,
              height: `${form.height}px`,
              backgroundColor: form.backColor || '#ffffff',
            }}
            className="relative shadow-md rounded-lg border border-slate-300 dark:border-neutral-800 overflow-hidden"
          >
            {form.controls.map((ctrl) => {
              // Extract bound field value
              let boundValue = '';
              let fieldName = '';
              if (ctrl.controlSource) {
                fieldName = ctrl.controlSource.includes('.') ? ctrl.controlSource.split('.')[1] : ctrl.controlSource;
                boundValue = recordBuffer[fieldName] !== undefined && recordBuffer[fieldName] !== null ? recordBuffer[fieldName] : '';
              }

              return (
                <div
                  key={ctrl.id}
                  style={{
                    left: `${ctrl.left}px`,
                    top: `${ctrl.top}px`,
                    width: `${ctrl.width}px`,
                    height: `${ctrl.height}px`,
                    fontSize: ctrl.fontSize ? `${ctrl.fontSize}px` : undefined,
                    fontWeight: ctrl.fontWeight,
                  }}
                  className="absolute"
                >
                  {/* Label */}
                  {ctrl.type === 'label' && (
                    <div
                      style={{ color: ctrl.foreColor || '#0f172a' }}
                      className="w-full h-full flex items-center px-1 font-semibold truncate"
                    >
                      {ctrl.caption}
                    </div>
                  )}

                  {/* TextBox */}
                  {ctrl.type === 'textbox' && (
                    <input
                      type="text"
                      value={ctrl.controlSource ? boundValue : ctrl.value || ''}
                      readOnly={ctrl.readOnly}
                      disabled={ctrl.enabled === false}
                      onChange={(e) => handleInputChange(ctrl.controlSource, e.target.value)}
                      placeholder={ctrl.format || ''}
                      className="w-full h-full px-2.5 py-1 rounded border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  )}

                  {/* EditBox (Memo) */}
                  {ctrl.type === 'editbox' && (
                    <textarea
                      value={ctrl.controlSource ? boundValue : ctrl.value || ''}
                      readOnly={ctrl.readOnly}
                      disabled={ctrl.enabled === false}
                      onChange={(e) => handleInputChange(ctrl.controlSource, e.target.value)}
                      className="w-full h-full p-2 rounded border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"
                    />
                  )}

                  {/* CheckBox */}
                  {ctrl.type === 'checkbox' && (
                    <label className="w-full h-full flex items-center space-x-2 cursor-pointer font-medium select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(ctrl.controlSource ? boundValue : ctrl.value)}
                        disabled={ctrl.enabled === false}
                        onChange={(e) => handleInputChange(ctrl.controlSource, e.target.checked)}
                        className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                      />
                      <span>{ctrl.caption}</span>
                    </label>
                  )}

                  {/* ComboBox */}
                  {ctrl.type === 'combobox' && (
                    <select
                      value={ctrl.controlSource ? boundValue : ctrl.value || ''}
                      disabled={ctrl.enabled === false}
                      onChange={(e) => handleInputChange(ctrl.controlSource, e.target.value)}
                      className="w-full h-full px-2 rounded border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    >
                      <option value="">(Select...)</option>
                      {ctrl.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* CommandButton */}
                  {ctrl.type === 'button' && (
                    <button
                      onClick={() => handleButtonClick(ctrl)}
                      disabled={ctrl.enabled === false}
                      className="w-full h-full rounded bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 active:scale-98 border border-slate-300 dark:border-neutral-600 font-bold text-slate-800 dark:text-neutral-200 shadow-xs flex items-center justify-center transition-all px-2"
                    >
                      {ctrl.caption}
                    </button>
                  )}

                  {/* VCR Navigation Group Bar */}
                  {ctrl.type === 'navgroup' && (
                    <div className="w-full h-full bg-slate-100 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg flex items-center justify-between px-3 shadow-xs font-semibold text-xs">
                      <div className="flex items-center space-x-1">
                        <button onClick={handleGoFirst} className="px-2.5 py-1 bg-white dark:bg-neutral-700 rounded border hover:bg-slate-50">|&lt;&lt;</button>
                        <button onClick={handleGoPrev} className="px-2.5 py-1 bg-white dark:bg-neutral-700 rounded border hover:bg-slate-50">&lt;&lt;</button>
                        <button onClick={handleGoNext} className="px-2.5 py-1 bg-white dark:bg-neutral-700 rounded border hover:bg-slate-50">&gt;&gt;</button>
                        <button onClick={handleGoLast} className="px-2.5 py-1 bg-white dark:bg-neutral-700 rounded border hover:bg-slate-50">&gt;&gt;|</button>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button onClick={handleAppendNew} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold">+ New</button>
                        <button onClick={handleSave} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold">Save</button>
                        <button onClick={handleDeleteRecord} className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold">Delete</button>
                      </div>
                    </div>
                  )}

                  {/* Shape */}
                  {ctrl.type === 'shape' && (
                    <div
                      style={{
                        backgroundColor: ctrl.backColor || '#f1f5f9',
                        borderRadius: `${ctrl.borderRadius || 6}px`,
                      }}
                      className="w-full h-full border border-slate-300 dark:border-neutral-700"
                    />
                  )}

                  {/* Separator Line */}
                  {ctrl.type === 'separator' && (
                    <div className="w-full h-full flex items-center">
                      <hr className="w-full border-t border-slate-300 dark:border-neutral-700" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Runtime Status Bar */}
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-inherit bg-slate-100 dark:bg-neutral-800 text-[11px] font-mono text-slate-600 dark:text-neutral-400">
          <div className="flex items-center space-x-3">
            <span>Status: <strong>{statusMessage}</strong></span>
            {isDirty && <span className="text-amber-600 font-bold animate-pulse">[BUFFER MODIFIED]</span>}
            {recordBuffer._deleted && <span className="text-rose-600 font-bold">[MARKED DELETED]</span>}
          </div>
          <div>
            <span>Work Area: <strong>{currentTable?.name || 'UNBOUND'}</strong></span>
          </div>
        </div>
      </div>

      {/* VFP MessageBox Simulation Modal */}
      {messageBoxModal && messageBoxModal.open && (
        <div className="fixed inset-0 z-60 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-lg shadow-2xl border border-slate-300 dark:border-neutral-700 p-4 space-y-4 text-xs">
            <div className="font-bold text-sm border-b pb-2 text-slate-800 dark:text-neutral-200">
              {messageBoxModal.title}
            </div>
            <div className="py-2 text-slate-700 dark:text-neutral-300 leading-relaxed font-mono">
              {messageBoxModal.message}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setMessageBoxModal(null)}
                className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
