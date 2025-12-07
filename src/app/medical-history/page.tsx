'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Calendar, User, MapPin, FileText, Filter, Eye, Search } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
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
  bloodGroup?: string
  isForeign: boolean
  academyNumber?: string
}

export default function MedicalHistoryPage() {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    name: '',
    company: '',
    battalion: '',
    medicalProblem: '',
    bloodGroup: ''
  })
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [foreignFilter, setForeignFilter] = useState('all')
  const [currentDateTime, setCurrentDateTime] = useState<string>('')
  const [updatingRecordId, setUpdatingRecordId] = useState<number | null>(null)

  const { user } = useUser()
  const isReadOnly = (user?.username?.toLowerCase() || '').includes('brig') ||
    (user?.username?.toLowerCase() || '').includes('coco') ||
    (user?.name?.toLowerCase() || '').includes('brig') ||
    (user?.name?.toLowerCase() || '').includes('coco')

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

        // Check for records that need automatic completion based on attendC
        const recordsToUpdate = []
        const now = new Date()

        for (const record of records) {
          // Only process records that are Active and have attendC > 0
          if (record.medicalStatus === 'Active' && record.attendC && record.attendC > 0 && record.admittedInMH !== 'Yes') {
            const reportingDate = new Date(record.dateOfReporting)
            const attendanceEndDate = new Date(reportingDate)
            attendanceEndDate.setDate(attendanceEndDate.getDate() + record.attendC)

            // If current date is past the attendance end date, mark as completed
            if (now >= attendanceEndDate) {
              recordsToUpdate.push(record.id)
              console.log(`🔄 Auto-completing record ${record.id} for cadet ${record.name} (attendC: ${record.attendC}, reported: ${record.dateOfReporting})`)
            }
          }
        }

        // Update records that need to be completed
        if (recordsToUpdate.length > 0) {
          try {
            const updatePromises = recordsToUpdate.map(recordId =>
              fetch(`/api/medical-records/${recordId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ medicalStatus: 'Completed' }),
              })
            )

            await Promise.all(updatePromises)
            console.log(`✅ Auto-completed ${recordsToUpdate.length} medical records`)

            // Re-fetch records to get updated data
            const updatedResponse = await fetch('/api/medical-records', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            const updatedRecords = await updatedResponse.json()

            // Sort medical records by createdAt descending (most recent first)
            const sortedRecords = updatedRecords.sort((a: MedicalRecord, b: MedicalRecord) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            setMedicalRecords(sortedRecords)
          } catch (updateError) {
            console.error('❌ Error auto-completing records:', updateError)
            // Fall back to original records if auto-completion fails
            const sortedRecords = records.sort((a: MedicalRecord, b: MedicalRecord) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            setMedicalRecords(sortedRecords)
          }
        } else {
          // Sort medical records by createdAt descending (most recent first)
          const sortedRecords = records.sort((a: MedicalRecord, b: MedicalRecord) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          setMedicalRecords(sortedRecords)
        }
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

  const handleStatusUpdate = async (recordId: number, newStatus: string, record?: MedicalRecord) => {
    // For status changes to "Completed" when admitted in MH, show confirmation about checking return status
    if (newStatus === 'Completed' && record?.admittedInMH === 'Yes') {
      const confirmed = confirm('Please first verify whether the cadet has returned. If the cadet has not returned, do not mark it as completed, as this action cannot be changed later.\n\nDo you want to proceed?')
      if (!confirmed) return
    } else if (record?.admittedInMH === 'Yes') {
      // Show regular confirmation for other status changes when admitted in MH
      const confirmed = confirm(`Are you sure you want to mark this medical record as ${newStatus.toLowerCase()}?`)
      if (!confirmed) return
    }
    // No confirmation for regular records (not admitted in MH)

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
    // Apply multi-field filters
    const nameMatch = !filters.name ||
      record.name.toLowerCase().includes(filters.name.toLowerCase()) ||
      (record.academyNumber && String(record.academyNumber).toLowerCase().includes(filters.name.toLowerCase()))

    const companyMatch = !filters.company || record.company.toLowerCase().includes(filters.company.toLowerCase())

    const battalionMatch = !filters.battalion || record.battalion.toLowerCase().includes(filters.battalion.toLowerCase())

    const problemMatch = !filters.medicalProblem || record.medicalProblem.toLowerCase().includes(filters.medicalProblem.toLowerCase())

    const bloodGroupMatch = !filters.bloodGroup || (record.bloodGroup && record.bloodGroup === filters.bloodGroup)

    const foreignMatch = foreignFilter === 'all'
      ? true
      : foreignFilter === 'yes'
        ? record.isForeign
        : !record.isForeign

    const matchesSearch = nameMatch && companyMatch && battalionMatch && problemMatch && bloodGroupMatch && foreignMatch

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
              {!isReadOnly && (
                <button
                  onClick={handleAddNewRecord}
                  disabled={updatingRecordId === -1}
                  className={`btn-primary flex items-center gap-2 ${updatingRecordId === -1 ? 'cursor-not-allowed opacity-75' : ''}`}
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
              )}
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
                <div className="text-sm text-gray-600 dark:text-gray-400">Currently Admitted in MH/BH/CH</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        {/* Filters and Search */}
        <div className="mt-8 mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter Records</h3>
            {(filters.name || filters.company || filters.battalion || filters.medicalProblem || filters.bloodGroup || statusFilter !== 'all' || foreignFilter !== 'all') && (
              <button
                onClick={() => {
                  setFilters({ name: '', company: '', battalion: '', medicalProblem: '', bloodGroup: '' })
                  setStatusFilter('all')
                  setForeignFilter('all')
                }}
                className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {/* Name Filter */}
            <div>
              <label htmlFor="filter-name" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Name / Academy No.
              </label>
              <div className="relative">
                <input
                  id="filter-name"
                  type="text"
                  placeholder="Search name..."
                  value={filters.name}
                  onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field py-2 text-sm"
                />
              </div>
            </div>

            {/* Company Filter with Autocomplete */}
            <div className="relative">
              <label htmlFor="filter-company" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
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
                className="input-field py-2 text-sm"
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
              <label htmlFor="filter-battalion" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Battalion
              </label>
              <input
                id="filter-battalion"
                type="text"
                placeholder="Filter battalion..."
                value={filters.battalion}
                onChange={(e) => setFilters(prev => ({ ...prev, battalion: e.target.value }))}
                className="input-field py-2 text-sm"
              />
            </div>

            {/* Medical Problem Filter */}
            <div>
              <label htmlFor="filter-problem" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Medical Problem
              </label>
              <div className="relative">
                <input
                  id="filter-problem"
                  type="text"
                  placeholder="Filter problem..."
                  value={filters.medicalProblem}
                  onChange={(e) => setFilters(prev => ({ ...prev, medicalProblem: e.target.value }))}
                  className="input-field py-2 text-sm pr-20"
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <select
                    className="h-full py-0 pl-2 pr-2 border-none bg-transparent text-gray-500 text-xs focus:ring-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.value) {
                        setFilters(prev => ({ ...prev, medicalProblem: e.target.value }))
                      }
                    }}
                    value=""
                  >
                    <option value="" disabled>Select</option>
                    <option value="Head">Head</option>
                    <option value="Chest">Chest</option>
                    <option value="Shoulders">Shoulders</option>
                    <option value="Back">Back</option>
                    <option value="Pelvic">Pelvic</option>
                    <option value="Knee">Knee</option>
                    <option value="Ankle">Ankle</option>
                    <option value="Elbow">Elbow</option>
                    <option value="Wrist">Wrist</option>
                    <option value="Hand">Hand</option>
                    <option value="Foot">Foot</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Blood Group Filter */}
            <div>
              <label htmlFor="filter-blood-group" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Blood Group
              </label>
              <select
                id="filter-blood-group"
                value={filters.bloodGroup}
                onChange={(e) => setFilters(prev => ({ ...prev, bloodGroup: e.target.value }))}
                className="input-field py-2 text-sm"
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

            {/* Medical Status Filter */}
            <div>
              <label htmlFor="filter-status" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Medical Status
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field py-2 text-sm"
              >
                <option value="all">All Medical Status</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="monitoring">Monitoring Cases</option>
                <option value="admitted">Admitted in MH/BH/CH</option>
              </select>
            </div>

            <div className="flex gap-4">
              {/* Foreign Cadets Dropdown */}
              <div className="flex-1">
                <label htmlFor="filter-foreign" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  F. Cadets
                </label>
                <select
                  id="filter-foreign"
                  value={foreignFilter}
                  onChange={(e) => setForeignFilter(e.target.value)}
                  className="input-field py-2 text-sm"
                >
                  <option value="all">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              {/* Records per Page */}
              <div className="flex-1">
                <label htmlFor="records-per-page" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Records/Page
                </label>
                <select
                  id="records-per-page"
                  value={pagination.itemsPerPage}
                  onChange={(e) => pagination.setItemsPerPage(Number(e.target.value))}
                  className="input-field py-2 text-sm"
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

        {/* Results Count */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {pagination.startIndex + 1}-{Math.min(pagination.endIndex + 1, filteredRecords.length)} of {filteredRecords.length} medical records
            {(filters.name || filters.company || filters.battalion || filters.medicalProblem || filters.bloodGroup) && ` matching filters`}
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
                    Company
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
                          className={`btn-primary flex items-center gap-2 ${updatingRecordId === -1 ? 'cursor-not-allowed opacity-75' : ''
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
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/cadets/${record.cadetId}`}
                                className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary transition-colors"
                              >
                                {record.name}
                              </Link>
                              {record.isForeign && (
                                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-blue-600 bg-blue-100 rounded-full dark:text-blue-400 dark:bg-blue-900/30" title="Foreign Cadet">
                                  F
                                </span>
                              )}
                            </div>
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
                          {(() => {
                            const companyMap: { [key: string]: string } = {
                              'M': 'Meiktila',
                              'N': 'Naushera',
                              'Z': 'Zojila',
                              'J': 'Jessami',
                              'K': 'Kohima',
                              'P': 'Phillora'
                            }
                            return companyMap[record.company] ? `${record.company} - ${companyMap[record.company]}` : record.company
                          })()}
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
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${record.admittedInMH === 'Yes' && record.medicalStatus === 'Active'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                            : record.medicalStatus === 'Active'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : record.medicalStatus === 'Completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : record.medicalStatus === 'Returned'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                            }`}>
                            {record.admittedInMH === 'Yes' && record.medicalStatus === 'Active' ? 'Admitted in MH' : record.medicalStatus}
                          </span>
                          {/* Auto-completion indicator for Active records with attendC */}
                          {(() => {
                            // Debug logging
                            if (record.medicalStatus === 'Active' && record.attendC && record.attendC > 0) {
                              console.log('🔍 Checking record:', {
                                id: record.id,
                                name: record.name,
                                status: record.medicalStatus,
                                attendC: record.attendC,
                                admittedInMH: record.admittedInMH,
                                dateOfReporting: record.dateOfReporting
                              })
                            }

                            return record.medicalStatus === 'Active' && record.attendC && record.attendC > 0 && record.admittedInMH !== 'Yes' ? (() => {
                              const reportingDate = new Date(record.dateOfReporting)
                              const attendanceEndDate = new Date(reportingDate)
                              attendanceEndDate.setDate(attendanceEndDate.getDate() + record.attendC)
                              const now = new Date()
                              const daysUntilExpiry = Math.ceil((attendanceEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

                              console.log('📅 Date calculation for record', record.id, ':', {
                                reportingDate: reportingDate.toDateString(),
                                attendanceEndDate: attendanceEndDate.toDateString(),
                                now: now.toDateString(),
                                daysUntilExpiry,
                                willShowIndicator: daysUntilExpiry <= 2
                              })

                              if (daysUntilExpiry <= 0) {
                                return <span className="text-xs text-orange-600 dark:text-orange-400 ml-2" title="Will auto-complete on next page load">⏰</span>
                              } else if (daysUntilExpiry <= 2) {
                                return <span className="text-xs text-orange-600 dark:text-orange-400 ml-2" title={`Auto-completes in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`}>⏳</span>
                              }
                              return null
                            })() : null
                          })()}
                          <div className="flex gap-1">
                            {record.admittedInMH !== 'Yes' && record.medicalStatus !== 'Active' && (
                              <button
                                onClick={() => handleStatusUpdate(record.id, 'Active', record)}
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
                                onClick={() => handleStatusUpdate(record.id, 'Completed', record)}
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
