'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Calendar, Users, Activity, TrendingUp, RefreshCw } from 'lucide-react'
import Link from 'next/link'


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
  isForeign?: boolean
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
  const router = useRouter()
  const [cadets, setCadets] = useState<Cadet[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState<string>('checking...')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [jwtToken, setJwtToken] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [currentDateTime, setCurrentDateTime] = useState<string>('')

  const [navigatingToNewRecord, setNavigatingToNewRecord] = useState(false)

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
      setCurrentDateTime(`${date} ${time} `)
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
        'Authorization': `Bearer ${jwtToken} `,
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
        setDbStatus(`connected(${cadetsData.length} cadets, ${recordsData.length} records)`)
        console.log('✅ Real-time data updated:', new Date().toLocaleTimeString())
      } else {
        if (cadetsRes.status === 401 || recordsRes.status === 401) {
          // Token expired, redirect to login
          localStorage.removeItem('jwt_token')
          window.location.href = '/login'
          return
        }
        setDbStatus(`api error(${cadetsRes.status}, ${recordsRes.status})`)
        // No fallback mock data - dashboard will show empty state
        setCadets([])
        setMedicalRecords([])
      }
    } catch (error) {
      setDbStatus(`connection failed: ${error instanceof Error ? error.message : 'unknown error'} `)
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

  const handleAddNewRecord = () => {
    setNavigatingToNewRecord(true)
    // Add a smooth scrolling animation before navigation
    setTimeout(() => {
      router.push('/medical-records/new')
    }, 800) // 800ms delay for smooth animation
  }

  // Close tooltip when clicking outside (only needed for click interactions, not hover)
  // Removed for hover-only tooltip functionality

  // State for attendance stats and attendees
  const [attendanceData, setAttendanceData] = useState<{
    stats: { morning: number; evening: number; total: number },
    attendees: (Cadet & { attendanceStatus: { morning: boolean; evening: boolean }, bloodGroup?: string | null })[]
  } | null>(null)

  // State for selected date
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('sv'))

  // Fetch attendance stats
  const fetchStats = useCallback(async () => {
    if (!jwtToken) return
    try {
      const response = await fetch(`/api/dashboard/stats?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAttendanceData(data)
      }
    } catch (error) {
      console.error('Failed to fetch attendance stats:', error)
    }
  }, [jwtToken, selectedDate])

  useEffect(() => {
    fetchStats()
    // Poll for stats every 5 seconds for near real-time updates
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [fetchStats])


  const stats = [
    {
      label: 'AM Attendance',
      value: attendanceData ? attendanceData.stats.morning.toString() : '0',
      icon: Users,
    },
    {
      label: 'PM Attendance',
      value: attendanceData ? attendanceData.stats.evening.toString() : '0',
      icon: Users,
    },
    {
      label: 'Total Attendance',
      value: attendanceData ? attendanceData.stats.total.toString() : '0',
      icon: Users,
    },
  ]

  // ... (loading check)

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
            {/* Date Picker */}
            <input
              type="date"
              value={selectedDate}
              max={new Date().toLocaleDateString('sv', { timeZone: 'Asia/Kolkata' })}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:ring-primary focus:border-primary"
            />
            <button
              onClick={fetchStats}
              className="inline-flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={handleAddNewRecord}
              disabled={navigatingToNewRecord}
              className={`btn - primary flex items - center gap - 2 ${navigatingToNewRecord ? 'cursor-not-allowed opacity-75' : ''
                } `}
            >
              {navigatingToNewRecord ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <span>Add New Record</span>
              )}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="card p-6 relative">
                {/* Content overlay */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                          {stat.value}
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      {/* Right side - Users Icon */}
                      <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Daily Attendance Report Table */}
        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Daily Attendance Report ({new Date(selectedDate).toLocaleDateString('en-GB')})
              </h3>
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
                    Academy No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Battalion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Blood Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {attendanceData?.attendees && attendanceData.attendees.length > 0 ? (
                  attendanceData.attendees.map((cadet) => (
                    <tr key={cadet.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                            <span className="text-primary font-medium">
                              {cadet.name.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                          <div className="ml-3 flex items-center gap-2">
                            <Link
                              href={`/ cadets / ${cadet.id} `}
                              className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary transition-colors"
                            >
                              {cadet.name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {cadet.academyNumber || 'N/A'}
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
                          {cadet.bloodGroup || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {cadet.attendanceStatus.morning && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              AM
                            </span>
                          )}
                          {cadet.attendanceStatus.evening && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              PM
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/ cadets / ${cadet.id} `}
                          className="text-primary hover:text-primary/80 font-medium text-sm"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No attendance records found for this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
