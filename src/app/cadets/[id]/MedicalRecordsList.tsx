'use client'

import { Calendar, Clock, FileText, X, Info, Download } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import jsPDF from 'jspdf'

interface CadetInfo {
  id: number
  name: string
  battalion: string
  company: string
  joinDate: string
  academyNumber?: number
  height?: number
  weight?: number
  age?: number
  course?: string
  sex?: string
  createdAt: string
  updatedAt?: string
  relegated?: string
  // Health Parameters
  bloodGroup?: string
  bmi?: string
  bodyFat?: string
  calcanealBoneDensity?: string
  bp?: string
  pulse?: string
  so2?: string
  bcaFat?: string
  ecg?: string
  temp?: string
  smmKg?: string
  // Vaccination Status
  covidDose1?: boolean
  covidDose2?: boolean
  covidDose3?: boolean
  hepatitisBDose1?: boolean
  hepatitisBDose2?: boolean
  tetanusToxoid?: boolean
  chickenPoxDose1?: boolean
  chickenPoxDose2?: boolean
  chickenPoxSuffered?: boolean
  yellowFever?: boolean
  pastMedicalHistory?: string
  // Tests
  enduranceTest?: string
  agilityTest?: string
  speedTest?: string
  // Strength Tests
  verticalJump?: string
  ballThrow?: string
  lowerBackStrength?: string
  shoulderDynamometerLeft?: string
  shoulderDynamometerRight?: string
  handGripDynamometerLeft?: string
  handGripDynamometerRight?: string
  // Overall Assessment
  overallAssessment?: string
  // Menstrual & Medical History (Female only)
  menstrualFrequency?: string
  menstrualDays?: string
  lastMenstrualDate?: string
  menstrualAids?: string | string[]
  sexuallyActive?: string
  maritalStatus?: string
  pregnancyHistory?: string
  contraceptiveHistory?: string
  surgeryHistory?: string
  medicalCondition?: string
  hemoglobinLevel?: string
}

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
  cadetInfo?: CadetInfo
  onReturn?: (recordId: number, daysMissed: number) => void
}

