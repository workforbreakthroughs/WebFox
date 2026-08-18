import React, { useState, useRef } from 'react';
import { 
  Database, 
  Play, 
  Terminal, 
  Layers, 
  FileCode, 
  Upload, 
  Download, 
  HelpCircle, 
  Sparkles, 
  Monitor, 
  Search,
  Plus,
  RefreshCw,
  FolderOpen,
  Menu,
  X,
  Smartphone,
  Laptop,
  Globe,
  Settings,
  HardDrive,
  ExternalLink
} from 'lucide-react';
import { DBFTable, VFPProject } from '../types/foxpro';
import { DBFBinaryEngine } from '../services/dbfEngine';
import { directDiskService } from '../services/directDiskService';
import { ActiveView } from '../App';

interface HeaderProps {
  project: VFPProject;
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  activeTable: DBFTable | null;
  onCreateTable: () => void;
  onCreateForm: () => void;
  onCreateQuery: () => void;
  onOpenImportExport: () => void;
  onToggleCommandWindow: () => void;
  onOpenHelp: () => void;
  onOpenOSModal?: () => void;
  onOpenDriveManager?: () => void;
  theme: string;
  onToggleTheme: (theme: 'vfp-classic' | 'linux-dark' | 'linux-light') => void;
  onResetSampleData: () => void;
  isProjectExplorerOpen: boolean;
  onToggleProjectExplorer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  activeView,
  onSelectView,
  activeTable,
  onCreateTable,
  onCreateForm,
  onCreateQuery,
  onOpenImportExport,
  onToggleCommandWindow,
  onOpenHelp,
  onOpenOSModal,
  onOpenDriveManager,
  theme,
  onToggleTheme,
  onResetSampleData,
  isProjectExplorerOpen,
  onToggleProjectExplorer,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navItems: { id: ActiveView; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'project', label: 'Project Explorer', icon: Layers },
    { id: 'table_browse', label: 'Browse DBF', icon: Database, badge: activeTable?.name },
    { id: 'form_designer', label: 'Form Designer', icon: Monitor },
    { id: 'form_runner', label: 'Run Form', icon: Play },
    { id: 'query_builder', label: 'Query Builder', icon: Search },
    { id: 'report_viewer', label: 'Report Preview', icon: FileCode },
    { id: 'program_editor', label: 'PRG Editor', icon: Terminal },
  ];

  return (
    <header id="fox_app_header" className={`border-b transition-colors select-none ${
      theme === 'linux-dark' 
        ? 'bg-[#18181b] border-neutral-800 text-gray-200' 
        : theme === 'vfp-classic'
        ? 'bg-[#d4d0c8] border-[#808080] text-gray-900 font-sans shadow-sm'
        : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Top Bar / Brand & Cross-Platform Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 text-sm border-b border-inherit">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Toggle Explorer (Desktop & Mobile) */}
          <button
            onClick={onToggleProjectExplorer}
            className={`p-1.5 rounded border transition-colors ${
              isProjectExplorerOpen
                ? 'bg-orange-500/20 text-orange-600 border-orange-500/40'
                : 'hover:bg-black/10 dark:hover:bg-white/10 border-transparent'
            }`}
            title="Toggle Project Explorer Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Logo & Platform Indicator */}
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              VFP
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-bold tracking-tight text-sm sm:text-base">FoxStudio</span>
                <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20 flex items-center space-x-1">
                  <Globe className="w-2.5 h-2.5 inline" />
                  <span>Web & Mobile</span>
                </span>
                <span className="text-xs opacity-70 hidden lg:inline">
                  [{project.name} - {project.database.name}]
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          {/* Drive & Working Directory Selector */}
          {onOpenDriveManager && (
            <button
              id="btn_open_drive_manager"
              onClick={onOpenDriveManager}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded text-xs font-semibold border transition-colors ${
                theme === 'linux-dark'
                  ? 'bg-orange-950/40 hover:bg-orange-900/50 border-orange-700/60 text-orange-400'
                  : 'bg-orange-50 hover:bg-orange-100 border-orange-300 text-orange-800'
              }`}
              title="Set Working Drive & Directory (SET DEFAULT TO X:)"
            >
              <HardDrive className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-mono font-bold text-[11px]">{project.defaultDrive || 'X:'}</span>
              <span className="hidden xl:inline font-mono opacity-80 text-[10px] truncate max-w-[100px]">
                {project.currentDirectory ? project.currentDirectory.replace(/^[A-Z]:/i, '') : '\\VFP_DATA\\'}
              </span>
            </button>
          )}

          {/* Import / Export DBF Modal */}
          <button
            id="btn_import_export_header"
            onClick={onOpenImportExport}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
              theme === 'linux-dark'
                ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
            }`}
            title="Import / Export DBF Binary and CSV files"
          >
            <Upload className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">DBF I/O</span>
          </button>

          {/* Quick Run Form (DO FORM) */}
          <button
            id="btn_quick_do_form"
            onClick={() => onSelectView('form_runner')}
            className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
            title="Run active FoxPro form (DO FORM)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>DO FORM</span>
          </button>

          {/* Command Window Toggle */}
          <button
            id="btn_toggle_command_window"
            onClick={onToggleCommandWindow}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
              theme === 'linux-dark'
                ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
            }`}
            title="Toggle Visual FoxPro Command Window (Ctrl+F2)"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Command</span>
          </button>

          {/* Standalone Window / Tab Launcher for Direct Hard Drive Access */}
          <button
            id="btn_launch_standalone_tab"
            onClick={() => window.open(window.location.href, '_blank')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded text-xs font-semibold border transition-colors ${
              theme === 'linux-dark'
                ? 'bg-emerald-950/60 hover:bg-emerald-900 border-emerald-700 text-emerald-300'
                : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
            }`}
            title="Open in Dedicated Browser Tab (Enables Direct Native Hard Drive Access)"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden lg:inline">Direct Disk Tab</span>
          </button>

          {/* Cross-Platform OS Guides */}
          {onOpenOSModal && (
            <button
              id="btn_open_os_guides"
              onClick={onOpenOSModal}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
                theme === 'linux-dark'
                  ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-orange-400'
                  : 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700'
              }`}
              title="Linux, macOS, Windows & Mobile Integration Guide"
            >
              <Laptop className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden xl:inline">OS Guides</span>
            </button>
          )}

          {/* VFP Help Reference */}
          <button
            id="btn_open_vfp_help"
            onClick={onOpenHelp}
            className={`p-1.5 rounded border transition-colors ${
              theme === 'linux-dark'
                ? 'hover:bg-neutral-700 border-neutral-700 text-neutral-300'
                : 'hover:bg-slate-100 border-slate-300 text-slate-600'
            }`}
            title="FoxPro Language & Command Reference"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Theme Selector */}
          <div className="flex items-center rounded border border-inherit overflow-hidden text-[11px] sm:text-xs">
            <button
              onClick={() => onToggleTheme('linux-dark')}
              className={`px-1.5 sm:px-2 py-1 ${theme === 'linux-dark' ? 'bg-orange-600 text-white font-medium' : 'hover:bg-black/10'}`}
              title="Dark Theme"
            >
              Dark
            </button>
            <button
              onClick={() => onToggleTheme('linux-light')}
              className={`px-1.5 sm:px-2 py-1 ${theme === 'linux-light' ? 'bg-orange-600 text-white font-medium' : 'hover:bg-black/10'}`}
              title="Light Theme"
            >
              Light
            </button>
            <button
              onClick={() => onToggleTheme('vfp-classic')}
              className={`px-1.5 sm:px-2 py-1 ${theme === 'vfp-classic' ? 'bg-[#000080] text-white font-medium' : 'hover:bg-black/10'}`}
              title="Classic VFP 9 Grey Theme"
            >
              VFP
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center px-3 sm:px-4 overflow-x-auto space-x-1 py-1 text-xs scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              id={`nav_tab_${item.id}`}
              onClick={() => {
                onSelectView(item.id);
                setMobileMenuOpen(false);
              }}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded font-medium transition-all whitespace-nowrap min-h-[34px] ${
                isActive
                  ? theme === 'vfp-classic'
                    ? 'bg-[#ffffff] shadow-inner text-blue-900 border border-[#808080] font-bold'
                    : 'bg-orange-600 text-white shadow-sm'
                  : theme === 'linux-dark'
                  ? 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{item.label}</span>
              {item.badge && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-neutral-700 text-inherit'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
