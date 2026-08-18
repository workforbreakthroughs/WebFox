import React, { useState, useEffect } from 'react';
import {
  Search,
  Play,
  Save,
  Plus,
  Trash2,
  Database,
  Code,
  Table as TableIcon,
  Download,
  Filter,
  ArrowUpDown,
  CheckCircle,
  Copy,
  ChevronDown,
  Layers,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { DBFTable, QueryCriterion, QueryDefinition, QueryJoin, QueryOrderBy, QuerySelectedField } from '../types/foxpro';
import { DBFBinaryEngine, VFPSqlEngine } from '../services/dbfEngine';

interface QueryBuilderProps {
  query: QueryDefinition;
  tables: DBFTable[];
  onSaveQuery: (updatedQuery: QueryDefinition) => void;
  onClose: () => void;
  theme: string;
}

export const QueryBuilder: React.FC<QueryBuilderProps> = ({
  query,
  tables,
  onSaveQuery,
  onClose,
  theme,
}) => {
  const [queryName, setQueryName] = useState<string>(query.name);
  const [queryDescription, setQueryDescription] = useState<string>(query.description || '');
  
  // Visual Query State
  const [queryTables, setQueryTables] = useState<{ tableId: string; alias: string; x: number; y: number }[]>(
    query.tables.length > 0
      ? query.tables
      : [{ tableId: tables[0]?.id || '', alias: tables[0]?.name || 'T1', x: 40, y: 30 }]
  );

  const [joins, setJoins] = useState<QueryJoin[]>(query.joins || []);
  const [selectedFields, setSelectedFields] = useState<QuerySelectedField[]>(
    query.selectedFields || []
  );
  const [criteria, setCriteria] = useState<QueryCriterion[]>(query.criteria || []);
  const [orderBy, setOrderBy] = useState<QueryOrderBy[]>(query.orderBy || []);
  const [groupBy, setGroupBy] = useState<string[]>(query.groupBy || []);
  const [isDistinct, setIsDistinct] = useState<boolean>(query.distinct || false);
  const [limit, setLimit] = useState<number | undefined>(query.limit);

  // Raw SQL & Tab View
  const [rawSql, setRawSql] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'visual' | 'sql' | 'results'>('visual');
  const [queryResult, setQueryResult] = useState<{ columns: string[]; rows: any[]; executionTimeMs: number; error?: string } | null>(null);
  const [executing, setExecuting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to execute query');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync generated SQL whenever visual settings change
  useEffect(() => {
    const currentDef: QueryDefinition = {
      ...query,
      tables: queryTables,
      joins,
      selectedFields,
      criteria,
      groupBy,
      orderBy,
      distinct: isDistinct,
      limit,
    };
    const generated = VFPSqlEngine.generateSQL(currentDef, tables);
    setRawSql(generated);
  }, [queryTables, joins, selectedFields, criteria, groupBy, orderBy, isDistinct, limit, tables]);

  // Execute Query
  const handleExecuteQuery = () => {
    setExecuting(true);
    setStatusMessage('Executing FoxPro SQL query...');

    setTimeout(() => {
      try {
        if (activeTab === 'sql' && rawSql.trim()) {
          const res = VFPSqlEngine.executeRawSQL(rawSql, tables);
          setQueryResult(res);
          setActiveTab('results');
          setStatusMessage(res.error ? `SQL Error: ${res.error}` : `Query executed: ${res.rows.length} records returned in ${res.executionTimeMs}ms`);
        } else {
          const currentDef: QueryDefinition = {
            ...query,
            tables: queryTables,
            joins,
            selectedFields,
            criteria,
            groupBy,
            orderBy,
            distinct: isDistinct,
            limit,
          };
          const res = VFPSqlEngine.executeQuery(currentDef, tables);
          setQueryResult(res);
          setActiveTab('results');
          setStatusMessage(`Query executed: ${res.rows.length} records returned in ${res.executionTimeMs}ms`);
        }
      } catch (err: any) {
        setQueryResult({ columns: [], rows: [], executionTimeMs: 0, error: err.message });
        setStatusMessage('Error executing query: ' + err.message);
      } finally {
        setExecuting(false);
      }
    }, 50);
  };

  // Save Query Definition
  const handleSave = () => {
    const updated: QueryDefinition = {
      ...query,
      name: queryName.toUpperCase(),
      description: queryDescription,
      tables: queryTables,
      joins,
      selectedFields,
      criteria,
      groupBy,
      orderBy,
      distinct: isDistinct,
      limit,
      customSql: rawSql,
    };
    onSaveQuery(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Add Table to Query Designer
  const handleAddTable = (tableId: string) => {
    const tbl = tables.find((t) => t.id === tableId);
    if (!tbl) return;
    if (queryTables.some((t) => t.tableId === tableId)) return;

    const newAlias = tbl.name.substring(0, 4).toUpperCase();
    const newPos = { tableId: tbl.id, alias: newAlias, x: 50 + queryTables.length * 240, y: 30 };
    setQueryTables([...queryTables, newPos]);

    // Auto-detect foreign key join
    const primaryTable = tables.find((t) => t.id === queryTables[0]?.tableId);
    if (primaryTable) {
      const matchField = primaryTable.fields.find((pf) => tbl.fields.some((tf) => tf.name === pf.name));
      if (matchField) {
        setJoins([
          ...joins,
          {
            id: 'join_' + Math.random().toString(36).substr(2, 6),
            leftTableId: primaryTable.id,
            leftField: matchField.name,
            rightTableId: tbl.id,
            rightField: matchField.name,
            joinType: 'INNER',
          },
        ]);
      }
    }
  };

  // Remove table
  const handleRemoveTable = (tableId: string) => {
    if (queryTables.length <= 1) return;
    setQueryTables(queryTables.filter((t) => t.tableId !== tableId));
    setJoins(joins.filter((j) => j.leftTableId !== tableId && j.rightTableId !== tableId));
    setSelectedFields(selectedFields.filter((sf) => sf.tableId !== tableId));
    setCriteria(criteria.filter((c) => c.tableId !== tableId));
  };

  // Toggle field in selected list
  const handleToggleField = (tableId: string, fieldName: string) => {
    const existing = selectedFields.find((sf) => sf.tableId === tableId && sf.fieldName === fieldName);
    if (existing) {
      setSelectedFields(selectedFields.filter((sf) => sf.id !== existing.id));
    } else {
      setSelectedFields([
        ...selectedFields,
        {
          id: 'sf_' + Math.random().toString(36).substr(2, 6),
          tableId,
          fieldName,
          alias: fieldName,
          aggregate: 'NONE',
        },
      ]);
    }
  };

  // Add Criteria Filter
  const handleAddCriteria = () => {
    const firstTable = queryTables[0];
    const tbl = tables.find((t) => t.id === firstTable?.tableId);
    setCriteria([
      ...criteria,
      {
        id: 'crit_' + Math.random().toString(36).substr(2, 6),
        tableId: firstTable?.tableId || '',
        field: tbl?.fields[0]?.name || '',
        operator: '=',
        value: '',
        logical: 'AND',
      },
    ]);
  };

  // Add Order By
  const handleAddOrderBy = () => {
    const firstTable = queryTables[0];
    const tbl = tables.find((t) => t.id === firstTable?.tableId);
    setOrderBy([
      ...orderBy,
      {
        id: 'ord_' + Math.random().toString(36).substr(2, 6),
        tableId: firstTable?.tableId || '',
        field: tbl?.fields[0]?.name || '',
        direction: 'ASC',
      },
    ]);
  };

  // Export Results
  const handleExportCSV = () => {
    if (!queryResult || queryResult.rows.length === 0) return;
    const headers = queryResult.columns.map((c) => `"${c}"`).join(',');
    const rows = queryResult.rows.map((r) =>
      queryResult.columns.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${queryName.toLowerCase()}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="vfp_query_builder" className="flex flex-col h-full bg-inherit select-none text-xs">
      {/* Title Bar */}
      <div className={`flex items-center justify-between px-4 py-2 border-b font-bold ${
        theme === 'vfp-classic' ? 'bg-[#000080] text-white' : 'bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200'
      }`}>
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-orange-500" />
          <span>FoxPro Visual Query Designer (RQBE / MODIFY QUERY) - {queryName}</span>
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
            <span>Save Query</span>
          </button>
          <button
            id="btn_run_query"
            onClick={handleExecuteQuery}
            disabled={executing}
            className="px-4 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1.5 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Query (! / Ctrl+E)</span>
          </button>
        </div>
      </div>

      {/* Tabs & Query Name Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-inherit bg-slate-50 dark:bg-neutral-900 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="font-bold text-slate-700 dark:text-neutral-300">Query File:</label>
            <input
              type="text"
              value={queryName}
              onChange={(e) => setQueryName(e.target.value.toUpperCase())}
              className="px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono font-bold uppercase"
            />
          </div>

          <div className="flex bg-slate-200 dark:bg-neutral-800 p-0.5 rounded-lg">
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-3 py-1 rounded-md font-semibold flex items-center space-x-1 ${
                activeTab === 'visual' ? 'bg-white dark:bg-neutral-700 text-orange-600 shadow-xs' : 'text-slate-600 dark:text-neutral-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Visual Diagram (RQBE)</span>
            </button>
            <button
              onClick={() => setActiveTab('sql')}
              className={`px-3 py-1 rounded-md font-semibold flex items-center space-x-1 ${
                activeTab === 'sql' ? 'bg-white dark:bg-neutral-700 text-orange-600 shadow-xs' : 'text-slate-600 dark:text-neutral-300'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>SQL Code</span>
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-3 py-1 rounded-md font-semibold flex items-center space-x-1 ${
                activeTab === 'results' ? 'bg-white dark:bg-neutral-700 text-orange-600 shadow-xs' : 'text-slate-600 dark:text-neutral-300'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Results Grid ({queryResult?.rows.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Add Table Dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-slate-500 font-medium">Add Table:</label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleAddTable(e.target.value);
                e.target.value = '';
              }
            }}
            defaultValue=""
            className="px-2.5 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold"
          >
            <option value="" disabled>
              + Select DBF Table...
            </option>
            {tables.map((t) => (
              <option key={t.id} value={t.id} disabled={queryTables.some((qt) => qt.tableId === t.id)}>
                {t.name}.DBF ({t.records.length} recs)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* TAB 1: VISUAL DIAGRAM / RQBE BUILDER */}
        {activeTab === 'visual' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top: Multi-table schema boxes with joins */}
            <div className="h-64 p-4 border-b border-inherit bg-slate-100 dark:bg-neutral-950 overflow-x-auto flex space-x-6 items-start">
              {queryTables.map((qt) => {
                const tbl = tables.find((t) => t.id === qt.tableId);
                if (!tbl) return null;

                return (
                  <div
                    key={qt.tableId}
                    className="w-56 bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 rounded-lg shadow-md flex flex-col flex-shrink-0 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="px-3 py-1.5 bg-slate-800 text-white font-bold flex justify-between items-center text-xs">
                      <span className="flex items-center space-x-1">
                        <Database className="w-3.5 h-3.5 text-orange-400" />
                        <span>{tbl.name}</span>
                      </span>
                      {queryTables.length > 1 && (
                        <button
                          onClick={() => handleRemoveTable(qt.tableId)}
                          className="text-slate-400 hover:text-rose-400 p-0.5"
                          title="Remove Table"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Field List with Checkboxes */}
                    <div className="p-2 overflow-y-auto max-h-48 space-y-1 font-mono text-xs">
                      {tbl.fields.map((f) => {
                        const isSelected = selectedFields.some((sf) => sf.tableId === qt.tableId && sf.fieldName === f.name);
                        return (
                          <label
                            key={f.name}
                            className={`flex items-center space-x-2 px-1.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer ${
                              isSelected ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold' : 'text-slate-700 dark:text-neutral-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleField(qt.tableId, f.name)}
                              className="rounded text-orange-600 focus:ring-orange-500"
                            />
                            <span>{f.name}</span>
                            <span className="text-[10px] text-slate-400 ml-auto">({f.type})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom: Query clauses (Fields / Joins / Criteria / Grouping / Order) */}
            <div className="flex-1 p-4 overflow-y-auto space-y-6 bg-white dark:bg-neutral-900">
              {/* Selected Fields Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs flex items-center space-x-1.5">
                    <CheckCircle className="w-4 h-4 text-orange-500" />
                    <span>Selected Output Fields ({selectedFields.length === 0 ? 'ALL (*)' : selectedFields.length})</span>
                  </h4>
                </div>

                {selectedFields.length === 0 ? (
                  <div className="p-3 bg-slate-50 dark:bg-neutral-800 rounded-lg text-slate-500 italic text-xs">
                    * All fields from selected tables will be returned. Click table checkboxes above to select specific fields.
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-neutral-800 font-bold border-b border-inherit">
                        <tr>
                          <th className="p-2">Table</th>
                          <th className="p-2">Field</th>
                          <th className="p-2">Alias / Output Name</th>
                          <th className="p-2">Aggregate</th>
                          <th className="p-2 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-inherit font-mono">
                        {selectedFields.map((sf, idx) => {
                          const tbl = tables.find((t) => t.id === sf.tableId);
                          return (
                            <tr key={sf.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50">
                              <td className="p-2 font-sans font-semibold">{tbl?.name || 'T1'}</td>
                              <td className="p-2">{sf.fieldName}</td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={sf.alias || sf.fieldName}
                                  onChange={(e) => {
                                    const next = [...selectedFields];
                                    next[idx].alias = e.target.value;
                                    setSelectedFields(next);
                                  }}
                                  className="px-2 py-0.5 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs w-44"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={sf.aggregate || 'NONE'}
                                  onChange={(e) => {
                                    const next = [...selectedFields];
                                    next[idx].aggregate = e.target.value as any;
                                    setSelectedFields(next);
                                  }}
                                  className="px-2 py-0.5 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-sans"
                                >
                                  <option value="NONE">None</option>
                                  <option value="COUNT">COUNT</option>
                                  <option value="SUM">SUM</option>
                                  <option value="AVG">AVG</option>
                                  <option value="MIN">MIN</option>
                                  <option value="MAX">MAX</option>
                                </select>
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  onClick={() => setSelectedFields(selectedFields.filter((f) => f.id !== sf.id))}
                                  className="text-slate-400 hover:text-rose-500"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Table Relationships & Joins */}
              {queryTables.length > 1 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xs flex items-center space-x-1.5">
                      <Layers className="w-4 h-4 text-blue-500" />
                      <span>Table Relationships & Joins ({joins.length})</span>
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {joins.map((join, idx) => {
                      const leftTbl = tables.find((t) => t.id === join.leftTableId);
                      const rightTbl = tables.find((t) => t.id === join.rightTableId);

                      return (
                        <div
                          key={join.id}
                          className="flex items-center space-x-2 p-2.5 bg-slate-50 dark:bg-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-700"
                        >
                          <span className="font-bold">{leftTbl?.name}</span>
                          <select
                            value={join.leftField}
                            onChange={(e) => {
                              const next = [...joins];
                              next[idx].leftField = e.target.value;
                              setJoins(next);
                            }}
                            className="px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono text-xs"
                          >
                            {leftTbl?.fields.map((f) => (
                              <option key={f.name} value={f.name}>
                                {f.name}
                              </option>
                            ))}
                          </select>

                          <select
                            value={join.joinType}
                            onChange={(e) => {
                              const next = [...joins];
                              next[idx].joinType = e.target.value as any;
                              setJoins(next);
                            }}
                            className="px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-bold text-xs text-blue-600"
                          >
                            <option value="INNER">INNER JOIN (=)</option>
                            <option value="LEFT">LEFT JOIN (&lt;=)</option>
                            <option value="RIGHT">RIGHT JOIN (=&gt;)</option>
                            <option value="CROSS">CROSS JOIN</option>
                          </select>

                          <span className="font-bold">{rightTbl?.name}</span>
                          <select
                            value={join.rightField}
                            onChange={(e) => {
                              const next = [...joins];
                              next[idx].rightField = e.target.value;
                              setJoins(next);
                            }}
                            className="px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono text-xs"
                          >
                            {rightTbl?.fields.map((f) => (
                              <option key={f.name} value={f.name}>
                                {f.name}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => setJoins(joins.filter((j) => j.id !== join.id))}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Criteria / WHERE Filter */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs flex items-center space-x-1.5">
                    <Filter className="w-4 h-4 text-emerald-500" />
                    <span>Filter Criteria (WHERE Clauses)</span>
                  </h4>
                  <button
                    onClick={handleAddCriteria}
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 font-bold text-xs flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Add Condition</span>
                  </button>
                </div>

                {criteria.length === 0 ? (
                  <div className="p-3 bg-slate-50 dark:bg-neutral-800 rounded-lg text-slate-500 text-xs">
                    No filter criteria configured (all records included). Click "+ Add Condition" to filter records.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {criteria.map((crit, idx) => {
                      const curTable = tables.find((t) => t.id === crit.tableId) || tables[0];
                      return (
                        <div
                          key={crit.id}
                          className="flex items-center space-x-2 p-2 bg-slate-50 dark:bg-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-700"
                        >
                          {idx > 0 && (
                            <select
                              value={crit.logical}
                              onChange={(e) => {
                                const next = [...criteria];
                                next[idx].logical = e.target.value as any;
                                setCriteria(next);
                              }}
                              className="px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-bold text-xs text-orange-600"
                            >
                              <option value="AND">AND</option>
                              <option value="OR">OR</option>
                            </select>
                          )}

                          <select
                            value={crit.tableId}
                            onChange={(e) => {
                              const next = [...criteria];
                              next[idx].tableId = e.target.value;
                              const newTbl = tables.find((t) => t.id === e.target.value);
                              if (newTbl && newTbl.fields.length > 0) {
                                next[idx].field = newTbl.fields[0].name;
                              }
                              setCriteria(next);
                            }}
                            className="px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold"
                          >
                            {queryTables.map((qt) => {
                              const t = tables.find((tbl) => tbl.id === qt.tableId);
                              return (
                                <option key={qt.tableId} value={qt.tableId}>
                                  {t?.name}
                                </option>
                              );
                            })}
                          </select>

                          <select
                            value={crit.field}
                            onChange={(e) => {
                              const next = [...criteria];
                              next[idx].field = e.target.value;
                              setCriteria(next);
                            }}
                            className="px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono text-xs"
                          >
                            {curTable?.fields.map((f) => (
                              <option key={f.name} value={f.name}>
                                {f.name}
                              </option>
                            ))}
                          </select>

                          <select
                            value={crit.operator}
                            onChange={(e) => {
                              const next = [...criteria];
                              next[idx].operator = e.target.value as any;
                              setCriteria(next);
                            }}
                            className="px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-bold text-xs"
                          >
                            <option value="=">=</option>
                            <option value="<>">&lt;&gt; (Not equal)</option>
                            <option value=">">&gt;</option>
                            <option value="<">&lt;</option>
                            <option value=">=">&gt;=</option>
                            <option value="<=">&lt;=</option>
                            <option value="LIKE">LIKE (Wildcard %)</option>
                            <option value="IS NULL">IS NULL</option>
                            <option value="IS NOT NULL">IS NOT NULL</option>
                          </select>

                          <input
                            type="text"
                            value={crit.value}
                            onChange={(e) => {
                              const next = [...criteria];
                              next[idx].value = e.target.value;
                              setCriteria(next);
                            }}
                            placeholder="Value / Constant"
                            className="flex-1 px-2.5 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-mono"
                          />

                          <button
                            onClick={() => setCriteria(criteria.filter((c) => c.id !== crit.id))}
                            className="p-1 rounded text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Order By & Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Order By */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xs flex items-center space-x-1.5">
                      <ArrowUpDown className="w-4 h-4 text-purple-500" />
                      <span>Sorting (ORDER BY)</span>
                    </h4>
                    <button
                      onClick={handleAddOrderBy}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 font-bold text-xs"
                    >
                      + Add Sort Field
                    </button>
                  </div>
                  {orderBy.map((ord, idx) => (
                    <div key={ord.id} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={ord.field}
                        onChange={(e) => {
                          const next = [...orderBy];
                          next[idx].field = e.target.value;
                          setOrderBy(next);
                        }}
                        placeholder="Field or Alias"
                        className="flex-1 px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-mono"
                      />
                      <select
                        value={ord.direction}
                        onChange={(e) => {
                          const next = [...orderBy];
                          next[idx].direction = e.target.value as any;
                          setOrderBy(next);
                        }}
                        className="px-2 py-1 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-bold text-xs"
                      >
                        <option value="ASC">Ascending (ASC)</option>
                        <option value="DESC">Descending (DESC)</option>
                      </select>
                      <button
                        onClick={() => setOrderBy(orderBy.filter((o) => o.id !== ord.id))}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Options (Distinct / Limit) */}
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-700">
                  <h4 className="font-bold text-xs">Query Options</h4>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDistinct}
                      onChange={(e) => setIsDistinct(e.target.checked)}
                      className="rounded text-orange-600"
                    />
                    <span>DISTINCT (Unique Rows Only)</span>
                  </label>
                  <div className="flex items-center space-x-2 pt-1">
                    <label className="text-slate-500">Row Limit:</label>
                    <input
                      type="number"
                      value={limit || ''}
                      onChange={(e) => setLimit(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                      placeholder="All records"
                      className="w-24 px-2 py-0.5 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RAW SQL CODE EDITOR */}
        {activeTab === 'sql' && (
          <div className="flex-1 flex flex-col p-4 bg-[#1e1e1e] text-slate-200 font-mono">
            <div className="flex justify-between items-center text-xs text-neutral-400 pb-2 border-b border-neutral-800 font-sans">
              <span>Visual FoxPro / ANSI SQL Query Editor</span>
              <span>Execute with Ctrl+E or Run Query button</span>
            </div>
            <textarea
              value={rawSql}
              onChange={(e) => setRawSql(e.target.value)}
              className="flex-1 w-full bg-transparent p-3 text-xs font-mono text-emerald-400 focus:outline-none resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>
        )}

        {/* TAB 3: RESULTS GRID */}
        {activeTab === 'results' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-900">
            {/* Results Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-inherit bg-slate-50 dark:bg-neutral-800 text-xs">
              <span className="font-mono text-slate-600 dark:text-neutral-300">
                {statusMessage}
              </span>
              {queryResult && queryResult.rows.length > 0 && (
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              )}
            </div>

            {/* Data Grid */}
            <div className="flex-1 overflow-auto">
              {queryResult?.error ? (
                <div className="p-8 text-center text-rose-500 font-mono text-xs">
                  <div className="font-bold mb-1">SQL Execution Error:</div>
                  <div>{queryResult.error}</div>
                </div>
              ) : !queryResult || queryResult.rows.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No records returned or query not yet executed. Click "Run Query" to execute.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-neutral-800 border-b border-slate-300 dark:border-neutral-700 z-10 font-bold">
                    <tr>
                      <th className="p-2 w-10 text-center text-slate-400">#</th>
                      {queryResult.columns.map((col, idx) => (
                        <th key={idx} className="p-2 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
                    {queryResult.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-neutral-800/60">
                        <td className="p-2 text-center text-slate-400 text-[11px]">{rIdx + 1}</td>
                        {queryResult.columns.map((col, cIdx) => (
                          <td key={cIdx} className="p-2 whitespace-nowrap">
                            {row[col] === null || row[col] === undefined ? (
                              <span className="text-slate-400 italic">NULL</span>
                            ) : typeof row[col] === 'boolean' ? (
                              row[col] ? '.T.' : '.F.'
                            ) : (
                              String(row[col])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="absolute bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 text-xs font-semibold z-50">
          <CheckCircle className="w-4 h-4" />
          <span>Query definition saved successfully!</span>
        </div>
      )}
    </div>
  );
};