export default function MedicalRecordsList({ records, cadetId, cadetInfo, onReturn }: MedicalRecordsListProps) {
  const [showModal, setShowModal] = useState(false)

  const generateMedicalRecordPDF = (record: MedicalRecord, cadetInfo: CadetInfo) => {
    const doc = new jsPDF()
    
    // Set up colors and styling
    const primaryColor = [0, 83, 156] // Navy blue
    const secondaryColor = [100, 100, 100] // Gray
    const accentColor = [220, 38, 38] // Red for important info
    
    let yPos = 18
    
    // Header Section with Border
    doc.setFillColor(240, 240, 240)
    doc.rect(0, 0, 210, 50, 'F')
    
    // Header Text
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('MEDICAL RECORD REPORT', 105, yPos + 16, { align: 'center' })
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.text('OFFICERS TRAINING ACADEMY - CHENNAI', 105, yPos + 30, { align: 'center' })
    
    // Header border
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(0.5)
    doc.rect(10, 10, 190, 35)
    
    yPos = 56
    
    // Report Details
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.text(`Report ID: MR-${record.id}`, 15, yPos)
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 140, yPos)
    
    yPos += 16
    
    // Cadet Information Section
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('CADET INFORMATION', 15, yPos)
    
    // Section underline
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(0.3)
    doc.line(15, yPos + 2, 80, yPos + 2)
    
    yPos += 8
    
    // Cadet Info Grid (two columns)
    const cadetData: [string, string][] = [
      ['Name:', cadetInfo.name || 'N/A'],
      ['Academy Number:', cadetInfo.academyNumber ? String(cadetInfo.academyNumber) : 'N/A'],
      ['Battalion:', cadetInfo.battalion || 'N/A'],
      ['Company:', cadetInfo.company || 'N/A'],
      ['Course:', cadetInfo.course || 'N/A'],
      ['Age:', cadetInfo.age ? `${cadetInfo.age}` : 'N/A'],
      ['Gender:', cadetInfo.sex || 'N/A'],
      ['Height (cm):', cadetInfo.height ? `${cadetInfo.height}` : 'N/A'],
      ['Weight (kg):', cadetInfo.weight ? `${cadetInfo.weight}` : 'N/A'],
      ['Blood Group:', cadetInfo.bloodGroup || 'N/A'],
      ['Join Date:', new Date(cadetInfo.joinDate).toLocaleDateString()]
    ]
    
    const cadetColumns = 2
    const columnWidth = 88
    const columnGap = 10
    const rowHeight = 7
    let cadetRow = 0
    let cadetStartY = yPos
    
    cadetData.forEach(([label, value], index) => {
      const column = index % cadetColumns
      if (column === 0 && index !== 0) {
        cadetRow += 1
      }
      let currentY = cadetStartY + cadetRow * rowHeight
      if (currentY > 252) {
        doc.addPage()
        yPos = 18
        cadetStartY = yPos
        cadetRow = 0
        currentY = cadetStartY
      }
      const currentX = 15 + column * (columnWidth + columnGap)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(0, 0, 0)
      doc.text(String(label), currentX, currentY)
      doc.setDrawColor(204, 204, 204)
      doc.setLineWidth(0.4)
      const valueBoxX = currentX + 32
      const valueBoxWidth = columnWidth - 35
      doc.rect(valueBoxX, currentY - 5, valueBoxWidth, 6.5)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.text(value, valueBoxX + 1.5, currentY - 0.5)
    })
    
    yPos = cadetStartY + (cadetRow + 1) * rowHeight + 8
    
    // Medical Record Section
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('MEDICAL RECORD DETAILS', 15, yPos)
    
    // Section underline
    doc.line(15, yPos + 2, 95, yPos + 2)
    
    yPos += 8
    
    // Medical Record Table
    const medicalData: [string, string][] = [
      ['Date of Reporting:', new Date(record.dateOfReporting).toLocaleDateString()],
      ['Medical Problem:', record.medicalProblem],
      ['Diagnosis:', record.diagnosis || 'Not specified'],
      ['Medical Status:', record.medicalStatus],
      ['Contact Number:', record.contactNo || 'Not provided']
    ]
    
    doc.setFontSize(9)
    medicalData.forEach(([label, value]) => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
      
      doc.setFont('helvetica', 'bold')
      doc.text(String(label), 20, yPos)
      doc.setFont('helvetica', 'normal')
      
      // Handle long text wrapping
      if (value.length > 50) {
        const lines = doc.splitTextToSize(value, 120)
        doc.text(lines, 70, yPos)
        yPos += lines.length * 4.5
      } else {
        doc.text(value, 70, yPos)
        yPos += 5.5
      }
    })
    
    yPos += 3
    
    // Treatment Details Section
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('TREATMENT DETAILS', 15, yPos)
    yPos += 10
    
    const treatmentData: [string, string][] = []
    
    if (record.attendC && Number(record.attendC) > 0) {
      treatmentData.push(['Attend C:', String(record.attendC)])
    }
    if (record.miDetained && Number(record.miDetained) > 0) {
      treatmentData.push(['MI Detained:', String(record.miDetained)])
    }
    if (record.exPpg && Number(record.exPpg) > 0) {
      treatmentData.push(['Ex-PPG:', `${record.exPpg} (${(record.exPpg * 0.25).toFixed(1)} days missed)`])
    }
    if (record.attendB && Number(record.attendB) > 0) {
      treatmentData.push(['Attend B:', `${record.attendB} (${(record.attendB * 0.25).toFixed(1)} days missed)`])
    }
    if (record.physiotherapy && Number(record.physiotherapy) > 0) {
      treatmentData.push(['Physiotherapy:', String(record.physiotherapy)])
    }
    
    if (treatmentData.length > 0) {
      treatmentData.forEach(([label, value]) => {
        if (yPos > 265) {
          doc.addPage()
          yPos = 18
        }
        doc.setFont('helvetica', 'bold')
        doc.text(String(label), 25, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(value, 75, yPos)
        yPos += 5.5
      })
    } else {
      doc.setFont('helvetica', 'normal')
      doc.text('No specific treatment details recorded', 25, yPos)
      yPos += 5.5
    }
    
    yPos += 3
    
    // Training Impact
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2])
    doc.text('TRAINING IMPACT', 15, yPos)
    yPos += 10
    
    let totalTrainingDays = record.totalTrainingDaysMissed || 0
    if (record.exPpg && Number(record.exPpg) > 0) {
      totalTrainingDays += Number(record.exPpg) * 0.25
    }
    if (record.attendB && Number(record.attendB) > 0) {
      totalTrainingDays += Number(record.attendB) * 0.25
    }
    const formattedTotalDays = totalTrainingDays > 0 ? totalTrainingDays.toFixed(1) : '0'
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Total Training Days Missed: ${formattedTotalDays} day${formattedTotalDays === '1.0' ? '' : 's'}`, 25, yPos)
    yPos += 5.5
    
    const monitoringValue = record.monitoringCase ? 'Yes' : 'No'
    doc.text(`Monitoring Case: ${monitoringValue}`, 25, yPos)
    yPos += 5.5
    
    if (record.admittedInMH) {
      doc.text(`Admitted in Medical Hospital: ${record.admittedInMH}`, 25, yPos)
      yPos += 5.5
    }
    
    yPos += 3
    
    // Remarks Section
    if (record.remarks) {
      if (yPos > 195) {
        doc.addPage()
        yPos = 18
      }
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.text('REMARKS', 15, yPos)
      yPos += 7
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(0, 0, 0)
      
      const remarksLines = doc.splitTextToSize(record.remarks, 165)
      doc.text(remarksLines, 20, yPos)
      yPos += remarksLines.length * 4.5 + 8
    }
    
    // Signature Section
    if (yPos > 212) {
      doc.addPage()
      yPos = 18
    }
    
    // Draw signature lines
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.3)
    
    yPos += 20
    doc.line(20, yPos, 80, yPos) // Doctor signature line
    doc.line(120, yPos, 180, yPos) // Date line
    
    yPos += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.text("Doctor's Signature", 20, yPos)
    doc.text('Date', 120, yPos)
    
    yPos += 15
    
    // Footer
    doc.setFontSize(8)
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.text('This document is generated electronically by HEALOTAC Medical Records Management System', 105, 280, { align: 'center' })
    doc.text(`Record created on: ${new Date(record.createdAt).toLocaleDateString()}`, 105, 285, { align: 'center' })
    
    // Save the PDF
    const fileName = `Medical_Record_${cadetInfo.name.replace(/\s+/g, '_')}_${record.id}.pdf`
    doc.save(fileName)
  }

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
                      Admitted in MH
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(record.dateOfReporting).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cadetInfo && (
                    <button
                      onClick={() => generateMedicalRecordPDF(record, cadetInfo)}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                    MH/BH/CH Admission
                  </div>
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
                    onDoubleClick={(e) => {
                      if (!isChecked && canCheck && onReturn) {
                        onReturn(record.id, daysMissed)
                        setShowModal(true)
                      }
                    }}
                  >
                    <input type="checkbox" className="sr-only peer" checked={isChecked} disabled={isChecked || !canCheck} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Returned</span>
                  </label>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">{isChecked ? `Training days missed by cadet: ${daysMissed} days` : 'Double-click the toggle when cadet returns from MH/BH/CH facility (cannot be unset once marked)'}</p>
              </div>

              {record.diagnosis && (
                <div className="mt-3">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Diagnosis
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {record.diagnosis}
                  </p>
                </div>
              )}

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
                {cadetInfo && (
                  <button
                    onClick={() => generateMedicalRecordPDF(record, cadetInfo)}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                )}
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
                    {record.miDetained && Number(record.miDetained) > 0 ? (
                      <div>MI Detained: {record.miDetained}</div>
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
                      <div className="flex items-center gap-2">
                        <span>Physiotherapy: {record.physiotherapy}</span>
                        <div className="relative group">
                          <Info className="h-3 w-3 text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            Not counted in training days missed
                          </div>
                        </div>
                      </div>
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

      {/* Custom Modal for Return Confirmation */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Cadet Return Confirmed
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Now please visit the respective medical history and mark this as completed from there also. <br />
                  Otherwise you will not be able to add medical records for this cadet.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-primary"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
