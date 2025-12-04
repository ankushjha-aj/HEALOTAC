'use client'

import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Search, Edit, Trash2, Filter } from 'lucide-react'
import Link from 'next/link'
import { usePagination } from '@/hooks/usePagination'
import PaginationControls from '@/components/PaginationControls'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'

// Interface for Medical Record
interface MedicalRecord {
  id: number
  cadetId: number
  totalTrainingDaysMissed: number
  medicalStatus: string
  exPpg: number
  attendB: number
  dateOfReporting: string
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
  bloodGroup?: string
  isForeign: boolean
}

// Interface for Filters
interface Filters {
  battalions: string[]
  companies: string[]
  statuses: string[]
  companiesByBattalion: Record<string, string[]>
}

// Helper function to count weekdays (excluding Sundays) between two dates
const getWeekdaysBetween = (startDate: Date, endDate: Date): number => {
  let count = 0
  const current = new Date(startDate)
  const end = new Date(endDate)
  while (current <= end) {
    if (current.getDay() !== 0) { // 0 = Sunday
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  return count
}

export default function CadetsPage() {
  const [filters, setFilters] = useState({
    name: '',
    company: '',
    battalion: '',
    course: '',
    bloodGroup: ''
  })
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false)
  const [cadets, setCadets] = useState<Cadet[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showHighTrainingMissed, setShowHighTrainingMissed] = useState(false)
  const [foreignFilter, setForeignFilter] = useState('all')
  const [navigatingToNewRecord, setNavigatingToNewRecord] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [cadetToDelete, setCadetToDelete] = useState<Cadet | null>(null)

  const router = useRouter()
  const { user } = useUser()

  // ESC key handler for delete confirmation modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDeleteConfirmation) {
        setShowDeleteConfirmation(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showDeleteConfirmation])

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

  const handleDeleteCadet = (cadet: Cadet) => {
    setCadetToDelete(cadet)
    setShowDeleteConfirmation(true)
  }

  const confirmDeleteCadet = async () => {
    if (!cadetToDelete) return

    setShowDeleteConfirmation(false)

    try {
      const token = localStorage.getItem('jwt_token')
      if (!token) {
        alert('Authentication required')
        return
      }
      const response = await fetch(`/api/cadets/${cadetToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to delete cadet')

      console.log('🗑️ DELETED CADET:', cadetToDelete.name)
      // Refresh the list
      await fetchCadets()
      setCadetToDelete(null)
    } catch (err) {
      console.error('❌ Error deleting cadet:', err)
      alert('Failed to delete cadet. Please try again.')
    }
  }

  // Calculate training days missed for each cadet
  const cadetsWithTrainingMissed = cadets.map(cadet => {
    const cadetRecords = medicalRecords.filter(record => record.cadetId === cadet.id)
    const totalTrainingMissed = cadetRecords.reduce((total, record) => {
      let days = 0

      // Calculate weekdays for the main absence period
      if (record.totalTrainingDaysMissed && record.totalTrainingDaysMissed > 0) {
        const startDate = new Date(record.dateOfReporting)
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + record.totalTrainingDaysMissed - 1)
        days += getWeekdaysBetween(startDate, endDate)
      }

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

    // Apply Foreign Cadet filter
    // Apply Foreign Cadet filter
    if (foreignFilter === 'yes' && !cadet.isForeign) {
      return false
    }
    if (foreignFilter === 'no' && cadet.isForeign) {
      return false
    }

    // Then apply multi-field filters
    const nameMatch = !filters.name || cadet.name.toLowerCase().includes(filters.name.toLowerCase()) ||
      (cadet.academyNumber && cadet.academyNumber.toString().includes(filters.name))

    const companyMatch = !filters.company || cadet.company.toLowerCase().includes(filters.company.toLowerCase())

    const battalionMatch = !filters.battalion || cadet.battalion.toLowerCase().includes(filters.battalion.toLowerCase())

    const courseMatch = !filters.course || (cadet.course && cadet.course.toLowerCase().includes(filters.course.toLowerCase()))

    const bloodGroupMatch = !filters.bloodGroup || (cadet.bloodGroup && cadet.bloodGroup === filters.bloodGroup)

    return nameMatch && companyMatch && battalionMatch && courseMatch && bloodGroupMatch
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
  }, [filters, showHighTrainingMissed, foreignFilter])

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
              className={`relative px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg ${showHighTrainingMissed
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
              className={`btn-primary flex items-center gap-2 ${navigatingToNewRecord ? 'cursor-not-allowed opacity-75' : ''
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
        <div className="card p-4">
          <div className="space-y-4">
            {/* Multi-filter Search Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Name / Academy Number Filter */}
              <div>
                <label htmlFor="filter-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name / Academy No.
                </label>
                <div className="relative">
                  <input
                    id="filter-name"
                    type="text"
                    placeholder="Search name..."
                    value={filters.name}
                    onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Company Filter with Autocomplete */}
              <div className="relative">
                <label htmlFor="filter-company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company
                </label>
                <input
                  id="filter-company"
                  type="text"
                  placeholder="Filter company..."
                  value={filters.company}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, company: e.target.value }))
                    setShowCompanySuggestions(true)
                  }}
                  onFocus={() => setShowCompanySuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 200)}
                  className="input-field"
                />
                {showCompanySuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {(() => {
                      const companyMap: { [key: string]: string } = {
                        'M': 'Meiktila',
                        'N': 'Naushera',
                        'Z': 'Zojila',
                        'J': 'Jessami',
                        'K': 'Kohima',
                        'P': 'Phillora'
                      }

                      // Create array of {code, name} objects
                      const companies = Object.entries(companyMap).map(([code, name]) => ({ code, name }))

                      // Filter based on input
                      const filteredCompanies = companies.filter(c =>
                        !filters.company ||
                        c.name.toLowerCase().includes(filters.company.toLowerCase()) ||
                        c.code.toLowerCase().includes(filters.company.toLowerCase())
                      )

                      if (filteredCompanies.length === 0) return null

                      return filteredCompanies.map((company) => (
                        <div
                          key={company.code}
                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white"
                          onClick={() => {
                            setFilters(prev => ({ ...prev, company: company.code }))
                            setShowCompanySuggestions(false)
                          }}
                        >
                          <span className="font-medium">{company.code}</span> - {company.name}
                        </div>
                      ))
                    })()}
                  </div>
                )}
              </div>

              {/* Battalion Filter */}
              <div>
                <label htmlFor="filter-battalion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Battalion
                </label>
                <input
                  id="filter-battalion"
                  type="text"
                  placeholder="Filter battalion..."
                  value={filters.battalion}
                  onChange={(e) => setFilters(prev => ({ ...prev, battalion: e.target.value }))}
                  className="input-field"
                />
              </div>

              {/* Course Filter */}
              <div>
                <label htmlFor="filter-course" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Course
                </label>
                <input
                  id="filter-course"
                  type="text"
                  placeholder="Filter course..."
                  value={filters.course}
                  onChange={(e) => setFilters(prev => ({ ...prev, course: e.target.value }))}
                  className="input-field"
                />
              </div>

              {/* Blood Group Filter */}
              <div>
                <label htmlFor="filter-blood-group" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Blood Group
                </label>
                <select
                  id="filter-blood-group"
                  value={filters.bloodGroup}
                  onChange={(e) => setFilters(prev => ({ ...prev, bloodGroup: e.target.value }))}
                  className="input-field"
                >
                  <option value="">All Blood Groups</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label htmlFor="filter-foreign" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Foreign Cadets
                  </label>
                  <select
                    id="filter-foreign"
                    value={foreignFilter}
                    onChange={(e) => setForeignFilter(e.target.value)}
                    className="input-field"
                  >
                    <option value="all">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                {/* Records per Page */}
                <div className="flex-1">
                  <label htmlFor="records-per-page" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Records/Page
                  </label>
                  <select
                    id="records-per-page"
                    value={pagination.itemsPerPage}
                    onChange={(e) => pagination.setItemsPerPage(Number(e.target.value))}
                    className="input-field"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Clear Filters and Results Count */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
              Showing {pagination.startIndex + 1}-{Math.min(pagination.endIndex + 1, filteredCadets.length)} of {filteredCadets.length} cadets
              {showHighTrainingMissed && ` (filtered: ≥30 days training missed)`}
            </p>

            <button
              onClick={() => {
                setFilters({ name: '', company: '', battalion: '', course: '', bloodGroup: '' })
                setForeignFilter('all')
              }}
              className="text-sm text-primary hover:text-primary/80 font-medium order-1 sm:order-2 whitespace-nowrap"
              disabled={!filters.name && !filters.company && !filters.battalion && !filters.course && !filters.bloodGroup && foreignFilter === 'all'}
            >
              Clear all filters
            </button>
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
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-red-600 bg-red-100 rounded-full dark:text-red-400 dark:bg-red-900/30" title="Relegated">
                              R
                            </span>
                          )}
                          {cadet.isForeign && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-blue-600 bg-blue-100 rounded-full dark:text-blue-400 dark:bg-blue-900/30" title="Foreign Cadet">
                              F
                            </span>
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
                        {(() => {
                          const companyMap: { [key: string]: string } = {
                            'M': 'Meiktila',
                            'N': 'Naushera',
                            'Z': 'Zojila',
                            'J': 'Jessami',
                            'K': 'Kohima',
                            'P': 'Phillora'
                          }
                          return companyMap[cadet.company] ? `${cadet.company} - ${companyMap[cadet.company]}` : cadet.company
                        })()}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${cadet.totalTrainingMissed >= 30
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
                        {user?.role !== 'user' && (
                          <button
                            onClick={() => handleDeleteCadet(cadet)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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

      {/* Delete Confirmation Modal */}
      {
        showDeleteConfirmation && cadetToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" onClick={() => setShowDeleteConfirmation(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Confirm Cadet Deletion
                  </h3>
                </div>
                <div className="mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Are you sure you want to delete cadet &quot;{cadetToDelete.name}&quot;? <br />
                    <strong className="text-red-600 dark:text-red-400">⚠️ WARNING:</strong> This will also delete all associated medical records for this cadet. <br />
                    This action cannot be undone.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirmation(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteCadet}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </DashboardLayout >
  )
}
