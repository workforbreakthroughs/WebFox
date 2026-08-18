import { DBFRecord, DBFTable, FormDefinition, VFPCommandLog, VFPProject } from '../types/foxpro';
import { VFPExpressionEngine, VFPSqlEngine, DBFBinaryEngine } from './dbfEngine';

export interface CommandContext {
  project: VFPProject;
  activeTableId: string | null;
  activeRecno: number;
  memoryVars: Record<string, any>;
  onOpenTable: (tableId: string) => void;
  onOpenForm: (formId: string, runMode?: boolean) => void;
  onModifyStructure: (tableId: string) => void;
  onBrowse: (tableId: string) => void;
  onUpdateTable: (table: DBFTable) => void;
  onImportTable?: (table: DBFTable) => void;
  onOpenImport?: () => void;
  onOpenDriveManager?: () => void;
  onSetDefault?: (path: string) => void;
  onSetPath?: (path: string) => void;
}

export function cleanFileNameOrPath(input: string): {
  raw: string;
  drive: string;
  directory: string;
  fileName: string;
  baseName: string;
  ext: string;
} {
  let cleaned = input.trim();
  // Strip enclosing quotes ('...' or "...") or FoxPro brackets ([...])
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'")) ||
    (cleaned.startsWith('[') && cleaned.endsWith(']'))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Also remove standalone surrounding brackets/quotes if any remain
  cleaned = cleaned.replace(/^[\["']+|[\]"']+$/g, '').trim();

  let drive = '';
  const driveMatch = /^([A-Za-z]:)/.exec(cleaned);
  if (driveMatch) {
    drive = driveMatch[1].toUpperCase();
  }

  // Find directory separator (Windows \ or Unix /)
  const lastSlash = Math.max(cleaned.lastIndexOf('\\'), cleaned.lastIndexOf('/'));
  let directory = '';
  let fileNameWithExt = cleaned;

  if (lastSlash >= 0) {
    directory = cleaned.substring(0, lastSlash + 1);
    fileNameWithExt = cleaned.substring(lastSlash + 1);
  }

  // Extract base name without extension
  const dotIdx = fileNameWithExt.lastIndexOf('.');
  let baseName = fileNameWithExt;
  let ext = '';
  if (dotIdx > 0) {
    baseName = fileNameWithExt.substring(0, dotIdx);
    ext = fileNameWithExt.substring(dotIdx + 1).toUpperCase();
  }

  return {
    raw: cleaned,
    drive,
    directory,
    fileName: fileNameWithExt,
    baseName: baseName.trim(),
    ext,
  };
}

export class VFPCommandInterpreter {
  static execute(
    commandLine: string,
    context: CommandContext
  ): {
    log: VFPCommandLog;
    updatedTable?: DBFTable;
    updatedVars?: Record<string, any>;
    newActiveTableId?: string;
    newActiveRecno?: number;
    clearWindow?: boolean;
    newDefaultDrive?: string;
    newCurrentDirectory?: string;
    newSearchPath?: string;
  } {
    const rawCmd = commandLine.trim();
    if (!rawCmd) {
      return {
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: '',
          success: true,
          message: '',
          timestamp: new Date().toLocaleTimeString(),
        },
      };
    }

    const upper = rawCmd.toUpperCase();
    const timestamp = new Date().toLocaleTimeString();

    // 1. HELP command
    if (upper === 'HELP' || upper === '?') {
      return {
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: [
            '=== FOXSTUDIO COMMAND QUICK REFERENCE ===',
            '• SET DEFAULT TO <drive/path> - Set working drive & directory (e.g. SET DEFAULT TO X: or SET DEFAULT TO X:\\DATA)',
            '• CD <path> / CHDIR <path>   - Change active working directory (e.g. CD X:\\DATA)',
            '• SET PATH TO <paths>        - Set search path list (e.g. SET PATH TO X:\\DATA;X:\\FORMS;X:\\REPORTS)',
            '• DIR [*.DBF]                - List database files, records, and sizes in current drive/directory',
            '• SET                        - Display active environment configuration (Drive, Directory, Path)',
            '• USE <tablename>            - Select/open a DBF table as active work area',
            '• BROWSE                     - Open interactive data browser grid for active table',
            '• MODIFY STRUCTURE           - Open table field & schema designer',
            '• LIST STRUCTURE             - Display fields, types, widths, and index tags',
            '• APPEND BLANK               - Append a new blank record to active table',
            '• REPLACE <fld> WITH <val>   - Update field value in active or filtered records',
            '• DELETE [FOR <condition>]   - Mark active record (or filtered) for deletion',
            '• RECALL [ALL]               - Unmark deleted records',
            '• PACK                       - Permanently remove records marked for deletion',
            '• ZAP                        - Erase all records in the active table',
            '• COUNT [FOR <condition>]    - Count matching records',
            '• SUM <field> [FOR <cond>]   - Calculate sum of numeric field',
            '• LOCATE FOR <condition>     - Find first matching record and move pointer',
            '• GO TOP / BOTTOM / <recno>  - Move record pointer',
            '• SKIP [n]                   - Move record pointer forward or backward',
            '• DO FORM <formname>         - Execute and run a visual form',
            '• MODIFY FORM <formname>     - Open visual form designer canvas',
            '• SELECT <cols> FROM <table> - Execute SQL query against DBF database',
            '• ? SYS(5) / ? CURDIR()     - Print current drive (SYS(5)) or current directory (CURDIR())',
            '• ? <expression>             - Evaluate and print expression (e.g. ? DATE(), ? FULLPATH("CUSTOMERS.DBF"))',
            '• CLEAR                      - Clear command log output',
          ].join('\n'),
          timestamp,
        },
      };
    }

    // 2. CLEAR command
    if (upper === 'CLEAR') {
      return {
        clearWindow: true,
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: 'Command window cleared.',
          timestamp,
        },
      };
    }

    // 3. Print / Evaluate expression: ? expression
    if (rawCmd.startsWith('?')) {
      const expr = rawCmd.substring(1).trim();
      const allTables = [...context.project.database.tables, ...context.project.freeTables];
      const activeTable = allTables.find((t) => t.id === context.activeTableId);
      const activeRec = activeTable?.records.find((r) => r._recno === context.activeRecno);

      const result = VFPExpressionEngine.evaluate(expr, {
        currentRecord: activeRec,
        table: activeTable,
        allTables,
        memoryVars: context.memoryVars,
        project: context.project,
      });

      return {
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `=> ${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}`,
          timestamp,
        },
      };
    }

    // --- WORKING DIRECTORY & DRIVE COMMANDS ---

    // 3a. SET DEFAULT TO <path> / SET DEFA TO <path>
    if (upper.startsWith('SET DEFAULT TO') || upper.startsWith('SET DEFA TO') || upper.startsWith('SET DEFAULT')) {
      let targetPath = rawCmd.replace(/^SET\s+DEFA(ULT)?(\s+TO)?\s*/i, '').trim();
      targetPath = targetPath.replace(/^['"]|['"]$/g, ''); // strip quotes if any

      if (!targetPath) {
        // Query current default
        const currentDef = context.project.currentDirectory || `${context.project.defaultDrive || 'X:'}\\VFP_DATA\\`;
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: true,
            message: `Current Default Directory: ${currentDef}`,
            timestamp,
          },
        };
      }

      // Parse drive vs directory
      let newDrive = context.project.defaultDrive || 'X:';
      let newDir = targetPath;

      const driveMatch = /^([A-Za-z]:)(.*)$/.exec(targetPath);
      if (driveMatch) {
        newDrive = driveMatch[1].toUpperCase();
        const rest = driveMatch[2];
        newDir = rest ? `${newDrive}${rest.startsWith('\\') || rest.startsWith('/') ? rest : '\\' + rest}` : `${newDrive}\\`;
      } else if (!targetPath.startsWith('/') && !targetPath.startsWith('\\')) {
        newDir = `${newDrive}\\${targetPath}\\`;
      }

      // Normalize slashes
      if (!newDir.endsWith('\\') && !newDir.endsWith('/')) {
        newDir += '\\';
      }

      if (context.onSetDefault) {
        context.onSetDefault(newDir);
      }

      return {
        newDefaultDrive: newDrive,
        newCurrentDirectory: newDir,
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `Default drive and directory set to: ${newDir} (SYS(5)="${newDrive}", CURDIR()="${newDir.replace(/^[A-Za-z]:/i, '')}")`,
          timestamp,
        },
      };
    }

    // 3b. CD <path> / CHDIR <path>
    if (upper.startsWith('CD ') || upper.startsWith('CHDIR ') || upper === 'CD' || upper === 'CHDIR') {
      let targetPath = rawCmd.replace(/^(CD|CHDIR)\s*/i, '').trim().replace(/^['"]|['"]$/g, '');

      if (!targetPath) {
        const currentDef = context.project.currentDirectory || `${context.project.defaultDrive || 'X:'}\\VFP_DATA\\`;
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: true,
            message: `Current Directory is: ${currentDef}`,
            timestamp,
          },
        };
      }

      let newDrive = context.project.defaultDrive || 'X:';
      let newDir = targetPath;

      const driveMatch = /^([A-Za-z]:)(.*)$/.exec(targetPath);
      if (driveMatch) {
        newDrive = driveMatch[1].toUpperCase();
        const rest = driveMatch[2];
        newDir = rest ? `${newDrive}${rest.startsWith('\\') || rest.startsWith('/') ? rest : '\\' + rest}` : `${newDrive}\\`;
      } else {
        newDir = `${newDrive}\\${targetPath}`;
      }

      if (!newDir.endsWith('\\') && !newDir.endsWith('/')) {
        newDir += '\\';
      }

      if (context.onSetDefault) {
        context.onSetDefault(newDir);
      }

      return {
        newDefaultDrive: newDrive,
        newCurrentDirectory: newDir,
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `Directory changed to: ${newDir}`,
          timestamp,
        },
      };
    }

    // 3c. SET PATH TO <paths>
    if (upper.startsWith('SET PATH TO') || upper.startsWith('SET PATH')) {
      const searchPath = rawCmd.replace(/^SET\s+PATH(\s+TO)?\s*/i, '').trim().replace(/^['"]|['"]$/g, '');
      if (context.onSetPath) {
        context.onSetPath(searchPath);
      }
      return {
        newSearchPath: searchPath,
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `Search path set to: ${searchPath || '(empty)'}`,
          timestamp,
        },
      };
    }

    // 3d. DIR / DIRECTORY
    if (upper.startsWith('DIR') || upper.startsWith('DIRECTORY')) {
      const allTables = [...context.project.database.tables, ...context.project.freeTables];
      const curDir = context.project.currentDirectory || `${context.project.defaultDrive || 'X:'}\\VFP_DATA\\`;
      const curDrive = context.project.defaultDrive || 'X:';

      const lines = [
        `Database Files in ${curDir}`,
        '----------------------------------------------------------------------',
        'Filename             Records     Last Update    Size (Bytes)   Status',
        '----------------------------------------------------------------------',
      ];

      let totalRecords = 0;
      let totalBytes = 0;

      allTables.forEach((tbl) => {
        const fname = tbl.filename.padEnd(20, ' ');
        const recs = String(tbl.records.length).padStart(8, ' ');
        const dateStr = (tbl.lastModified || '2026-08-17').padEnd(14, ' ');
        // Est DBF size: 32 + (fields * 32) + 1 + (records * record_length)
        const estRecordLen = tbl.fields.reduce((acc, f) => acc + (f.length || 10), 1);
        const estBytes = 32 + (tbl.fields.length * 32) + 1 + (tbl.records.length * estRecordLen);
        const sizeStr = String(estBytes).padStart(12, ' ');
        const status = tbl.id === context.activeTableId ? ' [ACTIVE]' : '';

        lines.push(`${fname} ${recs}   ${dateStr} ${sizeStr}${status}`);
        totalRecords += tbl.records.length;
        totalBytes += estBytes;
      });

      // Also list mounted files if present
      if (context.project.mountedFiles && context.project.mountedFiles.length > 0) {
        lines.push('----------------------------------------------------------------------');
        lines.push(`Mounted Local Drive Files (${context.project.mountedFolderName || curDrive}):`);
        context.project.mountedFiles.forEach((mf) => {
          lines.push(`${mf.name.padEnd(20, ' ')}   Mounted    ${mf.lastModified.padEnd(14, ' ')} ${String(mf.size).padStart(12, ' ')}  [LOCAL DISK]`);
        });
      }

      lines.push('----------------------------------------------------------------------');
      lines.push(`${allTables.length} file(s), ${totalRecords} records, ${totalBytes.toLocaleString()} total bytes.`);

      return {
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: lines.join('\n'),
          timestamp,
        },
      };
    }

    // 3e. SET (Display Environment Status)
    if (upper === 'SET' || upper === 'DISP STAT' || upper === 'DISPLAY STATUS') {
      const curDir = context.project.currentDirectory || `${context.project.defaultDrive || 'X:'}\\VFP_DATA\\`;
      const curDrive = context.project.defaultDrive || 'X:';
      const searchPath = context.project.searchPath || `${curDrive}\\DATA;${curDrive}\\FORMS;${curDrive}\\REPORTS`;
      const allTables = [...context.project.database.tables, ...context.project.freeTables];
      const activeTable = allTables.find((t) => t.id === context.activeTableId);

      const statusLines = [
        '=== FOXSTUDIO ENVIRONMENT STATUS ===',
        `Default Drive (SYS(5)):       ${curDrive}`,
        `Current Directory (CURDIR()): ${curDir.replace(/^[A-Za-z]:/i, '')}`,
        `Full Default Path:            ${curDir}`,
        `Search Path (SET PATH):       ${searchPath}`,
        `Database:                     ${context.project.database.name} (${allTables.length} tables)`,
        `Active Work Area:             ${activeTable ? `Table "${activeTable.name}" (Record ${context.activeRecno} of ${activeTable.records.length})` : 'None (No table open)'}`,
        `Mounted Local Drive:          ${context.project.mountedFolderName ? `${context.project.mountedFolderName} [ACTIVE]` : 'None (Virtual drive active)'}`,
        `Date Format:                  YYYY-MM-DD (ANSI)`,
        `Deleted Status (SET DELETED): OFF`,
        `Exact Status (SET EXACT):     OFF`,
      ];

      return {
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: statusLines.join('\n'),
          timestamp,
        },
      };
    }

    // All available tables
    const allTables = [...context.project.database.tables, ...context.project.freeTables];
    const activeTable = allTables.find((t) => t.id === context.activeTableId);

    // 4. USE [FileName | ?] [IN nWorkArea | cTableAlias] [EXCLUSIVE | SHARED] [NOUPDATE] [ALIAS cTableAlias] [AGAIN] [ORDER TagName]
    if (upper.startsWith('USE')) {
      let rest = rawCmd.substring(3).trim();

      if (!rest) {
        // USE with no param closes table in current workarea
        return {
          newActiveTableId: undefined,
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: true,
            message: 'Current work area closed.',
            timestamp,
          },
        };
      }

      // Check for 'USE ?' - FoxPro file open prompt
      if (rest.startsWith('?')) {
        if (context.onOpenImport) {
          context.onOpenImport();
        }
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: true,
            message: 'Prompted Open File Dialog for .DBF table (USE ?)...',
            timestamp,
          },
        };
      }

      // Parse out VFP clauses (EXCLUSIVE, SHARED, AGAIN, NOUPDATE, IN <...>, ALIAS <...>, ORDER <...>)
      let cleanedParam = rest;
      cleanedParam = cleanedParam.replace(/\b(EXCLUSIVE|SHARED|AGAIN|NOUPDATE)\b/gi, '').trim();
      cleanedParam = cleanedParam.replace(/\bIN\s+[0-9A-Za-z_]+\b/gi, '').trim();
      cleanedParam = cleanedParam.replace(/\bALIAS\s+[0-9A-Za-z_]+\b/gi, '').trim();
      cleanedParam = cleanedParam.replace(/\bORDER\s+[0-9A-Za-z_]+\b/gi, '').trim();

      const parsed = cleanFileNameOrPath(cleanedParam);
      const targetBase = parsed.baseName.toUpperCase();
      const targetFile = parsed.fileName.toUpperCase();

      // Look up in all existing tables in project database & free tables
      let targetTable = allTables.find((t) => {
        const tBase = t.name.toUpperCase();
        const tFile = t.filename.toUpperCase();
        const tBaseFromFile = t.filename.replace(/\.dbf$/i, '').toUpperCase();
        const tId = t.id.toUpperCase();

        return (
          tBase === targetBase ||
          tFile === targetFile ||
          tFile === `${targetBase}.DBF` ||
          tBaseFromFile === targetBase ||
          tId === targetBase
        );
      });

      // If not yet in memory, check if it is in project.mountedFiles (e.g. from local mounted folder)
      if (!targetTable && context.project.mountedFiles && context.project.mountedFiles.length > 0) {
        const matchedMounted = context.project.mountedFiles.find((mf) => {
          const mfBase = mf.name.replace(/\.dbf$/i, '').toUpperCase();
          const mfName = mf.name.toUpperCase();
          return mfBase === targetBase || mfName === targetFile || mfName === `${targetBase}.DBF`;
        });

        if (matchedMounted) {
          // If the mounted file has a FileSystemHandle, attempt to read & auto-parse
          if (matchedMounted.handle && context.onImportTable) {
            try {
              (async () => {
                try {
                  const file = await (matchedMounted.handle as any).getFile();
                  const buffer = await file.arrayBuffer();
                  const table = DBFBinaryEngine.parseDBF(buffer, file.name);
                  if (context.onImportTable) {
                    context.onImportTable(table);
                  }
                  if (context.onOpenTable) {
                    context.onOpenTable(table.id);
                  }
                } catch (e) {
                  console.error('Failed to auto-load mounted DBF:', e);
                }
              })();

              return {
                log: {
                  id: Math.random().toString(36).substr(2, 9),
                  command: rawCmd,
                  success: true,
                  message: `Loading mounted disk table '${matchedMounted.name}' (${matchedMounted.size} bytes) from ${context.project.mountedFolderName || 'mounted drive'}...`,
                  timestamp,
                },
              };
            } catch (err) {
              console.warn('Error reading handle:', err);
            }
          }

          return {
            log: {
              id: Math.random().toString(36).substr(2, 9),
              command: rawCmd,
              success: true,
              message: `Found mounted disk file '${matchedMounted.name}'. Click "Import .DBF" to load it into the active workspace.`,
              timestamp,
            },
          };
        }
      }

      if (!targetTable) {
        const curDir = context.project.currentDirectory || `${context.project.defaultDrive || 'X:'}\\VFP_DATA\\`;
        const availableTableNames = allTables.map((t) => t.name).join(', ');

        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: false,
            message: `Error 1: File '${targetBase}.DBF' does not exist in working directory '${curDir}'.\n` +
              `• Current In-Memory Tables: [${availableTableNames || 'None'}]\n` +
              `• How to load a real DBF from your D: drive in this web app:\n` +
              `   1. Type 'USE ?' to browse and open the .DBF file directly from your computer.\n` +
              `   2. Or click 'Drive Manager' to mount your local folder '${curDir}' (using File System Access API).\n` +
              `   3. Or click 'Import .DBF' in the top menu.`,
            timestamp,
          },
        };
      }

      return {
        newActiveTableId: targetTable.id,
        newActiveRecno: targetTable.records.length > 0 ? 1 : 0,
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `Selected table '${targetTable.name}' (${targetTable.records.length} records, ${targetTable.fields.length} fields) in work area 1.`,
          timestamp,
          tableAffected: targetTable.name,
        },
      };
    }

    // 5. BROWSE
    if (upper.startsWith('BROWSE')) {
      if (!activeTable) {
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: false,
            message: 'Error 52: No table is open in current work area. Use "USE <tablename>" first.',
            timestamp,
          },
        };
      }
      context.onBrowse(activeTable.id);
      return {
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `Opened BROWSE window for table '${activeTable.name}'.`,
          timestamp,
        },
      };
    }

    // 6. MODIFY STRUCTURE
    if (upper.startsWith('MODIFY STRUCTURE') || upper === 'MODI STRU') {
      if (!activeTable) {
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: false,
            message: 'Error: No active table selected.',
            timestamp,
          },
        };
      }
      context.onModifyStructure(activeTable.id);
      return {
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `Opened Table Designer for '${activeTable.name}'.`,
          timestamp,
        },
      };
    }

    // 7. LIST STRUCTURE / DISPLAY STRUCTURE
    if (upper.startsWith('LIST STRUCTURE') || upper.startsWith('DISPLAY STRUCTURE') || upper === 'LIST STRU') {
      if (!activeTable) {
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: false,
            message: 'Error: No active table selected.',
            timestamp,
          },
        };
      }

      const lines = [
        `Structure for database table: ${activeTable.filename}`,
        `Number of data records: ${activeTable.records.length}`,
        `Date of last update: ${activeTable.lastModified || 'Today'}`,
        'Field  Field Name    Type       Width    Dec   Null',
        '---------------------------------------------------',
      ];

      activeTable.fields.forEach((f, idx) => {
        const num = String(idx + 1).padStart(4, ' ');
        const name = f.name.padEnd(13, ' ');
        const typeStr = (f.type === 'C' ? 'Character' : f.type === 'N' ? 'Numeric' : f.type === 'D' ? 'Date' : f.type === 'L' ? 'Logical' : f.type === 'M' ? 'Memo' : f.type === 'I' ? 'Integer' : 'Currency').padEnd(10, ' ');
        const width = String(f.length).padStart(5, ' ');
        const dec = f.decimals ? String(f.decimals).padStart(6, ' ') : '      ';
        const nullStr = f.nullable ? '  Yes' : '   No';
        lines.push(`${num}  ${name} ${typeStr} ${width} ${dec} ${nullStr}`);
      });

      return {
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: lines.join('\n'),
          timestamp,
        },
      };
    }

    // 8. APPEND BLANK
    if (upper.startsWith('APPEND BLANK') || upper === 'APPEND') {
      if (!activeTable) {
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: false,
            message: 'Error: No active table open.',
            timestamp,
          },
        };
      }

      const newRec: DBFRecord = {
        _recno: activeTable.records.length + 1,
        _deleted: false,
      };

      activeTable.fields.forEach((f) => {
        newRec[f.name] = f.type === 'N' || f.type === 'I' || f.type === 'Y' ? 0 : f.type === 'L' ? false : '';
      });

      const updatedTable: DBFTable = {
        ...activeTable,
        records: [...activeTable.records, newRec],
      };

      return {
        updatedTable,
        newActiveRecno: newRec._recno,
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `Record ${newRec._recno} appended to '${activeTable.name}'.`,
          timestamp,
        },
      };
    }

    // 9. REPLACE <field> WITH <val> [FOR <condition>]
    if (upper.startsWith('REPLACE')) {
      if (!activeTable) {
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: false,
            message: 'Error: No active table open.',
            timestamp,
          },
        };
      }

      const match = /^REPLACE\s+([A-Za-z0-9_]+)\s+WITH\s+(.*?)(?:\s+FOR\s+(.*))?$/i.exec(rawCmd);
      if (!match) {
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: false,
            message: 'Syntax error in REPLACE command. Usage: REPLACE <fieldname> WITH <expression> [FOR <condition>]',
            timestamp,
          },
        };
      }

      const [, fieldName, withExpr, forCond] = match;
      const targetField = activeTable.fields.find((f) => f.name.toUpperCase() === fieldName.toUpperCase());

      if (!targetField) {
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: false,
            message: `Error: Field '${fieldName}' not found in table '${activeTable.name}'.`,
            timestamp,
          },
        };
      }

      let countReplaced = 0;
      const newRecords = activeTable.records.map((r) => {
        let shouldReplace = false;
        if (forCond) {
          shouldReplace = Boolean(
            VFPExpressionEngine.evaluate(forCond, { currentRecord: r, table: activeTable, allTables, memoryVars: context.memoryVars })
          );
        } else {
          shouldReplace = r._recno === context.activeRecno;
        }

        if (shouldReplace) {
          const newVal = VFPExpressionEngine.evaluate(withExpr, { currentRecord: r, table: activeTable, allTables, memoryVars: context.memoryVars });
          countReplaced++;
          return {
            ...r,
            [targetField.name]: newVal,
          };
        }
        return r;
      });

      const updatedTable: DBFTable = {
        ...activeTable,
        records: newRecords,
      };

      return {
        updatedTable,
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `${countReplaced} record(s) updated in '${activeTable.name}'.`,
          timestamp,
        },
      };
    }

    // 10. DELETE [FOR <condition>]
    if (upper.startsWith('DELETE')) {
      if (!activeTable) {
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: false,
            message: 'Error: No active table open.',
            timestamp,
          },
        };
      }

      const forMatch = /^DELETE(?:\s+FOR\s+(.*))?$/i.exec(rawCmd);
      const forCond = forMatch ? forMatch[1] : undefined;

      let countDeleted = 0;
      const newRecords = activeTable.records.map((r) => {
        let mark = false;
        if (forCond) {
          mark = Boolean(VFPExpressionEngine.evaluate(forCond, { currentRecord: r, table: activeTable }));
        } else {
          mark = r._recno === context.activeRecno;
        }
        if (mark) {
          countDeleted++;
          return { ...r, _deleted: true };
        }
        return r;
      });

      const updatedTable: DBFTable = { ...activeTable, records: newRecords };

      return {
        updatedTable,
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `${countDeleted} record(s) marked for deletion. (Use PACK to permanently purge).`,
          timestamp,
        },
      };
    }

    // 11. RECALL [ALL]
    if (upper.startsWith('RECALL')) {
      if (!activeTable) {
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: false,
            message: 'Error: No active table open.',
            timestamp,
          },
        };
      }

      const recallAll = upper.includes('ALL');
      let countRecalled = 0;
      const newRecords = activeTable.records.map((r) => {
        if (r._deleted && (recallAll || r._recno === context.activeRecno)) {
          countRecalled++;
          return { ...r, _deleted: false };
        }
        return r;
      });

      const updatedTable: DBFTable = { ...activeTable, records: newRecords };

      return {
        updatedTable,
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `${countRecalled} record(s) recalled.`,
          timestamp,
        },
      };
    }

    // 12. PACK
    if (upper === 'PACK') {
      if (!activeTable) {
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: false,
            message: 'Error: No active table open.',
            timestamp,
          },
        };
      }

      const activeRecords = activeTable.records.filter((r) => !r._deleted).map((r, i) => ({ ...r, _recno: i + 1 }));
      const countPurged = activeTable.records.length - activeRecords.length;

      const updatedTable: DBFTable = { ...activeTable, records: activeRecords };

      return {
        updatedTable,
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `PACK completed: ${countPurged} deleted record(s) purged. Table '${activeTable.name}' now contains ${activeRecords.length} records.`,
          timestamp,
        },
      };
    }

    // 13. ZAP
    if (upper === 'ZAP') {
      if (!activeTable) {
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: false,
            message: 'Error: No active table open.',
            timestamp,
          },
        };
      }

      const updatedTable: DBFTable = { ...activeTable, records: [] };

      return {
        updatedTable,
        newActiveRecno: 0,
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `ZAP completed: Table '${activeTable.name}' records erased.`,
          timestamp,
        },
      };
    }

    // 14. COUNT [FOR <condition>]
    if (upper.startsWith('COUNT')) {
      if (!activeTable) {
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: false,
            message: 'Error: No active table open.',
            timestamp,
          },
        };
      }

      const forMatch = /^COUNT(?:\s+FOR\s+(.*))?$/i.exec(rawCmd);
      const forCond = forMatch ? forMatch[1] : undefined;

      const count = activeTable.records.filter((r) => {
        if (r._deleted) return false;
        if (!forCond) return true;
        return Boolean(VFPExpressionEngine.evaluate(forCond, { currentRecord: r, table: activeTable }));
      }).length;

      return {
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `${count} records matching condition in '${activeTable.name}'.`,
          timestamp,
        },
      };
    }

    // 15. SUM <field> [FOR <condition>]
    if (upper.startsWith('SUM')) {
      if (!activeTable) {
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: false,
            message: 'Error: No active table open.',
            timestamp,
          },
        };
      }

      const sumMatch = /^SUM\s+([A-Za-z0-9_]+)(?:\s+FOR\s+(.*))?$/i.exec(rawCmd);
      if (!sumMatch) {
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: false,
            message: 'Usage: SUM <fieldname> [FOR <condition>]',
            timestamp,
          },
        };
      }

      const [, fieldName, forCond] = sumMatch;
      const total = activeTable.records
        .filter((r) => {
          if (r._deleted) return false;
          if (!forCond) return true;
          return Boolean(VFPExpressionEngine.evaluate(forCond, { currentRecord: r, table: activeTable }));
        })
        .reduce((sum, r) => sum + (Number(r[fieldName.toUpperCase()] ?? r[fieldName]) || 0), 0);

      return {
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `SUM(${fieldName.toUpperCase()}) = ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          timestamp,
        },
      };
    }

    // 16. GO TOP / GO BOTTOM / GO <recno> / SKIP <n>
    if (upper === 'GO TOP' || upper === 'GO 1') {
      return {
        newActiveRecno: 1,
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: 'Pointer moved to Record 1 (TOP).',
          timestamp,
        },
      };
    }
    if (upper === 'GO BOTTOM') {
      const bottom = activeTable ? activeTable.records.length : 1;
      return {
        newActiveRecno: bottom,
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `Pointer moved to Record ${bottom} (BOTTOM).`,
          timestamp,
        },
      };
    }
    if (upper.startsWith('SKIP')) {
      const n = parseInt(rawCmd.split(/\s+/)[1] || '1', 10);
      const newRec = Math.max(1, Math.min(activeTable?.records.length || 1, context.activeRecno + (isNaN(n) ? 1 : n)));
      return {
        newActiveRecno: newRec,
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `Pointer skipped to Record ${newRec}.`,
          timestamp,
        },
      };
    }

    // 17. DO FORM <formname>
    if (upper.startsWith('DO FORM')) {
      const formParam = rawCmd.substring(7).trim();
      const parsedForm = cleanFileNameOrPath(formParam);
      const formTarget = parsedForm.baseName.toUpperCase();

      const form = context.project.forms.find(
        (f) =>
          f.name.toUpperCase() === formTarget ||
          f.id.toUpperCase() === formTarget ||
          f.name.replace(/\.scx$/i, '').toUpperCase() === formTarget
      );

      if (!form) {
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: false,
            message: `Error: Form '${formTarget}.SCX' not found in project (Available: ${context.project.forms.map((f) => f.name).join(', ')}).`,
            timestamp,
          },
        };
      }

      context.onOpenForm(form.id, true);
      return {
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `Executing Form '${form.name}' in Run Mode.`,
          timestamp,
        },
      };
    }

    // 18. MODIFY FORM <formname>
    if (upper.startsWith('MODIFY FORM') || upper.startsWith('MODI FORM')) {
      const formParam = rawCmd.replace(/^MODI(FY)?\s+FORM\s+/i, '').trim();
      const parsedForm = cleanFileNameOrPath(formParam);
      const formTarget = parsedForm.baseName.toUpperCase();

      const form = context.project.forms.find(
        (f) =>
          f.name.toUpperCase() === formTarget ||
          f.id.toUpperCase() === formTarget ||
          f.name.replace(/\.scx$/i, '').toUpperCase() === formTarget
      );

      if (!form) {
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: false,
            message: `Error: Form '${formTarget}.SCX' not found.`,
            timestamp,
          },
        };
      }

      context.onOpenForm(form.id, false);
      return {
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `Opened Form Designer for '${form.name}'.`,
          timestamp,
        },
      };
    }

    // 19. DO <program.prg>
    if (upper.startsWith('DO ') && !upper.startsWith('DO FORM')) {
      const prgParam = rawCmd.substring(3).trim();
      const parsedPrg = cleanFileNameOrPath(prgParam);
      const prgTarget = parsedPrg.baseName.toUpperCase();

      const prg = context.project.programs?.find(
        (p) =>
          p.name.toUpperCase() === prgTarget ||
          p.name.toUpperCase() === `${prgTarget}.PRG` ||
          p.name.replace(/\.prg$/i, '').toUpperCase() === prgTarget
      );

      if (prg) {
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: true,
            message: `Executing PRG '${prg.name}'...\n${prg.code.split('\n').map((l) => `  ${l}`).join('\n')}`,
            timestamp,
          },
        };
      }
    }

    // 20. SQL Query: SELECT ...
    if (upper.startsWith('SELECT')) {
      const result = VFPSqlEngine.executeRawSQL(rawCmd, allTables);
      if (result.error) {
        return {
          log: {
            id: Math.random().toString(36).substr(2, 9),
            command: rawCmd,
            success: false,
            message: `SQL Error: ${result.error}`,
            timestamp,
          },
        };
      }

      const tablePreview = result.rows
        .slice(0, 5)
        .map((r) => JSON.stringify(r))
        .join('\n');

      return {
        log: {
          id: Math.random().toString(36).substr(2, 9),
          command: rawCmd,
          success: true,
          message: `SQL Query returned ${result.rows.length} rows in ${result.executionTimeMs}ms:\n${tablePreview}${result.rows.length > 5 ? `\n... (+${result.rows.length - 5} more rows)` : ''}`,
          timestamp,
          resultRows: result.rows.length,
        },
      };
    }

    // Unrecognized command
    return {
      log: {
        id: Math.random().toString(36).substr(2, 9),
        command: rawCmd,
        success: false,
        message: `Unrecognized FoxPro command: "${rawCmd}". Type HELP for command syntax reference.`,
        timestamp,
      },
    };
  }
}
