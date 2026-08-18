import React, { useState } from 'react';
import {
  Database,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Key,
  Tag,
  Code,
  CheckCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { DBFField, DBFFieldType, DBFIndex, DBFTable } from '../types/foxpro';
import { DBFBinaryEngine } from '../services/dbfEngine';

interface TableDesignerProps {
  table: DBFTable;
  onSaveTable: (updatedTable: DBFTable) => void;
  onCancel: () => void;
  theme: string;
}

export const TableDesigner: React.FC<TableDesignerProps> = ({
  table,
  onSaveTable,
  onCancel,
  theme,
}) => {
  const [tableName, setTableName] = useState<string>(table.name);
  const [fields, setFields] = useState<DBFField[]>(JSON.parse(JSON.stringify(table.fields)));
  const [indexes, setIndexes] = useState<DBFIndex[]>(JSON.parse(JSON.stringify(table.indexes || [])));
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'fields' | 'indexes' | 'ddl'>('fields');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const fieldTypes: { type: DBFFieldType; label: string; desc: string }[] = [
    { type: 'C', label: 'Character', desc: 'Text / string (Fixed length max 254)' },
    { type: 'N', label: 'Numeric', desc: 'Numbers with decimals' },
    { type: 'I', label: 'Integer', desc: '4-byte integer' },
    { type: 'Y', label: 'Currency', desc: 'Fixed 4 decimal precision money' },
    { type: 'F', label: 'Float', desc: 'Floating point value' },
    { type: 'D', label: 'Date', desc: 'Date format (YYYYMMDD)' },
    { type: 'T', label: 'DateTime', desc: 'Date and time timestamp' },
    { type: 'L', label: 'Logical', desc: 'Boolean True / False' },
    { type: 'M', label: 'Memo', desc: 'Variable length long text' },
    { type: 'B', label: 'Blob', desc: 'Binary large object' },
  ];

  // Add new field
  const handleAddField = () => {
    const newField: DBFField = {
      name: `FIELD_${fields.length + 1}`,
      type: 'C',
      length: 20,
      decimals: 0,
      nullable: true,
    };
    setFields([...fields, newField]);
    setSelectedFieldIndex(fields.length);
  };

  // Delete field
  const handleDeleteField = (idx: number) => {
    if (fields.length <= 1) {
      alert('Table must have at least one field.');
      return;
    }
    const newFields = fields.filter((_, i) => i !== idx);
    setFields(newFields);
    setSelectedFieldIndex(Math.min(idx, newFields.length - 1));
  };

  // Move Field Up/Down
  const handleMoveField = (idx: number, dir: 'up' | 'down') => {
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === fields.length - 1)) return;
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    const copy = [...fields];
    const item = copy.splice(idx, 1)[0];
    copy.splice(targetIdx, 0, item);
    setFields(copy);
    setSelectedFieldIndex(targetIdx);
  };

  // Update Field property
  const handleUpdateField = (idx: number, prop: keyof DBFField, val: any) => {
    const updated = [...fields];
    const field = { ...updated[idx], [prop]: val };

    // Set defaults when type changes
    if (prop === 'type') {
      if (val === 'C') {
        field.length = 30;
        field.decimals = 0;
      } else if (val === 'N') {
        field.length = 10;
        field.decimals = 2;
      } else if (val === 'I') {
        field.length = 4;
        field.decimals = 0;
      } else if (val === 'Y') {
        field.length = 10;
        field.decimals = 2;
      } else if (val === 'L') {
        field.length = 1;
        field.decimals = 0;
      } else if (val === 'D') {
        field.length = 8;
        field.decimals = 0;
      } else if (val === 'M') {
        field.length = 10;
        field.decimals = 0;
      }
    }

    // Auto update primary key tag
    if (prop === 'isPrimaryKey' && val) {
      field.indexTag = `${field.name}_PK`;
      // Ensure index is in indexes list
      if (!indexes.some((i) => i.tag === field.indexTag)) {
        setIndexes([...indexes, { tag: `${field.name}_PK`, expression: field.name, order: 'ASC', isUnique: true }]);
      }
    }

    updated[idx] = field;
    setFields(updated);
  };

  // Save structure with record migration
  const handleSave = () => {
    if (!tableName.trim()) {
      alert('Table name cannot be empty.');
      return;
    }

    // Validate field names
    for (const f of fields) {
      if (!f.name.trim()) {
        alert('Field name cannot be empty.');
        return;
      }
      if (!/^[A-Z0-9_]+$/i.test(f.name)) {
        alert(`Invalid field name "${f.name}". Use alphanumeric characters and underscores only.`);
        return;
      }
    }

    // Migrate existing records
    const migratedRecords = table.records.map((rec) => {
      const newRec: Record<string, any> = {
        _recno: rec._recno,
        _deleted: rec._deleted,
      };

      fields.forEach((f) => {
        const oldVal = rec[f.name];
        if (oldVal !== undefined) {
          if (f.type === 'N' || f.type === 'F' || f.type === 'I' || f.type === 'Y') {
            newRec[f.name] = oldVal === null ? null : Number(oldVal);
          } else if (f.type === 'L') {
            newRec[f.name] = Boolean(oldVal);
          } else {
            newRec[f.name] = String(oldVal);
          }
        } else {
          newRec[f.name] = f.defaultValue !== undefined ? f.defaultValue : null;
        }
      });

      return newRec;
    });

    const updatedTable: DBFTable = {
      ...table,
      name: tableName.toUpperCase(),
      filename: `${tableName.toLowerCase()}.dbf`,
      fields,
      records: migratedRecords,
      indexes,
      lastModified: new Date().toISOString().split('T')[0],
    };

    onSaveTable(updatedTable);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const selectedField = fields[selectedFieldIndex];

  return (
    <div id="vfp_table_designer" className="flex flex-col h-full bg-inherit">
      {/* Designer Header */}
      <div className={`flex items-center justify-between px-4 py-2 border-b text-xs font-semibold select-none ${
        theme === 'vfp-classic' ? 'bg-[#000080] text-white' : 'bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200'
      }`}>
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-amber-500" />
          <span>Table Structure Designer (MODIFY STRUCTURE) - {tableName}.DBF</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-inherit border border-white/20"
          >
            Cancel
          </button>
          <button
            id="btn_save_table_structure"
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-3.5 py-1 rounded bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-sm transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Structure (OK)</span>
          </button>
        </div>
      </div>

      {/* Tabs Strip & Table Name */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-inherit bg-slate-50 dark:bg-neutral-900 text-xs">
        <div className="flex items-center space-x-2">
          <label className="font-semibold text-slate-700 dark:text-neutral-300">Table Name:</label>
          <input
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value.toUpperCase())}
            className="px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono font-bold text-xs uppercase"
            maxLength={30}
          />
          <span className="text-[11px] text-slate-500 font-mono">.DBF</span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('fields')}
            className={`px-3 py-1 rounded font-medium ${
              activeTab === 'fields' ? 'bg-orange-600 text-white' : 'text-slate-600 dark:text-neutral-400 hover:bg-black/5'
            }`}
          >
            Fields ({fields.length})
          </button>
          <button
            onClick={() => setActiveTab('indexes')}
            className={`px-3 py-1 rounded font-medium ${
              activeTab === 'indexes' ? 'bg-orange-600 text-white' : 'text-slate-600 dark:text-neutral-400 hover:bg-black/5'
            }`}
          >
            Indexes / Tags ({indexes.length})
          </button>
          <button
            onClick={() => setActiveTab('ddl')}
            className={`px-3 py-1 rounded font-medium ${
              activeTab === 'ddl' ? 'bg-orange-600 text-white' : 'text-slate-600 dark:text-neutral-400 hover:bg-black/5'
            }`}
          >
            SQL DDL Preview
          </button>
        </div>
      </div>

      {/* Main Designer Content */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {activeTab === 'fields' && (
          <>
            {/* Left Fields Grid */}
            <div className="flex-1 flex flex-col border-r border-inherit overflow-hidden">
              {/* Field Action Buttons */}
              <div className="p-2 border-b border-inherit bg-slate-50/50 dark:bg-neutral-900/50 flex items-center space-x-2 text-xs">
                <button
                  id="btn_table_add_field"
                  onClick={handleAddField}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert Field</span>
                </button>
                <button
                  onClick={() => handleDeleteField(selectedFieldIndex)}
                  className="flex items-center space-x-1 px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => handleMoveField(selectedFieldIndex, 'up')}
                  disabled={selectedFieldIndex === 0}
                  className="p-1 rounded border border-slate-300 dark:border-neutral-700 disabled:opacity-30 hover:bg-black/5"
                  title="Move Field Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMoveField(selectedFieldIndex, 'down')}
                  disabled={selectedFieldIndex === fields.length - 1}
                  className="p-1 rounded border border-slate-300 dark:border-neutral-700 disabled:opacity-30 hover:bg-black/5"
                  title="Move Field Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Table of Fields */}
              <div className="flex-1 overflow-auto font-mono text-xs">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-neutral-800 border-b border-inherit text-slate-700 dark:text-neutral-300">
                    <tr>
                      <th className="w-8 px-2 py-1.5 text-center border-r border-inherit">#</th>
                      <th className="px-3 py-1.5 text-left border-r border-inherit">Field Name</th>
                      <th className="px-3 py-1.5 text-left border-r border-inherit">Type</th>
                      <th className="w-16 px-2 py-1.5 text-center border-r border-inherit">Width</th>
                      <th className="w-14 px-2 py-1.5 text-center border-r border-inherit">Dec</th>
                      <th className="w-14 px-2 py-1.5 text-center border-r border-inherit">Null</th>
                      <th className="w-14 px-2 py-1.5 text-center border-r border-inherit">PK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inherit">
                    {fields.map((field, idx) => {
                      const isSel = idx === selectedFieldIndex;
                      return (
                        <tr
                          key={idx}
                          onClick={() => setSelectedFieldIndex(idx)}
                          className={`cursor-pointer transition-colors ${
                            isSel
                              ? 'bg-orange-500/15 text-orange-950 dark:text-orange-100 font-semibold'
                              : 'hover:bg-slate-50 dark:hover:bg-neutral-800/60'
                          }`}
                        >
                          <td className="px-2 py-1.5 text-center border-r border-inherit opacity-75">
                            {idx + 1}
                          </td>
                          <td className="px-2 py-1 border-r border-inherit">
                            <input
                              type="text"
                              value={field.name}
                              onChange={(e) => handleUpdateField(idx, 'name', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/gi, ''))}
                              maxLength={10}
                              className="w-full bg-transparent px-1 py-0.5 rounded focus:bg-white focus:text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 uppercase font-bold"
                            />
                          </td>
                          <td className="px-2 py-1 border-r border-inherit">
                            <select
                              value={field.type}
                              onChange={(e) => handleUpdateField(idx, 'type', e.target.value as DBFFieldType)}
                              className="w-full bg-transparent px-1 py-0.5 rounded focus:bg-white focus:text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            >
                              {fieldTypes.map((ft) => (
                                <option key={ft.type} value={ft.type}>
                                  {ft.label} ({ft.type})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-1 border-r border-inherit text-center">
                            <input
                              type="number"
                              value={field.length}
                              disabled={field.type === 'L' || field.type === 'D' || field.type === 'M' || field.type === 'I'}
                              onChange={(e) => handleUpdateField(idx, 'length', parseInt(e.target.value, 10) || 1)}
                              className="w-full bg-transparent text-center px-1 py-0.5 rounded focus:bg-white focus:text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                              min={1}
                              max={254}
                            />
                          </td>
                          <td className="px-2 py-1 border-r border-inherit text-center">
                            <input
                              type="number"
                              value={field.decimals}
                              disabled={field.type !== 'N' && field.type !== 'F' && field.type !== 'Y'}
                              onChange={(e) => handleUpdateField(idx, 'decimals', parseInt(e.target.value, 10) || 0)}
                              className="w-full bg-transparent text-center px-1 py-0.5 rounded focus:bg-white focus:text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                              min={0}
                              max={10}
                            />
                          </td>
                          <td className="px-2 py-1 border-r border-inherit text-center">
                            <input
                              type="checkbox"
                              checked={field.nullable}
                              onChange={(e) => handleUpdateField(idx, 'nullable', e.target.checked)}
                              className="rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-2 py-1 border-r border-inherit text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(field.isPrimaryKey)}
                              onChange={(e) => handleUpdateField(idx, 'isPrimaryKey', e.target.checked)}
                              className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Field Property Sheet */}
            {selectedField && (
              <div className="w-full md:w-80 p-4 bg-slate-50/50 dark:bg-neutral-900/50 overflow-y-auto text-xs space-y-4">
                <div className="font-bold border-b pb-2 flex items-center justify-between">
                  <span>Field Properties: {selectedField.name}</span>
                  <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-mono text-[10px]">
                    {selectedField.type}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-semibold block mb-1">Default Value Expression:</label>
                    <input
                      type="text"
                      value={selectedField.defaultValue || ''}
                      onChange={(e) => handleUpdateField(selectedFieldIndex, 'defaultValue', e.target.value)}
                      placeholder='e.g. 0.00 or "USA" or DATE()'
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Validation Rule (Expression):</label>
                    <input
                      type="text"
                      value={selectedField.validationRule || ''}
                      onChange={(e) => handleUpdateField(selectedFieldIndex, 'validationRule', e.target.value)}
                      placeholder="e.g. BALANCE >= 0"
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Validation Error Text:</label>
                    <input
                      type="text"
                      value={selectedField.validationText || ''}
                      onChange={(e) => handleUpdateField(selectedFieldIndex, 'validationText', e.target.value)}
                      placeholder="e.g. Balance cannot be negative"
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Index Tag Name:</label>
                    <input
                      type="text"
                      value={selectedField.indexTag || ''}
                      onChange={(e) => handleUpdateField(selectedFieldIndex, 'indexTag', e.target.value.toUpperCase())}
                      placeholder="e.g. COMP_TAG"
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono uppercase"
                    />
                  </div>

                  <div className="pt-2 border-t text-[11px] text-slate-500 dark:text-neutral-400 space-y-1">
                    <p className="font-semibold text-slate-700 dark:text-neutral-300">FoxPro DBF Specification:</p>
                    <p>• Max field name length: 10 characters.</p>
                    <p>• Character fields: Max 254 bytes.</p>
                    <p>• Memo fields store pointer in .DBF and large text in .FPT container.</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Index Designer Tab */}
        {activeTab === 'indexes' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Table Index Tags (.CDX / Compound Index)</h3>
              <button
                onClick={() =>
                  setIndexes([
                    ...indexes,
                    { tag: `TAG_${indexes.length + 1}`, expression: fields[0]?.name || 'ID', order: 'ASC' },
                  ])
                }
                className="px-3 py-1.5 rounded bg-orange-600 text-white text-xs font-semibold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Index Tag</span>
              </button>
            </div>

            <div className="space-y-2">
              {indexes.map((idxItem, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-3 p-3 rounded border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-xs"
                >
                  <Tag className="w-4 h-4 text-amber-500" />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block">Tag Name</label>
                      <input
                        type="text"
                        value={idxItem.tag}
                        onChange={(e) => {
                          const copy = [...indexes];
                          copy[i].tag = e.target.value.toUpperCase();
                          setIndexes(copy);
                        }}
                        className="w-full px-2 py-1 rounded border border-inherit bg-transparent uppercase font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block">Expression</label>
                      <input
                        type="text"
                        value={idxItem.expression}
                        onChange={(e) => {
                          const copy = [...indexes];
                          copy[i].expression = e.target.value;
                          setIndexes(copy);
                        }}
                        className="w-full px-2 py-1 rounded border border-inherit bg-transparent font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block">Order</label>
                      <select
                        value={idxItem.order}
                        onChange={(e) => {
                          const copy = [...indexes];
                          copy[i].order = e.target.value as 'ASC' | 'DESC';
                          setIndexes(copy);
                        }}
                        className="w-full px-2 py-1 rounded border border-inherit bg-transparent"
                      >
                        <option value="ASC">Ascending (ASC)</option>
                        <option value="DESC">Descending (DESC)</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2 pt-4">
                      <label className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(idxItem.isUnique)}
                          onChange={(e) => {
                            const copy = [...indexes];
                            copy[i].isUnique = e.target.checked;
                            setIndexes(copy);
                          }}
                          className="rounded text-orange-600"
                        />
                        <span className="text-xs">Unique</span>
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={() => setIndexes(indexes.filter((_, idx) => idx !== i))}
                    className="p-1.5 rounded hover:bg-rose-100 text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DDL Preview Tab */}
        {activeTab === 'ddl' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs">
            <h3 className="font-bold text-sm font-sans">Generated FoxPro & SQL Schema DDL</h3>
            <pre className="p-4 rounded bg-slate-900 text-emerald-400 overflow-x-auto leading-relaxed">
              {DBFBinaryEngine.exportToSQL({ ...table, name: tableName, fields })}
            </pre>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="absolute bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 text-xs font-semibold">
          <CheckCircle className="w-4 h-4" />
          <span>Table structure saved successfully!</span>
        </div>
      )}
    </div>
  );
};
