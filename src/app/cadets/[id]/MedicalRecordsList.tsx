'use client'

import { useState } from 'react'
import { Calendar, Clock, FileText, Activity } from 'lucide-react'
import Link from 'next/link'

interface MedicalRecord {
  id: number
  cadetId: number
  dateOfReporting: string
  medicalProblem: string
  diagnosis?: string
  medicalStatus: string
  attendC: number
  miDetained: number
  exPpg: number
  attendB: number
  physiotherapy: number
  totalTrainingDaysMissed: number
  monitoringCase: boolean
  contactNo: string
  remarks: string
  createdAt: string
}

interface MedicalRecordsListProps {
  records: MedicalRecord[]
  cadetId: number
}

export default function MedicalRecordsList({ records: initialRecords, cadetId }: MedicalRecordsListProps) {
  const [records, setRecords] = useState<MedicalRecord[]>(initialRecords)
  const [updatingRecordId, setUpdatingRecordId] = useState<number | null>(null)

  const handleStatusUpdate = async (recordId: number, newStatus: string) => {
    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to mark this medical record as ${newStatus.toLowerCase()}?`)
    if (!confirmed) return

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
        setRecords(prevRecords =>
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

  return (
    <div className="space-y-4">
      {records.slice(0, 5).map((record: MedicalRecord) => (
        <div key={record.id} className="card p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {record.medicalProblem}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(record.dateOfReporting).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Created {new Date(record.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                record.medicalStatus === 'Active'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  : record.medicalStatus === 'Completed'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }`}>
                {record.medicalStatus}
              </span>
              {record.medicalStatus === 'Active' && (
                <button
                  onClick={() => handleStatusUpdate(record.id, 'Completed')}
                  disabled={updatingRecordId === record.id}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                  title="Mark as completed"
                >
                  {updatingRecordId === record.id ? (
                    <>
                      <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Complete
                    </>
                  )}
                </button>
              )}
              {record.monitoringCase && (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                  Monitoring Case
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {record.diagnosis && (
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Diagnosis
                </label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {record.diagnosis}
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Details
              </label>
              <div className="text-sm text-gray-900 dark:text-white mt-1 space-y-1">
                {/* Only show Attend C if > 0 */}
                {record.attendC && Number(record.attendC) > 0 ? (
                  <div>Attend C: {record.attendC}</div>
                ) : null}

                {/* Only show MI Detained if > 0 */}
                {record.attendC === 0 && record.totalTrainingDaysMissed && Number(record.totalTrainingDaysMissed) > 0 ? (
                  <div className="font-medium text-orange-600 dark:text-orange-400">
                    MI Detained: {record.totalTrainingDaysMissed} days
                  </div>
                ) : null}
                {record.attendC && Number(record.attendC) > 0 && record.totalTrainingDaysMissed && Number(record.totalTrainingDaysMissed) > Number(record.attendC) ? (
                  <div className="font-medium text-orange-600 dark:text-orange-400">
                    MI Detained: {record.totalTrainingDaysMissed - record.attendC} days
                  </div>
                ) : null}

                {/* Only show Ex-PPG if > 0 */}
                {record.exPpg && Number(record.exPpg) > 0 ? (
                  <div>Ex-PPG: {record.exPpg} (+{(record.exPpg * 0.25).toFixed(1)} day{(record.exPpg * 0.25) !== 1 ? 's' : ''} missed)</div>
                ) : null}

                {/* Only show Attend B if > 0 */}
                {record.attendB && Number(record.attendB) > 0 ? (
                  <div>Attend B: {record.attendB} (+{(record.attendB * 0.25).toFixed(1)} day{(record.attendB * 0.25) !== 1 ? 's' : ''} missed)</div>
                ) : null}

                {/* Only show Physiotherapy if > 0 */}
                {record.physiotherapy && Number(record.physiotherapy) > 0 ? (
                  <div>Physiotherapy: {record.physiotherapy}</div>
                ) : null}

                {/* Calculate and show total training days missed for this record */}
                {(() => {
                  let totalDays = record.totalTrainingDaysMissed || 0
                  if (record.exPpg && Number(record.exPpg) > 0) totalDays += Number(record.exPpg) * 0.25
                  if (record.attendB && Number(record.attendB) > 0) totalDays += Number(record.attendB) * 0.25
                  return totalDays > 0 ? (
                    <div className="font-medium text-red-600 dark:text-red-400 border-t border-gray-200 dark:border-gray-600 pt-1 mt-2">
                      Training Days Missed: {totalDays.toFixed(1)} day{totalDays !== 1 ? 's' : ''}
                    </div>
                  ) : null
                })()}
              </div>
            </div>
          </div>

          {record.remarks && (
            <div className="mt-3">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Remarks
              </label>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {record.remarks}
              </p>
            </div>
          )}
        </div>
      ))}

      {records.length > 5 && (
        <div className="text-center pt-4">
          <Link
            href={`/medical-history/${cadetId}`}
            className="text-primary hover:text-primary/80"
          >
            View all {records.length} records →
          </Link>
        </div>
      )}
    </div>
  )
}
