'use client'

import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Search, Edit, Trash2, Filter } from 'lucide-react'
import Link from 'next/link'
import { usePagination } from '@/hooks/usePagination'
import PaginationControls from '@/components/PaginationControls'
import { useRouter } from 'next/navigation'

// Interface for Medical Record
interface MedicalRecord {
  id: number
  cadetId: number
  totalTrainingDaysMissed: number
  medicalStatus: string
  exPpg: number
  attendB: number
}

// Interface for Cadet
interface Cadet {
  id: number
  name: string
  battalion: string
  company: string
  joinDate: string
  status: string
  academyNumber?: number
  createdAt: string
  relegated?: string
  course?: string
}

// Interface for Filters
interface Filters {
  battalions: string[]
  companies: string[]
  statuses: string[]
  companiesByBattalion: Record<string, string[]>
}

export default function CadetsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [cadets, setCadets] = useState<Cadet[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showHighTrainingMissed, setShowHighTrainingMissed] = useState(false)
  const [navigatingToNewRecord, setNavigatingToNewRecord] = useState(false)

  const router = useRouter()

  // Fetch cadets on component mount
  useEffect(() => {
    fetchCadets()
  }, [])

  const fetchCadets = async () => {
    try {
      console.log('🔄 Starting to fetch cadets...')
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('jwt_token')
      console.log('🔑 JWT Token:', token ? 'Present' : 'Missing')
      
      if (!token) {
        console.log('❌ No JWT token found, setting error')
        setError('Authentication required')
        return
      }

      console.log('📡 Making API calls...')
      const [cadetsRes, recordsRes] = await Promise.all([
        fetch('/api/cadets', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/medical-records', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ])

      console.log('📊 API Responses - Cadets:', cadetsRes.status, cadetsRes.ok)
      console.log('📋 API Responses - Records:', recordsRes.status, recordsRes.ok)

      if (!cadetsRes.ok) {
        console.log('❌ Cadets API failed:', cadetsRes.status)
        throw new Error('Failed to fetch cadets')
      }
      if (!recordsRes.ok) {
        console.log('❌ Records API failed:', recordsRes.status)
        throw new Error('Failed to fetch medical records')
      }

      const cadetsData = await cadetsRes.json()
      const recordsData = await recordsRes.json()
      
      console.log('✅ Cadets data received:', cadetsData.length, 'cadets')
      console.log('✅ Records data received:', recordsData.length, 'records')
      
      // Sort cadets by createdAt descending (most recent first)
      const sortedCadets = cadetsData.sort((a: Cadet, b: Cadet) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setCadets(sortedCadets)
      setMedicalRecords(recordsData)
      
      console.log('✅ Data set successfully, loading should be false')
    } catch (err) {
      console.error('❌ Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch cadets')
    } finally {
      console.log('🏁 Setting loading to false')
      setLoading(false)
    }
  }

  const handleDeleteCadet = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete cadet "${name}"?\n\n⚠️ WARNING: This will also delete all associated medical records for this cadet.\n\nThis action cannot be undone.`)) {
      return
    }

    try {
      const token = localStorage.getItem('jwt_token')
      if (!token) {
        alert('Authentication required')
        return
      }
      const response = await fetch(`/api/cadets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to delete cadet')

      console.log('🗑️ DELETED CADET:', name)
      // Refresh the list
      await fetchCadets()
    } catch (err) {
      console.error('❌ Error deleting cadet:', err)
      alert('Failed to delete cadet. Please try again.')
    }
  }

  // Calculate training days missed for each cadet
  const cadetsWithTrainingMissed = cadets.map(cadet => {
    const cadetRecords = medicalRecords.filter(record => record.cadetId === cadet.id)
    const totalTrainingMissed = cadetRecords.reduce((total, record) => {
      let days = record.totalTrainingDaysMissed || 0

      // Add Ex-PPG contribution (each point = 0.25 days missed)
      if (record.exPpg) {
        days += record.exPpg * 0.25
      }

      // Add Attend B contribution (each point = 0.25 days missed)
      if (record.attendB) {
        days += record.attendB * 0.25
      }

      // Physiotherapy doesn't add to training days missed

      return total + days
    }, 0)
    return { ...cadet, totalTrainingMissed }
  })

  // Filter cadets based on search term and training missed filter
  const filteredCadets = cadetsWithTrainingMissed.filter(cadet => {
    // First apply the training missed filter if active
    if (showHighTrainingMissed && cadet.totalTrainingMissed < 30) {
      return false
    }

    // Then apply search filter
    if (!searchTerm.trim()) return true

    const searchLower = searchTerm.toLowerCase()
    const joinDateFormatted = new Date(cadet.joinDate).toLocaleDateString()

    return (
      cadet.name.toLowerCase().includes(searchLower) ||
      (cadet.academyNumber && cadet.academyNumber.toString().includes(searchLower)) ||
      (cadet.course && cadet.course.toLowerCase().includes(searchLower)) ||
      cadet.battalion.toLowerCase().includes(searchLower) ||
      cadet.company.toLowerCase().includes(searchLower) ||
      joinDateFormatted.toLowerCase().includes(searchLower)
    )
  })

  // Pagination for cadets table
  const pagination = usePagination({
    totalItems: filteredCadets.length,
    itemsPerPage: 10,
    initialPage: 1
  })

  // Reset pagination to page 1 when search or filter changes
  useEffect(() => {
    pagination.goToPage(1)
  }, [searchTerm, showHighTrainingMissed])

  // Get paginated cadets
  const paginatedCadets = useMemo(
    () => pagination.getVisibleItems(filteredCadets),
    [pagination, filteredCadets]
  )

  const handleAddNewRecord = () => {
    setNavigatingToNewRecord(true)
    // Add a smooth scrolling animation before navigation
    setTimeout(() => {
      router.push('/medical-records/new')
    }, 800) // 800ms delay for smooth animation
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Cadet Records</h2>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Manage and access cadet medical information efficiently.
            </p>
            {loading && (
              <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                🔄 Loading cadets...
              </p>
            )}
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                ❌ Error: {error}
              </p>
            )}
          </div>
          <div className="mt-4 lg:mt-0 flex gap-2">
            <button
              onClick={() => setShowHighTrainingMissed(!showHighTrainingMissed)}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg ${
                showHighTrainingMissed
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-400 shadow-orange-200 dark:shadow-orange-900/50'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-500'
              }`}
              title="Show cadets with ≥30 days training missed"
            >
              {/* Animated background effect when active */}
              {showHighTrainingMissed && (
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-lg opacity-50 animate-pulse" />
              )}

              <div className="relative flex items-center gap-2">
                <Filter className={`h-4 w-4 transition-transform duration-200 ${showHighTrainingMissed ? 'rotate-12' : ''}`} />
                <span className="font-semibold">
                  {showHighTrainingMissed ? 'High Risk ≥30' : 'Filter ≥30'}
                </span>
                {showHighTrainingMissed && (
                  <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                )}
              </div>
            </button>
            <button
              onClick={handleAddNewRecord}
              disabled={navigatingToNewRecord}
              className={`btn-primary flex items-center gap-2 ${
                navigatingToNewRecord ? 'cursor-not-allowed opacity-75' : ''
              }`}
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

        {/* Search Section */}
        <div className="card p-6">
          <div className="space-y-4">
            {/* Search Bar and Records per Page */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by name, academy number, course, battalion, company, or join date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="records-per-page" className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  Records per page:
                </label>
                <select
                  id="records-per-page"
                  value={pagination.itemsPerPage}
                  onChange={(e) => pagination.setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {pagination.startIndex + 1}-{Math.min(pagination.endIndex + 1, filteredCadets.length)} of {filteredCadets.length} cadets
              {showHighTrainingMissed && ` (filtered: ≥30 days training missed)`}
            </p>
          </div>
        </div>

        {/* Cadets Table */}
        <div className="card overflow-hidden">
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
                    Training Days Missed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Academy Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedCadets.map((cadet) => (
                  <tr key={cadet.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {cadet.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-3 flex items-center gap-2">
                          <Link
                            href={`/cadets/${cadet.id}`}
                            className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary"
                          >
                            {cadet.name}
                          </Link>
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {cadet.battalion}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {cadet.company}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        cadet.totalTrainingMissed >= 30
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : cadet.totalTrainingMissed > 0
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      }`}>
                        {cadet.totalTrainingMissed} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {cadet.academyNumber || 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {cadet.course || 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(cadet.joinDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/cadets/${cadet.id}`}
                          className="text-primary hover:text-primary/80"
                          title="View cadet details"
                        >
                          View
                        </Link>
                        <Link
                          href={`/cadets/${cadet.id}/edit`}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          title="Edit cadet information"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => handleDeleteCadet(cadet.id, cadet.name)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredCadets.length > 0 && (
            <div className="mt-6 flex flex-col items-center gap-4">
              <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.goToPage}
                hasNextPage={pagination.hasNextPage}
                hasPrevPage={pagination.hasPrevPage}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
