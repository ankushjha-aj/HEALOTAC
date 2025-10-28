'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Calendar, Users, Activity, TrendingUp, RefreshCw } from 'lucide-react'
import Link from 'next/link'

// Animated ECG Waveform Component
const AnimatedECGWaveform = () => (
  <svg
    viewBox="0 0 800 80"
    className="w-full h-12"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <defs>
      <linearGradient id="ecgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="25%" stopColor="#dc2626" />
        <stop offset="50%" stopColor="#b91c1c" />
        <stop offset="75%" stopColor="#dc2626" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>

    {/* Single Continuous ECG Path Spanning Full Width */}
    <path
      d="M0 40 L50 40 L52 32 L54 48 L56 20 L58 60 L60 40 L90 40 L92 36 L94 44 L96 12 L98 68 L100 40 L130 40 L132 32 L134 48 L136 20 L138 60 L140 40 L170 40 L172 36 L174 44 L176 12 L178 68 L180 40 L210 40 L212 32 L214 48 L216 20 L218 60 L220 40 L250 40 L252 36 L254 44 L256 12 L258 68 L260 40 L290 40 L292 32 L294 48 L296 20 L298 60 L300 40 L330 40 L332 36 L334 44 L336 12 L338 68 L340 40 L370 40 L372 32 L374 48 L376 20 L378 60 L380 40 L410 40 L412 36 L414 44 L416 12 L418 68 L420 40 L450 40 L452 32 L454 48 L456 20 L458 60 L460 40 L490 40 L492 36 L494 44 L496 12 L498 68 L500 40 L530 40 L532 32 L534 48 L536 20 L538 60 L540 40 L570 40 L572 36 L574 44 L576 12 L578 68 L580 40 L610 40 L612 32 L614 48 L616 20 L618 60 L620 40 L650 40 L652 36 L654 44 L656 12 L658 68 L660 40 L690 40 L692 32 L694 48 L696 20 L698 60 L700 40 L730 40 L732 36 L734 44 L736 12 L738 68 L740 40 L770 40 L772 32 L774 48 L776 20 L778 60 L780 40 L800 40"
      stroke="url(#ecgGradient)"
      strokeWidth="3.5"
      fill="none"
    />

    {/* Continuous flowing animation */}
    <defs>
      <style>
        {`
          @keyframes ecgFlow {
            0% { stroke-dasharray: 0, 1600; }
            50% { stroke-dasharray: 800, 800; }
            100% { stroke-dasharray: 1600, 0; }
          }
          path {
            animation: ecgFlow 5s linear infinite;
          }
        `}
      </style>
    </defs>
  </svg>
)

// Interface definitions
interface Cadet {
  id: number
  name: string
  battalion: string
  company: string
  joinDate: string
  status: string
  lastActivity?: string
  createdAt: string
  relegated?: string
  course?: string
  academyNumber?: number
}

interface MedicalRecord {
  id: number
  name: string
  company: string
  battalion: string
  dateOfReporting: string
  medicalProblem: string
  diagnosis?: string
  medicalStatus: string
  attendC: number
  trainingDaysMissed: number
  contactNo: string
  remarks: string
  createdAt: string
  updatedAt?: string // Make updatedAt optional
  cadetId: number
  monitoringCase: boolean
}

