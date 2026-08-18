import { DBFTable, MountedFileInfo } from '../types/foxpro';
import { DBFBinaryEngine } from './dbfEngine';

/**
 * Direct Local Disk Service
 * Uses the HTML5 File System Access API (FileSystemDirectoryHandle / FileSystemFileHandle)
 * to provide direct read and write access to physical local hard drive files without uploading.
 */
class DirectDiskService {
  private dirHandle: any | null = null;
  private fileHandles: Map<string, any> = new Map();
  private folderName: string | null = null;

  /**
   * Check if File System Access API is supported
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  }

  /**
   * Check if currently running inside an iframe (which restricts showDirectoryPicker in Chromium)
   */
  public isInIframe(): boolean {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  /**
   * Mount a physical local folder with direct read/write permission.
   * Rock-solid async traversal with timeout protection to prevent hanging in Edge/Chrome.
   */
  public async mountPhysicalFolder(): Promise<{
    folderName: string;
    files: MountedFileInfo[];
    tables: DBFTable[];
  }> {
    if (!this.isSupported()) {
      throw new Error('Your browser does not support the File System Access API. Please use Google Chrome or Microsoft Edge.');
    }

    if (this.isInIframe()) {
      throw new Error('IFRAME_RESTRICTION: Direct hard drive access requires opening FoxStudio in a dedicated browser tab.');
    }

    // @ts-ignore
    const dirHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
    });

    this.dirHandle = dirHandle;
    this.folderName = dirHandle.name || 'LOCAL_DISK';
    this.fileHandles.clear();

    const discoveredFiles: MountedFileInfo[] = [];
    const parsedTables: DBFTable[] = [];

    // Traverse directory handle entries with safety timeout and async iterator support
    const rawEntries: any[] = [];

    const traversePromise = (async () => {
      try {
        // Modern standard: for await ... of dirHandle.values()
        // @ts-ignore
        if (typeof dirHandle.values === 'function') {
          // @ts-ignore
          for await (const entry of dirHandle.values()) {
            if (entry) rawEntries.push(entry);
          }
        } else if (typeof dirHandle.entries === 'function') {
          // @ts-ignore
          for await (const [, entry] of dirHandle.entries()) {
            if (entry) rawEntries.push(entry);
          }
        }
      } catch (iterErr) {
        console.warn('Standard async iteration failed, trying manual fallback:', iterErr);
        try {
          // Fallback manual iterator
          // @ts-ignore
          const iter = dirHandle.values ? dirHandle.values() : dirHandle.entries();
          let item = await iter.next();
          let safetyCount = 0;
          while (!item.done && safetyCount < 5000) {
            const val = item.value ? (item.value.kind ? item.value : item.value[1]) : null;
            if (val) rawEntries.push(val);
            item = await iter.next();
            safetyCount++;
          }
        } catch (manualErr) {
          console.error('Manual traversal failed:', manualErr);
        }
      }
    })();

    // 8-second safety timeout to guarantee the UI never gets stuck loading in Edge
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Directory read timed out. Please retry.')), 8000)
    );

    try {
      await Promise.race([traversePromise, timeoutPromise]);
    } catch (raceErr) {
      console.warn('Traversal warning/timeout:', raceErr);
    }

    for (const entry of rawEntries) {
      if (entry && entry.kind === 'file') {
        try {
          const file = await entry.getFile();
          const ext = file.name.split('.').pop()?.toUpperCase() || '';
          
          this.fileHandles.set(file.name.toUpperCase(), entry);

          discoveredFiles.push({
            name: file.name,
            size: file.size,
            lastModified: new Date(file.lastModified).toISOString().split('T')[0],
            type: ext,
            handle: entry,
          });

          // If DBF file, directly read and parse binary buffer from disk
          if (ext === 'DBF') {
            try {
              const buffer = await file.arrayBuffer();
              const table = DBFBinaryEngine.parseDBF(buffer, file.name);
              parsedTables.push(table);
            } catch (dbfErr) {
              console.warn(`Could not parse ${file.name}:`, dbfErr);
            }
          }
        } catch (fileErr) {
          console.warn(`Could not get file for entry ${entry.name}:`, fileErr);
        }
      }
    }

    return {
      folderName: this.folderName,
      files: discoveredFiles,
      tables: parsedTables,
    };
  }

  /**
   * Check if direct write handle is available for a table
   */
  public hasWriteHandle(filename: string): boolean {
    const upper = filename.toUpperCase();
    const withExt = upper.endsWith('.DBF') ? upper : `${upper}.DBF`;
    return this.fileHandles.has(withExt) || this.dirHandle !== null;
  }

  /**
   * Write table changes directly back to physical local disk
   */
  public async saveTableDirectlyToDisk(table: DBFTable): Promise<{ success: boolean; message: string }> {
    try {
      const fileName = table.filename || `${table.name}.DBF`;
      const upperName = fileName.toUpperCase();
      const withExt = upperName.endsWith('.DBF') ? upperName : `${upperName}.DBF`;

      let fileHandle = this.fileHandles.get(withExt);

      // If file handle doesn't exist yet, request it from directory handle
      if (!fileHandle && this.dirHandle) {
        try {
          fileHandle = await this.dirHandle.getFileHandle(withExt, { create: true });
          this.fileHandles.set(withExt, fileHandle);
        } catch (fhErr) {
          console.error('Failed to create file handle in mounted folder:', fhErr);
        }
      }

      if (!fileHandle) {
        return {
          success: false,
          message: `No active disk handle for "${withExt}". Please mount the folder directly with read/write permissions first.`,
        };
      }

      // Generate DBF binary buffer
      const buffer = DBFBinaryEngine.exportToDBF(table);

      // Create writable stream to disk
      const writable = await fileHandle.createWritable();
      await writable.write(buffer);
      await writable.close();

      return {
        success: true,
        message: `Successfully written ${buffer.byteLength.toLocaleString()} bytes directly to physical file "${withExt}" on local disk.`,
      };
    } catch (err: any) {
      console.error('Direct disk write failed:', err);
      return {
        success: false,
        message: `Direct disk write failed: ${err.message || err}`,
      };
    }
  }

  public getMountedFolderName(): string | null {
    return this.folderName;
  }

  public isMounted(): boolean {
    return this.dirHandle !== null;
  }
}

export const directDiskService = new DirectDiskService();
