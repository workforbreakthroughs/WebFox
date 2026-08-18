import { DBFField, DBFFieldType, DBFRecord, DBFTable, QueryDefinition } from '../types/foxpro';

/**
 * Real DBF (dBase III / FoxPro) Binary Reader & Writer
 * Enables native interoperability with legacy FoxPro files on Ubuntu/Linux.
 */

export class DBFBinaryEngine {
  /**
   * Parse a raw ArrayBuffer containing standard DBF binary bytes.
   */
  static parseDBF(buffer: ArrayBuffer, filename: string = 'imported.dbf'): DBFTable {
    const view = new DataView(buffer);
    const uint8 = new Uint8Array(buffer);

    // Byte 0: File type (0x03 = dBase III without memo, 0x30 = VFP, 0x83 = dBase III with memo, etc.)
    const fileType = view.getUint8(0);
    // Bytes 1-3: Last update (YY MM DD)
    const year = 1900 + view.getUint8(1);
    const month = view.getUint8(2);
    const day = view.getUint8(3);
    // Bytes 4-7: Number of records (32-bit Little Endian)
    const numRecords = view.getUint32(4, true);
    // Bytes 8-9: Header length in bytes (32-bit Little Endian uint16)
    const headerLength = view.getUint16(8, true);
    // Bytes 10-11: Record length in bytes
    const recordLength = view.getUint16(10, true);

    const decoder = new TextDecoder('windows-1252');

    // Parse Field Descriptors (each is 32 bytes, starting at byte 32 until 0x0D header terminator)
    const fields: DBFField[] = [];
    let offset = 32;

    while (offset < headerLength - 1) {
      if (uint8[offset] === 0x0d) {
        // Terminator reached
        break;
      }

      // Field name (bytes 0-10, null-padded)
      let nameBytes: number[] = [];
      for (let i = 0; i < 11; i++) {
        const b = uint8[offset + i];
        if (b === 0) break;
        nameBytes.push(b);
      }
      const fieldName = String.fromCharCode(...nameBytes).trim().toUpperCase();

      // Field type (byte 11)
      const fieldTypeChar = String.fromCharCode(uint8[offset + 11]).toUpperCase() as DBFFieldType;
      // Field length (byte 16)
      const fieldLength = uint8[offset + 16];
      // Field decimals (byte 17)
      const fieldDecimals = uint8[offset + 17];

      if (fieldName) {
        fields.push({
          name: fieldName,
          type: (['C', 'N', 'F', 'I', 'Y', 'D', 'T', 'L', 'M', 'B'].includes(fieldTypeChar) ? fieldTypeChar : 'C') as DBFFieldType,
          length: fieldLength || 10,
          decimals: fieldDecimals || 0,
          nullable: true,
        });
      }

      offset += 32;
    }

    // Parse Data Records
    const records: DBFRecord[] = [];
    let recordOffset = headerLength;

    for (let r = 0; r < numRecords && recordOffset < buffer.byteLength; r++) {
      // Byte 0 of each record is deletion flag: 0x20 (' ') = Active, 0x2A ('*') = Deleted
      const deletionByte = uint8[recordOffset];
      const isDeleted = deletionByte === 0x2a;

      const record: DBFRecord = {
        _recno: r + 1,
        _deleted: isDeleted,
      };

      let fieldOffset = recordOffset + 1; // skip deletion byte

      for (const field of fields) {
        const rawFieldBytes = uint8.subarray(fieldOffset, fieldOffset + field.length);
        const strVal = decoder.decode(rawFieldBytes).trim();

        if (field.type === 'N' || field.type === 'F' || field.type === 'I' || field.type === 'Y') {
          record[field.name] = strVal === '' ? null : Number(strVal);
        } else if (field.type === 'L') {
          const upper = strVal.toUpperCase();
          record[field.name] = upper === 'T' || upper === 'Y' || upper === '1';
        } else if (field.type === 'D') {
          // Format YYYYMMDD -> YYYY-MM-DD
          if (strVal.length === 8) {
            record[field.name] = `${strVal.substring(0, 4)}-${strVal.substring(4, 6)}-${strVal.substring(6, 8)}`;
          } else {
            record[field.name] = strVal;
          }
        } else {
          record[field.name] = strVal;
        }

        fieldOffset += field.length;
      }

      records.push(record);
      recordOffset += recordLength;
    }

    const baseName = filename.replace(/\.[^/.]+$/, '').toUpperCase();

    return {
      id: 'tbl_' + Math.random().toString(36).substr(2, 9),
      name: baseName,
      filename: filename.endsWith('.dbf') ? filename : filename + '.dbf',
      fields,
      records,
      indexes: [
        {
          tag: fields[0]?.name ? `${fields[0].name}_TAG` : 'RECNO',
          expression: fields[0]?.name || '_recno',
          order: 'ASC',
        },
      ],
      activeTag: fields[0]?.name ? `${fields[0].name}_TAG` : undefined,
      lastModified: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    };
  }

