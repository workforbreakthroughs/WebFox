import React, { useState } from 'react';
import {
  Layers,
  Database,
  Table as TableIcon,
  Monitor,
  Search,
  FileCode,
  FileText,
  Plus,
  Play,
  Edit3,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Eye,
  Download,
  Terminal,
  Settings,
  HardDrive
} from 'lucide-react';
import { DBFTable, FormDefinition, QueryDefinition, ReportDefinition, VFPProject } from '../types/foxpro';

interface ProjectExplorerProps {
  project: VFPProject;
  activeTable: DBFTable | null;
  setActiveTable: (table: DBFTable) => void;
  activeForm: FormDefinition | null;
  setActiveForm: (form: FormDefinition) => void;
  activeQuery: QueryDefinition | null;
  setActiveQuery: (query: QueryDefinition) => void;
  activeReport: ReportDefinition | null;
  setActiveReport: (report: ReportDefinition) => void;
  onModifyStructure: (table: DBFTable) => void;
  onBrowseTable: (table: DBFTable) => void;
  onDesignForm: (form: FormDefinition) => void;
  onRunForm: (form: FormDefinition) => void;
  onDesignQuery: (query: QueryDefinition) => void;
  onDesignReport: (report: ReportDefinition) => void;
  onNewTable: () => void;
  onNewForm: () => void;
  onNewQuery: () => void;
  onNewReport: () => void;
  onDeleteTable: (tableId: string) => void;
  onDeleteForm: (formId: string) => void;
  onDeleteQuery: (queryId: string) => void;
  onDeleteReport: (reportId: string) => void;
  onExportDbf: (table: DBFTable) => void;
  onOpenDriveManager?: () => void;
  theme: string;
}

