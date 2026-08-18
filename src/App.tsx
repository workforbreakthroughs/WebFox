import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Table as TableIcon,
  Layers,
  Search,
  FileText,
  FileCode,
  Terminal,
  Database,
  Plus,
  Play,
  Download,
  Upload,
  Settings,
  HelpCircle,
  Sparkles,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  DBFTable,
  FormDefinition,
  QueryDefinition,
  ReportDefinition,
  VFPProgram,
  VFPProject
} from './types/foxpro';
import {
  sampleVFPProject,
  sampleCustomersTable,
  sampleProductsTable,
  sampleOrdersTable,
  sampleCustomerForm,
  sampleTopCustomersQuery,
  sampleLowStockQuery,
  sampleCustomerReport
} from './data/sampleDatabases';
import { Header } from './components/Header';
import { ProjectExplorer } from './components/ProjectExplorer';
import { TableBrowser } from './components/TableBrowser';
import { TableDesigner } from './components/TableDesigner';
import { FormDesigner } from './components/FormDesigner/FormDesigner';
import { FormRunner } from './components/FormDesigner/FormRunner';
import { QueryBuilder } from './components/QueryBuilder';
import { ReportViewer } from './components/ReportViewer';
import { ProgramEditor } from './components/ProgramEditor';
import { CommandWindow } from './components/CommandWindow';
import { DBFImportExportModal } from './components/DBFImportExportModal';
import { OSIntegrationModal } from './components/OSIntegrationModal';
import { DriveManagerModal } from './components/DriveManagerModal';

export type ActiveView =
  | 'project'
  | 'table_browse'
  | 'table_designer'
  | 'form_designer'
  | 'form_runner'
  | 'query_builder'
  | 'report_viewer'
  | 'program_editor';

