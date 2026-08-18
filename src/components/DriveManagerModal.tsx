import React, { useState, useRef } from 'react';
import {
  HardDrive,
  Folder,
  FolderOpen,
  Check,
  Terminal,
  Upload,
  Download,
  X,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  RefreshCw,
  Info,
  AlertCircle,
  FileText,
  ExternalLink,
  ShieldCheck,
  Save
} from 'lucide-react';
import { DBFTable, VFPProject, MountedFileInfo } from '../types/foxpro';
import { DBFBinaryEngine } from '../services/dbfEngine';
import { directDiskService } from '../services/directDiskService';

interface DriveManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VFPProject;
  onUpdateProjectSettings?: (settings: { defaultDrive?: string; currentDirectory?: string; searchPath?: string; mountedFolderName?: string; mountedFiles?: MountedFileInfo[] }) => void;
  onUpdateProject?: (project: VFPProject) => void;
  onImportTable?: (table: DBFTable) => void;
  onSelectTable?: (tableId: string) => void;
  theme: string;
}

export const DriveManagerModal: React.FC<DriveManagerModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProjectSettings,
  onUpdateProject,
  onImportTable,
  onSelectTable,
  theme,
}) => {
  const [selectedDrive, setSelectedDrive] = useState<string>(project.defaultDrive || 'X:');
  const [currentDir, setCurrentDir] = useState<string>(project.currentDirectory || `${project.defaultDrive || 'X:'}\\VFP_DATA\\`);
  const [searchPath, setSearchPath] = useState<string>(project.searchPath || `${project.defaultDrive || 'X:'}\\DATA;${project.defaultDrive || 'X:'}\\FORMS;${project.defaultDrive || 'X:'}\\REPORTS`);
  const [customPathInput, setCustomPathInput] = useState<string>(project.currentDirectory || `${project.defaultDrive || 'X:'}\\VFP_DATA\\`);
  const [mountedFiles, setMountedFiles] = useState<MountedFileInfo[]>(project.mountedFiles || []);
  const [mountedFolderName, setMountedFolderName] = useState<string | undefined>(project.mountedFolderName);
  const [isMounting, setIsMounting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [iframeRestriction, setIframeRestriction] = useState<boolean>(false);

  // Hidden native inputs for bulletproof folder and file picking
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Safe wrapper for project update
  const applyProjectSettings = (settings: {
    defaultDrive?: string;
    currentDirectory?: string;
    searchPath?: string;
    mountedFolderName?: string;
    mountedFiles?: MountedFileInfo[];
  }) => {
    if (typeof onUpdateProjectSettings === 'function') {
      onUpdateProjectSettings(settings);
    } else if (typeof onUpdateProject === 'function') {
      onUpdateProject({
        ...project,
        ...settings,
      });
    }
  };

  // Preset drives
  const presetDrives = [
    { letter: 'X:', label: 'Drive X: (Mapped / Shared Drive)', description: 'Recommended for network / project shares' },
    { letter: 'C:', label: 'Drive C: (Local Primary)', description: 'Standard root disk' },
    { letter: 'D:', label: 'Drive D: (Secondary / Data)', description: 'Dedicated database storage' },
    { letter: 'Z:', label: 'Drive Z: (Legacy Network Share)', description: 'Visual FoxPro network volume' },
  ];

  const handleApplyDrive = (drive: string, subfolder: string = 'VFP_DATA') => {
    setSelectedDrive(drive);
    const newDir = `${drive}\\${subfolder}\\`;
    setCurrentDir(newDir);
    setCustomPathInput(newDir);
    const newPath = `${drive}\\DATA;${drive}\\FORMS;${drive}\\REPORTS`;
    setSearchPath(newPath);

    applyProjectSettings({
      defaultDrive: drive,
      currentDirectory: newDir,
      searchPath: newPath,
    });

    setStatusMessage(`Default drive set to ${drive} and directory to ${newDir}`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSaveCustomPath = () => {
    let path = customPathInput.trim();
    if (!path) return;

    let newDrive = selectedDrive;
    const driveMatch = /^([A-Za-z]:)(.*)$/.exec(path);
    if (driveMatch) {
      newDrive = driveMatch[1].toUpperCase();
    }

    if (!path.endsWith('\\') && !path.endsWith('/')) {
      path += '\\';
    }

    setSelectedDrive(newDrive);
    setCurrentDir(path);

    applyProjectSettings({
      defaultDrive: newDrive,
      currentDirectory: path,
      searchPath: searchPath,
    });

    setStatusMessage(`Default directory updated: SET DEFAULT TO ${path}`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Process File list from standard input (fallback mode)
  const processSelectedFiles = async (files: FileList | null, detectedFolderName?: string) => {
    if (!files || files.length === 0) return;

    setIsMounting(true);
    setErrorMessage(null);

    try {
      const discoveredFiles: MountedFileInfo[] = [];
      let importedCount = 0;

      // Extract folder name from webkitRelativePath or first file
      let folderName = detectedFolderName;
      if (!folderName) {
        const firstRelPath = files[0].webkitRelativePath;
        if (firstRelPath && firstRelPath.includes('/')) {
          folderName = firstRelPath.split('/')[0];
        } else {
          folderName = 'LOCAL_FOLDER';
        }
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop()?.toUpperCase() || '';
        
        discoveredFiles.push({
          name: file.name,
          size: file.size,
          lastModified: new Date(file.lastModified).toISOString().split('T')[0],
          type: ext,
        });

        // Auto-parse .DBF files
        if (ext === 'DBF') {
          try {
            const buffer = await file.arrayBuffer();
            const table = DBFBinaryEngine.parseDBF(buffer, file.name);
            if (onImportTable) {
              onImportTable(table);
            }
            importedCount++;
          } catch (err) {
            console.warn(`Could not parse ${file.name}:`, err);
          }
        }
      }

      setMountedFolderName(folderName);
      setMountedFiles(discoveredFiles);

      const targetDrive = selectedDrive || 'X:';
      const newDir = `${targetDrive}\\${folderName.toUpperCase()}\\`;
      setCurrentDir(newDir);
      setCustomPathInput(newDir);

      applyProjectSettings({
        defaultDrive: targetDrive,
        currentDirectory: newDir,
        mountedFolderName: folderName,
        mountedFiles: discoveredFiles,
      });

      setStatusMessage(`Mounted folder "${folderName}" directly as Drive ${targetDrive} (${discoveredFiles.length} files, ${importedCount} DBF tables active). Zero server uploads.`);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(`Error reading local folder: ${err.message || err}`);
    } finally {
      setIsMounting(false);
    }
  };

  // Handler for directory picker input (fallback)
  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFiles(e.target.files);
    }
  };

  // Handler for individual DBF file selection
  const handleFilesInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFiles(e.target.files, 'DBF_FILES');
    }
  };

  // Primary: Direct Local Disk Access via File System Access API
  const handleMountLocalDirectory = async () => {
    setErrorMessage(null);
    setIframeRestriction(false);

    try {
      setIsMounting(true);

      const result = await directDiskService.mountPhysicalFolder();
      
      // Auto-load parsed tables
      if (result.tables && result.tables.length > 0 && onImportTable) {
        for (const tbl of result.tables) {
          onImportTable(tbl);
        }
      }

      setMountedFolderName(result.folderName);
      setMountedFiles(result.files);

      const targetDrive = selectedDrive || 'X:';
      const newDir = `${targetDrive}\\${result.folderName.toUpperCase()}\\`;
      setCurrentDir(newDir);
      setCustomPathInput(newDir);

      applyProjectSettings({
        defaultDrive: targetDrive,
        currentDirectory: newDir,
        mountedFolderName: result.folderName,
        mountedFiles: result.files,
      });

      setStatusMessage(`⚡ Direct Hard Drive Access Active: Connected to folder "${result.folderName}" on Drive ${targetDrive} (${result.files.length} files, ${result.tables.length} tables). No files are uploaded to any server.`);
      setTimeout(() => setStatusMessage(null), 6000);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled picker dialog
        return;
      }

      console.warn('Direct File System Access API check:', err);

      // Check if restricted by iframe sandbox
      if (directDiskService.isInIframe() || String(err.message).includes('Cross-origin') || String(err.message).includes('sub frames')) {
        setIframeRestriction(true);
        setErrorMessage('Browser security blocks direct hard drive access inside embedded preview frames. Open in a dedicated tab for full direct read/write disk access, or choose a folder below.');
      } else {
        // Trigger folder input fallback
        if (folderInputRef.current) {
          folderInputRef.current.click();
        } else {
          setErrorMessage(`Notice: ${err.message || err}`);
        }
      }
    } finally {
      setIsMounting(false);
    }
  };

  const allTables = [...project.database.tables, ...project.freeTables];

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 text-xs font-sans">
      {/* Hidden File & Folder Inputs */}
      <input
        type="file"
        ref={folderInputRef}
        className="hidden"
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderInputChange}
      />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".dbf,.DBF,.csv,.CSV,.prg,.PRG"
        multiple
        onChange={handleFilesInputChange}
      />

      <div className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-slate-300 dark:border-neutral-700 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-inherit bg-slate-50 dark:bg-neutral-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 border border-orange-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-slate-800 dark:text-neutral-100">
                  Working Drive & Direct Local Disk Manager
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>100% Client-Side Direct Access (No Uploads)</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Set active drive (e.g. <code>SET DEFAULT TO D:</code>) or attach a direct local folder on your computer
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-700 dark:text-neutral-300">
          {/* Status Message */}
          {statusMessage && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium flex items-center space-x-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Error / Security Message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-2">
              <div className="flex items-center space-x-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
              {iframeRestriction && (
                <div className="pt-1 flex items-center space-x-2">
                  <button
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Dedicated Tab for Direct Hard Drive Access</span>
                  </button>
                  <span className="text-[11px] text-slate-500">
                    (Enables Chrome/Edge native disk read & write handle)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Section 1: Quick Drive Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                1. Select Default Drive (SYS(5))
              </span>
              <span className="text-[11px] font-mono text-orange-600 dark:text-orange-400 font-semibold">
                Active: {selectedDrive}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {presetDrives.map((d) => {
                const isSelected = selectedDrive === d.letter;
                return (
                  <button
                    key={d.letter}
                    onClick={() => handleApplyDrive(d.letter)}
                    className={`p-3 rounded-lg border text-left transition-all flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-500 text-orange-900 dark:text-orange-100 shadow-xs'
                        : 'bg-slate-50 dark:bg-neutral-800/60 border-slate-200 dark:border-neutral-700 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded font-mono font-bold text-xs ${isSelected ? 'bg-orange-600 text-white' : 'bg-slate-200 dark:bg-neutral-700 text-slate-700 dark:text-neutral-300'}`}>
                      {d.letter}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-slate-800 dark:text-neutral-200">{d.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">{d.description}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Direct Local Hard Drive / Folder Access */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-neutral-800 dark:to-neutral-800/80 border border-amber-200/80 dark:border-neutral-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Direct Local Hard Drive Access as Drive {selectedDrive}
                </span>
              </div>
              {mountedFolderName ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Direct Linked: {mountedFolderName}</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-bold border border-orange-500/20">
                  Direct Disk Mode
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-600 dark:text-neutral-300 leading-normal">
              Directly connect any folder on your computer (e.g. <code>D:\FoxPro\Data</code> or <code>C:\VFP_PROJECT</code>). FoxStudio reads and writes <code>.DBF</code> and <code>.PRG</code> files directly on your local hard drive. <strong>Zero files are uploaded to any server.</strong>
            </p>

            {/* Standalone Tab Prompt for Iframe previews */}
            {directDiskService.isInIframe() && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>To bypass browser iframe restrictions and enable native hard drive read/write access:</span>
                </div>
                <button
                  type="button"
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center space-x-1 flex-shrink-0 shadow-xs"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open in Dedicated Tab</span>
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                id="btn_mount_local_dir"
                type="button"
                onClick={handleMountLocalDirectory}
                disabled={isMounting}
                className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center space-x-2 shadow-xs transition-all disabled:opacity-50"
              >
                {isMounting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Folder className="w-3.5 h-3.5" />}
                <span>{mountedFolderName ? 'Change Direct Disk Folder...' : '⚡ Mount Direct Disk Folder...'}</span>
              </button>

              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white font-semibold text-xs flex items-center space-x-2 shadow-xs transition-all"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Select Folder from Computer</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 font-semibold text-xs flex items-center space-x-2 transition-all border border-slate-300 dark:border-neutral-700"
              >
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>Select .DBF Tables Directly</span>
              </button>
            </div>
          </div>

          {/* Section 3: Custom SET DEFAULT Path & Search Path */}
          <div className="space-y-3">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              2. Working Directory & Search Path (SET DEFAULT / SET PATH)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-neutral-400 mb-1">
                  Default Working Directory (<code>SET DEFAULT TO</code>):
                </label>
                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    value={customPathInput}
                    onChange={(e) => setCustomPathInput(e.target.value)}
                    placeholder="e.g. D:\VFP_DATA\"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono text-xs"
                  />
                  <button
                    onClick={handleSaveCustomPath}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white font-bold"
                  >
                    Set
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-neutral-400 mb-1">
                  Search Path (<code>SET PATH TO</code>):
                </label>
                <input
                  type="text"
                  value={searchPath}
                  onChange={(e) => {
                    setSearchPath(e.target.value);
                    applyProjectSettings({ searchPath: e.target.value });
                  }}
                  placeholder="e.g. D:\DATA;D:\FORMS;D:\REPORTS"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Live VFP Environment Variables Preview */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-neutral-200 border border-slate-800 space-y-2 font-mono text-[11px]">
            <div className="flex items-center space-x-2 text-orange-400 font-bold">
              <Terminal className="w-3.5 h-3.5" />
              <span>Live Visual FoxPro Environment Evaluation</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-300 pt-1">
              <div><code>? SYS(5)</code> =&gt; <span className="text-emerald-400">"{selectedDrive}"</span></div>
              <div><code>? SYS(2003)</code> =&gt; <span className="text-emerald-400">"{currentDir.replace(/^[A-Za-z]:/i, '').replace(/\\$/, '')}"</span></div>
              <div><code>? CURDIR()</code> =&gt; <span className="text-emerald-400">"{currentDir.replace(/^[A-Za-z]:/i, '')}"</span></div>
              <div><code>? FULLPATH("CUSTOMERS.DBF")</code> =&gt; <span className="text-emerald-400">"{currentDir}CUSTOMERS.DBF"</span></div>
              <div className="sm:col-span-2"><code>? SET("DEFAULT")</code> =&gt; <span className="text-emerald-400">"{currentDir}"</span></div>
            </div>
          </div>

          {/* Section 5: Files on Active Drive */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                Files on Active Drive {selectedDrive} ({allTables.length + mountedFiles.length} files)
              </span>
            </div>

            <div className="border border-slate-200 dark:border-neutral-700 rounded-lg overflow-hidden max-h-44 overflow-y-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 dark:bg-neutral-800 border-b border-inherit font-semibold text-slate-600 dark:text-neutral-300">
                  <tr>
                    <th className="py-1.5 px-3">Filename</th>
                    <th className="py-1.5 px-3">Full Path</th>
                    <th className="py-1.5 px-3 text-right">Records</th>
                    <th className="py-1.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-inherit">
                  {allTables.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50">
                      <td className="py-1.5 px-3 font-semibold flex items-center space-x-1.5">
                        <Database className="w-3.5 h-3.5 text-amber-500" />
                        <span>{t.filename}</span>
                      </td>
                      <td className="py-1.5 px-3 font-mono text-slate-500">{currentDir}{t.filename}</td>
                      <td className="py-1.5 px-3 text-right font-mono">{t.records.length}</td>
                      <td className="py-1.5 px-3 text-right">
                        <button
                          onClick={() => {
                            if (onSelectTable) onSelectTable(t.id);
                            onClose();
                          }}
                          className="px-2 py-0.5 rounded bg-orange-600 text-white font-medium hover:bg-orange-700 text-[10px]"
                        >
                          USE & Browse
                        </button>
                      </td>
                    </tr>
                  ))}

                  {mountedFiles.map((mf, idx) => (
                    <tr key={'mf_' + idx} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50">
                      <td className="py-1.5 px-3 font-semibold flex items-center space-x-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
                        <span>{mf.name}</span>
                      </td>
                      <td className="py-1.5 px-3 font-mono text-slate-500">{currentDir}{mf.name}</td>
                      <td className="py-1.5 px-3 text-right font-mono">{mf.size.toLocaleString()} B</td>
                      <td className="py-1.5 px-3 text-right">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300 text-[10px]">
                          Local Disk File
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3.5 border-t border-inherit bg-slate-50 dark:bg-neutral-800">
          <div className="text-[11px] text-slate-500">
            Tip: You can also type <code>SET DEFAULT TO D:\DATA</code> in the Command Window (Ctrl+F2) anytime.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