export const ProjectExplorer: React.FC<ProjectExplorerProps> = ({
  project,
  activeTable,
  setActiveTable,
  activeForm,
  setActiveForm,
  activeQuery,
  setActiveQuery,
  activeReport,
  setActiveReport,
  onModifyStructure,
  onBrowseTable,
  onDesignForm,
  onRunForm,
  onDesignQuery,
  onDesignReport,
  onNewTable,
  onNewForm,
  onNewQuery,
  onNewReport,
  onDeleteTable,
  onDeleteForm,
  onDeleteQuery,
  onDeleteReport,
  onExportDbf,
  onOpenDriveManager,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Data' | 'Documents' | 'Queries' | 'Code'>('All');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    databases: true,
    tables: true,
    freeTables: true,
    forms: true,
    queries: true,
    reports: true,
    programs: true,
  });

  const [selectedItem, setSelectedItem] = useState<{ type: 'table' | 'form' | 'query' | 'report' | 'program'; id: string } | null>({
    type: 'table',
    id: project.database.tables[0]?.id || '',
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const allTables = [...project.database.tables, ...project.freeTables];

  // Actions for current selection
  const handleModify = () => {
    if (!selectedItem) return;
    if (selectedItem.type === 'table') {
      const tbl = allTables.find((t) => t.id === selectedItem.id);
      if (tbl) onModifyStructure(tbl);
    } else if (selectedItem.type === 'form') {
      const frm = project.forms.find((f) => f.id === selectedItem.id);
      if (frm) onDesignForm(frm);
    } else if (selectedItem.type === 'query') {
      const qry = project.queries.find((q) => q.id === selectedItem.id);
      if (qry) onDesignQuery(qry);
    } else if (selectedItem.type === 'report') {
      const rpt = project.reports.find((r) => r.id === selectedItem.id);
      if (rpt) onDesignReport(rpt);
    }
  };

  const handleRun = () => {
    if (!selectedItem) return;
    if (selectedItem.type === 'table') {
      const tbl = allTables.find((t) => t.id === selectedItem.id);
      if (tbl) onBrowseTable(tbl);
    } else if (selectedItem.type === 'form') {
      const frm = project.forms.find((f) => f.id === selectedItem.id);
      if (frm) onRunForm(frm);
    } else if (selectedItem.type === 'query') {
      const qry = project.queries.find((q) => q.id === selectedItem.id);
      if (qry) onDesignQuery(qry);
    } else if (selectedItem.type === 'report') {
      const rpt = project.reports.find((r) => r.id === selectedItem.id);
      if (rpt) onDesignReport(rpt);
    }
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    if (!confirm('Are you sure you want to remove this item from the project?')) return;
    if (selectedItem.type === 'table') onDeleteTable(selectedItem.id);
    else if (selectedItem.type === 'form') onDeleteForm(selectedItem.id);
    else if (selectedItem.type === 'query') onDeleteQuery(selectedItem.id);
    else if (selectedItem.type === 'report') onDeleteReport(selectedItem.id);
  };

  const totalRecords = allTables.reduce((sum, t) => sum + t.records.length, 0);

  return (
    <div id="vfp_project_manager" className="flex flex-col h-full bg-inherit">
      {/* VFP Window Title Bar */}
      <div className={`flex items-center justify-between px-3 py-1.5 border-b text-xs font-semibold select-none ${
        theme === 'vfp-classic' ? 'bg-[#000080] text-white' : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300'
      }`}>
        <div className="flex items-center space-x-2">
          <Layers className="w-3.5 h-3.5" />
          <span>Project Manager - {project.name} (.PJX)</span>
        </div>
        <div className="text-[11px] opacity-80">
          VFP 9.0 Compatibility Mode
        </div>
      </div>

      {/* VFP Project Tab Strip */}
      <div className="flex items-center border-b border-inherit px-2 py-1 space-x-1 bg-slate-50 dark:bg-neutral-900 text-xs">
        {(['All', 'Data', 'Documents', 'Queries', 'Code'] as const).map((tab) => (
          <button
            key={tab}
            id={`pjx_tab_${tab.toLowerCase()}`}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === tab
                ? theme === 'vfp-classic'
                  ? 'bg-[#d4d0c8] text-gray-900 border border-gray-400 font-bold shadow-sm'
                  : 'bg-white dark:bg-neutral-800 text-orange-600 dark:text-orange-400 shadow-sm border border-slate-200 dark:border-neutral-700'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Two-Column Layout (Tree Explorer + Right Action Panel) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Tree Explorer */}
        <div className="flex-1 overflow-y-auto p-2 text-xs space-y-1.5 font-mono">
          {/* Active Drive Strip */}
          <div
            onClick={onOpenDriveManager}
            className="p-1.5 rounded bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-600 dark:text-orange-400 cursor-pointer flex items-center justify-between text-[11px] select-none transition-colors"
            title="Click to change Working Drive or Directory (SET DEFAULT TO)"
          >
            <div className="flex items-center space-x-1.5 truncate">
              <HardDrive className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-bold">{project.defaultDrive || 'X:'}</span>
              <span className="opacity-80 truncate text-[10px]">{project.currentDirectory ? project.currentDirectory.replace(/^[A-Z]:/i, '') : '\\VFP_DATA\\'}</span>
            </div>
            <span className="text-[9px] uppercase px-1 py-0.2 bg-orange-500/20 rounded font-semibold ml-1">
              SET DEFA
            </span>
          </div>

          {/* Data Section */}
          {(activeTab === 'All' || activeTab === 'Data') && (
            <div className="space-y-0.5">
              <div
                onClick={() => toggleSection('databases')}
                className="flex items-center space-x-1.5 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer font-semibold select-none"
              >
                {expandedSections.databases ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <Database className="w-3.5 h-3.5 text-blue-500" />
                <span>Databases ({project.database.name})</span>
              </div>

              {expandedSections.databases && (
                <div className="pl-5 space-y-0.5">
                  <div
                    onClick={() => toggleSection('tables')}
                    className="flex items-center space-x-1.5 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer select-none text-slate-700 dark:text-neutral-300"
                  >
                    {expandedSections.tables ? <FolderOpen className="w-3.5 h-3.5 text-amber-500" /> : <Folder className="w-3.5 h-3.5 text-amber-500" />}
                    <span>Tables ({project.database.tables.length})</span>
                  </div>

                  {expandedSections.tables && (
                    <div className="pl-4 space-y-0.5">
                      {project.database.tables.map((table) => {
                        const isSel = selectedItem?.type === 'table' && selectedItem.id === table.id;
                        return (
                          <div
                            key={table.id}
                            id={`pjx_item_table_${table.name.toLowerCase()}`}
                            onClick={() => {
                              setSelectedItem({ type: 'table', id: table.id });
                              setActiveTable(table);
                            }}
                            onDoubleClick={() => onBrowseTable(table)}
                            className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors ${
                              isSel
                                ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 font-semibold border border-orange-500/30'
                                : 'hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-neutral-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <TableIcon className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                              <span className="truncate">{table.filename || `${table.name}.DBF`}</span>
                            </div>
                            <span className="text-[10px] opacity-70 ml-2 whitespace-nowrap">
                              {table.records.length} recs
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Free Tables */}
                  {project.freeTables.length > 0 && (
                    <div className="pt-1">
                      <div
                        onClick={() => toggleSection('freeTables')}
                        className="flex items-center space-x-1.5 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer select-none text-slate-700 dark:text-neutral-300"
                      >
                        {expandedSections.freeTables ? <FolderOpen className="w-3.5 h-3.5 text-amber-500" /> : <Folder className="w-3.5 h-3.5 text-amber-500" />}
                        <span>Free Tables ({project.freeTables.length})</span>
                      </div>

                      {expandedSections.freeTables && (
                        <div className="pl-4 space-y-0.5">
                          {project.freeTables.map((table) => {
                            const isSel = selectedItem?.type === 'table' && selectedItem.id === table.id;
                            return (
                              <div
                                key={table.id}
                                onClick={() => {
                                  setSelectedItem({ type: 'table', id: table.id });
                                  setActiveTable(table);
                                }}
                                onDoubleClick={() => onBrowseTable(table)}
                                className={`flex items-center justify-between p-1.5 rounded cursor-pointer ${
                                  isSel ? 'bg-orange-500/20 text-orange-600 font-semibold' : 'hover:bg-black/5'
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <TableIcon className="w-3.5 h-3.5 text-amber-500" />
                                  <span>{table.filename}</span>
                                </div>
                                <span className="text-[10px] opacity-70">{table.records.length} recs</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Documents Section (Forms & Reports) */}
          {(activeTab === 'All' || activeTab === 'Documents') && (
            <div className="space-y-0.5 pt-1">
              <div
                onClick={() => toggleSection('forms')}
                className="flex items-center space-x-1.5 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer font-semibold select-none"
              >
                {expandedSections.forms ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <Monitor className="w-3.5 h-3.5 text-emerald-500" />
                <span>Forms ({project.forms.length} .SCX)</span>
              </div>

              {expandedSections.forms && (
                <div className="pl-5 space-y-0.5">
                  {project.forms.map((form) => {
                    const isSel = selectedItem?.type === 'form' && selectedItem.id === form.id;
                    return (
                      <div
                        key={form.id}
                        id={`pjx_item_form_${form.name.toLowerCase()}`}
                        onClick={() => {
                          setSelectedItem({ type: 'form', id: form.id });
                          setActiveForm(form);
                        }}
                        onDoubleClick={() => onRunForm(form)}
                        className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors ${
                          isSel
                            ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 font-semibold border border-orange-500/30'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <Monitor className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="truncate">{form.name}.SCX</span>
                        </div>
                        <span className="text-[10px] opacity-70 ml-2 whitespace-nowrap">
                          {form.controls.length} ctrls
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reports */}
              <div
                onClick={() => toggleSection('reports')}
                className="flex items-center space-x-1.5 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer font-semibold select-none pt-1"
              >
                {expandedSections.reports ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <FileText className="w-3.5 h-3.5 text-purple-500" />
                <span>Reports ({project.reports.length} .FRX)</span>
              </div>

              {expandedSections.reports && (
                <div className="pl-5 space-y-0.5">
                  {project.reports.map((report) => {
                    const isSel = selectedItem?.type === 'report' && selectedItem.id === report.id;
                    return (
                      <div
                        key={report.id}
                        onClick={() => {
                          setSelectedItem({ type: 'report', id: report.id });
                          setActiveReport(report);
                        }}
                        onDoubleClick={() => onDesignReport(report)}
                        className={`flex items-center justify-between p-1.5 rounded cursor-pointer ${
                          isSel ? 'bg-orange-500/20 text-orange-600 font-semibold' : 'hover:bg-black/5'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-purple-500" />
                          <span className="truncate">{report.name}</span>
                        </div>
                        <span className="text-[10px] opacity-70">{report.bands.length} bands</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Queries Section */}
          {(activeTab === 'All' || activeTab === 'Queries') && (
            <div className="space-y-0.5 pt-1">
              <div
                onClick={() => toggleSection('queries')}
                className="flex items-center space-x-1.5 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer font-semibold select-none"
              >
                {expandedSections.queries ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <Search className="w-3.5 h-3.5 text-cyan-500" />
                <span>Queries ({project.queries.length} .QPR)</span>
              </div>

              {expandedSections.queries && (
                <div className="pl-5 space-y-0.5">
                  {project.queries.map((query) => {
                    const isSel = selectedItem?.type === 'query' && selectedItem.id === query.id;
                    return (
                      <div
                        key={query.id}
                        id={`pjx_item_query_${query.name.toLowerCase()}`}
                        onClick={() => {
                          setSelectedItem({ type: 'query', id: query.id });
                          setActiveQuery(query);
                        }}
                        onDoubleClick={() => onDesignQuery(query)}
                        className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors ${
                          isSel
                            ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 font-semibold border border-orange-500/30'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <Search className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                          <span className="truncate">{query.name}</span>
                        </div>
                        <span className="text-[10px] opacity-70 ml-2 whitespace-nowrap">
                          {query.tables.length} tbls
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Code & Programs */}
          {(activeTab === 'All' || activeTab === 'Code') && (
            <div className="space-y-0.5 pt-1">
              <div
                onClick={() => toggleSection('programs')}
                className="flex items-center space-x-1.5 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer font-semibold select-none"
              >
                {expandedSections.programs ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <FileCode className="w-3.5 h-3.5 text-amber-500" />
                <span>Programs ({project.programs.length} .PRG)</span>
              </div>

              {expandedSections.programs && (
                <div className="pl-5 space-y-0.5">
                  {project.programs.map((prog) => (
                    <div
                      key={prog.id}
                      onClick={() => setSelectedItem({ type: 'program', id: prog.id })}
                      className="flex items-center justify-between p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <FileCode className="w-3.5 h-3.5 text-amber-500" />
                        <span className="truncate">{prog.name}</span>
                      </div>
                      <span className="text-[10px] opacity-70">Main Entry</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right FoxPro Action Button Palette */}
        <div className={`w-44 border-l border-inherit p-3 flex flex-col justify-between text-xs select-none ${
          theme === 'vfp-classic' ? 'bg-[#d4d0c8]' : 'bg-slate-50/50 dark:bg-neutral-900/50'
        }`}>
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Project Actions
            </div>

            {/* New Button */}
            <div className="relative group">
              <button
                id="btn_pjx_new"
                onClick={() => {
                  if (activeTab === 'Data' || selectedItem?.type === 'table') onNewTable();
                  else if (activeTab === 'Documents' || selectedItem?.type === 'form') onNewForm();
                  else if (activeTab === 'Queries' || selectedItem?.type === 'query') onNewQuery();
                  else onNewForm();
                }}
                className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Item...</span>
              </button>
            </div>

            {/* Modify Button */}
            <button
              id="btn_pjx_modify"
              onClick={handleModify}
              disabled={!selectedItem}
              className={`w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded font-medium border transition-colors ${
                selectedItem
                  ? 'bg-white dark:bg-neutral-800 hover:bg-slate-100 border-slate-300 dark:border-neutral-700 text-slate-800 dark:text-neutral-200'
                  : 'opacity-50 cursor-not-allowed border-transparent'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-500" />
              <span>Modify (Design)</span>
            </button>

            {/* Run / Browse Button */}
            <button
              id="btn_pjx_run"
              onClick={handleRun}
              disabled={!selectedItem}
              className={`w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded font-medium border transition-colors ${
                selectedItem
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                  : 'opacity-50 cursor-not-allowed border-transparent'
              }`}
            >
              <Play className="w-3.5 h-3.5 text-emerald-600 fill-current" />
              <span>Run / Browse</span>
            </button>

            {/* Remove / Delete Button */}
            <button
              id="btn_pjx_remove"
              onClick={handleDelete}
              disabled={!selectedItem}
              className={`w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded font-medium border transition-colors ${
                selectedItem
                  ? 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                  : 'opacity-50 cursor-not-allowed border-transparent'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Remove</span>
            </button>

            {/* Export DBF */}
            {selectedItem?.type === 'table' && (
              <button
                id="btn_pjx_export_dbf"
                onClick={() => {
                  const tbl = allTables.find((t) => t.id === selectedItem.id);
                  if (tbl) onExportDbf(tbl);
                }}
                className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded font-medium bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 mt-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save as .DBF</span>
              </button>
            )}
          </div>

          {/* Project Summary Stats */}
          <div className="pt-3 border-t border-inherit text-[11px] text-slate-500 dark:text-neutral-400 space-y-1">
            <div className="flex justify-between">
              <span>Tables:</span>
              <span className="font-semibold text-slate-800 dark:text-neutral-200">{allTables.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Records:</span>
              <span className="font-semibold text-slate-800 dark:text-neutral-200">{totalRecords}</span>
            </div>
            <div className="flex justify-between">
              <span>Forms:</span>
              <span className="font-semibold text-slate-800 dark:text-neutral-200">{project.forms.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Queries:</span>
              <span className="font-semibold text-slate-800 dark:text-neutral-200">{project.queries.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
