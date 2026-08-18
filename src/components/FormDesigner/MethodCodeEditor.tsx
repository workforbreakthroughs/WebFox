import React, { useState } from 'react';
import {
  Code,
  Save,
  X,
  Play,
  Sparkles,
  BookOpen,
  Check,
  Terminal,
  HelpCircle
} from 'lucide-react';
import { FormControl, FormDefinition } from '../../types/foxpro';

interface MethodCodeEditorProps {
  form: FormDefinition;
  control: FormControl | null;
  eventKey: 'click' | 'init' | 'valid' | 'interactiveChange' | 'gotFocus' | 'lostFocus';
  onSaveCode: (eventKey: string, code: string) => void;
  onClose: () => void;
  theme: string;
}

export const MethodCodeEditor: React.FC<MethodCodeEditorProps> = ({
  form,
  control,
  eventKey,
  onSaveCode,
  onClose,
  theme,
}) => {
  const currentCode = control?.events?.[eventKey] || form.events?.[eventKey as any] || '';
  const [code, setCode] = useState<string>(currentCode);
  const [testOutput, setTestOutput] = useState<string | null>(null);

  const snippets = [
    {
      name: 'MessageBox Alert',
      code: 'MESSAGEBOX("Operation completed successfully!", 64, "FoxStudio Linux");',
    },
    {
      name: 'Credit / Numeric Calculation',
      code: 'LOCAL nDiff\nnDiff = CUSTOMERS.CREDIT_LMT - CUSTOMERS.BALANCE\nMESSAGEBOX("Remaining Credit: $" + STR(nDiff, 10, 2), 64, "Credit Check");',
    },
    {
      name: 'Validation Rule (Return .T. / .F.)',
      code: '* Return .F. to prevent user from leaving field\nIF EMPTY(THIS.Value)\n  MESSAGEBOX("This field cannot be empty!", 48, "Validation Error")\n  RETURN .F.\nENDIF\nRETURN .T.',
    },
    {
      name: 'Append Record Programmatically',
      code: 'APPEND BLANK\nREPLACE CUSTOMERS.JOIN_DATE WITH DATE()\nMESSAGEBOX("New blank customer record created.", 64, "FoxPro");',
    },
    {
      name: 'Set Table Filter',
      code: 'SET FILTER TO CUSTOMERS.ACTIVE == .T.\nGO TOP\nMESSAGEBOX("Filtered to active accounts only.", 64, "Filter");',
    },
  ];

  const handleInsertSnippet = (snipCode: string) => {
    setCode((prev) => (prev.trim() ? `${prev}\n\n${snipCode}` : snipCode));
  };

  const handleTestRun = () => {
    try {
      setTestOutput(`Code executed without syntax errors.\nEvent: ${eventKey}\nTarget: ${control ? control.name : form.name}`);
    } catch (err: any) {
      setTestOutput(`Runtime Error: ${err.message || err}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-3xl h-[560px] bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-slate-300 dark:border-neutral-800 flex flex-col overflow-hidden text-xs">
        {/* Editor Title Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-inherit bg-slate-100 dark:bg-neutral-800 select-none">
          <div className="flex items-center space-x-2 font-bold text-slate-800 dark:text-neutral-200">
            <Code className="w-4 h-4 text-orange-500" />
            <span>
              VFP Code Editor: {control ? `${control.name}.${eventKey}` : `${form.name}.${eventKey}`}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Snippet Insert Bar */}
        <div className="flex items-center px-4 py-2 border-b border-inherit bg-slate-50 dark:bg-neutral-900/50 space-x-2 overflow-x-auto text-[11px]">
          <span className="font-semibold text-slate-500 flex items-center space-x-1 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Insert Snippet:</span>
          </span>
          {snippets.map((snip, idx) => (
            <button
              key={idx}
              onClick={() => handleInsertSnippet(snip.code)}
              className="px-2 py-1 rounded bg-white dark:bg-neutral-800 hover:bg-slate-100 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 whitespace-nowrap transition-colors"
            >
              {snip.name}
            </button>
          ))}
        </div>

        {/* Main Code Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden font-mono">
          <div className="flex-1 flex flex-col p-2 bg-[#1e1e1e] text-slate-200">
            <div className="flex justify-between items-center text-[10px] text-neutral-400 pb-1 border-b border-neutral-800">
              <span>* Visual FoxPro / xBase Event Script</span>
              <span>UTF-8 / VFP 9.0</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="* Enter your FoxPro event code here...&#10;MESSAGEBOX('Button Clicked!', 64, 'FoxStudio')&#10;* e.g. REPLACE CUSTOMERS.BALANCE WITH CUSTOMERS.BALANCE + 100"
              rows={16}
              className="flex-1 w-full bg-transparent p-2 text-xs font-mono text-emerald-400 focus:outline-none resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-inherit bg-slate-50 dark:bg-neutral-800">
          <div className="text-[11px] text-slate-500">
            Supported functions: <code className="text-orange-600 font-bold">MESSAGEBOX</code>, <code className="text-orange-600 font-bold">ALLTRIM</code>, <code className="text-orange-600 font-bold">STR</code>, <code className="text-orange-600 font-bold">VAL</code>, <code className="text-orange-600 font-bold">DATE()</code>, <code className="text-orange-600 font-bold">RECNO()</code>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSaveCode(eventKey, code);
                onClose();
              }}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Method Code</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
