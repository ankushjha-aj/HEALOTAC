'use client'

import { Calendar, Clock, FileText, X, Info, Download, Edit } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { useUser } from '@/hooks/useUser'

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
  commandantRemarks?: string
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
  const [editingRemarkId, setEditingRemarkId] = useState<number | null>(null)
  const [remarkText, setRemarkText] = useState('')
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [pdfFilename, setPdfFilename] = useState<string>('')
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null)
  const [editFormData, setEditFormData] = useState<{
    medicalProblem: string
    diagnosis: string
    dateOfReporting: string
    attendC: string
    attendB: string
    exPpg: string
    physiotherapy: string
    miDetained: string
    contactNo: string
    remarks: string
    monitoringCase: boolean
    admittedInMH: string
  }>({
    medicalProblem: '',
    diagnosis: '',
    dateOfReporting: '',
    attendC: '0',
    attendB: '0',
    exPpg: '0',
    physiotherapy: '0',
    miDetained: '0',
    contactNo: '',
    remarks: '',
    monitoringCase: false,
    admittedInMH: ''
  })
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const { user } = useUser()

  // Check for allowed roles/usernames (comdt, dcci)
  const isCommandant =
    ['comdt', 'dcci'].includes(user?.role?.toLowerCase() || '') ||
    ['comdt', 'dcci'].includes(user?.username?.toLowerCase() || '') ||
    user?.role === 'RMO' // Fallback: Allow RMO to see/edit if role assignment is messy

  // Check for Read-Only users (Brig, Coco)
  const isReadOnly = (user?.username?.toLowerCase() || '').includes('brig') ||
    (user?.username?.toLowerCase() || '').includes('coco') ||
    (user?.name?.toLowerCase() || '').includes('brig') ||
    (user?.name?.toLowerCase() || '').includes('coco')

  // Visible to admins (RMO, Comdt, Dcci) AND Read-Only users (Brig, Coco)
  const canSeeCommandantRemarks = user?.role !== 'user' || isReadOnly

  const handleEditRemark = (record: MedicalRecord) => {
    setEditingRemarkId(record.id)
    setRemarkText('') // Start with empty text for appending
  }

  const handleSaveRemark = async (recordId: number) => {
    try {
      if (!remarkText.trim()) {
        setEditingRemarkId(null)
        return
      }

      const record = records.find(r => r.id === recordId)
      const existing = record?.commandantRemarks || ''

      // Determine signer based on username/role
      let signer = user?.role === 'RMO' ? 'RMO' : 'Admin'
      const username = user?.username?.toLowerCase() || ''
      if (username.includes('dcci')) signer = 'DCCI'
      else if (username.includes('comdt')) signer = 'COMDT'
      else if (username.includes('brig')) signer = 'BRIG'
      else if (username.includes('coco')) signer = 'COCO'

      const signedRemark = `${remarkText} -- ${signer}`

      // Append new remark with a separator
      const newContent = existing
        ? `${existing}\n\n• ${signedRemark}`
        : `• ${signedRemark}`

      const response = await fetch(`/api/medical-records/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({ commandantRemarks: newContent })
      })

      if (!response.ok) throw new Error('Failed to update remark')

      // Ideally refresh data here, but for now we might need to reload or update local state
      // Since props are passed down, we might need a callback to refresh. 
      // For simplicity, we assume parent refreshes or we force reload.
      window.location.reload()
    } catch (error) {
      console.error('Error updating remark:', error)
      alert('Failed to save remark')
    } finally {
      setEditingRemarkId(null)
    }
  }

  const handleEditRecord = (record: MedicalRecord) => {
    setEditingRecord(record)
    setEditFormData({
      medicalProblem: record.medicalProblem || '',
      diagnosis: record.diagnosis || '',
      dateOfReporting: record.dateOfReporting ? new Date(record.dateOfReporting).toISOString().split('T')[0] : '',
      attendC: String(record.attendC || 0),
      attendB: String(record.attendB || 0),
      exPpg: String(record.exPpg || 0),
      physiotherapy: String(record.physiotherapy || 0),
      miDetained: String(record.miDetained || 0),
      contactNo: record.contactNo || '',
      remarks: record.remarks || '',
      monitoringCase: record.monitoringCase || false,
      admittedInMH: record.admittedInMH || ''
    })
  }

  const handleSaveEdit = async () => {
    if (!editingRecord) return

    setIsSavingEdit(true)
    try {
      const response = await fetch(`/api/medical-records/${editingRecord.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({
          medicalProblem: editFormData.medicalProblem,
          diagnosis: editFormData.diagnosis,
          dateOfReporting: editFormData.dateOfReporting,
          attendC: editFormData.attendC,
          attendB: editFormData.attendB,
          exPpg: editFormData.exPpg,
          physiotherapy: editFormData.physiotherapy,
          miDetained: editFormData.miDetained,
          contactNo: editFormData.contactNo,
          remarks: editFormData.remarks,
          monitoringCase: editFormData.monitoringCase,
          admittedInMH: editFormData.admittedInMH
        })
      })

      if (!response.ok) throw new Error('Failed to update record')

      alert('Medical record updated successfully!')
      window.location.reload()
    } catch (error) {
      console.error('Error updating medical record:', error)
      alert('Failed to update medical record')
    } finally {
      setIsSavingEdit(false)
      setEditingRecord(null)
    }
  }

  // Helper function to count weekdays (excluding Sundays) between two dates
  const getWeekdaysBetween = (startDate: Date, endDate: Date): number => {
    let count = 0
    const current = new Date(startDate)
    const end = new Date(endDate)
    while (current <= end) {
      if (current.getDay() !== 0) { // 0 = Sunday
        count++
      }
      current.setDate(current.getDate() + 1)
    }
    return count
  }

  const generateMedicalRecordPDF = async (record: MedicalRecord, cadetInfo: CadetInfo) => {
    try {
      // Fetch the existing MI ROOM.pdf template
      const response = await fetch('/MI ROOM.pdf')
      const pdfDoc = await PDFDocument.load(await response.arrayBuffer())
      const form = pdfDoc.getForm()
      const fields = form.getFields()

      if (fields.length > 0) {
        // Fill form fields
        fields.forEach(field => {
          const fieldName = field.getName().toLowerCase()
          console.log('Processing field:', fieldName)

          // Only handle academy number for now
          if (fieldName.includes('academy') || fieldName.includes('number')) {
            if (cadetInfo.academyNumber) {
              form.getTextField(field.getName())?.setText(String(cadetInfo.academyNumber))
              console.log('Filled academy number:', cadetInfo.academyNumber)
            }
          }
        })
      } else {
        // Fallback: Use text overlay for academy number, name, company/course, age, sex, date of reporting, mobile number, and total training days missed
        console.log('No form fields found, using text overlay')

        // Embed fonts
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

        const firstPage = pdfDoc.getPages()[0]

        // Define colors
        const red = rgb(1, 0, 0)
        const black = rgb(0, 0, 0)
        const green = rgb(0, 0.5, 0)
        const wrapText = (text: string, maxWidth: number, font: any, size: number) => {
          const words = text.split(' ')
          const lines: string[] = []
          let currentLine = ''
          for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word
            if (font.widthOfTextAtSize(testLine, size) <= maxWidth) {
              currentLine = testLine
            } else {
              if (currentLine) lines.push(currentLine)
              currentLine = word
            }
          }
          if (currentLine) lines.push(currentLine)
          return lines
        }

        const maxWidth = 375 // Approximate available width (595 - 170 - 50)

        // Position academy number in the academy number section
        if (cadetInfo.academyNumber) {
          firstPage.drawText(String(cadetInfo.academyNumber), {
            x: 105, // Slightly left for better alignment
            y: 662, // Lower on the page for proper positioning
            size: 12,
            color: black,
            font: helveticaFont,
          })
        }

        // Position name below the academy number
        if (cadetInfo.name) {
          firstPage.drawText(cadetInfo.name, {
            x: 240, // Same X position as academy number
            y: 662, // Slightly lower than academy number
            size: 12,
            color: black,
            font: helveticaFont,
          })
        }

        // Position company below the name
        if (cadetInfo.company || cadetInfo.course) {
          const companyMap: { [key: string]: string } = {
            'M': 'Meiktila',
            'N': 'Naushera',
            'Z': 'Zojila',
            'J': 'Jessami',
            'K': 'Kohima',
            'P': 'Phillora'
          }
          const companyName = cadetInfo.company ? (companyMap[cadetInfo.company] ? `${cadetInfo.company} - ${companyMap[cadetInfo.company]}` : cadetInfo.company) : '';
          const companyText = companyName && cadetInfo.course
            ? `${companyName}/${cadetInfo.course}`
            : companyName || cadetInfo.course || '';

          firstPage.drawText(companyText, {
            x: 420, // Same X position as name
            y: 662, // Below the name field
            size: 12,
            color: black,
            font: helveticaFont,
          })
        }

        // Position age and sex on the same line
        if (cadetInfo.age) {
          firstPage.drawText(String(cadetInfo.age), {
            x: 88, // Left position for age
            y: 615, // Same y-plane
            size: 12,
            color: black,
            font: helveticaFont,
          })
        }

        if (cadetInfo.sex) {
          firstPage.drawText(cadetInfo.sex, {
            x: 150, // Right of age for sex
            y: 615, // Same y-plane as age
            size: 12,
            color: black,
            font: helveticaFont,
          })
        }

        // Position date of reporting
        if (record.dateOfReporting) {
          const dateText = new Date(record.dateOfReporting).toLocaleDateString()
          firstPage.drawText(dateText, {
            x: 215.5, // Position for date
            y: 615, // Same y-plane as age/sex
            size: 12,
            color: black,
            font: helveticaFont,
          })
        }

        // Position mobile number
        if (record.contactNo) {
          firstPage.drawText(record.contactNo, {
            x: 419, // Position for mobile number
            y: 718.2, // Same y-plane as age/sex/date
            size: 12,
            color: black,
            font: helveticaFont,
          })
        }

        // Position diagnosis below the date of reporting
        const totalTrainingDays = records.reduce((total, record) => {
          let days = 0

          // Calculate weekdays for the main absence period
          if (record.totalTrainingDaysMissed && record.totalTrainingDaysMissed > 0) {
            const startDate = new Date(record.dateOfReporting)
            const endDate = new Date(startDate)
            endDate.setDate(endDate.getDate() + record.totalTrainingDaysMissed - 1)
            days += getWeekdaysBetween(startDate, endDate)
          }

          // Add Ex-PPG contribution (each point = 0.25 days missed)
          if (record.exPpg && Number(record.exPpg) > 0) days += Number(record.exPpg) * 0.25

          // Add Attend B contribution (each point = 0.25 days missed)
          if (record.attendB && Number(record.attendB) > 0) days += Number(record.attendB) * 0.25

          return total + days
        }, 0)

        if (totalTrainingDays > 0) {
          firstPage.drawText(String(totalTrainingDays.toFixed(2)), {
            x: 367, // Specified x coordinate
            y: 615, // Specified y coordinate
            size: 12,
            color: black,
            font: helveticaFont,
          })
          firstPage.drawText("(Sundays are excluded)", {
            x: 399.5,
            y: 615,
            size: 12,
            color: black,
            font: helveticaFont,
          })
        }

        // Position medical problem
        if (record.medicalProblem) {
          firstPage.drawText('MEDICAL PROBLEM', {
            x: 170, // Left position
            y: 480, // Heading above content
            size: 12,
            color: red,
            font: helveticaBoldFont,
          })
          const problemLines = record.medicalProblem.split('\n');
          let problemY = 460; // Below heading
          const lineSpacing = 15; // Space between lines
          for (const line of problemLines) {
            firstPage.drawText(line, {
              x: 170, // Left position
              y: problemY,
              size: 11,
              color: black,
              font: helveticaFont,
            });
            problemY -= lineSpacing;
          }
        }

        // Position diagnosis
        if (record.diagnosis) {
          firstPage.drawText('DIAGNOSIS', {
            x: 170, // Left position
            y: 430, // Heading above content
            size: 12,
            color: red,
            font: helveticaBoldFont,
          })
          const diagLines = record.diagnosis.split('\n');
          const allDiagLines: string[] = []
          for (const line of diagLines) {
            const wrapped = wrapText(line, maxWidth, helveticaFont, 11)
            allDiagLines.push(...wrapped)
          }
          const finalDiagLines = allDiagLines.slice(0, 7)
          let diagY = 410; // Below heading
          const lineSpacing = 15; // Space between lines
          for (const line of finalDiagLines) {
            firstPage.drawText(line, {
              x: 170, // Left position
              y: diagY,
              size: 11,
              color: black,
              font: helveticaFont,
            });
            diagY -= lineSpacing;
          }
        }

        // Position details below diagnosis
        firstPage.drawText('DETAILS', {
          x: 170, // Left position
          y: 290, // Heading above details
          size: 12,
          color: red,
          font: helveticaBoldFont,
        });

        let detailY = 270; // Start below heading
        const lineSpacing = 15; // Space between lines

        if (record.attendC && Number(record.attendC) > 0) {
          firstPage.drawText(`Attend C: ${record.attendC}`, {
            x: 170,
            y: detailY,
            size: 10,
            color: black,
            font: helveticaFont,
          });
          detailY -= lineSpacing;
        }

        if (record.miDetained && Number(record.miDetained) > 0) {
          firstPage.drawText(`MI Detained: ${record.miDetained}`, {
            x: 170,
            y: detailY,
            size: 10,
            color: black,
            font: helveticaFont,
          });
          detailY -= lineSpacing;
        }

        if (record.exPpg && Number(record.exPpg) > 0) {
          firstPage.drawText(`Ex-PPG: ${record.exPpg} (+${(record.exPpg * 0.25).toFixed(2)} day${record.exPpg * 0.25 !== 1 ? 's' : ''} missed)`, {
            x: 170,
            y: detailY,
            size: 10,
            color: black,
            font: helveticaFont,
          });
          detailY -= lineSpacing;
        }

        if (record.attendB && Number(record.attendB) > 0) {
          firstPage.drawText(`Attend B: ${record.attendB} (+${(record.attendB * 0.25).toFixed(2)} day${record.attendB * 0.25 !== 1 ? 's' : ''} missed)`, {
            x: 170,
            y: detailY,
            size: 10,
            color: black,
            font: helveticaFont,
          });
          detailY -= lineSpacing;
        }

        if (record.physiotherapy && Number(record.physiotherapy) > 0) {
          firstPage.drawText(`Physiotherapy: ${record.physiotherapy}`, {
            x: 170,
            y: detailY,
            size: 10,
            color: black,
            font: helveticaFont,
          });
          detailY -= lineSpacing;
        }

        if (record.monitoringCase) {
          firstPage.drawText(`Monitoring Case: YES`, {
            x: 170,
            y: detailY,
            size: 10,
            color: rgb(0, 0.5, 0), // Green (0.5 = 128/255)
            font: helveticaFont,
          });
          detailY -= lineSpacing;
        }

        if (record.admittedInMH === 'Yes') {
          firstPage.drawText(`Admitted in MH: YES`, {
            x: 170,
            y: detailY,
            size: 10,
            color: green, // Red for MH admission
            font: helveticaFont,
          });
          detailY -= lineSpacing;
        }

        // Position remarks
        if (record.remarks) {
          firstPage.drawText('REMARKS', {
            x: 170, // Left position
            y: 215, // Heading above content
            size: 12,
            color: red,
            font: helveticaBoldFont,
          })
          const remarksLines = record.remarks.split('\n');
          const allRemarksLines: string[] = []
          for (const line of remarksLines) {
            const wrapped = wrapText(line, maxWidth, helveticaFont, 11)
            allRemarksLines.push(...wrapped)
          }
          const finalRemarksLines = allRemarksLines.slice(0, 3)
          let remarksY = 195; // Below heading
          const lineSpacing = 15; // Space between lines
          for (const line of finalRemarksLines) {
            firstPage.drawText(line, {
              x: 170, // Left position
              y: remarksY,
              size: 11,
              color: black,
              font: helveticaFont,
            });
            remarksY -= lineSpacing;
          }
        }

        // Doctor's Sign
        firstPage.drawText("Doctor's Sign", {
          x: 520,
          y: 10,
          size: 10,
          color: black,
          font: helveticaBoldFont,
        });
      }

      // Serialize the PDF document
      const pdfBytes = await pdfDoc.save()

      // Create a blob and show preview
      const blob = new Blob([pdfBytes] as BlobPart[], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      // Store for preview modal instead of direct download
      setPdfPreviewUrl(url)
      setPdfFilename(`MI_ROOM_${cadetInfo.name.replace(/\s+/g, '_')}_${record.id}_filled.pdf`)

    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    }
  }

  const handleDownloadPdf = () => {
    if (pdfPreviewUrl && pdfFilename) {
      const link = document.createElement('a')
      link.href = pdfPreviewUrl
      link.download = pdfFilename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const closePdfPreview = () => {
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl)
    }
    setPdfPreviewUrl(null)
    setPdfFilename('')
  }

  return (
    <div className="space-y-4">
      {records.map((record: MedicalRecord) => {
        const admissionDate = new Date(record.dateOfReporting)
        const timeDiff = Date.now() - admissionDate.getTime()
        const canCheck = timeDiff >= 24 * 60 * 60 * 1000
        const daysMissed = getWeekdaysBetween(admissionDate, new Date())
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
                    {isCommandant && (
                      <button
                        onClick={() => handleEditRemark(record)}
                        className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center gap-2"
                        title="Add/Edit Additional Remarks"
                      >
                        <span className="text-xs font-medium">Additional remarks</span>
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {user?.role !== 'user' && !isReadOnly && cadetInfo && (
                      <button
                        onClick={() => handleEditRecord(record)}
                        className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit Medical Record"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {user?.role !== 'user' && !isReadOnly && cadetInfo && (
                      <button
                        onClick={() => generateMedicalRecordPDF(record, cadetInfo)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
                        title="Download PDF with medical record data"
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
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 1186 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Cadet Return Status</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Track when cadet returns to OTA</p>
                      </div>
                    </div>
                    <label
                      className="relative inline-flex items-center cursor-pointer"
                      title={!canCheck ? "Please come back after 24 hours in order to change status to returned" : isChecked ? "Cadet has been marked as returned" : user?.role === 'user' ? "You are not authorized to manage anything else adding cadet record" : "Double-click to mark cadet as returned"}
                      onDoubleClick={(e) => {
                        // Prevent if already checked, or not authorized, or not active
                        // Also prevent Read-Only users (Brig, Coco)
                        if (!isChecked && canCheck && onReturn && user?.role !== 'user' && !isReadOnly) {
                          onReturn(record.id, daysMissed)
                          setShowModal(true)
                        }
                      }}
                    >
                      <input type="checkbox" className="sr-only peer" checked={isChecked} disabled={isChecked || !canCheck || user?.role === 'user'} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                      <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Returned</span>
                    </label>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-2">
                    <span>{isChecked ? `Training days missed by cadet: ${daysMissed} days` : 'Double-click the toggle when cadet returns from MH/BH/CH facility (cannot be unset once marked)'}</span>
                    {isChecked && (() => {
                      // Calculate how many Sundays were in the period
                      const admissionDate = new Date(record.dateOfReporting)
                      const returnDate = new Date()
                      const totalDays = Math.ceil((returnDate.getTime() - admissionDate.getTime()) / (24 * 60 * 60 * 1000))
                      const sundays = Math.floor((totalDays + admissionDate.getDay()) / 7)
                      return sundays > 0 ? (
                        <div className="relative group">
                          <Info className="h-3 w-3 text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            Sundays excluded: {sundays}, total period: {totalDays} days
                          </div>
                        </div>
                      ) : null
                    })()}
                  </div>
                </div>

                {record.diagnosis && (
                  <div className="mt-3">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Diagnosis
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                      {record.diagnosis}
                    </p>
                  </div>
                )}

                {record.remarks && (
                  <div className="mt-3">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Remarks
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                      {record.remarks}
                    </p>
                  </div>
                )}

                {(canSeeCommandantRemarks || isCommandant) && record.commandantRemarks && (
                  <div className="mt-3">
                    <label className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      Additional Remarks
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white bg-purple-50 dark:bg-purple-900/10 p-2 rounded-lg border border-purple-100 dark:border-purple-800/30 mt-1 whitespace-pre-wrap">
                      {record.commandantRemarks}
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
                  {cadetInfo && user?.role !== 'user' && (
                    <div className="flex items-center gap-1">
                      {isCommandant && (
                        <button
                          onClick={() => handleEditRemark(record)}
                          className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center gap-2"
                          title="Add/Edit Additional Remarks"
                        >
                          <span className="text-xs font-medium">Additional remarks</span>
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {!isReadOnly && (
                        <button
                          onClick={() => handleEditRecord(record)}
                          className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit Medical Record"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {!isReadOnly && (
                        <button
                          onClick={() => generateMedicalRecordPDF(record, cadetInfo)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
                          title="Download PDF with medical record data"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {record.diagnosis && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Diagnosis
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
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
                        <div className="flex items-center gap-2">
                          <span>Attend C: {record.attendC}</span>
                          <div className="relative group">
                            <Info className="h-3 w-3 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Counted as 1 day per occurrence in training days missed
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* Only show MI Detained if > 0 */}
                      {record.miDetained && Number(record.miDetained) > 0 ? (
                        <div className="flex items-center gap-2">
                          <span>MI Detained: {record.miDetained}</span>
                          <div className="relative group">
                            <Info className="h-3 w-3 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Counted as 1 day per occurrence in training days missed
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* Only show Ex-PPG if > 0 */}
                      {record.exPpg && Number(record.exPpg) > 0 ? (
                        <div className="flex items-center gap-2">
                          <span>Ex-PPG: {record.exPpg} (+{(record.exPpg * 0.25).toFixed(2)} day{(record.exPpg * 0.25) !== 1 ? 's' : ''} missed)</span>
                          <div className="relative group">
                            <Info className="h-3 w-3 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Counted as 0.25 day per occurrence in training days missed
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* Only show Attend B if > 0 */}
                      {record.attendB && Number(record.attendB) > 0 ? (
                        <div className="flex items-center gap-2">
                          <span>Attend B: {record.attendB} (+{(record.attendB * 0.25).toFixed(2)} day{(record.attendB * 0.25) !== 1 ? 's' : ''} missed)</span>
                          <div className="relative group">
                            <Info className="h-3 w-3 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Counted as 0.25 day per occurrence in training days missed
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* Only show Physiotherapy if > 0 - no info button as it doesn't count */}
                      {record.physiotherapy && Number(record.physiotherapy) > 0 ? (
                        <div>Physiotherapy: {record.physiotherapy}</div>
                      ) : null}

                      {/* Calculate and show total training days missed for this record */}
                      {(() => {
                        let weekdays = 0
                        let sundays = 0
                        if (record.totalTrainingDaysMissed && record.totalTrainingDaysMissed > 0) {
                          const startDate = new Date(record.dateOfReporting)
                          const endDate = new Date(startDate)
                          endDate.setDate(endDate.getDate() + record.totalTrainingDaysMissed - 1)
                          weekdays = getWeekdaysBetween(startDate, endDate)
                          sundays = record.totalTrainingDaysMissed - weekdays
                        }
                        weekdays += (record.exPpg || 0) * 0.25
                        weekdays += (record.attendB || 0) * 0.25
                        return weekdays > 0 ? (
                          <div className="font-medium text-red-600 dark:text-red-400 border-t border-gray-200 dark:border-gray-600 pt-1 mt-2 flex items-center gap-2">
                            Training Days Missed: {weekdays.toFixed(2)} day{weekdays !== 1 ? 's' : ''}
                            {sundays > 0 && (
                              <div className="relative group">
                                <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  Sundays excluded: {sundays}, original: {record.totalTrainingDaysMissed} days
                                </div>
                              </div>
                            )}
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
                    <p className="text-sm text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                      {record.remarks}
                    </p>
                  </div>
                )}

                {(canSeeCommandantRemarks || isCommandant) && record.commandantRemarks && (
                  <div className="mt-3">
                    <label className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      Additional Remarks
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white bg-purple-50 dark:bg-purple-900/10 p-2 rounded-lg border border-purple-100 dark:border-purple-800/30 mt-1 whitespace-pre-wrap">
                      {record.commandantRemarks}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}

      {/* Modal for Editing Remarks */}
      {editingRemarkId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4" onClick={() => setEditingRemarkId(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Edit className="h-5 w-5 text-purple-600" />
                  Add Reminder / Remark
                </h3>
                <button
                  onClick={() => setEditingRemarkId(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Show Existing Remarks */}
              {(() => {
                const record = records.find(r => r.id === editingRemarkId)
                if (record?.commandantRemarks) {
                  return (
                    <div className="mb-4">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                        Previous Remarks
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
                        {record.commandantRemarks}
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              <div className="mb-6">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                  New Remark
                </label>
                <textarea
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  rows={5}
                  placeholder="Enter remarks here..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditingRemarkId(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveRemark(editingRemarkId)}
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md hover:shadow-lg"
                >
                  Save Remarks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* PDF Preview Modal */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                PDF Preview
              </h3>
              <button
                onClick={closePdfPreview}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* PDF Preview */}
            <div className="flex-1 p-4 bg-gray-100 dark:bg-gray-900">
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full rounded-lg border border-gray-300 dark:border-gray-600"
                title="PDF Preview"
              />
            </div>

            {/* Footer with Download Button */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={closePdfPreview}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleDownloadPdf}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Medical Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Medical Record
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Medical Problem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Medical Problem
                </label>
                <input
                  type="text"
                  value={editFormData.medicalProblem}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, medicalProblem: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Diagnosis
                </label>
                <textarea
                  rows={3}
                  value={editFormData.diagnosis}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Date of Reporting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date of Reporting
                </label>
                <input
                  type="date"
                  value={editFormData.dateOfReporting}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, dateOfReporting: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Training Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Attend C
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.attendC}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      attendC: e.target.value,
                      // Clear others when Attend C is set
                      ...(parseInt(e.target.value) > 0 ? { attendB: '0', exPpg: '0', miDetained: '0' } : {})
                    }))}
                    disabled={editFormData.admittedInMH === 'Yes' || parseInt(editFormData.attendB) > 0 || parseInt(editFormData.exPpg) > 0 || parseInt(editFormData.miDetained) > 0}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Attend B
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.attendB}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      attendB: e.target.value,
                      // Clear others when Attend B is set
                      ...(parseInt(e.target.value) > 0 ? { attendC: '0', exPpg: '0', miDetained: '0' } : {})
                    }))}
                    disabled={editFormData.admittedInMH === 'Yes' || parseInt(editFormData.attendC) > 0 || parseInt(editFormData.exPpg) > 0 || parseInt(editFormData.miDetained) > 0}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ex-PPG
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.exPpg}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      exPpg: e.target.value,
                      // Clear others when Ex-PPG is set
                      ...(parseInt(e.target.value) > 0 ? { attendC: '0', attendB: '0', miDetained: '0' } : {})
                    }))}
                    disabled={editFormData.admittedInMH === 'Yes' || parseInt(editFormData.attendC) > 0 || parseInt(editFormData.attendB) > 0 || parseInt(editFormData.miDetained) > 0}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Physiotherapy
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.physiotherapy}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, physiotherapy: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    MI Detained
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.miDetained}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      miDetained: e.target.value,
                      // Clear others when MI Detained is set
                      ...(parseInt(e.target.value) > 0 ? { attendC: '0', attendB: '0', exPpg: '0' } : {})
                    }))}
                    disabled={editFormData.admittedInMH === 'Yes' || parseInt(editFormData.attendC) > 0 || parseInt(editFormData.attendB) > 0 || parseInt(editFormData.exPpg) > 0}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={editFormData.contactNo}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, contactNo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Remarks
                </label>
                <textarea
                  rows={3}
                  value={editFormData.remarks}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Monitoring Case Toggle */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.monitoringCase}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, monitoringCase: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Monitoring Case</span>
              </div>

              {/* MH/BH/CH Admission Toggle */}
              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-800/30">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.admittedInMH === 'Yes'}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      admittedInMH: e.target.checked ? 'Yes' : '',
                      monitoringCase: e.target.checked ? true : prev.monitoringCase,
                      // Clear training fields when MH/BH/CH is toggled on
                      ...(e.target.checked ? {
                        attendC: '0',
                        attendB: '0',
                        exPpg: '0',
                        miDetained: '0'
                      } : {})
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
                <div>
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Admitted in MH/BH/CH</span>
                  <p className="text-xs text-purple-600 dark:text-purple-400">Toggle on if cadet is admitted to Military Hospital/Base Hospital/Civil Hospital</p>
                </div>
              </div>
            </div>

            {/* Footer with Save Button */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setEditingRecord(null)}
                disabled={isSavingEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingEdit ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
