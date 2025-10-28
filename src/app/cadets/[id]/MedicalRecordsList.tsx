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
