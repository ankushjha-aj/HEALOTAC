'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Search, Edit, Trash2, Plus, Filter } from 'lucide-react'
import Link from 'next/link'

// Interface for Medical Record
interface MedicalRecord {
  id: number
  cadetId: number
  totalTrainingDaysMissed: number
  medicalStatus: string
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
  const [currentPage, setCurrentPage] = useState(1)
  const [showHighTrainingMissed, setShowHighTrainingMissed] = useState(false)
  const cadetsPerPage = 10

  // Fetch cadets on component mount
  useEffect(() => {
    fetchCadets()
  }, [])

  const fetchCadets = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('jwt_token')
      if (!token) {
        setError('Authentication required')
        return
      }

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

      if (!cadetsRes.ok) throw new Error('Failed to fetch cadets')
      if (!recordsRes.ok) throw new Error('Failed to fetch medical records')

      const cadetsData = await cadetsRes.json()
      const recordsData = await recordsRes.json()
      setCadets(cadetsData)
      setMedicalRecords(recordsData)
      console.log('📊 FETCHED CADETS:', cadetsData.length, 'records')
      console.log('📋 FETCHED MEDICAL RECORDS:', recordsData.length, 'records')
    } catch (err) {
      console.error('❌ Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch cadets')
    } finally {
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
    const totalTrainingMissed = cadetRecords.reduce((total, record) => total + record.totalTrainingDaysMissed, 0)
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
      cadet.battalion.toLowerCase().includes(searchLower) ||
      cadet.company.toLowerCase().includes(searchLower) ||
      joinDateFormatted.toLowerCase().includes(searchLower)
    )
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredCadets.length / cadetsPerPage)
  const startIndex = (currentPage - 1) * cadetsPerPage
  const endIndex = startIndex + cadetsPerPage
  const currentCadets = filteredCadets.slice(startIndex, endIndex)

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, showHighTrainingMissed])

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
            <Link href="/medical-records/new" className="btn-primary">
              Add New Record
            </Link>
          </div>
        </div>

        {/* Search Section */}
        <div className="card p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, academy number, battalion, company, or join date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Results Count */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredCadets.length)} of {filteredCadets.length} cadets
              {showHighTrainingMissed && ` (filtered: ≥30 days training missed)`}
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
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
                    Join Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentCadets.map((cadet) => (
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
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredCadets.length)} of {filteredCadets.length} cadets
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                    if (pageNum > totalPages) return null
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          currentPage === pageNum
                            ? 'bg-primary border-primary text-white'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