  /**
   * Export a DBFTable to standard binary ArrayBuffer suitable for saving as .dbf.
   */
  static exportToDBF(table: DBFTable): ArrayBuffer {
    const fields = table.fields;
    const records = table.records;

    // Header size: 32 bytes + (32 bytes * field_count) + 1 byte (0x0D terminator)
    const headerLength = 32 + fields.length * 32 + 1;
    // Record length: 1 (deletion flag) + sum(field.length)
    const recordLength = 1 + fields.reduce((sum, f) => sum + f.length, 0);
    const totalSize = headerLength + records.length * recordLength + 1; // + 1 for 0x1A EOF marker

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    const uint8 = new Uint8Array(buffer);

    const now = new Date();
    // 0: File type (0x03 dBase III standard, widely compatible)
    view.setUint8(0, 0x03);
    // 1-3: YY MM DD
    view.setUint8(1, now.getFullYear() - 1900);
    view.setUint8(2, now.getMonth() + 1);
    view.setUint8(3, now.getDate());
    // 4-7: Record count
    view.setUint32(4, records.length, true);
    // 8-9: Header size
    view.setUint16(8, headerLength, true);
    // 10-11: Record length
    view.setUint16(10, recordLength, true);

    // Write Field Descriptors
    let offset = 32;
    for (const field of fields) {
      // 0-10: Field name (max 10 chars, null padded)
      const fieldName = field.name.toUpperCase().substring(0, 10);
      for (let i = 0; i < 11; i++) {
        view.setUint8(offset + i, i < fieldName.length ? fieldName.charCodeAt(i) : 0);
      }
      // 11: Field type
      view.setUint8(offset + 11, field.type.charCodeAt(0));
      // 16: Length
      view.setUint8(offset + 16, Math.min(255, field.length));
      // 17: Decimals
      view.setUint8(offset + 17, field.decimals || 0);

      offset += 32;
    }

    // Header terminator
    view.setUint8(offset, 0x0d);

    // Write Records
    let recordOffset = headerLength;
    for (const record of records) {
      // Deletion flag
      view.setUint8(recordOffset, record._deleted ? 0x2a : 0x20);

      let fieldOffset = recordOffset + 1;
      for (const field of fields) {
        const val = record[field.name];
        let strVal = '';

        if (val === undefined || val === null) {
          strVal = '';
        } else if (field.type === 'L') {
          strVal = val ? 'T' : 'F';
        } else if (field.type === 'D') {
          strVal = String(val).replace(/[-/]/g, '').substring(0, 8);
        } else if (field.type === 'N' || field.type === 'F' || field.type === 'Y') {
          if (field.decimals > 0) {
            strVal = Number(val).toFixed(field.decimals);
          } else {
            strVal = String(Math.round(Number(val)));
          }
        } else {
          strVal = String(val);
        }

        // Format to fixed length
        if (field.type === 'N' || field.type === 'F' || field.type === 'Y') {
          strVal = strVal.padStart(field.length, ' ');
        } else {
          strVal = strVal.padEnd(field.length, ' ');
        }
        strVal = strVal.substring(0, field.length);

        for (let i = 0; i < field.length; i++) {
          view.setUint8(fieldOffset + i, strVal.charCodeAt(i));
        }

        fieldOffset += field.length;
      }

      recordOffset += recordLength;
    }

    // EOF marker
    view.setUint8(totalSize - 1, 0x1a);

    return buffer;
  }