export default function App() {
  // Load Project state from localStorage or initialize with sample
  const [project, setProject] = useState<VFPProject>(() => {
    const saved = localStorage.getItem('vfp_linux_project');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved project:', e);
      }
    }
    return sampleVFPProject;
  });

  // Active View State
  const [activeView, setActiveView] = useState<ActiveView>('table_browse');
  const [activeTableId, setActiveTableId] = useState<string>(
    project.database.tables[0]?.id || 'tbl_customers'
  );
  const [activeFormId, setActiveFormId] = useState<string>(
    project.forms[0]?.id || 'frm_customers'
  );
  const [activeQueryId, setActiveQueryId] = useState<string>(
    project.queries[0]?.id || 'qry_top_cust'
  );
  const [activeReportId, setActiveReportId] = useState<string>(
    project.reports[0]?.id || 'rpt_cust_directory'
  );
  const [activeProgramId, setActiveProgramId] = useState<string>(
    project.programs[0]?.id || 'prg_main'
  );

  // Command Window & Modals State
  const [isCommandWindowOpen, setIsCommandWindowOpen] = useState<boolean>(true);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState<boolean>(false);
  const [isDriveManagerOpen, setIsDriveManagerOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isOSModalOpen, setIsOSModalOpen] = useState<boolean>(false);
  const [isProjectExplorerOpen, setIsProjectExplorerOpen] = useState<boolean>(true);
  const [theme, setTheme] = useState<'vfp-classic' | 'linux-dark' | 'linux-light'>('linux-dark');

  // Update project-level drive, directory, and paths
  const handleUpdateProjectSettings = (settings: Partial<VFPProject>) => {
    setProject((prev) => ({
      ...prev,
      ...settings,
    }));
  };

  // Sync project to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vfp_linux_project', JSON.stringify(project));
    } catch (e) {
      console.error('Error saving project:', e);
    }
  }, [project]);

  // Derived active items
  const allTables = [...project.database.tables, ...project.freeTables];
  const activeTable = allTables.find((t) => t.id === activeTableId) || allTables[0] || null;
  const activeForm = project.forms.find((f) => f.id === activeFormId) || project.forms[0] || null;
  const activeQuery = project.queries.find((q) => q.id === activeQueryId) || project.queries[0] || null;
  const activeReport = project.reports.find((r) => r.id === activeReportId) || project.reports[0] || null;
  const activeProgram = project.programs.find((p) => p.id === activeProgramId) || project.programs[0] || null;

  // Handler: Update Table
  const handleUpdateTable = (updatedTable: DBFTable) => {
    setProject((prev) => {
      const inDb = prev.database.tables.some((t) => t.id === updatedTable.id);
      if (inDb) {
        return {
          ...prev,
          database: {
            ...prev.database,
            tables: prev.database.tables.map((t) => (t.id === updatedTable.id ? updatedTable : t)),
          },
        };
      } else {
        return {
          ...prev,
          freeTables: prev.freeTables.map((t) => (t.id === updatedTable.id ? updatedTable : t)),
        };
      }
    });
  };

  // Handler: Create New Table
  const handleCreateNewTable = () => {
    const newId = 'tbl_' + Math.random().toString(36).substr(2, 9);
    const newName = `TABLE_${allTables.length + 1}`;
    const newTable: DBFTable = {
      id: newId,
      name: newName,
      filename: `${newName.toLowerCase()}.dbf`,
      fields: [
        { name: 'ID', type: 'I', length: 6, decimals: 0, nullable: false, isPrimaryKey: true },
        { name: 'NAME', type: 'C', length: 35, decimals: 0, nullable: true },
        { name: 'CREATED', type: 'D', length: 8, decimals: 0, nullable: true },
      ],
      records: [
        { _recno: 1, _deleted: false, ID: 1, NAME: 'First Sample Record', CREATED: '2026-08-17' },
      ],
      indexes: [],
      lastModified: new Date().toISOString().split('T')[0],
    };

    setProject((prev) => ({
      ...prev,
      database: {
        ...prev.database,
        tables: [...prev.database.tables, newTable],
      },
    }));

    setActiveTableId(newId);
    setActiveView('table_designer');
  };

  // Handler: Create New Form
  const handleCreateNewForm = () => {
    const newId = 'frm_' + Math.random().toString(36).substr(2, 9);
    const newForm: FormDefinition = {
      id: newId,
      name: `frmScreen_${project.forms.length + 1}`,
      caption: `New Data Entry Form (${allTables[0]?.name || 'Table'})`,
      width: 640,
      height: 460,
      backColor: '#f8fafc',
      foreColor: '#0f172a',
      initialTableId: activeTableId || allTables[0]?.id,
      createdDate: new Date().toISOString().split('T')[0],
      controls: [
        {
          id: 'c1',
          name: 'lblTitle',
          type: 'label',
          left: 24,
          top: 20,
          width: 250,
          height: 24,
          caption: 'Data Entry Master Form',
          fontSize: 16,
          fontWeight: 'bold',
        },
        {
          id: 'c2',
          name: 'lblFld1',
          type: 'label',
          left: 24,
          top: 70,
          width: 100,
          height: 20,
          caption: `${activeTable?.fields[0]?.name || 'ID'}:`,
          fontWeight: '600',
        },
        {
          id: 'c3',
          name: 'txtFld1',
          type: 'textbox',
          left: 130,
          top: 66,
          width: 180,
          height: 32,
          controlSource: activeTable ? `${activeTable.name}.${activeTable.fields[0]?.name}` : '',
        },
        {
          id: 'c4',
          name: 'lblFld2',
          type: 'label',
          left: 24,
          top: 114,
          width: 100,
          height: 20,
          caption: `${activeTable?.fields[1]?.name || 'NAME'}:`,
        },
        {
          id: 'c5',
          name: 'txtFld2',
          type: 'textbox',
          left: 130,
          top: 110,
          width: 320,
          height: 32,
          controlSource: activeTable && activeTable.fields[1] ? `${activeTable.name}.${activeTable.fields[1]?.name}` : '',
        },
        {
          id: 'c6',
          name: 'vcrNav',
          type: 'navgroup',
          left: 24,
          top: 360,
          width: 580,
          height: 48,
        },
      ],
    };

    setProject((prev) => ({
      ...prev,
      forms: [...prev.forms, newForm],
    }));

    setActiveFormId(newId);
    setActiveView('form_designer');
  };

  // Handler: Create New Query
  const handleCreateNewQuery = () => {
    const newId = 'qry_' + Math.random().toString(36).substr(2, 9);
    const firstTable = activeTable || allTables[0];
    const newQuery: QueryDefinition = {
      id: newId,
      name: `QUERY_${project.queries.length + 1}.QPR`,
      description: 'Custom FoxPro query',
      tables: [{ tableId: firstTable?.id || 'tbl_customers', alias: firstTable?.name || 'CUST', x: 40, y: 30 }],
      joins: [],
      selectedFields: [],
      criteria: [],
      groupBy: [],
      orderBy: [],
    };

    setProject((prev) => ({
      ...prev,
      queries: [...prev.queries, newQuery],
    }));

    setActiveQueryId(newId);
    setActiveView('query_builder');
  };

  // Handler: Update Form
  const handleUpdateForm = (updatedForm: FormDefinition) => {
    setProject((prev) => ({
      ...prev,
      forms: prev.forms.map((f) => (f.id === updatedForm.id ? updatedForm : f)),
    }));
  };

  // Handler: Update Query
  const handleUpdateQuery = (updatedQuery: QueryDefinition) => {
    setProject((prev) => ({
      ...prev,
      queries: prev.queries.map((q) => (q.id === updatedQuery.id ? updatedQuery : q)),
    }));
  };

  // Handler: Update Program
  const handleUpdateProgram = (updatedPrg: VFPProgram) => {
    setProject((prev) => ({
      ...prev,
      programs: prev.programs.map((p) => (p.id === updatedPrg.id ? updatedPrg : p)),
    }));
  };

  // Handler: Add Imported Table
  const handleImportTable = (newTable: DBFTable) => {
    setProject((prev) => ({
      ...prev,
      database: {
        ...prev.database,
        tables: [...prev.database.tables, newTable],
      },
    }));
    setActiveTableId(newTable.id);
    setActiveView('table_browse');
  };

  // Theme container classes
  const themeClasses =
    theme === 'linux-dark'
      ? 'bg-[#0f172a] text-slate-100 dark'
      : theme === 'vfp-classic'
      ? 'bg-[#d4d0c8] text-black font-sans'
      : 'bg-slate-50 text-slate-900';

  return (
    <div id="foxstudio_linux_root" className={`h-screen w-screen flex flex-col overflow-hidden select-none font-sans ${themeClasses}`}>
      {/* Top Application Header & Menu Bar */}
      <Header
        project={project}
        activeView={activeView}
        onSelectView={setActiveView}
        activeTable={activeTable}
        onCreateTable={handleCreateNewTable}
        onCreateForm={handleCreateNewForm}
        onCreateQuery={handleCreateNewQuery}
        onOpenImportExport={() => setIsImportExportModalOpen(true)}
        onToggleCommandWindow={() => setIsCommandWindowOpen(!isCommandWindowOpen)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onOpenOSModal={() => setIsOSModalOpen(true)}
        onOpenDriveManager={() => setIsDriveManagerOpen(true)}
        theme={theme}
        onToggleTheme={(t) => setTheme(t)}
        onResetSampleData={() => {
          if (confirm('Reset project to default Northwind sample database?')) {
            setProject(sampleVFPProject);
            setActiveTableId(sampleVFPProject.database.tables[0].id);
            setActiveView('table_browse');
          }
        }}
        isProjectExplorerOpen={isProjectExplorerOpen}
        onToggleProjectExplorer={() => setIsProjectExplorerOpen(!isProjectExplorerOpen)}
      />

      {/* Main Workspace (Project Explorer + Active Document Area) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: FoxPro Project Explorer (.PJX) */}
        {isProjectExplorerOpen && (
          <div className="w-64 flex-shrink-0 flex flex-col border-r border-slate-300 dark:border-neutral-800">
            <ProjectExplorer
              project={project}
              activeTable={activeTable}
              setActiveTable={(t) => {
                setActiveTableId(t.id);
                setActiveView('table_browse');
              }}
              activeForm={activeForm}
              setActiveForm={(f) => {
                setActiveFormId(f.id);
                setActiveView('form_designer');
              }}
              activeQuery={activeQuery}
              setActiveQuery={(q) => {
                setActiveQueryId(q.id);
                setActiveView('query_builder');
              }}
              activeReport={activeReport}
              setActiveReport={(r) => {
                setActiveReportId(r.id);
                setActiveView('report_viewer');
              }}
              onModifyStructure={(t) => {
                setActiveTableId(t.id);
                setActiveView('table_designer');
              }}
              onBrowseTable={(t) => {
                setActiveTableId(t.id);
                setActiveView('table_browse');
              }}
              onDesignForm={(f) => {
                setActiveFormId(f.id);
                setActiveView('form_designer');
              }}
              onRunForm={(f) => {
                setActiveFormId(f.id);
                setActiveView('form_runner');
              }}
              onDesignQuery={(q) => {
                setActiveQueryId(q.id);
                setActiveView('query_builder');
              }}
              onDesignReport={(r) => {
                setActiveReportId(r.id);
                setActiveView('report_viewer');
              }}
              onNewTable={handleCreateNewTable}
              onNewForm={handleCreateNewForm}
              onNewQuery={handleCreateNewQuery}
              onNewReport={() => {
                alert('Report creation: You can view and preview existing report templates in the Report Preview tab.');
              }}
              onDeleteTable={(id) => {
                setProject((prev) => ({
                  ...prev,
                  database: {
                    ...prev.database,
                    tables: prev.database.tables.filter((t) => t.id !== id),
                  },
                  freeTables: prev.freeTables.filter((t) => t.id !== id),
                }));
              }}
              onDeleteForm={(id) => {
                setProject((prev) => ({
                  ...prev,
                  forms: prev.forms.filter((f) => f.id !== id),
                }));
              }}
              onDeleteQuery={(id) => {
                setProject((prev) => ({
                  ...prev,
                  queries: prev.queries.filter((q) => q.id !== id),
                }));
              }}
              onDeleteReport={(id) => {
                setProject((prev) => ({
                  ...prev,
                  reports: prev.reports.filter((r) => r.id !== id),
                }));
              }}
              onExportDbf={(t) => {
                setActiveTableId(t.id);
                setIsImportExportModalOpen(true);
              }}
              onOpenDriveManager={() => setIsDriveManagerOpen(true)}
              theme={theme}
            />
          </div>
        )}

        {/* Center: Active Document / Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#121212] relative">
          {/* VIEW: Table Browser (BROWSE) */}
          {activeView === 'table_browse' && activeTable && (
            <TableBrowser
              table={activeTable}
              onUpdateTable={handleUpdateTable}
              onOpenTableDesigner={() => setActiveView('table_designer')}
              onOpenForm={() => {
                if (project.forms.length > 0) {
                  setActiveFormId(project.forms[0].id);
                  setActiveView('form_runner');
                } else {
                  handleCreateNewForm();
                }
              }}
              onExportDBF={() => setIsImportExportModalOpen(true)}
              theme={theme}
            />
          )}

          {/* VIEW: Table Schema Designer (MODIFY STRUCTURE) */}
          {activeView === 'table_designer' && activeTable && (
            <TableDesigner
              table={activeTable}
              onSaveTable={(updated) => {
                handleUpdateTable(updated);
                setActiveView('table_browse');
              }}
              onCancel={() => setActiveView('table_browse')}
              theme={theme}
            />
          )}

          {/* VIEW: Form Designer (MODIFY FORM) */}
          {activeView === 'form_designer' && activeForm && (
            <FormDesigner
              form={activeForm}
              onSaveForm={handleUpdateForm}
              onClose={() => setActiveView('table_browse')}
              allTables={allTables}
              onUpdateTable={handleUpdateTable}
              queries={project.queries}
              onRunQuery={(qId) => {
                setActiveQueryId(qId);
                setActiveView('query_builder');
              }}
              theme={theme}
            />
          )}

          {/* VIEW: Form Runner (DO FORM) */}
          {activeView === 'form_runner' && activeForm && (
            <FormRunner
              form={activeForm}
              tables={allTables}
              onUpdateTable={handleUpdateTable}
              onClose={() => setActiveView('table_browse')}
              onEditDesign={() => setActiveView('form_designer')}
              queries={project.queries}
              onRunQuery={(qId) => {
                setActiveQueryId(qId);
                setActiveView('query_builder');
              }}
              theme={theme}
            />
          )}

          {/* VIEW: Query Designer (MODIFY QUERY) */}
          {activeView === 'query_builder' && activeQuery && (
            <QueryBuilder
              query={activeQuery}
              tables={allTables}
              onSaveQuery={handleUpdateQuery}
              onClose={() => setActiveView('table_browse')}
              theme={theme}
            />
          )}

          {/* VIEW: Report Viewer (REPORT FORM ... PREVIEW) */}
          {activeView === 'report_viewer' && activeReport && (
            <ReportViewer
              report={activeReport}
              tables={allTables}
              onClose={() => setActiveView('table_browse')}
              theme={theme}
            />
          )}

          {/* VIEW: Program Editor (MODIFY COMMAND) */}
          {activeView === 'program_editor' && activeProgram && (
            <ProgramEditor
              program={activeProgram}
              project={project}
              onSaveProgram={handleUpdateProgram}
              onClose={() => setActiveView('table_browse')}
              onUpdateProject={setProject}
              theme={theme}
            />
          )}

          {/* Fallback Empty State */}
          {!activeTable && allTables.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <Database className="w-16 h-16 text-orange-500 mb-4 stroke-1" />
              <h3 className="text-base font-bold">No Tables in Active Database</h3>
              <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
                Import an existing .DBF file from your Linux system or create a new table to start designing forms and queries.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleCreateNewTable}
                  className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
                >
                  Create New Table
                </button>
                <button
                  onClick={() => setIsImportExportModalOpen(true)}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                >
                  Import .DBF / .CSV
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Panel: Interactive FoxPro Command Window */}
      <CommandWindow
        project={project}
        activeTable={activeTable}
        onUpdateProject={setProject}
        onSelectTable={(id) => {
          setActiveTableId(id);
          setActiveView('table_browse');
        }}
        onOpenTableDesigner={(id) => {
          setActiveTableId(id);
          setActiveView('table_designer');
        }}
        onOpenFormDesigner={(id) => {
          setActiveFormId(id);
          setActiveView('form_designer');
        }}
        onRunForm={(id) => {
          setActiveFormId(id);
          setActiveView('form_runner');
        }}
        onOpenQueryBuilder={(id) => {
          setActiveQueryId(id);
          setActiveView('query_builder');
        }}
        onOpenImport={() => setIsImportExportModalOpen(true)}
        onOpenDriveManager={() => setIsDriveManagerOpen(true)}
        onImportTable={handleImportTable}
        isOpen={isCommandWindowOpen}
        onToggleOpen={() => setIsCommandWindowOpen(!isCommandWindowOpen)}
        theme={theme}
      />

      {/* DBF Import / Export Modal */}
      {isImportExportModalOpen && (
        <DBFImportExportModal
          table={activeTable}
          onImportTable={handleImportTable}
          onClose={() => setIsImportExportModalOpen(false)}
          theme={theme}
        />
      )}

      {/* OS Integration & Cross-Platform Modal */}
      <OSIntegrationModal
        isOpen={isOSModalOpen}
        onClose={() => setIsOSModalOpen(false)}
        theme={theme}
      />

      {/* VFP Virtual Drive & Directory Manager (SET DEFAULT TO) */}
      <DriveManagerModal
        isOpen={isDriveManagerOpen}
        onClose={() => setIsDriveManagerOpen(false)}
        project={project}
        onUpdateProjectSettings={handleUpdateProjectSettings}
        onUpdateProject={setProject}
        onImportTable={handleImportTable}
        onSelectTable={(tableId) => {
          setActiveTableId(tableId);
          setActiveView('table_browse');
        }}
        theme={theme}
      />

      {/* FoxStudio Universal Help & Documentation Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-slate-300 dark:border-neutral-700 p-6 space-y-4 text-xs overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-base text-slate-800 dark:text-neutral-100">
                  FoxStudio - Visual FoxPro Universal Web Guide
                </h3>
              </div>
              <button onClick={() => setIsHelpModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-slate-600 dark:text-neutral-300 leading-relaxed font-sans">
              <p>
                <strong>FoxStudio</strong> is a universal, Visual FoxPro 9.0 compatible development and database management suite accessible in any modern web browser across Linux, macOS, Windows, iPad, and mobile devices.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 dark:bg-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-700">
                  <h4 className="font-bold text-slate-800 dark:text-neutral-200 mb-1 flex items-center space-x-1.5">
                    <Database className="w-3.5 h-3.5 text-orange-500" />
                    <span>DBF Database Engine</span>
                  </h4>
                  <ul className="space-y-1 text-[11px]">
                    <li>• Binary .DBF & Memo (.FPT) parser/generator</li>
                    <li>• Modify Table Structure with live migration</li>
                    <li>• Data Grid Browser with PACK, ZAP, REINDEX</li>
                    <li>• Export to DBF, CSV, and PostgreSQL / SQLite</li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-700">
                  <h4 className="font-bold text-slate-800 dark:text-neutral-200 mb-1 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    <span>Visual Form Designer (SCX)</span>
                  </h4>
                  <ul className="space-y-1 text-[11px]">
                    <li>• Drag-and-drop visual canvas with 8px snap</li>
                    <li>• Two-way <code>ControlSource</code> data binding</li>
                    <li>• FoxPro Property Inspector & Method Code Editor</li>
                    <li>• Export to standalone Linux Web & Python App</li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-700">
                  <h4 className="font-bold text-slate-800 dark:text-neutral-200 mb-1 flex items-center space-x-1.5">
                    <Search className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Query Designer (QPR)</span>
                  </h4>
                  <ul className="space-y-1 text-[11px]">
                    <li>• Multi-table visual relationship joins</li>
                    <li>• WHERE filters, ORDER BY, GROUP BY</li>
                    <li>• Synchronized ANSI / FoxPro SQL editor</li>
                    <li>• Direct output to cursors and CSV exports</li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-700">
                  <h4 className="font-bold text-slate-800 dark:text-neutral-200 mb-1 flex items-center space-x-1.5">
                    <Terminal className="w-3.5 h-3.5 text-purple-500" />
                    <span>Interactive Command Window</span>
                  </h4>
                  <ul className="space-y-1 text-[11px]">
                    <li>• Real-time xBase command interpreter</li>
                    <li>• Supports USE, BROWSE, DO FORM, SELECT, etc.</li>
                    <li>• Command history with arrow key navigation</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="px-4 py-1.5 rounded bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
