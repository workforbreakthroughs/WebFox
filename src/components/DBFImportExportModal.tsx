import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  Database,
  X,
  CheckCircle,
  FileCode,
  AlertCircle
} from 'lucide-react';
import { DBFTable } from '../types/foxpro';
import { DBFBinaryEngine } from '../services/dbfEngine';

interface DBFImportExportModalProps {
  table: DBFTable | null;
  onImportTable: (newTable: DBFTable) => void;
  onClose: () => void;
  theme: string;
}

export const DBFImportExportModal: React.FC<DBFImportExportModalProps> = ({
  table,
  onImportTable,
  onClose,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [importType, setImportType] = useState<'dbf' | 'csv'>('dbf');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [importedTablePreview, setImportedTablePreview] = useState<DBFTable | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Binary DBF or CSV File Upload
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();

    if (file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv')) {
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsed = DBFBinaryEngine.parseCSV(text, file.name.replace(/\.[^/.]+$/, ''));
          setImportedTablePreview(parsed);
          setStatusMessage(`Parsed CSV with ${parsed.fields.length} columns and ${parsed.records.length} records.`);
        } catch (err: any) {
          alert('Failed to parse CSV: ' + err.message);
        }
      };
      reader.readAsText(file);
    } else {
      // Binary DBF file (.dbf)
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const parsed = DBFBinaryEngine.parseDBF(buffer, file.name);
          setImportedTablePreview(parsed);
          setStatusMessage(`Parsed FoxPro DBF binary file successfully (${parsed.records.length} records, ${parsed.fields.length} fields).`);
        } catch (err: any) {
          alert('Failed to parse DBF file: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (importedTablePreview) {
      onImportTable(importedTablePreview);
      onClose();
    }
  };

  // Export handlers
  const handleExportBinaryDBF = () => {
    if (!table) return;
    const buffer = DBFBinaryEngine.exportToDBF(table);
    const blob = new Blob([buffer], { type: 'application/x-dbf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = table.filename || `${table.name.toLowerCase()}.dbf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!table) return;
    const csv = DBFBinaryEngine.exportToCSV(table);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table.name.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSQL = () => {
    if (!table) return;
    const sql = DBFBinaryEngine.exportToSQL(table);
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table.name.toLowerCase()}_schema.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-slate-300 dark:border-neutral-800 flex flex-col overflow-hidden text-xs">
        {/* Title Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-inherit bg-slate-100 dark:bg-neutral-800 font-bold select-none">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-orange-500" />
            <span>FoxPro DBF Data Transfer & Linux Migration</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center px-4 py-2 border-b border-inherit bg-slate-50 dark:bg-neutral-900 space-x-2">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3 py-1.5 rounded font-semibold ${
              activeTab === 'import' ? 'bg-orange-600 text-white' : 'hover:bg-slate-200 text-slate-700 dark:text-neutral-300'
            }`}
          >
            Import Database (.DBF / .CSV)
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded font-semibold ${
              activeTab === 'export' ? 'bg-orange-600 text-white' : 'hover:bg-slate-200 text-slate-700 dark:text-neutral-300'
            }`}
          >
            Export Table ({table ? `${table.name}.DBF` : 'Select Table'})
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'import' && (
            <div className="space-y-4">
              {/* Drag & Drop Box */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                  dragActive
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-slate-300 dark:border-neutral-700 hover:border-orange-400 bg-slate-50 dark:bg-neutral-800/50'
                }`}
              >
                <Upload className="w-10 h-10 text-orange-500 mb-2 stroke-1" />
                <h4 className="font-bold text-sm text-slate-800 dark:text-neutral-200">
                  Drop your FoxPro .DBF or .CSV file here
                </h4>
                <p className="text-slate-500 text-xs mt-1">or click to browse from your Linux filesystem</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".dbf,.csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
              </div>

              {/* Import Preview */}
              {importedTablePreview && (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-600 font-bold">
                    <CheckCircle className="w-4 h-4" />
                    <span>Table Ready to Import: {importedTablePreview.name}.DBF</span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-neutral-300 font-mono">
                    • Fields ({importedTablePreview.fields.length}):{' '}
                    {importedTablePreview.fields.map((f) => `${f.name}(${f.type})`).join(', ')}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-neutral-300 font-mono">
                    • Records: {importedTablePreview.records.length} records parsed
                  </div>

                  <button
                    onClick={handleConfirmImport}
                    className="mt-2 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                  >
                    Add Table to FoxStudio Project
                  </button>
                </div>
              )}

              {statusMessage && !importedTablePreview && (
                <div className="text-slate-500 text-xs">{statusMessage}</div>
              )}
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              {table ? (
                <>
                  <div className="p-3 bg-slate-100 dark:bg-neutral-800 rounded-lg text-xs">
                    <span className="font-bold">Active Table:</span> {table.name} ({table.records.length} records, {table.fields.length} fields)
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Binary DBF */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 hover:border-orange-500 transition-all flex flex-col justify-between space-y-3">
                      <div>
                        <Database className="w-6 h-6 text-orange-500 mb-1" />
                        <h5 className="font-bold text-xs">Binary .DBF File</h5>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Standard dBase III+ / FoxPro binary file compatible with legacy Linux tools.
                        </p>
                      </div>
                      <button
                        onClick={handleExportBinaryDBF}
                        className="w-full py-1.5 rounded bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center justify-center space-x-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .DBF</span>
                      </button>
                    </div>

                    {/* CSV */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 hover:border-emerald-500 transition-all flex flex-col justify-between space-y-3">
                      <div>
                        <FileSpreadsheet className="w-6 h-6 text-emerald-500 mb-1" />
                        <h5 className="font-bold text-xs">CSV Spreadsheet</h5>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Universal comma-separated format for LibreOffice Calc or Excel.
                        </p>
                      </div>
                      <button
                        onClick={handleExportCSV}
                        className="w-full py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center space-x-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download CSV</span>
                      </button>
                    </div>

                    {/* SQL DDL */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 hover:border-blue-500 transition-all flex flex-col justify-between space-y-3">
                      <div>
                        <FileCode className="w-6 h-6 text-blue-500 mb-1" />
                        <h5 className="font-bold text-xs">SQL Migration Script</h5>
                        <p className="text-[11px] text-slate-500 mt-1">
                          CREATE TABLE and INSERT statements for PostgreSQL / SQLite.
                        </p>
                      </div>
                      <button
                        onClick={handleExportSQL}
                        className="w-full py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center space-x-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download SQL</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Please open or select a table from the Project Manager first to export.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
