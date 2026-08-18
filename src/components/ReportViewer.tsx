import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
  Database,
  ArrowLeft,
  Search,
  CheckCircle
} from 'lucide-react';
import { DBFTable, ReportDefinition } from '../types/foxpro';
import { DBFBinaryEngine } from '../services/dbfEngine';

interface ReportViewerProps {
  report: ReportDefinition;
  tables: DBFTable[];
  onClose: () => void;
  theme: string;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  tables,
  onClose,
  theme,
}) => {
  const table = tables.find((t) => t.id === report.tableId) || tables[0];
  const [filterText, setFilterText] = useState<string>('');

  if (!table) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Report has no bound table or table not found.</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded">
          Back
        </button>
      </div>
    );
  }

  // Filter records
  const filteredRecords = table.records.filter((rec) => {
    if (!filterText) return true;
    return Object.values(rec).some((val) =>
      String(val).toLowerCase().includes(filterText.toLowerCase())
    );
  });

  // Derive display columns from table fields
  const columns = table.fields.map((f) => ({
    title: f.name,
    field: f.name,
  }));

  // Calculate Column Totals for numeric columns
  const numericTotals: Record<string, number> = {};
  columns.forEach((col) => {
    const isNum = table.fields.find((f) => f.name === col.field && (f.type === 'N' || f.type === 'Y' || f.type === 'F' || f.type === 'I'));
    if (isNum) {
      numericTotals[col.field] = filteredRecords.reduce((acc, r) => acc + (Number(r[col.field]) || 0), 0);
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csv = DBFBinaryEngine.exportToCSV(table);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name.toLowerCase()}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="vfp_report_viewer" className="flex flex-col h-full bg-inherit select-none text-xs">
      {/* Title Bar (Hidden when printing) */}
      <div className={`print:hidden flex items-center justify-between px-4 py-2 border-b font-bold ${
        theme === 'vfp-classic' ? 'bg-[#000080] text-white' : 'bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200'
      }`}>
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-orange-500" />
          <span>Visual FoxPro Report Preview (REPORT FORM {report.name}.FRX PREVIEW)</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-inherit border border-white/20 flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Close Preview</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            id="btn_print_report"
            onClick={handlePrint}
            className="px-4 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center space-x-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Hidden when printing) */}
      <div className="print:hidden flex items-center justify-between px-4 py-2 border-b border-inherit bg-slate-50 dark:bg-neutral-900 text-xs">
        <div className="flex items-center space-x-2">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter report records..."
            className="px-2.5 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-sans text-xs w-60"
          />
          <span className="text-slate-500 font-mono">
            Showing {filteredRecords.length} of {table.records.length} records
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Source: <strong className="font-mono">{table.name}.DBF</strong>
        </div>
      </div>

      {/* Printable Sheet Canvas */}
      <div className="flex-1 overflow-auto p-6 bg-slate-200 dark:bg-neutral-950 flex justify-center">
        {/* Paper Page Container */}
        <div className="w-full max-w-4xl bg-white text-slate-900 shadow-2xl p-8 rounded-sm font-sans flex flex-col min-h-[800px] border border-slate-300">
          {/* TITLE BAND */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{report.title}</h1>
              <p className="text-xs text-slate-600 mt-0.5">Visual FoxPro Report Format (FRX) Preview</p>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              <div>Date: {new Date().toLocaleDateString()}</div>
              <div>Table: {table.name}.DBF</div>
            </div>
          </div>

          {/* DETAIL BAND TABLE */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-800 font-bold text-slate-900 bg-slate-50">
                  <th className="py-2 px-2 w-8 text-center">#</th>
                  {columns.map((col, idx) => (
                    <th key={idx} className="py-2 px-3">
                      {col.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecords.map((rec, rIdx) => (
                  <tr key={rIdx} className={rec._deleted ? 'line-through text-rose-500 opacity-60' : 'hover:bg-slate-50'}>
                    <td className="py-1.5 px-2 text-center text-slate-400 font-mono text-[11px]">
                      {rec._recno || rIdx + 1}
                    </td>
                    {columns.map((col, cIdx) => {
                      const val = rec[col.field];
                      const isMoney = col.field.includes('BAL') || col.field.includes('PRICE') || col.field.includes('LMT') || col.field.includes('AMT');
                      return (
                        <td key={cIdx} className={`py-1.5 px-3 ${typeof val === 'number' ? 'font-mono text-right' : ''}`}>
                          {isMoney && typeof val === 'number'
                            ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : typeof val === 'boolean'
                            ? val ? '.T.' : '.F.'
                            : String(val !== undefined && val !== null ? val : '')}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              {/* SUMMARY / TOTALS BAND */}
              <tfoot>
                <tr className="border-t-2 border-slate-800 font-bold bg-slate-50">
                  <td className="py-2 px-2 text-center">Total</td>
                  {columns.map((col, idx) => {
                    const total = numericTotals[col.field];
                    const isMoney = col.field.includes('BAL') || col.field.includes('PRICE') || col.field.includes('LMT');
                    return (
                      <td key={idx} className={`py-2 px-3 ${total !== undefined ? 'font-mono text-right' : ''}`}>
                        {total !== undefined
                          ? isMoney
                          : idx === 0
                          ? `Records: ${filteredRecords.length}`
                          : ''}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>

          {/* PAGE FOOTER BAND */}
          <div className="border-t border-slate-300 pt-3 mt-8 flex justify-between text-[11px] text-slate-500 font-mono">
            <span>Visual FoxPro Compatible Report Generator</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
