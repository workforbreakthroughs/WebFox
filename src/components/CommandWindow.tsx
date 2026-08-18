import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Play,
  Trash2,
  ChevronRight,
  History,
  Sparkles,
  Maximize2,
  Minimize2,
  HelpCircle,
  X
} from 'lucide-react';
import { DBFTable, VFPProject } from '../types/foxpro';
import { VFPCommandInterpreter } from '../services/commandInterpreter';

interface CommandWindowProps {
  project: VFPProject;
  activeTable: DBFTable | null;
  onUpdateProject: (updatedProject: VFPProject) => void;
  onSelectTable: (tableId: string) => void;
  onOpenTableDesigner: (tableId: string) => void;
  onOpenFormDesigner: (formId: string) => void;
  onRunForm: (formId: string) => void;
  onOpenQueryBuilder: (queryId: string) => void;
  onOpenImport?: () => void;
  onOpenDriveManager?: () => void;
  onImportTable?: (table: DBFTable) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  theme: string;
}

export const CommandWindow: React.FC<CommandWindowProps> = ({
  project,
  activeTable,
  onUpdateProject,
  onSelectTable,
  onOpenTableDesigner,
  onOpenFormDesigner,
  onRunForm,
  onOpenQueryBuilder,
  onOpenImport,
  onOpenDriveManager,
  onImportTable,
  isOpen,
  onToggleOpen,
  theme,
}) => {
  const [inputCommand, setInputCommand] = useState<string>('');
  const [history, setHistory] = useState<string[]>([
    'USE CUSTOMERS.DBF',
    'BROWSE',
    'SELECT * FROM CUSTOMERS WHERE BALANCE > 1000',
    'DO FORM frm_customers',
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [outputLogs, setOutputLogs] = useState<{ id: string; type: 'cmd' | 'info' | 'error' | 'success'; text: string; time: string }[]>([
    {
      id: '1',
      type: 'info',
      text: 'FoxStudio Linux Command Environment (xBase / VFP 9.0 ANSI compatible)\nType HELP for available commands.',
      time: new Date().toLocaleTimeString(),
    },
  ]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputLogs]);

  // Execute Command
  const handleExecute = (cmdToRun?: string) => {
    const rawCmd = (cmdToRun !== undefined ? cmdToRun : inputCommand).trim();
    if (!rawCmd) return;

    // Add to history
    if (!history.includes(rawCmd)) {
      setHistory((prev) => [...prev, rawCmd]);
    }
    setHistoryIndex(-1);

    const now = new Date().toLocaleTimeString();

    // Log the command
    setOutputLogs((prev) => [
      ...prev,
      { id: Math.random().toString(), type: 'cmd', text: `> ${rawCmd}`, time: now },
    ]);

    // Handle CLEAR
    if (rawCmd.toUpperCase() === 'CLEAR') {
      setOutputLogs([]);
      setInputCommand('');
      return;
    }

    // Execute through interpreter
    const context = {
      project,
      activeTableId: activeTable?.id || null,
      activeRecno: 1,
      memoryVars: {},
      onOpenTable: (tableId: string) => onSelectTable(tableId),
      onOpenForm: (formId: string, runMode?: boolean) => {
        if (runMode) onRunForm(formId);
        else onOpenFormDesigner(formId);
      },
      onModifyStructure: (tableId: string) => onOpenTableDesigner(tableId),
      onBrowse: (tableId: string) => onSelectTable(tableId),
      onUpdateTable: (t: DBFTable) => {
        const inDb = project.database.tables.some((tbl) => tbl.id === t.id);
        if (inDb) {
          onUpdateProject({
            ...project,
            database: {
              ...project.database,
              tables: project.database.tables.map((tbl) => (tbl.id === t.id ? t : tbl)),
            },
          });
        }
      },
      onImportTable: (t: DBFTable) => {
        if (onImportTable) {
          onImportTable(t);
        } else {
          onUpdateProject({
            ...project,
            database: {
              ...project.database,
              tables: [...project.database.tables, t],
            },
          });
        }
      },
      onOpenImport: () => {
        if (onOpenImport) onOpenImport();
      },
      onOpenDriveManager: () => {
        if (onOpenDriveManager) onOpenDriveManager();
      },
      onSetDefault: (path: string) => {
        const driveMatch = /^([A-Za-z]:)/.exec(path);
        const drive = driveMatch ? driveMatch[1].toUpperCase() : project.defaultDrive || 'X:';
        onUpdateProject({
          ...project,
          defaultDrive: drive,
          currentDirectory: path,
        });
      },
      onSetPath: (paths: string) => {
        onUpdateProject({
          ...project,
          searchPath: paths,
        });
      },
    };

    const result = VFPCommandInterpreter.execute(rawCmd, context);

    if (result.newDefaultDrive || result.newCurrentDirectory || result.newSearchPath) {
      onUpdateProject({
        ...project,
        ...(result.newDefaultDrive ? { defaultDrive: result.newDefaultDrive } : {}),
        ...(result.newCurrentDirectory ? { currentDirectory: result.newCurrentDirectory } : {}),
        ...(result.newSearchPath ? { searchPath: result.newSearchPath } : {}),
      });
    }

    if (result.updatedTable) {
      context.onUpdateTable(result.updatedTable);
    }
    if (result.newActiveTableId) {
      onSelectTable(result.newActiveTableId);
    }

    if (result.log.success) {
      setOutputLogs((prev) => [
        ...prev,
        { id: Math.random().toString(), type: 'success', text: result.log.message, time: now },
      ]);
    } else {
      setOutputLogs((prev) => [
        ...prev,
        { id: Math.random().toString(), type: 'error', text: result.log.message, time: now },
      ]);
    }

    setInputCommand('');
  };

  // Keyboard navigation for command history
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleExecute();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputCommand(history[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= history.length) {
        setHistoryIndex(-1);
        setInputCommand('');
      } else {
        setHistoryIndex(nextIdx);
        setInputCommand(history[nextIdx]);
      }
    }
  };

  if (!isOpen) {
    return (
      <button
        id="btn_open_command_window"
        onClick={onToggleOpen}
        className="fixed bottom-3 right-4 z-40 flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-emerald-400 border border-slate-700 shadow-xl hover:bg-slate-800 text-xs font-mono font-bold transition-all"
        title="Open FoxPro Interactive Command Window"
      >
        <Terminal className="w-3.5 h-3.5" />
        <span>Command Window</span>
      </button>
    );
  }

  return (
    <div
      id="vfp_command_window"
      style={{ height: isExpanded ? '480px' : '220px' }}
      className={`border-t border-slate-300 dark:border-neutral-800 flex flex-col font-mono text-xs select-none transition-all ${
        theme === 'vfp-classic' ? 'bg-[#d4d0c8]' : 'bg-slate-900 text-slate-200'
      }`}
    >
      {/* Title Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#000080] text-white text-xs font-bold select-none">
        <div className="flex items-center space-x-1.5 truncate">
          <Terminal className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="truncate">Command - FoxPro Interactive Window</span>
          <span className="text-[10px] bg-orange-500/30 text-orange-200 border border-orange-400/30 px-1.5 py-0.2 rounded font-mono font-bold flex-shrink-0">
            {project.defaultDrive || 'X:'}
          </span>
          {activeTable && (
            <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono hidden sm:inline truncate">
              Workarea: {activeTable.name} ({activeTable.records.length} recs)
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleExecute('SET DEFAULT TO X:\\VFP_DATA')}
            className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] hidden md:inline font-mono"
            title="SET DEFAULT TO X:\VFP_DATA"
          >
            SET DEFA X:
          </button>
          <button
            onClick={() => handleExecute('DIR')}
            className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] hidden md:inline font-mono"
            title="List files on drive"
          >
            DIR
          </button>
          <button
            onClick={() => handleExecute('? SYS(5)')}
            className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] hidden lg:inline font-mono"
            title="Display active drive"
          >
            ? SYS(5)
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-white/20 text-white"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onToggleOpen}
            className="p-1 rounded hover:bg-rose-600 text-white"
            title="Close Command Window"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Body: Output Logs + Command History Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Output Console */}
        <div className="flex-1 p-2 overflow-y-auto space-y-1 bg-[#1e1e1e] text-slate-300 font-mono text-xs">
          {outputLogs.map((log) => (
            <div
              key={log.id}
              className={`leading-relaxed whitespace-pre-wrap ${
                log.type === 'cmd'
                  ? 'text-amber-300 font-bold'
                  : log.type === 'error'
                  ? 'text-rose-400 font-semibold'
                  : log.type === 'success'
                  ? 'text-emerald-400'
                  : 'text-slate-400'
              }`}
            >
              {log.text}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>

        {/* History Sidebar */}
        <div className="w-64 border-l border-neutral-800 bg-[#181818] p-2 flex flex-col hidden sm:flex text-[11px]">
          <div className="flex items-center justify-between pb-1 mb-1 border-b border-neutral-800 text-neutral-400 font-sans font-bold">
            <span className="flex items-center space-x-1">
              <History className="w-3 h-3 text-orange-500" />
              <span>Command History</span>
            </span>
            <button
              onClick={() => setHistory([])}
              className="text-[10px] hover:text-rose-400"
              title="Clear History"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 font-mono">
            {history.map((hCmd, i) => (
              <button
                key={i}
                onClick={() => {
                  setInputCommand(hCmd);
                  handleExecute(hCmd);
                }}
                className="w-full text-left p-1 rounded hover:bg-neutral-800 text-neutral-300 truncate transition-colors"
                title={`Click to re-run: ${hCmd}`}
              >
                &gt; {hCmd}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Command Input Bar */}
      <div className="p-2 border-t border-neutral-800 bg-[#121212] flex items-center space-x-2">
        <ChevronRight className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-pulse" />
        <input
          id="inp_vfp_command"
          ref={inputRef}
          type="text"
          value={inputCommand}
          onChange={(e) => setInputCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter VFP command (e.g. USE CUSTOMERS, BROWSE, DO FORM frm_customers, SELECT * FROM ...)"
          className="flex-1 bg-transparent text-emerald-400 font-mono text-xs focus:outline-none placeholder:text-neutral-600"
          autoFocus
        />
        <button
          id="btn_run_command_line"
          onClick={() => handleExecute()}
          className="px-3 py-1 rounded bg-orange-600 hover:bg-orange-700 text-white font-bold font-sans text-xs flex items-center space-x-1 shadow-sm"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Execute</span>
        </button>
      </div>
    </div>
  );
};
