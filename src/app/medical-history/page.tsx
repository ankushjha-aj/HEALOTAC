'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Calendar, User, MapPin, FileText, Filter, Eye } from 'lucide-react'
import Link from 'next/link'

interface MedicalRecord {
  id: number
  cadetId: number // Add cadetId field
  name: string
  company: string
  battalion: string
  dateOfReporting: string
  medicalProblem: string
  diagnosis?: string
  status: string
  attendC: number
  totalTrainingDaysMissed: number
  contactNo: string
  remarks: string
  createdAt: string
  monitoringCase: boolean
}

export default function MedicalHistoryPage() {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentDateTime, setCurrentDateTime] = useState<string>('')

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
        setMedicalRecords(records)
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
    } else if (statusFilter !== 'all') {
      matchesStatus = record.medicalStatus === statusFilter
    }

    return matchesSearch && matchesStatus
  })

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
              <Link href="/medical-records/new" className="btn-primary">
                Add New Record
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  {medicalRecords.filter(r => r.monitoringCase).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Monitoring Cases</div>
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
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredRecords.length} of {medicalRecords.length} medical records
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
                        <Link href="/medical-records/new" className="btn-primary">
                          Add First Record
                        </Link>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                            <span className="text-primary font-medium">
                              {record.name.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {record.name}
                            </p>
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
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {record.attendC > 0 ? (
                            <>Attend C: {record.attendC}</>
                          ) : record.totalTrainingDaysMissed && record.totalTrainingDaysMissed > 0 ? (
                            <span className="font-medium text-orange-600 dark:text-orange-400">
                              MI Detained: {record.totalTrainingDaysMissed}
                            </span>
                          ) : (
                            <>Attend C: {record.attendC}</>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.medicalStatus === 'Active'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : record.medicalStatus === 'Completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {record.medicalStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/medical-history/${record.cadetId}`}
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
        </div>
      </div>
    </DashboardLayout>
  )
}
