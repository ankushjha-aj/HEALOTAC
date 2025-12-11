'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Database, Table as TableIcon, Code, Play, Plus, Trash2, RefreshCw, Sun, Moon, ArrowLeft, Save, X, Edit2, MoreVertical } from 'lucide-react'

// Quick Theme Toggle Component
const ThemeToggle = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light')

    useEffect(() => {
        if (document.documentElement.classList.contains('dark')) {
            setTheme('dark')
        }
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('theme', newTheme)
    }

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
    )
}

export default function DatabaseManagerPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'browse' | 'sql'>('browse')
    const [tables, setTables] = useState<any[]>([])
    const [selectedTable, setSelectedTable] = useState<string | null>(null)

    // Data View State
    const [tableData, setTableData] = useState<any[]>([])
    const [tableColumns, setTableColumns] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Editing State
    const [editingCell, setEditingCell] = useState<{ rowIdx: number, col: string } | null>(null)
    const [editValue, setEditValue] = useState('')

    // Schema Editing State
    const [showAddColumn, setShowAddColumn] = useState(false)
    const [newColName, setNewColName] = useState('')
    const [newColType, setNewColType] = useState('VARCHAR(255)')

    // SQL Editor State
    const [customQuery, setCustomQuery] = useState('')
    const [queryResult, setQueryResult] = useState<any>(null)

    // Auth Check
    useEffect(() => {
        const token = localStorage.getItem('jwt_token')
        if (!token) router.push('/admin')
    }, [router])

    // Helper to run raw SQL
    const runQuery = async (query: string, silent = false) => {
        setLoading(true)
        if (!silent) setError(null)
        if (!silent) setSuccess(null)
        try {
            const token = localStorage.getItem('jwt_token')
            const res = await fetch('/api/admin/database/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Operation failed')
            return data
        } catch (e: any) {
            if (!silent) setError(e.message)
            throw e
        } finally {
            setLoading(false)
        }
    }

    // State for DB Info
    const [dbHost, setDbHost] = useState<string>('Connecting...')

    // Fetch Tables
    const fetchTables = useCallback(async () => {
        try {
            const token = localStorage.getItem('jwt_token')
            const res = await fetch('/api/admin/database/tables', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (res.ok) {
                const data = await res.json()
                // data = { tables: [{table_name: ''}], host: '' }
                setTables(data.tables.map((t: any) => t.table_name))
                setDbHost(data.host)
            }
        } catch (e) {
            console.error('Failed to fetch tables')
            setDbHost('Connection Failed')
        }
    }, [])

    useEffect(() => {
        fetchTables()
    }, [fetchTables])

    // Fetch Table Data
    const fetchTableData = async (tableName: string) => {
        setLoading(true)
        setError(null)
        setSelectedTable(tableName)
        setActiveTab('browse')
        setEditingCell(null)

        try {
            // Use text-mode for ctid to ensure it comes back as string
            const query = `SELECT ctid::text, * FROM "${tableName}" LIMIT 100`
            const data = await runQuery(query, true)

            console.log('Fetched Data:', data) // DEBUG

            if (data.rows) {
                setTableData(data.rows)
                // Extract columns, excluding ctid from display
                if (data.fields) {
                    setTableColumns(data.fields.map((f: any) => f.name).filter((c: string) => c !== 'ctid'))
                } else if (data.rows.length > 0) {
                    setTableColumns(Object.keys(data.rows[0]).filter(c => c !== 'ctid'))
                } else {
                    setTableColumns([])
                }
            }
        } catch (e: any) {
            console.error(e)
            setError(e.message)
            setTableData([])
        } finally {
            setLoading(false)
        }
    }

    // ----------- ACTIONS -----------

    const handleUpdateCell = async () => {
        if (!editingCell || !selectedTable) return

        const { rowIdx, col } = editingCell
        const row = tableData[rowIdx]
        const ctid = row.ctid

        // Strategy: Prefer Primary Key 'id' if available, otherwise fallback to ctid
        const id = row.id
        let whereClause = ''

        if (id) {
            // Assuming id is integer usually, but handle string if needed.
            // Safest to quote it if UUID, but if int no quotes needed? Postgres handles implicit cast usually.
            // Let's assume standard serial ID/UUID.
            whereClause = `id = '${id}'`
        } else if (ctid) {
            whereClause = `ctid = '${ctid}'`
        } else {
            setError('Cannot update: No ID or ctid found.')
            return
        }

        // Simple escaping for single quotes
        const safeValue = editValue.replace(/'/g, "''")
        const query = `UPDATE "${selectedTable}" SET "${col}" = '${safeValue}' WHERE ${whereClause}`

        try {
            await runQuery(query)
            setSuccess('Cell updated')
            setEditingCell(null)
            fetchTableData(selectedTable)
        } catch (e: any) {
            console.error(e)
            setError(`Update failed: ${e.message}`)
        }
    }

    const handleDeleteRow = async (rowIdx: number) => {
        if (!selectedTable || !confirm('Are you sure you want to delete this row?')) return

        const row = tableData[rowIdx]
        const id = row.id
        const ctid = row.ctid

        let whereClause = ''
        if (id) {
            whereClause = `id = '${id}'`
        } else if (ctid) {
            whereClause = `ctid = '${ctid}'`
        } else {
            setError('Cannot delete: No ID or ctid found.')
            return
        }

        const query = `DELETE FROM "${selectedTable}" WHERE ${whereClause}`

        try {
            await runQuery(query)
            setSuccess('Row deleted')
            fetchTableData(selectedTable)
        } catch (e: any) {
            console.error(e)
            setError(`Delete failed: ${e.message}`)
        }
    }

    const handleAddColumn = async () => {
        if (!selectedTable || !newColName) return

        const query = `ALTER TABLE "${selectedTable}" ADD COLUMN "${newColName}" ${newColType}`

        try {
            await runQuery(query, true)
            setSuccess(`Column ${newColName} added`)
            setShowAddColumn(false)
            setNewColName('')
            fetchTableData(selectedTable)
        } catch (e) { }
    }

    const handleDropColumn = async (col: string) => {
        if (!selectedTable || !confirm(`Delete column "${col}"? This implies data loss!`)) return

        const query = `ALTER TABLE "${selectedTable}" DROP COLUMN "${col}"`
        try {
            await runQuery(query, true)
            setSuccess(`Column ${col} deleted`)
            fetchTableData(selectedTable)
        } catch (e) { }
    }

    // ----------- UI HELPERS -----------

    const startEditing = (rowIdx: number, col: string, currentVal: any) => {
        setEditingCell({ rowIdx, col })
        setEditValue(currentVal === null ? '' : String(currentVal))
    }

    // ----------- RENDER -----------

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col h-screen overflow-hidden font-display">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <Link href="/admin/dashboard" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Database Manager</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full font-mono">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        Connected: {dbHost}
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">

                {/* Sidebar */}
                <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                        <h2 className="font-bold text-gray-700 dark:text-gray-200 text-xs uppercase tracking-wider">Tables</h2>
                        <button onClick={fetchTables} className="text-gray-400 hover:text-blue-500 transition-colors">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {tables.map(table => (
                            <button
                                key={table}
                                onClick={() => fetchTableData(table)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors font-medium border ${selectedTable === table
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                <TableIcon className="w-4 h-4 opacity-70" />
                                <span className="truncate">{table}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Content Area */}
                <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900">

                    {/* Toolbar */}
                    <div className="h-12 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center px-4 justify-between">
                        <div className="flex h-full gap-4">
                            <button
                                onClick={() => setActiveTab('browse')}
                                className={`h-full px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'browse'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                            >
                                <TableIcon className="w-4 h-4" />
                                Browse Data
                            </button>
                            <button
                                onClick={() => setActiveTab('sql')}
                                className={`h-full px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'sql'
                                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                            >
                                <Code className="w-4 h-4" />
                                SQL Editor
                            </button>
                        </div>

                        {/* Schema Actions (Only visible in Browse) */}
                        {activeTab === 'browse' && selectedTable && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowAddColumn(true)}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Add Column
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Notifications */}
                    {(error || success) && (
                        <div className={`px-4 py-2 text-sm flex justify-between items-center ${error ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            }`}>
                            <span>{error || success}</span>
                            <button onClick={() => { setError(null); setSuccess(null) }}><X className="w-4 h-4" /></button>
                        </div>
                    )}

                    {/* TAB CONTENT: BROWSE */}
                    {activeTab === 'browse' && (
                        <div className="flex-1 overflow-auto p-4 relative">
                            {selectedTable ? (
                                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col h-full">
                                    <div className="overflow-auto flex-1">
                                        <table className="w-full text-sm text-left border-collapse">
                                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300 sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th className="px-3 py-3 w-10 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"></th>
                                                    {tableColumns.map(col => (
                                                        <th key={col} className="px-6 py-3 whitespace-nowrap border-b border-gray-200 dark:border-gray-600 font-bold group relative">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span>{col}</span>
                                                                <button
                                                                    onClick={() => handleDropColumn(col)}
                                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                                                    title="Delete Column"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                                {tableData.length > 0 ? (
                                                    tableData.map((row, rowIdx) => (
                                                        <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                                            {/* Actions Column */}
                                                            <td className="px-3 py-4 border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                                                <button
                                                                    onClick={() => handleDeleteRow(rowIdx)}
                                                                    className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                    title="Delete Row"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </td>

                                                            {/* Data Columns */}
                                                            {tableColumns.map(col => {
                                                                const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.col === col
                                                                const val = row[col]

                                                                return (
                                                                    <td
                                                                        key={col}
                                                                        className={`px-6 py-4 whitespace-nowrap border-r border-transparent ${!isEditing ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20' : ''}`}
                                                                        onClick={() => !isEditing && startEditing(rowIdx, col, val)}
                                                                    >
                                                                        {isEditing ? (
                                                                            <div className="flex gap-2 min-w-[150px]">
                                                                                <input
                                                                                    autoFocus
                                                                                    className="w-full px-2 py-1 text-sm border border-blue-500 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                                                                                    value={editValue}
                                                                                    onChange={(e) => setEditValue(e.target.value)}
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key === 'Enter') handleUpdateCell()
                                                                                        if (e.key === 'Escape') setEditingCell(null)
                                                                                    }}
                                                                                />
                                                                                <button onClick={handleUpdateCell} className="text-green-600"><Save className="w-4 h-4" /></button>
                                                                                <button onClick={() => setEditingCell(null)} className="text-gray-400"><X className="w-4 h-4" /></button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-gray-900 dark:text-gray-300 min-h-[20px]">
                                                                                {val === null ? <span className="text-gray-300 dark:text-gray-600 italic">null</span> : String(val)}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                )
                                                            })}
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={100} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                            No rows found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                                    <TableIcon className="w-16 h-16 mb-4 opacity-50" />
                                    <p>Select a table to browse and edit</p>
                                </div>
                            )}

                            {/* Add Column Modal (Simple Overlay) */}
                            {showAddColumn && (
                                <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add New Column</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Column Name</label>
                                                <input
                                                    value={newColName}
                                                    onChange={(e) => setNewColName(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="e.g. status_notes"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Type</label>
                                                <select
                                                    value={newColType}
                                                    onChange={(e) => setNewColType(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                >
                                                    <option value="VARCHAR(255)">VARCHAR(255)</option>
                                                    <option value="TEXT">TEXT</option>
                                                    <option value="INTEGER">INTEGER</option>
                                                    <option value="BOOLEAN">BOOLEAN</option>
                                                    <option value="TIMESTAMP">TIMESTAMP</option>
                                                    <option value="DATE">DATE</option>
                                                </select>
                                            </div>
                                            <div className="flex justify-end gap-3 mt-6">
                                                <button
                                                    onClick={() => setShowAddColumn(false)}
                                                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleAddColumn}
                                                    className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded shadow-sm"
                                                >
                                                    Create Column
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB CONTENT: SQL */}
                    {activeTab === 'sql' && (
                        <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
                            <div className="flex-shrink-0 bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col">
                                <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase px-2">SQL Query</span>
                                    <button
                                        onClick={() => runQuery(customQuery).then(d => { setQueryResult(d); setSuccess(`Query executed. ${d.rowCount ?? 0} rows.`) })}
                                        disabled={loading || !customQuery.trim()}
                                        className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Play className="w-3 h-3 fill-current" />
                                        Run Query
                                    </button>
                                </div>
                                <textarea
                                    value={customQuery}
                                    onChange={(e) => setCustomQuery(e.target.value)}
                                    className="w-full h-40 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none resize-none"
                                    placeholder="SELECT * FROM users WHERE..."
                                />
                            </div>

                            {/* Results Area */}
                            <div className="flex-1 bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                                <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                    <span className="text-xs font-bold text-gray-500 uppercase px-2">Results</span>
                                </div>
                                <div className="flex-1 overflow-auto">
                                    {queryResult ? (
                                        <table className="w-full text-sm text-left border-collapse">
                                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300 sticky top-0">
                                                <tr>
                                                    {queryResult.fields ? queryResult.fields.map((f: any) => (
                                                        <th key={f.name} className="px-6 py-3 whitespace-nowrap border-b border-gray-200 dark:border-gray-600 font-bold bg-gray-50 dark:bg-gray-700">
                                                            {f.name}
                                                        </th>
                                                    )) : queryResult.rows && queryResult.rows.length > 0 ? Object.keys(queryResult.rows[0]).map(k => (
                                                        <th key={k} className="px-6 py-3 whitespace-nowrap border-b border-gray-200 dark:border-gray-600 font-bold bg-gray-50 dark:bg-gray-700">
                                                            {k}
                                                        </th>
                                                    )) : (
                                                        <th className="px-6 py-3 border-b dark:border-gray-600">Status</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {queryResult.rows && queryResult.rows.length > 0 ? (
                                                    queryResult.rows.map((row: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                            {Object.values(row).map((val: any, vIdx) => (
                                                                <td key={vIdx} className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-300 border-r border-transparent last:border-r-0">
                                                                    {val === null ? <span className="text-gray-400 italic">null</span> : String(val)}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={100} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                            {queryResult.rows ? 'Query executed successfully. No rows returned.' : 'Query executed.'}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                                            <p>Run a query to see results here.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    )
}