  /**
   * Import CSV to DBF Table format.
   */
  static parseCSV(csvText: string, tableName: string = 'CSV_IMPORT'): DBFTable {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length === 0) throw new Error('CSV file is empty');

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toUpperCase().replace(/[^A-Z0-9_]/gi, '_').substring(0, 10));

    // Guess field types from first row
    const dataRows = lines.slice(1);
    const sampleVals = dataRows[0] ? dataRows[0].split(',').map((v) => v.trim().replace(/^["']|["']$/g, '')) : [];

    const fields: DBFField[] = headers.map((header, idx) => {
      const sample = sampleVals[idx] || '';
      const isNum = sample !== '' && !isNaN(Number(sample));
      const isDate = /^\d{4}-\d{2}-\d{2}$/.test(sample);
      const isBool = ['true', 'false', 't', 'f', 'yes', 'no', '1', '0'].includes(sample.toLowerCase());

      if (isBool) {
        return { name: header || `COL_${idx + 1}`, type: 'L', length: 1, decimals: 0, nullable: true };
      }
      if (isDate) {
        return { name: header || `COL_${idx + 1}`, type: 'D', length: 8, decimals: 0, nullable: true };
      }
      if (isNum) {
        const hasDec = sample.includes('.');
        return { name: header || `COL_${idx + 1}`, type: 'N', length: 12, decimals: hasDec ? 2 : 0, nullable: true };
      }
      return { name: header || `COL_${idx + 1}`, type: 'C', length: 60, decimals: 0, nullable: true };
    });

    const records: DBFRecord[] = dataRows.map((line, rIdx) => {
      const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      const rec: DBFRecord = { _recno: rIdx + 1, _deleted: false };

      fields.forEach((field, fIdx) => {
        const raw = parts[fIdx];
        if (raw === undefined || raw === '') {
          rec[field.name] = null;
        } else if (field.type === 'N' || field.type === 'F' || field.type === 'Y') {
          rec[field.name] = isNaN(Number(raw)) ? 0 : Number(raw);
        } else if (field.type === 'L') {
          rec[field.name] = ['true', 't', '1', 'yes'].includes(raw.toLowerCase());
        } else {
          rec[field.name] = raw;
        }
      });

      return rec;
    });

    return {
      id: 'tbl_' + Math.random().toString(36).substr(2, 9),
      name: tableName.toUpperCase(),
      filename: `${tableName.toLowerCase()}.dbf`,
      fields,
      records,
      indexes: [{ tag: `${fields[0]?.name || 'REC'}_TAG`, expression: fields[0]?.name || '_recno', order: 'ASC' }],
      lastModified: new Date().toISOString().split('T')[0],
    };
  }

  /**
   * Export DBF Table to CSV.
   */
  static exportToCSV(table: DBFTable, includeDeleted: boolean = false): string {
    const headers = table.fields.map((f) => `"${f.name}"`).join(',');
    const rows = table.records
      .filter((r) => includeDeleted || !r._deleted)
      .map((r) => {
        return table.fields
          .map((f) => {
            const val = r[f.name];
            if (val === null || val === undefined) return '""';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(',');
      });

    return [headers, ...rows].join('\n');
  }

  /**
   * Export DBF Table to SQL script (CREATE TABLE & INSERT).
   */
  static exportToSQL(table: DBFTable): string {
    const typeMap: Record<DBFFieldType, string> = {
      C: 'VARCHAR',
      N: 'DECIMAL',
      F: 'FLOAT',
      I: 'INTEGER',
      Y: 'DECIMAL(12,2)',
      D: 'DATE',
      T: 'TIMESTAMP',
      L: 'BOOLEAN',
      M: 'TEXT',
      B: 'BYTEA',
    };

    const colDefs = table.fields
      .map((f) => {
        let t = typeMap[f.type] || 'VARCHAR';
        if (f.type === 'C') t = `VARCHAR(${f.length})`;
        if (f.type === 'N') t = `NUMERIC(${f.length}, ${f.decimals})`;
        return `  ${f.name.toLowerCase()} ${t}${f.isPrimaryKey ? ' PRIMARY KEY' : ''}`;
      })
      .join(',\n');

    let sql = `-- Table: ${table.name}\nCREATE TABLE ${table.name.toLowerCase()} (\n${colDefs}\n);\n\n`;

    const validRecords = table.records.filter((r) => !r._deleted);
    if (validRecords.length > 0) {
      sql += `-- Records for ${table.name}\n`;
      const colNames = table.fields.map((f) => f.name.toLowerCase()).join(', ');

      for (const rec of validRecords) {
        const valStrings = table.fields.map((f) => {
          const val = rec[f.name];
          if (val === null || val === undefined) return 'NULL';
          if (f.type === 'N' || f.type === 'F' || f.type === 'I' || f.type === 'Y') return String(val);
          if (f.type === 'L') return val ? 'TRUE' : 'FALSE';
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        sql += `INSERT INTO ${table.name.toLowerCase()} (${colNames}) VALUES (${valStrings.join(', ')});\n`;
      }
    }

    return sql;
  }
}

/**
 * FoxPro Standard Library & Expression Evaluator
 */
export class VFPExpressionEngine {
  /**
   * Evaluates a FoxPro expression in the context of an active record/table or variables.
   * e.g. "ALLTRIM(UPPER(customers.company_name)) + ' - ' + STR(balance, 10, 2)"
   */
  static evaluate(expression: string, context: { currentRecord?: DBFRecord; table?: DBFTable; allTables?: DBFTable[]; memoryVars?: Record<string, any>; project?: any }): any {
    if (!expression || expression.trim() === '') return '';

    let expr = expression.trim();
    const upperExpr = expr.toUpperCase();

    const defDrive = context.project?.defaultDrive || 'X:';
    const defDir = context.project?.currentDirectory || 'X:\\VFP_DATA\\';
    const defPath = context.project?.searchPath || 'X:\\DATA;X:\\FORMS;X:\\REPORTS';

    // Check built-in VFP functions
    if (upperExpr === 'DATE()') {
      return new Date().toISOString().split('T')[0];
    }
    if (upperExpr === 'DATETIME()') {
      return new Date().toISOString().replace('T', ' ').substring(0, 19);
    }
    if (upperExpr === 'RECNO()') {
      return context.currentRecord ? context.currentRecord._recno : 1;
    }
    if (upperExpr === 'RECCOUNT()') {
      return context.table ? context.table.records.length : 0;
    }
    if (upperExpr === 'EOF()') {
      return false;
    }
    if (upperExpr === 'BOF()') {
      return false;
    }
    if (upperExpr === 'SYS(5)') {
      return defDrive;
    }
    if (upperExpr === 'SYS(2003)') {
      return defDir.replace(/^[A-Za-z]:/i, '').replace(/\\$/, '');
    }
    if (upperExpr === 'SYS(2004)') {
      return `${defDrive}\\FOXSTUDIO\\`;
    }
    if (upperExpr === 'CURDIR()') {
      return defDir.replace(/^[A-Za-z]:/i, '');
    }

    // Check SET("DEFAULT") or SET('DEFAULT')
    if (upperExpr.startsWith('SET("DEFAULT")') || upperExpr.startsWith("SET('DEFAULT')")) {
      return defDir;
    }
    if (upperExpr.startsWith('SET("PATH")') || upperExpr.startsWith("SET('PATH')")) {
      return defPath;
    }

    // FULLPATH('filename')
    const fullpathMatch = /^FULLPATH\(['"]([^'"]+)['"]\)$/i.exec(expr);
    if (fullpathMatch) {
      const fileName = fullpathMatch[1];
      if (/^[A-Za-z]:|^\\|^\//.test(fileName)) return fileName;
      return `${defDir.endsWith('\\') || defDir.endsWith('/') ? defDir : defDir + '\\'}${fileName}`;
    }

    // Replace table.field or simple field names
    if (context.currentRecord) {
      for (const [key, val] of Object.entries(context.currentRecord)) {
        if (key.startsWith('_')) continue;
        // Check direct field
        if (expr.toLowerCase() === key.toLowerCase()) {
          return val;
        }
        if (context.table && expr.toLowerCase() === `${context.table.name.toLowerCase()}.${key.toLowerCase()}`) {
          return val;
        }
      }
    }

    // Try evaluating compound expressions
    try {
      // Create a sandboxed scope with VFP helpers
      const ALLTRIM = (s: any) => (s !== null && s !== undefined ? String(s).trim() : '');
      const UPPER = (s: any) => (s !== null && s !== undefined ? String(s).toUpperCase() : '');
      const LOWER = (s: any) => (s !== null && s !== undefined ? String(s).toLowerCase() : '');
      const PROPER = (s: any) => (s ? String(s).replace(/\b\w/g, (c) => c.toUpperCase()) : '');
      const LEN = (s: any) => (s ? String(s).length : 0);
      const LEFT = (s: any, n: number) => (s ? String(s).substring(0, n) : '');
      const RIGHT = (s: any, n: number) => (s ? String(s).substring(Math.max(0, String(s).length - n)) : '');
      const SUBSTR = (s: any, start: number, len?: number) => (s ? String(s).substr(start - 1, len) : '');
      const STR = (n: any, len?: number, dec?: number) => (n !== null && n !== undefined ? Number(n).toFixed(dec || 0).padStart(len || 0, ' ') : '');
      const VAL = (s: any) => (s ? parseFloat(String(s)) || 0 : 0);
      const NVL = (a: any, b: any) => (a !== null && a !== undefined && a !== '' ? a : b);
      const IIF = (cond: boolean, trueVal: any, falseVal: any) => (cond ? trueVal : falseVal);
      const SYS = (n: number) => {
        if (n === 5) return defDrive;
        if (n === 2003) return defDir.replace(/^[A-Za-z]:/i, '').replace(/\\$/, '');
        if (n === 2004) return `${defDrive}\\FOXSTUDIO\\`;
        return '';
      };
      const CURDIR = () => defDir.replace(/^[A-Za-z]:/i, '');
      const FULLPATH = (file: string) => `${defDir.endsWith('\\') || defDir.endsWith('/') ? defDir : defDir + '\\'}${file}`;
      const SET = (setting: string) => {
        const u = String(setting).toUpperCase();
        if (u === 'DEFAULT') return defDir;
        if (u === 'PATH') return defPath;
        return '';
      };

      // Build scope variables
      const scope: Record<string, any> = {
        ALLTRIM,
        UPPER,
        LOWER,
        PROPER,
        LEN,
        LEFT,
        RIGHT,
        SUBSTR,
        STR,
        VAL,
        NVL,
        IIF,
        SYS,
        CURDIR,
        FULLPATH,
        SET,
        RECNO: () => (context.currentRecord ? context.currentRecord._recno : 1),
        RECCOUNT: () => (context.table ? context.table.records.length : 0),
        ...(context.memoryVars || {}),
      };

      if (context.currentRecord) {
        for (const [k, v] of Object.entries(context.currentRecord)) {
          if (!k.startsWith('_')) {
            scope[k] = v;
            if (context.table) {
              scope[`${context.table.name}_${k}`] = v;
            }
          }
        }
      }

      // Convert VFP string concatenation "." and "+" to JS
      // Convert FoxPro IIF() / NVL()
      const sanitized = expr
        .replace(/\.AND\./gi, ' && ')
        .replace(/\.OR\./gi, ' || ')
        .replace(/\.NOT\./gi, ' ! ')
        .replace(/<>/g, ' !== ')
        .replace(/==/g, ' === ');

      const keys = Object.keys(scope);
      const values = Object.values(scope);
      const fn = new Function(...keys, `try { return (${sanitized}); } catch(e) { return "${expr}"; }`);
      return fn(...values);
    } catch {
      return expr;
    }
  }
}

/**
 * Visual FoxPro SQL Query Runner for DBF Tables
 */
export class VFPSqlEngine {
  /**
   * Execute a QueryDefinition or raw SQL against active DBF tables.
   */
  static executeQuery(query: QueryDefinition, tables: DBFTable[]): { columns: string[]; rows: any[]; executionTimeMs: number; generatedSql: string } {
    const startTime = performance.now();
    const generatedSql = this.generateSQL(query, tables);

    if (query.tables.length === 0) {
      return { columns: [], rows: [], executionTimeMs: 0, generatedSql: '-- No tables selected' };
    }

    const primaryTableDef = query.tables[0];
    const primaryTable = tables.find((t) => t.id === primaryTableDef.tableId);
    if (!primaryTable) {
      throw new Error(`Table not found: ${primaryTableDef.alias}`);
    }

    // Step 1: Base rows from primary table
    let workingRows: Record<string, any>[] = primaryTable.records
      .filter((r) => !r._deleted)
      .map((r) => {
        const row: Record<string, any> = {};
        for (const field of primaryTable.fields) {
          row[`${primaryTableDef.alias}.${field.name}`] = r[field.name];
          row[field.name] = r[field.name];
        }
        return row;
      });

    // Step 2: Perform Joins
    for (const join of query.joins) {
      const leftTableItem = query.tables.find((t) => t.tableId === join.leftTableId);
      const rightTableItem = query.tables.find((t) => t.tableId === join.rightTableId);
      const rightTable = tables.find((t) => t.id === join.rightTableId);

      if (!leftTableItem || !rightTableItem || !rightTable) continue;

      const joinedRows: Record<string, any>[] = [];

      for (const row of workingRows) {
        const leftVal = row[`${leftTableItem.alias}.${join.leftField}`] ?? row[join.leftField];
        const matches = rightTable.records.filter((r) => !r._deleted && String(r[join.rightField]) === String(leftVal));

        if (matches.length > 0) {
          for (const match of matches) {
            const combined = { ...row };
            for (const f of rightTable.fields) {
              combined[`${rightTableItem.alias}.${f.name}`] = match[f.name];
            }
            joinedRows.push(combined);
          }
        } else if (join.joinType === 'LEFT' || join.joinType === 'CROSS') {
          const combined = { ...row };
          for (const f of rightTable.fields) {
            combined[`${rightTableItem.alias}.${f.name}`] = null;
          }
          joinedRows.push(combined);
        }
      }

      workingRows = joinedRows;
    }

    // Step 3: Apply Criteria (WHERE)
    if (query.criteria.length > 0) {
      workingRows = workingRows.filter((row) => {
        let result = true;
        let logicalOp: 'AND' | 'OR' = 'AND';

        for (const crit of query.criteria) {
          const tableAlias = query.tables.find((t) => t.tableId === crit.tableId)?.alias;
          const key = tableAlias ? `${tableAlias}.${crit.field}` : crit.field;
          const val = row[key] ?? row[crit.field];

          let match = false;
          const targetVal = crit.value.trim();

          switch (crit.operator) {
            case '=':
              match = String(val ?? '').toLowerCase() === targetVal.toLowerCase();
              break;
            case '<>':
              match = String(val ?? '').toLowerCase() !== targetVal.toLowerCase();
              break;
            case '>':
              match = Number(val) > Number(targetVal);
              break;
            case '<':
              match = Number(val) < Number(targetVal);
              break;
            case '>=':
              match = Number(val) >= Number(targetVal);
              break;
            case '<=':
              match = Number(val) <= Number(targetVal);
              break;
            case 'LIKE':
              const pattern = targetVal.replace(/%/g, '.*').replace(/_/g, '.');
              match = new RegExp(pattern, 'i').test(String(val ?? ''));
              break;
            case 'IS NULL':
              match = val === null || val === undefined || val === '';
              break;
            case 'IS NOT NULL':
              match = val !== null && val !== undefined && val !== '';
              break;
            case 'BETWEEN':
              match = Number(val) >= Number(targetVal) && Number(val) <= Number(crit.value2 || targetVal);
              break;
            default:
              match = true;
          }

          if (crit === query.criteria[0]) {
            result = match;
          } else {
            result = logicalOp === 'AND' ? result && match : result || match;
          }

          logicalOp = crit.logical || 'AND';
        }

        return result;
      });
    }

    // Step 4: Group By and Aggregation if specified
    const hasAggregates = query.selectedFields.some((f) => f.aggregate && f.aggregate !== 'NONE');

    let outputRows: any[] = [];
    const columns: string[] = [];

    // Determine target columns
    if (query.selectedFields.length === 0) {
      // Select all fields
      for (const tableDef of query.tables) {
        const t = tables.find((tbl) => tbl.id === tableDef.tableId);
        if (t) {
          for (const f of t.fields) {
            columns.push(`${tableDef.alias}.${f.name}`);
          }
        }
      }
      outputRows = workingRows;
    } else {
      query.selectedFields.forEach((sf) => {
        const colName = sf.alias || (sf.aggregate && sf.aggregate !== 'NONE' ? `${sf.aggregate}(${sf.fieldName})` : sf.fieldName);
        columns.push(colName);
      });

      if (hasAggregates || query.groupBy.length > 0) {
        // Grouping logic
        const groups = new Map<string, Record<string, any>[]>();

        for (const row of workingRows) {
          const groupKey = query.groupBy.map((g) => String(row[g] ?? '')).join('|--|');
          if (!groups.has(groupKey)) groups.set(groupKey, []);
          groups.get(groupKey)!.push(row);
        }

        groups.forEach((groupItems) => {
          const outRow: Record<string, any> = {};

          query.selectedFields.forEach((sf) => {
            const tableAlias = query.tables.find((t) => t.tableId === sf.tableId)?.alias;
            const fullKey = tableAlias ? `${tableAlias}.${sf.fieldName}` : sf.fieldName;
            const colName = sf.alias || (sf.aggregate && sf.aggregate !== 'NONE' ? `${sf.aggregate}(${sf.fieldName})` : sf.fieldName);

            if (sf.aggregate === 'COUNT') {
              outRow[colName] = groupItems.length;
            } else if (sf.aggregate === 'SUM') {
              outRow[colName] = groupItems.reduce((s, item) => s + (Number(item[fullKey] ?? item[sf.fieldName]) || 0), 0);
            } else if (sf.aggregate === 'AVG') {
              const sum = groupItems.reduce((s, item) => s + (Number(item[fullKey] ?? item[sf.fieldName]) || 0), 0);
              outRow[colName] = groupItems.length ? Number((sum / groupItems.length).toFixed(2)) : 0;
            } else if (sf.aggregate === 'MIN') {
              const nums = groupItems.map((item) => Number(item[fullKey] ?? item[sf.fieldName])).filter((n) => !isNaN(n));
              outRow[colName] = nums.length ? Math.min(...nums) : 0;
            } else if (sf.aggregate === 'MAX') {
              const nums = groupItems.map((item) => Number(item[fullKey] ?? item[sf.fieldName])).filter((n) => !isNaN(n));
              outRow[colName] = nums.length ? Math.max(...nums) : 0;
            } else {
              outRow[colName] = groupItems[0]?.[fullKey] ?? groupItems[0]?.[sf.fieldName];
            }
          });

          outputRows.push(outRow);
        });
      } else {
        // Simple projection
        outputRows = workingRows.map((row) => {
          const outRow: Record<string, any> = {};
          query.selectedFields.forEach((sf) => {
            const tableAlias = query.tables.find((t) => t.tableId === sf.tableId)?.alias;
            const fullKey = tableAlias ? `${tableAlias}.${sf.fieldName}` : sf.fieldName;
            const colName = sf.alias || sf.fieldName;
            outRow[colName] = row[fullKey] ?? row[sf.fieldName];
          });
          return outRow;
        });
      }
    }

    // Step 5: Order By
    if (query.orderBy.length > 0) {
      outputRows.sort((a, b) => {
        for (const ord of query.orderBy) {
          const valA = a[ord.field];
          const valB = b[ord.field];
          if (valA === valB) continue;
          const comp = valA > valB ? 1 : -1;
          return ord.direction === 'ASC' ? comp : -comp;
        }
        return 0;
      });
    }

    // Step 6: Distinct & Limit
    if (query.distinct) {
      const seen = new Set<string>();
      outputRows = outputRows.filter((r) => {
        const str = JSON.stringify(r);
        if (seen.has(str)) return false;
        seen.add(str);
        return true;
      });
    }

    if (query.limit && query.limit > 0) {
      outputRows = outputRows.slice(0, query.limit);
    }

    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
    return { columns, rows: outputRows, executionTimeMs, generatedSql };
  }

  /**
   * Generates standard Visual FoxPro SQL string from QueryDefinition
   */
  static generateSQL(query: QueryDefinition, tables: DBFTable[]): string {
    if (query.tables.length === 0) return 'SELECT * FROM ;';

    let sql = 'SELECT ';
    if (query.distinct) sql += 'DISTINCT ';

    if (query.selectedFields.length === 0) {
      sql += '*';
    } else {
      const fieldStrings = query.selectedFields.map((sf) => {
        const tableAlias = query.tables.find((t) => t.tableId === sf.tableId)?.alias;
        let expr = tableAlias ? `${tableAlias}.${sf.fieldName}` : sf.fieldName;
        if (sf.aggregate && sf.aggregate !== 'NONE') {
          expr = `${sf.aggregate}(${expr})`;
        }
        if (sf.alias && sf.alias !== sf.fieldName) {
          expr += ` AS ${sf.alias}`;
        }
        return expr;
      });
      sql += fieldStrings.join(',\n       ');
    }

    const primaryTableDef = query.tables[0];
    const primaryTable = tables.find((t) => t.id === primaryTableDef.tableId);
    sql += `\nFROM ${primaryTable?.name || primaryTableDef.alias} ${primaryTableDef.alias}`;

    for (const join of query.joins) {
      const leftTableItem = query.tables.find((t) => t.tableId === join.leftTableId);
      const rightTableItem = query.tables.find((t) => t.tableId === join.rightTableId);
      const rightTable = tables.find((t) => t.id === join.rightTableId);
      if (leftTableItem && rightTableItem && rightTable) {
        sql += `\n${join.joinType} JOIN ${rightTable.name} ${rightTableItem.alias} ON ${leftTableItem.alias}.${join.leftField} = ${rightTableItem.alias}.${join.rightField}`;
      }
    }

    if (query.criteria.length > 0) {
      sql += '\nWHERE ';
      const critStrings = query.criteria.map((c, i) => {
        const tableAlias = query.tables.find((t) => t.tableId === c.tableId)?.alias;
        const fieldName = tableAlias ? `${tableAlias}.${c.field}` : c.field;
        const val = isNaN(Number(c.value)) ? `'${c.value}'` : c.value;
        const prefix = i > 0 ? ` ${c.logical} ` : '';
        return `${prefix}${fieldName} ${c.operator} ${val}`;
      });
      sql += critStrings.join('');
    }

    if (query.groupBy.length > 0) {
      sql += `\nGROUP BY ${query.groupBy.join(', ')}`;
    }

    if (query.orderBy.length > 0) {
      sql += '\nORDER BY ' + query.orderBy.map((o) => `${o.field} ${o.direction}`).join(', ');
    }

    if (query.limit) {
      sql += `\nLIMIT ${query.limit}`;
    }

    sql += ';';
    return sql;
  }

  /**
   * Execute raw SQL statement
   */
  static executeRawSQL(sql: string, tables: DBFTable[]): { columns: string[]; rows: any[]; executionTimeMs: number; error?: string } {
    const startTime = performance.now();
    try {
      const trimmed = sql.trim().replace(/;$/, '');
      const selectMatch = /^SELECT\s+(.*?)\s+FROM\s+([A-Za-z0-9_]+)(?:\s+(?:WHERE\s+(.*?))?(?:\s+ORDER\s+BY\s+(.*?))?(?:\s+LIMIT\s+(\d+))?)?$/is.exec(trimmed);

      if (!selectMatch) {
        // Fallback simple query parser
        const words = trimmed.split(/\s+/);
        const fromIdx = words.findIndex((w) => w.toUpperCase() === 'FROM');
        if (fromIdx !== -1 && words[fromIdx + 1]) {
          const tableName = words[fromIdx + 1].toUpperCase();
          const targetTable = tables.find((t) => t.name.toUpperCase() === tableName);
          if (targetTable) {
            const rows = targetTable.records.filter((r) => !r._deleted);
            const columns = targetTable.fields.map((f) => f.name);
            return { columns, rows, executionTimeMs: Number((performance.now() - startTime).toFixed(2)) };
          }
        }
        throw new Error('Unsupported SQL statement syntax. Supports SELECT * FROM table [WHERE condition] [ORDER BY column] [LIMIT n]');
      }

      const [, fieldsStr, tableName, whereClause, orderByClause, limitStr] = selectMatch;
      const targetTable = tables.find((t) => t.name.toUpperCase() === tableName.toUpperCase());

      if (!targetTable) {
        throw new Error(`Table '${tableName}' not found in active database.`);
      }

      let rows = [...targetTable.records.filter((r) => !r._deleted)];

      if (whereClause) {
        rows = rows.filter((r) => {
          try {
            return VFPExpressionEngine.evaluate(whereClause, { currentRecord: r, table: targetTable });
          } catch {
            return true;
          }
        });
      }

      if (orderByClause) {
        const [ordField, ordDir] = orderByClause.trim().split(/\s+/);
        const isDesc = ordDir?.toUpperCase() === 'DESC';
        rows.sort((a, b) => {
          const vA = a[ordField.toUpperCase()] ?? a[ordField];
          const vB = b[ordField.toUpperCase()] ?? b[ordField];
          if (vA === vB) return 0;
          return isDesc ? (vA < vB ? 1 : -1) : vA > vB ? 1 : -1;
        });
      }

      if (limitStr) {
        rows = rows.slice(0, parseInt(limitStr, 10));
      }

      const columns =
        fieldsStr.trim() === '*'
          ? targetTable.fields.map((f) => f.name)
          : fieldsStr.split(',').map((f) => f.trim().toUpperCase());

      return {
        columns,
        rows: rows.map((r) => {
          if (fieldsStr.trim() === '*') return r;
          const out: Record<string, any> = {};
          columns.forEach((c) => (out[c] = r[c]));
          return out;
        }),
        executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
      };
    } catch (e: any) {
      return { columns: [], rows: [], executionTimeMs: 0, error: e.message || String(e) };
    }
  }
}
