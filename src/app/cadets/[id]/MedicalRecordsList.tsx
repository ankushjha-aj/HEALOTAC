'use client'

import { Calendar, Clock, FileText } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

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
  admittedInMH?: string
  contactNo: string
  remarks: string
  createdAt: string
}

interface MedicalRecordsListProps {
  records: MedicalRecord[]
  cadetId: number
  onReturn?: (recordId: number, daysMissed: number) => void
}

export default function MedicalRecordsList({ records, cadetId, onReturn }: MedicalRecordsListProps) {

  return (
    <div className="space-y-4">
      {records.map((record: MedicalRecord) => {
        const admissionDate = new Date(record.dateOfReporting)
        const timeDiff = Date.now() - admissionDate.getTime()
        const canCheck = timeDiff >= 24 * 60 * 60 * 1000
        const daysMissed = Math.floor(timeDiff / (24 * 60 * 60 * 1000))
        const isChecked = record.admittedInMH === 'Yes' && (record.totalTrainingDaysMissed || 0) > 0

        return (
        <div key={record.id} className="card p-4">
          {record.admittedInMH === 'Yes' ? (
            // Simplified view for MH/BH/CH admitted records
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-purple-500"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Admitted today
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(record.dateOfReporting).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                  MH/BH/CH Admission
                </div>
              </div>
              {/* Cadet Return Status */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Cadet Return Status</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Track when cadet returns to OTA</p>
                    </div>
                  </div>
                  <label 
                    className="relative inline-flex items-center cursor-pointer" 
                    title={!canCheck ? "Please come back after 24 hours in order to change status to returned" : isChecked ? "Cadet has been marked as returned" : "Double-click to mark cadet as returned"}
                  >
                    <input type="checkbox" className="sr-only peer" checked={isChecked} onDoubleClick={(e) => {
                      if (!isChecked && canCheck && onReturn) {
                        onReturn(record.id, daysMissed)
                      }
                    }} disabled={isChecked || !canCheck} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Returned</span>
                  </label>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">{isChecked ? `Training days missed by cadet: ${daysMissed} days` : 'Double-click the toggle when cadet returns from MH/BH/CH facility (cannot be unset once marked)'}</p>
              </div>
            </>
          ) : (
            // Normal detailed view for other records
            <>
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
            </>
          )}
        </div>
      )})}
    </div>
  )
}
