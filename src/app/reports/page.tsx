'use client' 

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Download, Calendar, Clock, Filter, FileText } from 'lucide-react'
import { format } from 'date-fns'

interface ReportRecord {
  id: number
  cadetId: number
  name: string
  company: string
  battalion: string
  dateOfReporting: string
  medicalProblem: string
  diagnosis: string
  medicalStatus: string
  attendC: number
  trainingDaysMissed: number
  monitoringCase: boolean
  contactNo: string
  remarks: string
  createdAt: string
}

// Data generation function
const generateMockData = (period: string): ReportRecord[] => {
  // Return empty array for fresh start
  return []
}

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const [reportData, setReportData] = useState<ReportRecord[]>([])
  const [originalData, setOriginalData] = useState<ReportRecord[]>([]) // Store original data
  const [isGenerating, setIsGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [useCustomRange, setUseCustomRange] = useState(false)

  // Fetch real data from API
  const fetchReportData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('jwt_token')
      if (!token) {
        console.error('No authentication token found')
        setOriginalData([])
        setReportData([])
        return
      }
      const response = await fetch('/api/medical-records', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setOriginalData(data) // Store original data
        setReportData(data) // Set filtered data initially to all data
      } else {
        console.error('Failed to fetch medical records')
        setOriginalData([])
        setReportData([])
      }
    } catch (error) {
      console.error('Error fetching medical records:', error)
      setOriginalData([])
      setReportData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [])

  useEffect(() => {
    // Load data based on selected period or custom range
    if (useCustomRange && customStartDate && customEndDate) {
      // Filter data for custom date range based on reporting date
      const filteredData = originalData.filter(record => {
        const recordDate = new Date(record.dateOfReporting)
        const startDate = new Date(customStartDate)
        const endDate = new Date(customEndDate + 'T23:59:59') // Include the entire end date
        return recordDate >= startDate && recordDate <= endDate
      })
      setReportData(filteredData)
    } else if (!useCustomRange && selectedPeriod !== 'all') {
      // Filter data by time period based on reporting date
      const now = new Date()
      let startDate = new Date()

      switch (selectedPeriod) {
        case 'yesterday':
          // Yesterday: from start of yesterday to end of yesterday
          startDate = new Date(now)
          startDate.setDate(now.getDate() - 1)
          startDate.setHours(0, 0, 0, 0)
          const yesterdayEnd = new Date(startDate)
          yesterdayEnd.setHours(23, 59, 59, 999)

          const yesterdayData = originalData.filter(record => {
            const recordDate = new Date(record.dateOfReporting)
            return recordDate >= startDate && recordDate <= yesterdayEnd
          })
          setReportData(yesterdayData)
          return

        case 'today':
          // Today: from start of today to now
          startDate = new Date(now)
          startDate.setHours(0, 0, 0, 0)

          const todayData = originalData.filter(record => {
            const recordDate = new Date(record.dateOfReporting)
            return recordDate >= startDate && recordDate <= now
          })
          setReportData(todayData)
          return

        case 'week':
          // Last 7 days
          startDate.setDate(now.getDate() - 7)
          break

        default:
          // Show all data for any other case
          setReportData(originalData)
          return
      }

      // For week filter (and any other future filters)
      const filteredData = originalData.filter(record =>
        new Date(record.dateOfReporting) >= startDate
      )
      setReportData(filteredData)
    } else {
      // Show all data for 'all' period or when not using custom range
      setReportData(originalData)
    }
  }, [selectedPeriod, useCustomRange, customStartDate, customEndDate, originalData])

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    setUseCustomRange(false)
    setCustomStartDate('')
    setCustomEndDate('')
  }

  const handleCustomRangeToggle = () => {
    setUseCustomRange(!useCustomRange)
    if (!useCustomRange) {
      setCustomStartDate('')
      setCustomEndDate('')
    }
  }

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      // Validate that start date is not after end date
      if (new Date(customStartDate) > new Date(customEndDate)) {
        alert('Start date cannot be after end date')
        return
      }
      // The filtering will be triggered by the useEffect when dates change
      console.log('Custom date range applied:', customStartDate, 'to', customEndDate)
    }
  }

  const downloadCSV = () => {
    if (reportData.length === 0) {
      alert('No data available for the selected time period.')
      return
    }

    setIsGenerating(true)

    // Simulate processing time
    setTimeout(() => {
      const headers = ['ID', 'Cadet ID', 'Name', 'Company', 'Battalion', 'Date of Reporting', 'Medical Problem', 'Diagnosis', 'Medical Status', 'Attend C', 'Training Days Missed', 'Monitoring Case', 'Contact No', 'Remarks', 'Created At']
      const csvContent = [
        headers.join(','),
        ...reportData.map(record => [
          record.id,
          record.cadetId,
          `"${record.name}"`,
          `"${record.company}"`,
          `"${record.battalion}"`,
          record.dateOfReporting,
          `"${record.medicalProblem}"`,
          `"${record.diagnosis || ''}"`,
          record.medicalStatus,
          record.attendC,
          record.trainingDaysMissed || 0,
          record.monitoringCase ? 'Yes' : 'No',
          `"${record.contactNo || ''}"`,
          `"${record.remarks || ''}"`,
          record.createdAt
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', useCustomRange && customStartDate && customEndDate
        ? `curacadet-reports-${customStartDate}-to-${customEndDate}.csv`
        : `curacadet-reports-${selectedPeriod}-${format(new Date(), 'yyyy-MM-dd')}.csv`
      )
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setIsGenerating(false)
    }, 1000)
  }

  const getPeriodLabel = (period: string) => {
    if (useCustomRange && customStartDate && customEndDate) {
      return `Custom (${customStartDate} to ${customEndDate})`
    }

    switch (period) {
      case 'yesterday': return 'Yesterday'
      case 'today': return 'Today'
      case 'week': return 'Last Week'
      default: return 'All Records'
    }
  }

  const getPeriodDescription = (period: string) => {
    if (useCustomRange && customStartDate && customEndDate) {
      return `Medical records reported between ${customStartDate} and ${customEndDate}`
    }

    switch (period) {
      case 'yesterday': return 'Medical records reported yesterday'
      case 'today': return 'Medical records reported today'
      case 'week': return 'Medical records reported in the last 7 days'
      default: return 'All medical records in the system'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h2>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Generate and download medical records reports
            </p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Time Period Filters
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => handlePeriodChange('yesterday')}
              className={`p-4 rounded-lg border-2 ${
                !useCustomRange && selectedPeriod === 'yesterday'
                  ? 'border-primary bg-primary/10 dark:bg-primary/20 text-primary'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
              }`}
              disabled={useCustomRange}
            >
              <Calendar className="h-6 w-6 mx-auto mb-2" />
              <div className="text-sm font-medium">Yesterday</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Previous day</div>
            </button>

            <button
              onClick={() => handlePeriodChange('today')}
              className={`p-4 rounded-lg border-2 ${
                !useCustomRange && selectedPeriod === 'today'
                  ? 'border-primary bg-primary/10 dark:bg-primary/20 text-primary'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
              }`}
              disabled={useCustomRange}
            >
              <Clock className="h-6 w-6 mx-auto mb-2" />
              <div className="text-sm font-medium">Today</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current day</div>
            </button>

            <button
              onClick={() => handlePeriodChange('week')}
              className={`p-4 rounded-lg border-2 ${
                !useCustomRange && selectedPeriod === 'week'
                  ? 'border-primary bg-primary/10 dark:bg-primary/20 text-primary'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
              }`}
              disabled={useCustomRange}
            >
              <Filter className="h-6 w-6 mx-auto mb-2" />
              <div className="text-sm font-medium">Week</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last 7 days</div>
            </button>

            <button
              onClick={handleCustomRangeToggle}
              className={`p-4 rounded-lg border-2 ${
                useCustomRange
                  ? 'border-primary bg-primary/10 dark:bg-primary/20 text-primary'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
              }`}
            >
              <Calendar className="h-6 w-6 mx-auto mb-2" />
              <div className="text-sm font-medium">Custom Date</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select range</div>
            </button>
          </div>

          {/* Custom Date Range Section */}
          {useCustomRange && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Select Custom Date Range
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <button
                    onClick={handleCustomDateChange}
                    disabled={!customStartDate || !customEndDate}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                  >
                    Apply Range
                  </button>
                  <button
                    onClick={() => {
                      setUseCustomRange(false)
                      setCustomStartDate('')
                      setCustomEndDate('')
                      setSelectedPeriod('today')
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Report Summary */}
        <div className="card p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getPeriodLabel(selectedPeriod)} Report
              </h3>
              {/* Results Count */}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {reportData.length} of {originalData.length} records
                {selectedPeriod !== 'all' && ` (${getPeriodLabel(selectedPeriod)})`}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="text-2xl font-bold text-primary">{loading ? '...' : reportData.length}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {loading ? 'Loading records...' : 'records found'}
                </div>
              </div>
            </div>

            <button
              onClick={downloadCSV}
              disabled={isGenerating || reportData.length === 0 || loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Download CSV'}
            </button>
          </div>
        </div>

        {/* Data Preview */}
        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Data Preview
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Preview of records that will be included in the CSV export
            </p>
          </div>

          {reportData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Battalion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Medical Problem
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Medical Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Monitoring Case
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date Reported
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {reportData.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {record.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {record.company}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {record.battalion}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {record.medicalProblem}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.medicalStatus === 'Active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {record.medicalStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.monitoringCase
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {record.monitoringCase ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(record.dateOfReporting).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : loading ? (
            <div className="p-12 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-lg">Loading medical records...</p>
                <p className="text-sm mt-2">Please wait while we fetch the data.</p>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No records found</p>
                <p className="text-sm">No medical records available for the selected time period.</p>
                <p className="text-sm mt-2 text-gray-400 dark:text-gray-500">
                  Add records through the medical records form to see them here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
