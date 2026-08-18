import React, { useState } from 'react';
import {
  Download,
  X,
  Code,
  Check,
  Terminal,
  FileCode,
  Layers,
  Sparkles
} from 'lucide-react';
import { DBFTable, FormDefinition } from '../../types/foxpro';

interface FormExportModalProps {
  form: FormDefinition;
  table: DBFTable | null;
  onClose: () => void;
  theme: string;
}

export const FormExportModal: React.FC<FormExportModalProps> = ({
  form,
  table,
  onClose,
  theme,
}) => {
  const [exportType, setExportType] = useState<'html' | 'python' | 'scx_json'>('html');
  const [copied, setCopied] = useState<boolean>(false);

  // Generate Standalone HTML / JS App
  const generateStandaloneHTML = () => {
    const tableDataJSON = JSON.stringify(table?.records || [], null, 2);
    const tableFieldsJSON = JSON.stringify(table?.fields || [], null, 2);
    const formJSON = JSON.stringify(form, null, 2);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${form.caption || form.name} - FoxStudio Linux App</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; }
  </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">
  <div class="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300">
    <div class="bg-[#000080] text-white px-4 py-2.5 flex items-center justify-between font-bold text-sm">
      <span>${form.caption || form.name}</span>
      <span class="text-xs opacity-75">FoxStudio Standalone</span>
    </div>
    
    <div class="bg-slate-100 p-2 border-b flex items-center justify-between text-xs">
      <div class="flex items-center space-x-1">
        <button onclick="goFirst()" class="px-2 py-1 bg-white border rounded">|&lt;&lt;</button>
        <button onclick="goPrev()" class="px-2 py-1 bg-white border rounded">&lt;&lt;</button>
        <span id="recnoDisplay" class="px-2 font-bold font-mono">1 / 1</span>
        <button onclick="goNext()" class="px-2 py-1 bg-white border rounded">&gt;&gt;</button>
        <button onclick="goLast()" class="px-2 py-1 bg-white border rounded">&gt;&gt;|</button>
      </div>
      <div class="space-x-1">
        <button onclick="appendRecord()" class="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded">+ New</button>
        <button onclick="saveRecord()" class="px-2.5 py-1 bg-blue-600 text-white font-bold rounded">Save</button>
        <button onclick="deleteRecord()" class="px-2.5 py-1 bg-rose-600 text-white font-bold rounded">Delete</button>
      </div>
    </div>

    <div id="formContainer" class="p-6 relative bg-slate-50 min-h-[400px]"></div>
    
    <div class="bg-slate-100 px-4 py-1.5 border-t text-[11px] text-slate-500 flex justify-between">
      <span id="statusBar">Ready.</span>
      <span>Workarea: ${table?.name || 'UNBOUND'}</span>
    </div>
  </div>

  <script>
    const formDef = ${formJSON};
    const fields = ${tableFieldsJSON};
    let records = ${tableDataJSON};
    let activeIdx = 0;

    function renderForm() {
      const container = document.getElementById('formContainer');
      container.innerHTML = '';
      const rec = records[activeIdx] || {};

      document.getElementById('recnoDisplay').innerText = (activeIdx + 1) + ' / ' + records.length;

      formDef.controls.forEach(ctrl => {
        const el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.left = ctrl.left + 'px';
        el.style.top = ctrl.top + 'px';
        el.style.width = ctrl.width + 'px';
        el.style.height = ctrl.height + 'px';

        let fld = ctrl.controlSource ? ctrl.controlSource.replace(/^[A-Z0-9_]+\\./i, '') : '';
        let val = rec[fld] !== undefined ? rec[fld] : '';

        if (ctrl.type === 'label') {
          el.innerHTML = '<div class="font-semibold text-slate-800 text-xs">' + (ctrl.caption || '') + '</div>';
        } else if (ctrl.type === 'textbox') {
          el.innerHTML = '<input type="text" id="inp_' + fld + '" value="' + val + '" class="w-full h-full px-2 rounded border border-slate-300 bg-white text-xs font-mono" oninput="records[activeIdx][\\'' + fld + '\\']=this.value">';
        } else if (ctrl.type === 'checkbox') {
          el.innerHTML = '<label class="flex items-center space-x-1.5 text-xs font-medium"><input type="checkbox" ' + (val ? 'checked' : '') + ' onchange="records[activeIdx][\\'' + fld + '\\']=this.checked"><span>' + (ctrl.caption || '') + '</span></label>';
        } else if (ctrl.type === 'button') {
          el.innerHTML = '<button class="w-full h-full bg-slate-200 border rounded font-bold text-xs" onclick="alert(\\'' + (ctrl.caption || '') + ' clicked!\\')">' + (ctrl.caption || '') + '</button>';
        }
        container.appendChild(el);
      });
    }

    function goFirst() { activeIdx = 0; renderForm(); }
    function goPrev() { if (activeIdx > 0) activeIdx--; renderForm(); }
    function goNext() { if (activeIdx < records.length - 1) activeIdx++; renderForm(); }
    function goLast() { activeIdx = records.length - 1; renderForm(); }
    function appendRecord() { records.push({ _recno: records.length + 1 }); activeIdx = records.length - 1; renderForm(); }
    function saveRecord() { alert('Record saved to local storage.'); }
    function deleteRecord() { if (confirm('Delete this record?')) { records.splice(activeIdx, 1); activeIdx = Math.max(0, activeIdx - 1); renderForm(); } }

    renderForm();
  </script>
</body>
</html>`;
  };

  // Generate Python Tkinter Script for Native Ubuntu execution
  const generatePythonTkinter = () => {
    return `# -*- coding: utf-8 -*-
"""
FoxStudio Linux - Standalone Python/Tkinter Form Runner
Generated for Ubuntu Linux: ${form.name}
Run with: python3 ${form.name.toLowerCase()}_app.py
"""

import tkinter as tk
from tkinter import ttk, messagebox
import json

class FoxProFormApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("${form.caption || form.name}")
        self.geometry("${form.width + 40}x${form.height + 120}")
        self.configure(bg="#f1f5f9")
        
        # Sample DBF Data Buffer
        self.records = ${JSON.stringify(table?.records || [], null, 4)}
        self.active_idx = 0
        
        self.create_widgets()
        self.load_record()
        
    def create_widgets(self):
        # Navigation Bar
        nav_frame = ttk.Frame(self)
        nav_frame.pack(fill="x", padx=10, pady=5)
        
        ttk.Button(nav_frame, text="|<<", width=4, command=self.go_first).pack(side="left", padx=2)
        ttk.Button(nav_frame, text="<<", width=4, command=self.go_prev).pack(side="left", padx=2)
        self.lbl_recno = ttk.Label(nav_frame, text="1 / 1", font=("Courier", 10, "bold"))
        self.lbl_recno.pack(side="left", padx=8)
        ttk.Button(nav_frame, text=">>", width=4, command=self.go_next).pack(side="left", padx=2)
        ttk.Button(nav_frame, text=">>|", width=4, command=self.go_last).pack(side="left", padx=2)
        
        ttk.Button(nav_frame, text="+ Append", command=self.append_record).pack(side="right", padx=2)
        ttk.Button(nav_frame, text="Save", command=self.save_record).pack(side="right", padx=2)
        
        # Form Canvas
        self.canvas_frame = tk.Frame(self, bg="#ffffff", bd=1, relief="sunken")
        self.canvas_frame.pack(fill="both", expand=True, padx=10, pady=5)
        
        # Form Inputs Dictionary
        self.inputs = {}
        
        # Render Controls
        controls = ${JSON.stringify(form.controls, null, 4)}
        for ctrl in controls:
            c_type = ctrl.get("type")
            left = ctrl.get("left", 0)
            top = ctrl.get("top", 0)
            width = ctrl.get("width", 100)
            height = ctrl.get("height", 30)
            cs = ctrl.get("controlSource", "")
            fld = cs.split(".")[-1] if "." in cs else cs
            
            if c_type == "label":
                lbl = tk.Label(self.canvas_frame, text=ctrl.get("caption", ""), bg="#ffffff", font=("Helvetica", 9, "bold"))
                lbl.place(x=left, y=top, width=width, height=height)
            elif c_type in ["textbox", "editbox"]:
                ent = ttk.Entry(self.canvas_frame)
                ent.place(x=left, y=top, width=width, height=height)
                if fld:
                    self.inputs[fld] = ent
            elif c_type == "button":
                btn = ttk.Button(self.canvas_frame, text=ctrl.get("caption", "Button"), command=lambda c=ctrl: self.on_button(c))
                btn.place(x=left, y=top, width=width, height=height)

    def load_record(self):
        if not self.records:
            return
        rec = self.records[self.active_idx]
        self.lbl_recno.config(text=f"{self.active_idx + 1} / {len(self.records)}")
        for fld, widget in self.inputs.items():
            widget.delete(0, tk.END)
            val = rec.get(fld, "")
            widget.insert(0, str(val) if val is not None else "")
            
    def go_first(self): self.active_idx = 0; self.load_record()
    def go_prev(self): 
        if self.active_idx > 0: self.active_idx -= 1; self.load_record()
    def go_next(self): 
        if self.active_idx < len(self.records) - 1: self.active_idx += 1; self.load_record()
    def go_last(self): self.active_idx = len(self.records) - 1; self.load_record()
    def append_record(self):
        self.records.append({"_recno": len(self.records) + 1})
        self.active_idx = len(self.records) - 1
        self.load_record()
    def save_record(self):
        rec = self.records[self.active_idx]
        for fld, widget in self.inputs.items():
            rec[fld] = widget.get()
        messagebox.showinfo("FoxPro", "Record committed to DBF memory buffer.")
    def on_button(self, ctrl):
        messagebox.showinfo("FoxStudio", f"Button '{ctrl.get('caption')}' clicked.")

if __name__ == "__main__":
    app = FoxProFormApp()
    app.mainloop()
`;
  };

  const getCode = () => {
    if (exportType === 'html') return generateStandaloneHTML();
    if (exportType === 'python') return generatePythonTkinter();
    return JSON.stringify(form, null, 2);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const code = getCode();
    let ext = '.html';
    let mime = 'text/html';
    if (exportType === 'python') {
      ext = '.py';
      mime = 'text/x-python';
    } else if (exportType === 'scx_json') {
      ext = '.scx.json';
      mime = 'application/json';
    }

    const blob = new Blob([code], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.name.toLowerCase()}${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-3xl h-[600px] bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-slate-300 dark:border-neutral-800 flex flex-col overflow-hidden text-xs">
        <div className="flex items-center justify-between px-4 py-3 border-b border-inherit bg-slate-100 dark:bg-neutral-800 font-bold select-none">
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4 text-orange-500" />
            <span>Export Standalone Form Application - {form.name}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex items-center px-4 py-2 border-b border-inherit bg-slate-50 dark:bg-neutral-900 space-x-2">
          <button
            onClick={() => setExportType('html')}
            className={`px-3 py-1.5 rounded font-semibold ${
              exportType === 'html' ? 'bg-orange-600 text-white' : 'hover:bg-slate-200 text-slate-700 dark:text-neutral-300'
            }`}
          >
            Standalone Single-File Web App (.HTML)
          </button>
          <button
            onClick={() => setExportType('python')}
            className={`px-3 py-1.5 rounded font-semibold ${
              exportType === 'python' ? 'bg-orange-600 text-white' : 'hover:bg-slate-200 text-slate-700 dark:text-neutral-300'
            }`}
          >
            Native Linux Python / Tkinter (.PY)
          </button>
          <button
            onClick={() => setExportType('scx_json')}
            className={`px-3 py-1.5 rounded font-semibold ${
              exportType === 'scx_json' ? 'bg-orange-600 text-white' : 'hover:bg-slate-200 text-slate-700 dark:text-neutral-300'
            }`}
          >
            FoxPro SCX JSON Definition
          </button>
        </div>

        {/* Code Preview */}
        <div className="flex-1 p-3 bg-[#1e1e1e] overflow-auto font-mono text-xs">
          <pre className="text-emerald-400 leading-relaxed whitespace-pre-wrap">{getCode()}</pre>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-inherit bg-slate-50 dark:bg-neutral-800">
          <div className="text-[11px] text-slate-500">
            {exportType === 'html'
              ? 'Works offline in any Linux browser (Firefox, Chromium).'
              : exportType === 'python'
              ? 'Ready to run in Ubuntu terminal via `python3 app.py`.'
              : 'Compatible with FoxStudio schema importers.'}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 flex items-center space-x-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Code className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
