import React, { useState } from 'react';
import {
  Globe,
  Smartphone,
  Laptop,
  Terminal,
  Download,
  Copy,
  CheckCircle,
  X,
  Sparkles,
  Layers,
  Database,
  Cpu
} from 'lucide-react';

interface OSIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
}

export const OSIntegrationModal: React.FC<OSIntegrationModalProps> = ({
  isOpen,
  onClose,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<'web' | 'linux' | 'macos' | 'windows' | 'mobile'>('web');
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(id);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  const linuxDesktopEntry = `[Desktop Entry]
Version=1.0
Type=Application
Name=FoxStudio Web
Comment=Universal Visual FoxPro Database & Form Designer
Exec=xdg-open https://ais-dev-x47aidhslvtwjzits55wnm-860824588270.asia-southeast1.run.app
Icon=database
Terminal=false
Categories=Development;Database;`;

  const pythonScript = `# Python DBF Helper Utility for FoxStudio (cross-platform)
# Install: pip install dbfread pandas
import pandas as pd
from dbfread import DBF

def inspect_dbf(filepath):
    table = DBF(filepath, load=True)
    df = pd.DataFrame(iter(table))
    print(f"Loaded DBF: {filepath}")
    print(f"Records: {len(df)}, Columns: {list(df.columns)}")
    return df

# df = inspect_dbf("customers.dbf")
# df.to_csv("customers.csv", index=False)`;

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 text-xs font-sans">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-slate-300 dark:border-neutral-700 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-inherit bg-slate-50 dark:bg-neutral-800">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-neutral-100">
              FoxStudio Universal & Cross-Platform Support
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-inherit bg-slate-100 dark:bg-neutral-950 p-1 space-x-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('web')}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'web' ? 'bg-white dark:bg-neutral-800 text-orange-600 shadow-xs' : 'text-slate-600 dark:text-neutral-400'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Universal Web</span>
          </button>
          <button
            onClick={() => setActiveTab('mobile')}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'mobile' ? 'bg-white dark:bg-neutral-800 text-orange-600 shadow-xs' : 'text-slate-600 dark:text-neutral-400'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile & iPad</span>
          </button>
          <button
            onClick={() => setActiveTab('linux')}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'linux' ? 'bg-white dark:bg-neutral-800 text-orange-600 shadow-xs' : 'text-slate-600 dark:text-neutral-400'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Linux (Ubuntu/Debian)</span>
          </button>
          <button
            onClick={() => setActiveTab('macos')}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'macos' ? 'bg-white dark:bg-neutral-800 text-orange-600 shadow-xs' : 'text-slate-600 dark:text-neutral-400'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>macOS</span>
          </button>
          <button
            onClick={() => setActiveTab('windows')}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'windows' ? 'bg-white dark:bg-neutral-800 text-orange-600 shadow-xs' : 'text-slate-600 dark:text-neutral-400'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Windows</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-700 dark:text-neutral-300 leading-relaxed flex-1">
          {activeTab === 'web' && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Run Anywhere in Any Modern Browser</h4>
              <p>
                FoxStudio is 100% web-native. You do not need Wine, virtual machines, or emulator setups. Open it on Chrome, Firefox, Safari, Edge, or Brave on any operating system.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 dark:bg-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-700">
                  <div className="font-bold text-slate-800 dark:text-neutral-100 mb-1">Local Storage Persistence</div>
                  <p className="text-[11px] text-slate-500">Your tables, forms, queries, and reports automatically sync to your browser's persistent storage so you can resume work anytime.</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-700">
                  <div className="font-bold text-slate-800 dark:text-neutral-100 mb-1">Binary DBF Import / Export</div>
                  <p className="text-[11px] text-slate-500">Directly read and generate real FoxPro `.DBF` binary files without needing Windows or legacy drivers.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mobile' && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Touch-Friendly Mobile & Tablet Experience</h4>
              <p>
                FoxStudio is built with responsive touch design. On iPads, tablets, and smartphones:
              </p>
              <ul className="space-y-1.5 list-disc pl-4 text-xs">
                <li><strong>Add to Home Screen (PWA)</strong>: In Safari (iOS) or Chrome (Android), tap "Share" → "Add to Home Screen" to install FoxStudio as a standalone app icon.</li>
                <li><strong>Mobile Form Runner</strong>: Fill out and interact with database-backed forms directly on your mobile device in the field.</li>
                <li><strong>Mobile Quick Switcher</strong>: Tap the top menu icon (☰) to switch between Tables, Forms, Queries, and Reports.</li>
              </ul>
            </div>
          )}

          {activeTab === 'linux' && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Linux (Ubuntu / Debian / Fedora / Arch) Integration</h4>
              <p>
                Create a desktop shortcut to launch FoxStudio like a native Linux application:
              </p>
              <div className="p-3 bg-slate-900 text-emerald-400 font-mono rounded-lg border border-slate-700 relative text-xs">
                <button
                  onClick={() => handleCopy(linuxDesktopEntry, 'desktop_entry')}
                  className="absolute top-2 right-2 px-2 py-1 bg-slate-800 text-white rounded text-[11px] flex items-center space-x-1 hover:bg-slate-700"
                >
                  {copiedScript === 'desktop_entry' ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedScript === 'desktop_entry' ? 'Copied' : 'Copy .desktop'}</span>
                </button>
                <pre className="overflow-x-auto whitespace-pre-wrap">{linuxDesktopEntry}</pre>
              </div>
              <p className="text-[11px] text-slate-500">
                Save as <code>~/.local/share/applications/foxstudio.desktop</code> and make executable with <code>chmod +x</code>.
              </p>
            </div>
          )}

          {activeTab === 'macos' && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">macOS (Apple Silicon & Intel)</h4>
              <p>
                Visual FoxPro never had a native macOS release—until now. On macOS:
              </p>
              <ul className="space-y-1.5 list-disc pl-4 text-xs">
                <li>Run FoxStudio in Safari, Chrome, or Arc with high-DPI Retina display support.</li>
                <li>Use <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-neutral-800 rounded font-mono">⌘ + E</kbd> to execute visual queries and <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-neutral-800 rounded font-mono">Ctrl + F2</kbd> for the Command Window.</li>
                <li>In Safari, choose <strong>File → Add to Dock</strong> (macOS Sonoma+) to run FoxStudio as a standalone Mac application in your Dock.</li>
              </ul>
            </div>
          )}

          {activeTab === 'windows' && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Windows (Modern Web Modernization)</h4>
              <p>
                Replace legacy 32-bit Visual FoxPro 9 runtimes without installation hassles:
              </p>
              <ul className="space-y-1.5 list-disc pl-4 text-xs">
                <li>Compatible with existing `.DBF` files generated by Visual FoxPro, Clipper, and dBASE.</li>
                <li>No ODBC or OLE DB driver installation required.</li>
                <li>Export reports and queries directly to CSV or print to PDF.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-3 border-t border-inherit bg-slate-50 dark:bg-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
