'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Calendar, User, MapPin, FileText, Filter, Eye } from 'lucide-react'
import Link from 'next/link'
import { usePagination } from '@/hooks/usePagination'
import PaginationControls from '@/components/PaginationControls'
import { useRouter } from 'next/navigation'

interface MedicalRecord {
  id: number
  cadetId: number // Add cadetId field
  name: string
  company: string
  battalion: string
  dateOfReporting: string
  medicalProblem: string
  diagnosis?: string
  medicalStatus: string
  attendC: number
  totalTrainingDaysMissed: number
  contactNo: string
  remarks: string
  createdAt: string
  monitoringCase: boolean
  admittedInMH?: string // New field for admission in MH/BH/CH
}

export default function MedicalHistoryPage() {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentDateTime, setCurrentDateTime] = useState<string>('')
  const [updatingRecordId, setUpdatingRecordId] = useState<number | null>(null)

  const router = useRouter()

  useEffect(() => {
    const fetchMedicalRecords = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = localStorage.getItem('jwt_token')
        if (!token) {
          setError('Authentication required')
          return
        }

        const response = await fetch('/api/medical-records', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (!response.ok) throw new Error('Failed to fetch medical records')

        const records = await response.json()
        // Sort medical records by createdAt descending (most recent first)
        const sortedRecords = records.sort((a: MedicalRecord, b: MedicalRecord) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setMedicalRecords(sortedRecords)
      } catch (err) {
        console.error('Error fetching medical records:', err)
        setError(err instanceof Error ? err.message : 'Failed to load medical records')
      } finally {
        setLoading(false)
      }
    }

    fetchMedicalRecords()
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

  const handleStatusUpdate = async (recordId: number, newStatus: string) => {
    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to mark this medical record as ${newStatus.toLowerCase()}?`)
    if (!confirmed) return

    // For status changes to "Completed", check if cadet is still admitted
    if (newStatus === 'Completed') {
      const record = medicalRecords.find(r => r.id === recordId)
      if (record && record.admittedInMH === 'Yes') {
        // Check if cadet still has active admissions
        try {
          const token = localStorage.getItem('jwt_token')
          if (token) {
            const medicalRecordsResponse = await fetch(`/api/medical-history/${record.cadetId}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })

            if (medicalRecordsResponse.ok) {
              const { records } = await medicalRecordsResponse.json()
              const hasActiveAdmission = records.some((rec: any) =>
                rec.admittedInMH === 'Yes' && rec.medicalStatus === 'Active'
              )

              if (hasActiveAdmission) {
                alert('Please mark the cadet as returned in their details page first before changing status to Completed.')
                return
              }
            }
          }
        } catch (error) {
          console.error('Error checking cadet admission status:', error)
          alert('Unable to verify cadet return status. Please try again.')
          return
        }
      }
    }

    setUpdatingRecordId(recordId)

    try {
      const token = localStorage.getItem('jwt_token')
      if (!token) {
        alert('Authentication required')
        return
      }

      const response = await fetch(`/api/medical-records/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ medicalStatus: newStatus }),
      })

      if (response.ok) {
        // Update the local state immediately to show the new status
        setMedicalRecords(prevRecords =>
          prevRecords.map(record =>
            record.id === recordId
              ? { ...record, medicalStatus: newStatus }
              : record
          )
        )
      } else {
        const error = await response.json()
        alert(`Failed to update status: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update medical record status')
    } finally {
      setUpdatingRecordId(null)
    }
  }

  // Filter records based on search and status
  const filteredRecords = medicalRecords.filter(record => {
    const matchesSearch = searchTerm === '' ||
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.medicalProblem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.battalion.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesStatus = true
    if (statusFilter === 'Active') {
      matchesStatus = record.medicalStatus === 'Active'
    } else if (statusFilter === 'Completed') {
      matchesStatus = record.medicalStatus === 'Completed'
    } else if (statusFilter === 'monitoring') {
      matchesStatus = record.monitoringCase === true
    } else if (statusFilter === 'admitted') {
      matchesStatus = record.admittedInMH === 'Yes'
    } else if (statusFilter !== 'all') {
      matchesStatus = record.medicalStatus === statusFilter
    }

    return matchesSearch && matchesStatus
  })

  // Pagination for medical records table
  const pagination = usePagination({
    totalItems: filteredRecords.length,
    itemsPerPage: 10,
    initialPage: 1
  })

  // Get paginated records
  const paginatedRecords = pagination.getVisibleItems(filteredRecords)

  const handleAddNewRecord = () => {
    setUpdatingRecordId(-1) // Use -1 to indicate navigation loading
    // Add a smooth scrolling animation before navigation
    setTimeout(() => {
      router.push('/medical-records/new')
    }, 800) // 800ms delay for smooth animation
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading medical records...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Medical History</h2>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Complete medical records for all cadets
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex flex-col lg:items-end gap-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {currentDateTime}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddNewRecord}
                disabled={updatingRecordId === -1}
                className={`btn-primary flex items-center gap-2 ${
                  updatingRecordId === -1 ? 'cursor-not-allowed opacity-75' : ''
                }`}
              >
                {updatingRecordId === -1 ? (
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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Set(medicalRecords.map(r => r.cadetId)).size}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Cadets</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {medicalRecords.filter(r => r.medicalStatus === 'Active').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Cases</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {medicalRecords.filter(r => r.medicalStatus === 'Completed').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed Cases</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {medicalRecords.filter(r => r.monitoringCase && r.medicalStatus === 'Active').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Monitoring Case</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-purple-500"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Set(medicalRecords.filter(r => r.admittedInMH === 'Yes' && r.medicalStatus === 'Active').map(r => r.cadetId)).size}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active MH/BH/CH Status</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by cadet name, medical problem, company, or battalion..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Medical Status</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="monitoring">Monitoring Cases</option>
                <option value="admitted">Admitted in MH/BH/CH</option>
              </select>
              {/* Records per page selector */}
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
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {pagination.startIndex + 1}-{Math.min(pagination.endIndex + 1, filteredRecords.length)} of {filteredRecords.length} medical records
            {searchTerm && ` matching "${searchTerm}"`}
            {statusFilter !== 'all' && ` with status "${statusFilter}"`}
          </div>
        </div>

        {/* Medical Records Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cadet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Medical Problem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date Reported
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Medical Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {medicalRecords.length === 0 ? 'No Medical Records' : 'No Records Found'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {medicalRecords.length === 0
                          ? 'No medical records have been added yet.'
                          : 'Try adjusting your search or filter criteria.'
                        }
                      </p>
                      {medicalRecords.length === 0 && (
                        <button
                          onClick={handleAddNewRecord}
                          disabled={updatingRecordId === -1}
                          className={`btn-primary flex items-center gap-2 ${
                            updatingRecordId === -1 ? 'cursor-not-allowed opacity-75' : ''
                          }`}
                        >
                          {updatingRecordId === -1 ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Loading...</span>
                            </>
                          ) : (
                            <span>Add First Record</span>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                            <span className="text-primary font-medium">
                              {record.name.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                          <div className="ml-3">
                            <Link
                              href={`/cadets/${record.cadetId}`}
                              className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary transition-colors"
                            >
                              {record.name}
                            </Link>
                            {record.contactNo && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {record.contactNo}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {record.company}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {record.battalion}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {record.medicalProblem}
                        </div>
                        {record.diagnosis && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {record.diagnosis}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(record.dateOfReporting).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.admittedInMH === 'Yes'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                              : record.medicalStatus === 'Active'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : record.medicalStatus === 'Completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : record.medicalStatus === 'Returned'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {record.admittedInMH === 'Yes' ? 'Admitted in MH' : record.medicalStatus}
                          </span>
                          <div className="flex gap-1">
                            {record.admittedInMH !== 'Yes' && record.medicalStatus !== 'Active' && (
                              <button
                                onClick={() => handleStatusUpdate(record.id, 'Active')}
                                disabled={updatingRecordId === record.id}
                                className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-yellow-400 disabled:cursor-not-allowed transition-colors"
                                title="Mark as Active"
                              >
                                {updatingRecordId === record.id ? (
                                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  'A'
                                )}
                              </button>
                            )}
                            {record.medicalStatus !== 'Completed' && (
                              <button
                                onClick={() => handleStatusUpdate(record.id, 'Completed')}
                                disabled={updatingRecordId === record.id}
                                className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                                title="Mark as Completed"
                              >
                                {updatingRecordId === record.id ? (
                                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  'C'
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/cadets/${record.cadetId}`}
                          className="text-primary hover:text-primary/80 font-medium text-sm"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredRecords.length > 0 && (
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
