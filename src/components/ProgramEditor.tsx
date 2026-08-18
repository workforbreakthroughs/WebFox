import React, { useState } from 'react';
import {
  FileCode,
  Play,
  Save,
  Trash2,
  Sparkles,
  Terminal,
  X,
  CheckCircle,
  Copy,
  BookOpen
} from 'lucide-react';
import { DBFTable, VFPProgram, VFPProject } from '../types/foxpro';
import { VFPCommandInterpreter } from '../services/commandInterpreter';

interface ProgramEditorProps {
  program: VFPProgram;
  project: VFPProject;
  onSaveProgram: (updatedProgram: VFPProgram) => void;
  onClose: () => void;
  onUpdateProject: (updatedProject: VFPProject) => void;
  theme: string;
}

export const ProgramEditor: React.FC<ProgramEditorProps> = ({
  program,
  project,
  onSaveProgram,
  onClose,
  onUpdateProject,
  theme,
}) => {
  const [prgName, setPrgName] = useState<string>(program.name);
  const [code, setCode] = useState<string>(program.code);
  const [executionOutput, setExecutionOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const sampleSnippets = [
    {
      name: 'Loop All Records (SCAN...ENDSCAN)',
      snippet: `* Scan table records and calculate\nUSE CUSTOMERS.DBF\nSCAN\n  IF BALANCE > 1000\n    ? "High balance: " + ALLTRIM(COMPANY) + " ($" + STR(BALANCE, 10, 2) + ")"\n  ENDIF\nENDSCAN`,
    },
    {
      name: 'Update / REPLACE Batch',
      snippet: `* Bulk update customer credit limit\nUSE CUSTOMERS.DBF\nREPLACE ALL CREDIT_LMT WITH CREDIT_LMT * 1.10 FOR ACTIVE == .T.\n? "Updated credit limits by 10% for active accounts."`,
    },
    {
      name: 'SQL Aggregation to Cursor',
      snippet: `* Query sum of sales by country\nSELECT COUNTRY, COUNT(*) as CUSTOMER_COUNT, SUM(BALANCE) as TOTAL_DEBT ;\n  FROM CUSTOMERS ;\n  GROUP BY COUNTRY ;\n  ORDER BY TOTAL_DEBT DESC ;\n  INTO CURSOR cur_summary\nBROWSE`,
    },
  ];

  const handleSave = () => {
    onSaveProgram({
      ...program,
      name: prgName.toUpperCase(),
      code,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleRunProgram = () => {
    setIsRunning(true);
    const logs: string[] = [];
    logs.push(`=== Executing ${prgName} ===`);

    const lines = code.split('\n');
    let currentProject = { ...project };
    let currentTable = project.database.tables[0] || null;

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();
      if (!line || line.startsWith('*')) return;

      if (line.startsWith('?')) {
        const expr = line.substring(1).trim();
        logs.push(`Output: ${expr.replace(/^["']|["']$/g, '')}`);
      } else {
        const context = {
          project: currentProject,
          activeTableId: currentTable?.id || null,
          activeRecno: 1,
          memoryVars: {},
          onOpenTable: () => {},
          onOpenForm: () => {},
          onModifyStructure: () => {},
          onBrowse: () => {},
          onUpdateTable: (t: DBFTable) => {
            currentTable = t;
          },
        };
        const res = VFPCommandInterpreter.execute(line, context);
        if (res.updatedTable) {
          currentTable = res.updatedTable;
        }
        if (res.log.success && res.log.message) {
          logs.push(`> [L${idx + 1}] ${res.log.message}`);
        } else if (!res.log.success) {
          logs.push(`! [L${idx + 1} Error] ${res.log.message}`);
        }
      }
    });

    logs.push(`=== Finished execution at ${new Date().toLocaleTimeString()} ===`);
    setExecutionOutput(logs);
    onUpdateProject(currentProject);
    setIsRunning(false);
  };

  return (
    <div id="vfp_program_editor" className="flex flex-col h-full bg-inherit select-none text-xs">
      {/* Title Bar */}
      <div className={`flex items-center justify-between px-4 py-2 border-b font-bold ${
        theme === 'vfp-classic' ? 'bg-[#000080] text-white' : 'bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200'
      }`}>
        <div className="flex items-center space-x-2">
          <FileCode className="w-4 h-4 text-orange-500" />
          <span>FoxPro Program Editor (MODIFY COMMAND) - {prgName}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={onClose} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-inherit border border-white/20">
            Close
          </button>
          <button
            onClick={handleSave}
            className="px-3.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center space-x-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save (Ctrl+S)</span>
          </button>
          <button
            id="btn_run_program"
            onClick={handleRunProgram}
            disabled={isRunning}
            className="px-4 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1.5 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Script (DO {prgName})</span>
          </button>
        </div>
      </div>

      {/* Program Name & Quick Snippets */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-inherit bg-slate-50 dark:bg-neutral-900 text-xs">
        <div className="flex items-center space-x-2">
          <label className="font-bold text-slate-700 dark:text-neutral-300">Program File:</label>
          <input
            type="text"
            value={prgName}
            onChange={(e) => setPrgName(e.target.value.toUpperCase())}
            className="px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono font-bold uppercase"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto text-[11px]">
          <span className="font-semibold text-slate-500 flex items-center space-x-1 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Insert Pattern:</span>
          </span>
          {sampleSnippets.map((snip, idx) => (
            <button
              key={idx}
              onClick={() => setCode((prev) => `${prev}\n\n${snip.snippet}`)}
              className="px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:bg-slate-100 text-slate-700 dark:text-neutral-300 whitespace-nowrap"
            >
              {snip.name}
            </button>
          ))}
        </div>
      </div>

      {/* Editor & Console Split Screen */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden font-mono">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col p-3 bg-[#1e1e1e] text-slate-200">
          <div className="flex justify-between items-center text-[10px] text-neutral-400 pb-1 border-b border-neutral-800">
            <span>* FoxPro Procedure Code / xBase Script</span>
            <span>Lines: {code.split('\n').length}</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 w-full bg-transparent p-2 text-xs font-mono text-emerald-400 focus:outline-none resize-none leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Execution Output Panel */}
        {executionOutput.length > 0 && (
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-neutral-800 bg-[#141414] p-3 flex flex-col text-[11px]">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-neutral-400 font-sans font-bold">
              <span className="flex items-center space-x-1">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Execution Output</span>
              </span>
              <button onClick={() => setExecutionOutput([])} className="hover:text-rose-400 text-[10px]">
                Clear
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pt-2 font-mono text-neutral-300">
              {executionOutput.map((out, idx) => (
                <div key={idx} className={out.startsWith('!') ? 'text-rose-400 font-bold' : out.startsWith('>') ? 'text-emerald-400' : 'text-slate-400'}>
                  {out}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="absolute bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 text-xs font-semibold z-50">
          <CheckCircle className="w-4 h-4" />
          <span>Program script saved!</span>
        </div>
      )}
    </div>
  );
};
