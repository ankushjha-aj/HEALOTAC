'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BarChart2, Users, Activity, HeartPulse, ArrowLeft, RefreshCw, Sun, Moon } from 'lucide-react'

// Reusing ThemeToggle for consistency
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
        <button onClick={toggleTheme} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
    )
}

export default function InsightsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    // Auth Check
    useEffect(() => {
        const token = localStorage.getItem('jwt_token')
        if (!token) router.push('/admin')
    }, [router])

    const fetchStats = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('jwt_token')
            const res = await fetch('/api/admin/insights/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!res.ok) throw new Error('Failed to fetch stats')
            const json = await res.json()
            setData(json)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
    }, [])

    // --- DRILL DOWN LOGIC ---
    const [modalOpen, setModalOpen] = useState(false)
    const [modalTitle, setModalTitle] = useState('')
    const [modalData, setModalData] = useState<any[]>([])
    const [modalLoading, setModalLoading] = useState(false)

    const handleDrillDown = async (company: string, type: 'all' | 'healthy' | 'sick') => {
        setModalTitle(`${company} - ${type === 'all' ? 'All Cadets' : type === 'healthy' ? 'HealthyCadets' : 'Active Sick Report'}`)
        setModalOpen(true)
        setModalLoading(true)
        setModalData([])

        try {
            const token = localStorage.getItem('jwt_token')
            const res = await fetch(`/api/admin/insights/drilldown?company=${encodeURIComponent(company)}&type=${type}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const json = await res.json()
                setModalData(json.cadets || [])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setModalLoading(false)
        }
    }

    // --- CHARTS ---

    // Updated Palette for Distinctive High Contrast
    // Blue, Bright Yellow, Green, Red, Purple, Cyan
    const COLORS = ['#2563EB', '#FACC15', '#16A34A', '#DC2626', '#9333EA', '#0891B2']

    const PieChart = ({ data }: { data: any[] }) => {
        if (!data || data.length === 0) return <div className="text-center text-gray-400 py-10">No Data</div>

        const total = data.reduce((acc, curr) => acc + Number(curr.total_cadets), 0)
        let cumulativePercent = 0

        return (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 h-full">

                <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {data.map((item, idx) => {
                            const percent = (Number(item.total_cadets) / total)
                            const C = 157.1 // 2 * PI * 25
                            const strokeDasharray = `${percent * C} ${C}`
                            const offset = cumulativePercent * C
                            cumulativePercent += percent

                            return (
                                <circle
                                    key={idx}
                                    cx="50"
                                    cy="50"
                                    r="25"
                                    fill="transparent"
                                    stroke={COLORS[idx % COLORS.length]}
                                    strokeWidth="50" /* Full radius width creates a pie */
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={-offset}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => handleDrillDown(item.company, 'all')}
                                >
                                    <title>{item.company}: {item.total_cadets}</title>
                                </circle>
                            )
                        })}
                    </svg>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {data.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleDrillDown(item.company, 'all')}
                            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded transition-colors text-left"
                        >
                            <span className="w-3 h-3 rounded-full" style={{ background: COLORS[idx % COLORS.length] }}></span>
                            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{item.company}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">({item.total_cadets})</span>
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    const HealthRings = ({ data }: { data: any[] }) => {
        if (!data || data.length === 0) return <div className="text-center text-gray-400 py-10">No Data</div>

        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full place-items-center">
                {data.map((item, idx) => {
                    const total = Number(item.total_cadets)
                    const sick = Number(item.active_sick)
                    const healthy = total - sick

                    const healthyPercent = total > 0 ? (healthy / total) * 100 : 0
                    const radius = 30
                    const circumference = 2 * Math.PI * radius
                    const strokeDashoffset = circumference - (healthyPercent / 100) * circumference

                    return (
                        <div key={idx} className="flex flex-col items-center gap-3 group relative">
                            <div className="relative w-24 h-24 flex items-center justify-center transition-transform hover:scale-105">
                                {/* Background Circle (Red/Sick Portion click) */}
                                <svg className="transform -rotate-90 w-full h-full absolute inset-0">
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r={radius}
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-red-100 dark:text-red-900/30 pointer-events-none"
                                    />
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r={radius}
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-red-500 cursor-pointer hover:stroke-red-600 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDrillDown(item.company, 'sick')
                                        }}
                                    >
                                        <title>Active Sick: {sick}</title>
                                    </circle>
                                </svg>

                                {/* Foreground Circle (Green/Healthy Portion click) */}
                                <svg className="absolute top-0 left-0 transform -rotate-90 w-full h-full">
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r={radius}
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        className="text-green-500 transition-all duration-1000 ease-out cursor-pointer hover:stroke-green-600 hover:brightness-110"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDrillDown(item.company, 'healthy')
                                        }}
                                    >
                                        <title>Healthy: {healthy}</title>
                                    </circle>
                                </svg>

                                {/* Center Text - Non-clickable / Info Only */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(healthyPercent)}%</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Fit</span>
                                </div>
                            </div>

                            <div className="text-center">
                                <span className="block text-sm font-bold text-gray-700 dark:text-gray-300">{item.company}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex justify-center gap-2">
                                    <button onClick={() => handleDrillDown(item.company, 'healthy')} className="text-green-600 dark:text-green-400 hover:underline">{healthy}</button>
                                    /
                                    <button onClick={() => handleDrillDown(item.company, 'sick')} className="text-red-500 dark:text-red-400 hover:underline">{sick}</button>
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    // --- MODAL ---
    const Modal = () => {
        if (!modalOpen) return null

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{modalTitle}</h3>
                        <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                            <ArrowLeft className="w-5 h-5" /> {/* Close Icon */}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-0">
                        {modalLoading ? (
                            <div className="p-8 flex justify-center">
                                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3">Name</th>
                                        <th className="px-6 py-3">Academy No</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {modalData.length > 0 ? modalData.map((c: any, i) => (
                                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white capitalize">{c.name}</td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono">{c.academy_number || 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.status === 'Fit' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No cadets found in this category.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 shrink-0 flex justify-end">
                        <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-display">
            <Modal />
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <Link href="/admin/dashboard" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <BarChart2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">System Insights</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={fetchStats} className="p-2 text-gray-500 hover:text-purple-600 transition" title="Refresh">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                {error && (
                    <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
                        Error loading insights: {error}
                    </div>
                )}

                {/* KPI Cards (Unchanged Logic, just rendering simplified) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Cadets</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.totalCadets || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Active Sick</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.activeCases || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                <HeartPulse className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Never Reported</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.neverReported || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">High BMI</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.bmiStats?.find((b: any) => b.category === 'Overweight')?.count || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">

                    {/* Pie Chart: Distribution */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[350px] flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Cadet Distribution</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Percentage of total cadets per company.</p>
                        <div className="flex-1 flex items-center justify-center">
                            {loading ? <div className="animate-pulse w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-full" /> : (
                                <PieChart data={data?.companyStats} />
                            )}
                        </div>
                    </div>

                    {/* Health Rings: Health vs Sick */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[350px] flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Health Status</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Green Ring = Healthy %</p>
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                            {loading ? <div className="animate-pulse w-full h-full bg-gray-100 dark:bg-gray-700 rounded" /> : (
                                <HealthRings data={data?.companyStats} />
                            )}
                        </div>
                    </div>

                </div>

                {/* High Risk Cadets Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">High Risk Cadets</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Monitoring list for cadets with BMI &gt; 25</p>
                        </div>
                        <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-bold px-3 py-1 rounded-full">
                            {data?.highRiskCadets?.length || 0} Cadets
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                                <tr>
                                    <th className="px-6 py-3 font-bold">Name</th>
                                    <th className="px-6 py-3 font-bold">Academy No</th>
                                    <th className="px-6 py-3 font-bold">Company</th>
                                    <th className="px-6 py-3 font-bold">BMI</th>
                                    <th className="px-6 py-3 font-bold text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {data?.highRiskCadets?.length > 0 ? (
                                    data.highRiskCadets.map((cadet: any) => (
                                        <tr key={cadet.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white capitalize">{cadet.name}</td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono">{cadet.academy_number || 'N/A'}</td>
                                            <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{cadet.company}</td>
                                            <td className="px-6 py-4 font-bold text-orange-600 dark:text-orange-400">{cadet.bmi}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="px-2 py-1 text-xs font-semibold text-orange-700 bg-orange-100 rounded-full dark:bg-orange-900/30 dark:text-orange-400">
                                                    Overweight
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-3">
                                                    <HeartPulse className="w-6 h-6 text-green-600 dark:text-green-400" />
                                                </div>
                                                <p className="font-medium">All cadets are within healthy BMI range!</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>
        </div>
    )
}