export default function DashboardPage() {
  const [cadets, setCadets] = useState<Cadet[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState<string>('checking...')
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipContent, setTooltipContent] = useState<string[]>([])
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [jwtToken, setJwtToken] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [currentDateTime, setCurrentDateTime] = useState<string>('')

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('jwt_token')
    if (token) {
      setJwtToken(token)
      setIsAuthenticated(true)
    } else {
      // Redirect to login if no token
      window.location.href = '/login'
    }
  }, [])

  // Update current date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      const date = now.toLocaleDateString()
      const time = now.toLocaleTimeString()
      setCurrentDateTime(`${date} ${time}`)
    }

    updateDateTime()
    const interval = setInterval(updateDateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  // Fetch data function with JWT authentication
  const fetchData = useCallback(async () => {
    if (!jwtToken) return

    setDbStatus('connecting...')
    try {
      const headers = {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      }

      const [cadetsRes, recordsRes] = await Promise.all([
        fetch('/api/cadets', { headers }),
        fetch('/api/medical-records', { headers })
      ])

      if (cadetsRes.ok && recordsRes.ok) {
        const cadetsData = await cadetsRes.json()
        const recordsData = await recordsRes.json()
        setCadets(cadetsData)
        setMedicalRecords(recordsData)
        setDbStatus(`connected (${cadetsData.length} cadets, ${recordsData.length} records)`)
        console.log('✅ Real-time data updated:', new Date().toLocaleTimeString())
      } else {
        if (cadetsRes.status === 401 || recordsRes.status === 401) {
          // Token expired, redirect to login
          localStorage.removeItem('jwt_token')
          window.location.href = '/login'
          return
        }
        setDbStatus(`api error (${cadetsRes.status}, ${recordsRes.status})`)
        // No fallback mock data - dashboard will show empty state
        setCadets([])
        setMedicalRecords([])
      }
    } catch (error) {
      setDbStatus(`connection failed: ${error instanceof Error ? error.message : 'unknown error'}`)
      // No fallback mock data - dashboard will show empty state
      setCadets([])
      setMedicalRecords([])
    } finally {
      setLoading(false)
    }
  }, [jwtToken])

  // Real-time polling effect
  useEffect(() => {
    if (!isAuthenticated || !jwtToken) return

    // Initial fetch
    fetchData()

    // Set up polling every 30 seconds for real-time updates
    pollingIntervalRef.current = setInterval(() => {
      console.log('🔄 Polling for real-time data updates...')
      fetchData()
    }, 30000) // 30 seconds

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [isAuthenticated, jwtToken, fetchData])

  // Manual refresh function
  const refreshData = () => {
    console.log('🔄 Manual refresh triggered')
    fetchData()
  }

  // Close tooltip when clicking outside (only needed for click interactions, not hover)
  // Removed for hover-only tooltip functionality

  // Calculate stats from real data - show cadets with records added/updated today
  const today = new Date()
  const todayString = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0')

  // Get cadets who have medical records created or updated today
  const todayRecords = medicalRecords.filter(record => {
    const createdDate = new Date(record.createdAt).toISOString().split('T')[0] // Get YYYY-MM-DD part
    const updatedDate = record.updatedAt ? new Date(record.updatedAt).toISOString().split('T')[0] : null

    return createdDate === todayString || (updatedDate && updatedDate === todayString)
  })

  const todayCadets = new Set(todayRecords.map(record => record.cadetId))
  const todayCadetNames = [...new Set(todayRecords.map(record => record.name))]

  const stats = [
    {
      label: 'Total Cadets for Today',
      value: todayCadets.size.toString(),
      icon: Users,
    },
  ]

  // Recent cadets with activity
  const recentCadets = cadets
    .map(cadet => ({
      ...cadet,
      lastActivity: cadet.createdAt
    }))
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    .slice(0, 5)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Real-time overview of medical records and cadet health status
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center gap-3">
            <button
              onClick={refreshData}
              className="inline-flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <Link href="/medical-records/new" className="btn-primary">
              Add New Record
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="card p-6 relative">
                {/* Full-width ECG Waveform background */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <AnimatedECGWaveform />
                </div>

                {/* Content overlay */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </div>
                    </div>
                    <div className="relative">
                      {/* Right side - Users Icon (hoverable) */}
                      <div
                        className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg cursor-pointer transition-all hover:bg-primary/20 dark:hover:bg-primary/30"
                        onMouseEnter={() => {
                          setTooltipContent(todayCadetNames.length > 0 ? todayCadetNames : ['No cadets with records today'])
                          setShowTooltip(true)
                        }}
                        onMouseLeave={() => {
                          setShowTooltip(false)
                        }}
                      >
                        <Icon className="h-5 w-5 text-primary" />
                      </div>

                      {/* Custom Tooltip */}
                      {showTooltip && (
                        <div
                          ref={tooltipRef}
                          className="absolute bottom-full right-0 mb-2 w-64 max-h-48 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 overflow-hidden animate-fade-in"
                        >
                          <div className="p-3 border-b border-gray-700">
                            <strong>Cadets with Records Today ({todayCadetNames.length})</strong>
                          </div>
                          <div className="max-h-32 overflow-y-auto">
                            {tooltipContent.map((name, index) => (
                              <div key={index} className="px-3 py-2 border-b border-gray-700 last:border-b-0 hover:bg-gray-800 transition-colors">
                                {name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Recent Cadets Table */}
        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Cadet Activity
              </h3>
              <Link
                href="/cadets"
                className="text-sm text-primary hover:text-primary/80"
              >
                View all cadets →
              </Link>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cadet Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Battalion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Academy Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentCadets.map((cadet) => (
                  <tr key={cadet.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {cadet.name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-3 flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {cadet.name}
                          </p>
                          {cadet.relegated === 'Y' && (
                            <>
                              <span className="text-red-600 dark:text-red-400 font-bold">R</span>
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {cadet.battalion}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {cadet.company}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(cadet.joinDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {cadet.course || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {cadet.academyNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(cadet.lastActivity || cadet.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/cadets/${cadet.id}`}
                        className="text-primary hover:text-primary/80 font-medium text-sm"
                      >
                        View Cadet
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
