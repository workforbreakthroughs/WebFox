import React, { useState, useMemo } from 'react';
import {
  Database,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  RotateCcw,
  Scissors,
  Download,
  Search,
  ArrowUpDown,
  Filter,
  Check,
  FileText,
  Sparkles,
  Edit2,
  Table as TableIcon,
  X,
  HardDrive,
  Save,
  ShieldCheck
} from 'lucide-react';
import { DBFField, DBFRecord, DBFTable } from '../types/foxpro';
import { DBFBinaryEngine } from '../services/dbfEngine';
import { directDiskService } from '../services/directDiskService';

interface TableBrowserProps {
  table: DBFTable;
  onUpdateTable: (updatedTable: DBFTable) => void;
  onModifyStructure: () => void;
  onOpenCommandWindow: () => void;
  theme: string;
}

export const TableBrowser: React.FC<TableBrowserProps> = ({
  table,
  onUpdateTable,
  onModifyStructure,
  onOpenCommandWindow,
  theme,
}) => {
  const [activeRecno, setActiveRecno] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFieldFilter, setSelectedFieldFilter] = useState<string>('ALL');
  const [hideDeleted, setHideDeleted] = useState<boolean>(false);
  const [sortField, setSortField] = useState<string | null>(table.activeTag ? table.indexes.find(i => i.tag === table.activeTag)?.expression || null : null);
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [diskSaveStatus, setDiskSaveStatus] = useState<string | null>(null);
  
  // Memo viewer / editor modal
  const [memoEditorOpen, setMemoEditorOpen] = useState<{ open: boolean; fieldName: string; recno: number; text: string }>({
    open: false,
    fieldName: '',
    recno: 1,
    text: '',
  });

  // Direct disk save handler
  const handleSaveDirectlyToDisk = async () => {
    setDiskSaveStatus('Writing directly to local hard drive...');
    const res = await directDiskService.saveTableDirectlyToDisk(table);
    if (res.success) {
      setDiskSaveStatus('⚡ Saved directly to local disk!');
      setTimeout(() => setDiskSaveStatus(null), 4000);
    } else {
      setDiskSaveStatus(`Notice: ${res.message}`);
      setTimeout(() => setDiskSaveStatus(null), 6000);
    }
  };

  // Filtered & Sorted records
  const filteredRecords = useMemo(() => {
    let list = [...table.records];

    if (hideDeleted) {
      list = list.filter((r) => !r._deleted);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((rec) => {
        if (selectedFieldFilter === 'ALL') {
          return table.fields.some((f) => {
            const val = rec[f.name];
            return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
          });
        } else {
          const val = rec[selectedFieldFilter];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        }
      });
    }

    if (sortField) {
      list.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        const comp = valA > valB ? 1 : -1;
        return sortDirection === 'ASC' ? comp : -comp;
      });
    }

    return list;
  }, [table.records, hideDeleted, searchTerm, selectedFieldFilter, sortField, sortDirection, table.fields]);

  // Record Navigation handlers
  const handleGoFirst = () => {
    if (filteredRecords.length > 0) setActiveRecno(filteredRecords[0]._recno);
  };
  const handleGoPrev = () => {
    const idx = filteredRecords.findIndex((r) => r._recno === activeRecno);
    if (idx > 0) setActiveRecno(filteredRecords[idx - 1]._recno);
  };
  const handleGoNext = () => {
    const idx = filteredRecords.findIndex((r) => r._recno === activeRecno);
    if (idx !== -1 && idx < filteredRecords.length - 1) setActiveRecno(filteredRecords[idx + 1]._recno);
  };
  const handleGoLast = () => {
    if (filteredRecords.length > 0) setActiveRecno(filteredRecords[filteredRecords.length - 1]._recno);
  };

  // Append Blank Record
  const handleAppendBlank = () => {
    const newRecno = table.records.length + 1;
    const newRec: DBFRecord = {
      _recno: newRecno,
      _deleted: false,
    };

    table.fields.forEach((f) => {
      if (f.type === 'N' || f.type === 'F' || f.type === 'I' || f.type === 'Y') {
        newRec[f.name] = f.defaultValue ? Number(f.defaultValue) : 0;
      } else if (f.type === 'L') {
        newRec[f.name] = f.defaultValue === 'true';
      } else if (f.type === 'D') {
        newRec[f.name] = new Date().toISOString().split('T')[0];
      } else {
        newRec[f.name] = f.defaultValue || '';
      }
    });

    const updatedTable: DBFTable = {
      ...table,
      records: [...table.records, newRec],
      lastModified: new Date().toISOString().split('T')[0],
    };

    onUpdateTable(updatedTable);
    setActiveRecno(newRecno);
  };

  // Toggle Record Deletion Mark
  const handleToggleDelete = (recno: number) => {
    const updatedRecords = table.records.map((r) => {
      if (r._recno === recno) {
        return { ...r, _deleted: !r._deleted };
      }
      return r;
    });

    onUpdateTable({
      ...table,
      records: updatedRecords,
      lastModified: new Date().toISOString().split('T')[0],
    });
  };

  // Pack (Permanently delete marked records)
  const handlePack = () => {
    const deletedCount = table.records.filter((r) => r._deleted).length;
    if (deletedCount === 0) {
      alert('No records are marked for deletion.');
      return;
    }
    if (!confirm(`Permanently remove ${deletedCount} record(s) marked for deletion? (PACK command)`)) return;

    const remaining = table.records
      .filter((r) => !r._deleted)
      .map((r, i) => ({ ...r, _recno: i + 1 }));

    onUpdateTable({
      ...table,
      records: remaining,
      lastModified: new Date().toISOString().split('T')[0],
    });
    setActiveRecno(remaining[0]?._recno || 0);
  };

  // Zap (Erase all records)
  const handleZap = () => {
    if (!confirm(`Warning: Are you sure you want to ZAP table '${table.name}'? All ${table.records.length} records will be permanently erased.`)) return;
    onUpdateTable({
      ...table,
      records: [],
      lastModified: new Date().toISOString().split('T')[0],
    });
    setActiveRecno(0);
  };

  // Inline Cell Editing
  const handleCellChange = (recno: number, field: DBFField, val: any) => {
    let parsedVal = val;
    if (field.type === 'N' || field.type === 'F' || field.type === 'I' || field.type === 'Y') {
      parsedVal = val === '' ? null : Number(val);
    } else if (field.type === 'L') {
      parsedVal = Boolean(val);
    }

    const updatedRecords = table.records.map((r) => {
      if (r._recno === recno) {
        return { ...r, [field.name]: parsedVal };
      }
      return r;
    });

    onUpdateTable({
      ...table,
      records: updatedRecords,
      lastModified: new Date().toISOString().split('T')[0],
    });
  };

  // Export Table as .DBF binary file
  const handleExportDBF = () => {
    const buffer = DBFBinaryEngine.exportToDBF(table);
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = table.filename || `${table.name.toLowerCase()}.dbf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Table as CSV
  const handleExportCSV = () => {
    const csv = DBFBinaryEngine.exportToCSV(table, true);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table.name.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Table as SQL
  const handleExportSQL = () => {
    const sql = DBFBinaryEngine.exportToSQL(table);
    const blob = new Blob([sql], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table.name.toLowerCase()}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentRecord = table.records.find((r) => r._recno === activeRecno);
  const deletedCount = table.records.filter((r) => r._deleted).length;

  return (
    <div id="vfp_table_browser" className="flex flex-col h-full bg-inherit">
      {/* VFP Window Header & Action Ribbon */}
      <div className={`flex flex-wrap items-center justify-between px-3 py-2 border-b text-xs gap-2 select-none ${
        theme === 'vfp-classic' ? 'bg-[#000080] text-white' : 'bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200'
      }`}>
        <div className="flex items-center space-x-2 font-semibold">
          <TableIcon className="w-4 h-4 text-amber-500" />
          <span>BROWSE - {table.filename || `${table.name}.DBF`}</span>
          <span className="opacity-75 font-normal">
            ({table.records.length} records, {table.fields.length} fields)
          </span>
          {directDiskService.isMounted() && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>⚡ Direct Disk: {directDiskService.getMountedFolderName()}</span>
            </span>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center space-x-1.5">
          {/* Direct Disk Save */}
          {directDiskService.isMounted() && (
            <button
              onClick={handleSaveDirectlyToDisk}
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1 shadow-xs transition-colors"
              title="Save changes directly back to physical .DBF on hard drive"
            >
              <Save className="w-3 h-3" />
              <span>Save to Disk</span>
            </button>
          )}

          {/* Modify Structure */}
          <button
            id="btn_browse_modi_stru"
            onClick={onModifyStructure}
            className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-inherit font-medium border border-white/30 transition-colors"
            title="Modify Table Structure (MODIFY STRUCTURE)"
          >
            Modify Structure
          </button>

          {/* Export Dropdown / Buttons */}
          <button
            id="btn_browse_download_dbf"
            onClick={handleExportDBF}
            className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center space-x-1 shadow-sm"
            title="Download DBF binary copy"
          >
            <Download className="w-3 h-3" />
            <span>.DBF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white font-medium"
            title="Export CSV"
          >
            CSV
          </button>
          <button
            onClick={handleExportSQL}
            className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white font-medium"
            title="Export SQL DDL & Inserts"
          >
            SQL
          </button>
        </div>
      </div>

      {/* Disk Save Toast Feedback */}
      {diskSaveStatus && (
        <div className="px-4 py-1.5 bg-emerald-600 text-white text-[11px] font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-3.5 h-3.5" />
            <span>{diskSaveStatus}</span>
          </div>
          <button onClick={() => setDiskSaveStatus(null)} className="hover:opacity-75">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Navigation, Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 border-b border-inherit bg-slate-50 dark:bg-neutral-900 text-xs gap-2">
        {/* VCR Navigation Group */}
        <div className="flex items-center space-x-1 bg-white dark:bg-neutral-800 p-0.5 rounded border border-slate-200 dark:border-neutral-700">
          <button
            id="btn_vcr_first"
            onClick={handleGoFirst}
            disabled={filteredRecords.length === 0}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 disabled:opacity-30"
            title="First Record (GO TOP)"
          >
            <ChevronFirst className="w-4 h-4" />
          </button>
          <button
            id="btn_vcr_prev"
            onClick={handleGoPrev}
            disabled={filteredRecords.length === 0}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 disabled:opacity-30"
            title="Previous Record (SKIP -1)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-2 font-mono font-semibold text-slate-700 dark:text-neutral-300">
            {activeRecno} / {table.records.length}
          </div>
          <button
            id="btn_vcr_next"
            onClick={handleGoNext}
            disabled={filteredRecords.length === 0}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 disabled:opacity-30"
            title="Next Record (SKIP 1)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            id="btn_vcr_last"
            onClick={handleGoLast}
            disabled={filteredRecords.length === 0}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 disabled:opacity-30"
            title="Last Record (GO BOTTOM)"
          >
            <ChevronLast className="w-4 h-4" />
          </button>
        </div>

        {/* Record Manipulation Actions */}
        <div className="flex items-center space-x-1">
          <button
            id="btn_browse_append"
            onClick={handleAppendBlank}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all"
            title="Append Blank Record (APPEND BLANK)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Append Blank</span>
          </button>

          <button
            id="btn_browse_delete_toggle"
            onClick={() => handleToggleDelete(activeRecno)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded font-medium border transition-colors ${
              currentRecord?._deleted
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200'
            }`}
            title="Mark/Recall active record for deletion"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{currentRecord?._deleted ? 'Recall Record' : 'Delete (Mark)'}</span>
          </button>

          {deletedCount > 0 && (
            <button
              id="btn_browse_pack"
              onClick={handlePack}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm animate-pulse"
              title="Permanently remove records marked for deletion (PACK)"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Pack ({deletedCount})</span>
            </button>
          )}

          <button
            onClick={handleZap}
            className="px-2 py-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 font-medium"
            title="Erase all records (ZAP)"
          >
            Zap
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in table..."
              className="pl-7 pr-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs w-36 sm:w-48 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2 text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <label className="flex items-center space-x-1 text-[11px] text-slate-600 dark:text-neutral-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideDeleted}
              onChange={(e) => setHideDeleted(e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
            />
            <span>SET DELETED ON</span>
          </label>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 overflow-auto font-mono text-xs select-text">
        <table className="w-full border-collapse">
          {/* Table Header */}
          <thead className={`sticky top-0 z-10 border-b border-inherit ${
            theme === 'vfp-classic' ? 'bg-[#d4d0c8] text-black font-bold' : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300'
          }`}>
            <tr>
              {/* Record Selector Column (Active Pointer & Deletion Flag) */}
              <th className="w-10 px-1 py-1.5 text-center border-r border-inherit font-semibold">
                Del
              </th>
              <th className="w-14 px-2 py-1.5 text-center border-r border-inherit font-semibold">
                Rec#
              </th>

              {/* Data Field Columns */}
              {table.fields.map((field) => {
                const isSorted = sortField === field.name;
                return (
                  <th
                    key={field.name}
                    onClick={() => {
                      if (sortField === field.name) {
                        setSortDirection((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
                      } else {
                        setSortField(field.name);
                        setSortDirection('ASC');
                      }
                    }}
                    className="px-3 py-1.5 text-left border-r border-inherit font-bold cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center justify-between space-x-1">
                      <span>{field.name}</span>
                      <div className="flex items-center text-[10px] opacity-70">
                        <span>({field.type})</span>
                        {isSorted && (
                          <span className="ml-1 text-orange-600 font-bold">
                            {sortDirection === 'ASC' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-inherit">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={table.fields.length + 2} className="text-center py-12 text-slate-400">
                  {table.records.length === 0
                    ? 'Table is empty. Click "Append Blank" to add records.'
                    : 'No records matching filter criteria.'}
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => {
                const isActive = record._recno === activeRecno;
                const isDeleted = record._deleted;

                return (
                  <tr
                    key={record._recno}
                    onClick={() => setActiveRecno(record._recno)}
                    className={`transition-colors ${
                      isActive
                        ? theme === 'vfp-classic'
                          ? 'bg-[#000080] text-white font-medium'
                          : 'bg-orange-500/15 text-orange-950 dark:text-orange-100 font-medium'
                        : isDeleted
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-700/70 dark:text-rose-300/70 line-through'
                        : 'hover:bg-slate-50 dark:hover:bg-neutral-800/60'
                    }`}
                  >
                    {/* Record Selector / Deletion indicator */}
                    <td
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleDelete(record._recno);
                      }}
                      className="w-10 px-1 py-1 text-center border-r border-inherit cursor-pointer hover:bg-black/10"
                      title={isDeleted ? 'Marked for deletion (*). Click to recall.' : 'Click to mark for deletion'}
                    >
                      <div className="flex items-center justify-center space-x-0.5">
                        {isActive && <span className="text-amber-500 font-bold">►</span>}
                        {isDeleted ? <span className="text-rose-600 font-bold">■</span> : <span className="text-slate-300">□</span>}
                      </div>
                    </td>

                    {/* Recno */}
                    <td className="w-14 px-2 py-1 text-center border-r border-inherit opacity-75 font-mono">
                      {record._recno}
                    </td>

                    {/* Editable Cells */}
                    {table.fields.map((field) => {
                      const val = record[field.name];

                      if (field.type === 'L') {
                        return (
                          <td key={field.name} className="px-3 py-1 border-r border-inherit text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(val)}
                              onChange={(e) => handleCellChange(record._recno, field, e.target.checked)}
                              className="rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                            />
                          </td>
                        );
                      }

                      if (field.type === 'M') {
                        // Memo field opens text editor
                        const hasMemo = Boolean(val && String(val).trim());
                        return (
                          <td key={field.name} className="px-3 py-1 border-r border-inherit">
                            <button
                              onClick={() =>
                                setMemoEditorOpen({
                                  open: true,
                                  fieldName: field.name,
                                  recno: record._recno,
                                  text: String(val || ''),
                                })
                              }
                              className={`px-2 py-0.5 rounded text-[11px] font-medium border flex items-center space-x-1 ${
                                hasMemo
                                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-300'
                                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 border-slate-200'
                              }`}
                            >
                              <FileText className="w-3 h-3" />
                              <span>{hasMemo ? 'Memo (Edit)' : 'memo'}</span>
                            </button>
                          </td>
                        );
                      }

                      return (
                        <td key={field.name} className="px-1.5 py-0.5 border-r border-inherit">
                          <input
                            type={field.type === 'N' || field.type === 'F' || field.type === 'I' || field.type === 'Y' ? 'number' : field.type === 'D' ? 'date' : 'text'}
                            value={val === null || val === undefined ? '' : val}
                            onChange={(e) => handleCellChange(record._recno, field, e.target.value)}
                            className={`w-full bg-transparent px-1.5 py-0.5 rounded focus:bg-white focus:text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                              field.type === 'N' || field.type === 'Y' ? 'text-right' : 'text-left'
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* VFP Status Bar */}
      <div className={`flex items-center justify-between px-3 py-1 border-t text-[11px] font-mono select-none ${
        theme === 'vfp-classic' ? 'bg-[#d4d0c8] text-black border-[#808080]' : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400'
      }`}>
        <div className="flex items-center space-x-4">
          <span>
            REC: <strong>{activeRecno}</strong> / {table.records.length}
          </span>
          <span>
            TABLE: <strong>{table.name}</strong>
          </span>
          <span>
            TAG: <strong>{sortField ? `${sortField} (${sortDirection})` : 'NONE'}</strong>
          </span>
          <span>
            STATUS: <strong>{currentRecord?._deleted ? 'DELETED' : 'ACTIVE'}</strong>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span>EXCLUSIVE</span>
          <button
            onClick={onOpenCommandWindow}
            className="text-orange-600 hover:underline font-semibold"
          >
            Open Command Window
          </button>
        </div>
      </div>

      {/* Memo Field Editor Modal */}
      {memoEditorOpen.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-slate-200 dark:border-neutral-800 flex flex-col overflow-hidden text-xs">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50 dark:bg-neutral-800">
              <div className="font-bold flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Memo Field: {memoEditorOpen.fieldName} (Record #{memoEditorOpen.recno})</span>
              </div>
              <button
                onClick={() => setMemoEditorOpen({ open: false, fieldName: '', recno: 1, text: '' })}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1">
              <textarea
                value={memoEditorOpen.text}
                onChange={(e) => setMemoEditorOpen((prev) => ({ ...prev, text: e.target.value }))}
                placeholder="Enter memo text..."
                rows={8}
                className="w-full p-2.5 rounded border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-xs"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 px-4 py-3 border-t bg-slate-50 dark:bg-neutral-800">
              <button
                onClick={() => setMemoEditorOpen({ open: false, fieldName: '', recno: 1, text: '' })}
                className="px-3 py-1.5 rounded border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const targetField = table.fields.find((f) => f.name === memoEditorOpen.fieldName);
                  if (targetField) {
                    handleCellChange(memoEditorOpen.recno, targetField, memoEditorOpen.text);
                  }
                  setMemoEditorOpen({ open: false, fieldName: '', recno: 1, text: '' });
                }}
                className="px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-700 text-white font-semibold"
              >
                Save Memo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
