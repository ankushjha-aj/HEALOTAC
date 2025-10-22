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
  status: string
  attendC: number
  miDetained: number
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

export default function MedicalRecordsList({ records, cadetId }: MedicalRecordsListProps) {
  const handleStatusUpdate = async (recordId: number, newStatus: string) => {
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
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        // Refresh the page to show updated data
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Failed to update status: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update medical record status')
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
                record.status === 'Active'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  : record.status === 'Completed'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }`}>
                {record.status}
              </span>
              {record.status === 'Active' && (
                <button
                  onClick={() => handleStatusUpdate(record.id, 'Completed')}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  title="Mark as completed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Complete
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
                {record.attendC > 0 && (
                  <div>Attend C: {record.attendC}</div>
                )}
                {record.attendC === 0 && record.totalTrainingDaysMissed && record.totalTrainingDaysMissed > 0 && (
                  <div className="font-medium text-orange-600 dark:text-orange-400">
                    MI Detained: {record.totalTrainingDaysMissed} days
                  </div>
                )}
                {record.attendC > 0 && record.totalTrainingDaysMissed && record.totalTrainingDaysMissed > record.attendC && (
                  <div>MI Detained: {record.totalTrainingDaysMissed - record.attendC} days</div>
                )}
                {record.totalTrainingDaysMissed > 0 && (
                  <div className="font-medium text-red-600 dark:text-red-400">
                    Total Training Days Missed: {record.totalTrainingDaysMissed}
                  </div>
                )}
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
