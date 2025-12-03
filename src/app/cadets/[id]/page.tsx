'use client'

import { notFound } from 'next/navigation'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback, useMemo } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowLeft, Calendar, User, MapPin, Phone, FileText, Activity, Clock, Ruler, Weight, Users, GraduationCap, Plus, X, Info } from 'lucide-react'
import Link from 'next/link'
import MedicalRecordsList from './MedicalRecordsList'
import { usePagination } from '@/hooks/usePagination'
import PaginationControls from '@/components/PaginationControls'
import jsPDF from 'jspdf'

interface CadetInfo {
  id: number
  name: string
  battalion: string
  company: string
  joinDate: string
  academyNumber?: number
  height?: number
  initialWeight?: number
  currentWeight?: number
  weight?: number
  age?: number
  course?: string
  sex?: string
  nokContact?: string
  relegated?: string
  createdAt: string
  updatedAt: string
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
  // Physical Test
  ppt?: string
  ipet?: string
  bpet?: string
  swm?: string
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

export default function CadetDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cadetId = parseInt(params.id)
  const [cadetInfo, setCadetInfo] = useState<CadetInfo | null>(null)
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showMoreCadetInfo, setShowMoreCadetInfo] = useState(false)
  const [showMenstrualModal, setShowMenstrualModal] = useState(false)

  // Pagination for medical records
  const pagination = usePagination({
    totalItems: medicalRecords.length,
    itemsPerPage: 10,
    initialPage: 1
  })

  const fetchCadetData = useCallback(async () => {
    try {
      console.log(`📡 FETCHING CADET DATA for cadet ${cadetId}`)
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('jwt_token')
      if (!token) {
        setError('Authentication required')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`
      }

      const [cadetRes, recordsRes] = await Promise.all([
        fetch(`/api/cadets/${cadetId}`, {
          headers
        }),
        fetch(`/api/medical-history/${cadetId}`, {
          headers
        })
      ])

      if (!cadetRes.ok) {
        throw new Error('Failed to fetch cadet')
      }

      const cadetData: CadetInfo = await cadetRes.json()
      console.log(`🔍 RAW CADET DATA:`, cadetData)
      console.log(`🔍 MENSTRUAL AIDS RAW FROM DB:`, cadetData.menstrualAids)
      const recordsResponse = recordsRes.ok ? await recordsRes.json() : { records: [] }
      const { records: medicalRecordsResult } = recordsResponse

      console.log(`✅ RAW RECORDS RESPONSE:`, recordsResponse)
      console.log(`✅ RECEIVED MEDICAL RECORDS:`, medicalRecordsResult.length, 'records')
      console.log(`✅ RECORDS RESPONSE STATUS:`, recordsRes.status, recordsRes.ok)

      // Sort medical records by createdAt descending (most recent first)
      const sortedMedicalRecords = medicalRecordsResult.sort((a: MedicalRecord, b: MedicalRecord) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      console.log(`✅ RECEIVED CADET DATA:`, cadetData)
      console.log(`🔍 MENSTRUAL DATA CHECK:`, {
        menstrualFrequency: cadetData.menstrualFrequency,
        menstrualDays: cadetData.menstrualDays,
        lastMenstrualDate: cadetData.lastMenstrualDate,
        menstrualAids: cadetData.menstrualAids,
        sexuallyActive: cadetData.sexuallyActive,
        maritalStatus: cadetData.maritalStatus,
        pregnancyHistory: cadetData.pregnancyHistory,
        contraceptiveHistory: cadetData.contraceptiveHistory,
        surgeryHistory: cadetData.surgeryHistory,
        medicalCondition: cadetData.medicalCondition,
        hemoglobinLevel: cadetData.hemoglobinLevel
      })
      console.log(`🔍 MENSTRUAL AIDS TYPE:`, typeof cadetData.menstrualAids, Array.isArray(cadetData.menstrualAids))
      console.log(`✅ RECEIVED CADET DATA:`, cadetData)

      setCadetInfo(cadetData)
      setMedicalRecords(sortedMedicalRecords)
    } catch (err) {
      console.error('❌ Error loading cadet details:', err)
      setError(err instanceof Error ? err.message : 'Failed to load cadet details')
    } finally {
      setLoading(false)
    }
  }, [cadetId])

  useEffect(() => {
    console.log(`🔄 USEEFFECT TRIGGERED: cadetId=${cadetId}`)
    fetchCadetData()
  }, [cadetId, fetchCadetData])

  // Check for refresh parameter using searchParams
  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      console.log('🔄 DETECTED REFRESH PARAMETER - refreshing data directly')
      // Remove the refresh parameter from URL
      router.replace(window.location.pathname)
      // Trigger refresh directly
      fetchCadetData()
    }
  }, [searchParams, fetchCadetData, router])

  useEffect(() => {
    if (!showMoreCadetInfo) {
      setShowMenstrualModal(false)
    }
  }, [showMoreCadetInfo])

  // ESC key handler for menstrual modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMenstrualModal) {
        setShowMenstrualModal(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showMenstrualModal])

  const handleReturn = useCallback(async (recordId: number, daysMissed: number) => {
    try {
      const token = localStorage.getItem('jwt_token')
      if (!token) return

      const response = await fetch(`/api/medical-history/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          totalTrainingDaysMissed: daysMissed,
          medicalStatus: 'Completed' // Mark the admission as completed when cadet returns
        })
      })

      if (response.ok) {
        // Update local state only after successful API update
        setMedicalRecords(prev => prev.map(record =>
          record.id === recordId ? { ...record, totalTrainingDaysMissed: (record.totalTrainingDaysMissed || 0) + daysMissed, medicalStatus: 'Completed' } : record
        ))
      }
    } catch (error) {
      console.error('Error updating return status:', error)
    }
  }, [])
  const totalTrainingDaysMissed = medicalRecords.reduce((total: number, record: MedicalRecord) => {
    let days = 0

    // Calculate weekdays for the main absence period
    if (record.totalTrainingDaysMissed && record.totalTrainingDaysMissed > 0) {
      const startDate = new Date(record.dateOfReporting)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + record.totalTrainingDaysMissed - 1)
      days += getWeekdaysBetween(startDate, endDate)
    }

    // Add Ex-PPG contribution (each point = 0.25 days missed)
    if (record.exPpg) {
      days += record.exPpg * 0.25
    }

    // Add Attend B contribution (each point = 0.25 days missed)
    if (record.attendB) {
      days += record.attendB * 0.25
    }

    // Physiotherapy doesn't add to training days missed

    return total + days
  }, 0)

  // Memoize active admission check to prevent unnecessary re-renders
  const hasActiveAdmission = useMemo(() =>
    medicalRecords.some(record => record.admittedInMH === 'Yes' && record.medicalStatus === 'Active'),
    [medicalRecords]
  )

  const isFemaleCadet = cadetInfo?.sex?.toLowerCase?.() === 'female'

  const hasMenstrualData = useMemo(() => {
    if (!isFemaleCadet || !cadetInfo) return false

    const hasValue = (value: unknown) => {
      if (value === null || value === undefined) return false
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'string') return value.trim().length > 0
      return true
    }

    return (
      hasValue(cadetInfo.sexuallyActive) ||
      hasValue(cadetInfo.maritalStatus) ||
      hasValue(cadetInfo.pregnancyHistory) ||
      hasValue(cadetInfo.contraceptiveHistory) ||
      hasValue(cadetInfo.surgeryHistory) ||
      hasValue(cadetInfo.medicalCondition) ||
      hasValue(cadetInfo.hemoglobinLevel) ||
      hasValue(cadetInfo.menstrualFrequency) ||
      hasValue(cadetInfo.menstrualDays) ||
      hasValue(cadetInfo.lastMenstrualDate) ||
      hasValue(cadetInfo.menstrualAids)
    )
  }, [cadetInfo, isFemaleCadet])

  const generateCadetProfilePDF = () => {
    if (!cadetInfo) return

    const doc = new jsPDF()

    // Set up colors and styling
    const primaryColor = [0, 83, 156] // Navy blue
    const secondaryColor = [100, 100, 100] // Gray
    const accentColor = [220, 38, 38] // Red for important info

    let yPos = 18

    // Header Section
    doc.setFillColor(240, 240, 240)
    doc.rect(0, 0, 210, 40, 'F')

    // Header Text
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('MI ROOM', 105, yPos + 12, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.text('OFFICERS TRAINING ACADEMY - CHENNAI', 105, yPos + 25, { align: 'center' })

    // Header border
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(0.5)
    doc.rect(10, 10, 190, 25)

    yPos = 50

    // Main Content Section
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)

    // Left Column - Basic Info
    let leftX = 15
    let rightX = 110

    // Academy Number
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('ACADEMY NUMBER:', leftX, yPos)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(cadetInfo.academyNumber ? String(cadetInfo.academyNumber) : 'ACADEMY NUMBER', leftX + 35, yPos)

    yPos += 8

    // Name
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('NAME:', leftX, yPos)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(cadetInfo.name || '', leftX + 15, yPos)

    yPos += 8

    // Company
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('COMPANY:', leftX, yPos)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const companyMap: { [key: string]: string } = {
      'M': 'Meiktila',
      'N': 'Naushera',
      'Z': 'Zojila',
      'J': 'Jessami',
      'K': 'Kohima',
      'P': 'Phillora'
    }
    const companyDisplay = companyMap[cadetInfo.company] ? `${cadetInfo.company} - ${companyMap[cadetInfo.company]}` : (cadetInfo.company || '')
    doc.text(companyDisplay, leftX + 20, yPos)

    yPos += 8

    // Battalion
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('BATTALION:', leftX, yPos)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(cadetInfo.battalion || '', leftX + 22, yPos)

    yPos += 8

    // Date of Reporting (use profile generation date)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('DATE OF REPORTING:', leftX, yPos)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(new Date().toLocaleDateString(), leftX + 40, yPos)

    yPos += 15

    // Total Training Days of Absence Due to Medical Category
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('TOTAL TRG DAYS OF ABSENCE DUE TO MEDICAL CATEGORY:', leftX, yPos)
    yPos += 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(totalTrainingDaysMissed.toFixed(2), leftX + 10, yPos)

    yPos += 15

    // Diagnosis or Prescription (Cadet Profile Info)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('DIAGNOSIS OR PRESCRIPTION:', leftX, yPos)
    yPos += 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const profileInfo = [
      `Initial Weight: ${cadetInfo.initialWeight || 'N/A'} kg`,
      `Current Weight: ${cadetInfo.currentWeight || 'N/A'} kg`,
      `Height: ${cadetInfo.height || 'N/A'} cm`,
      `Age: ${cadetInfo.age || 'N/A'} years`,
      `Sex: ${cadetInfo.sex || 'N/A'}`,
      `Course: ${cadetInfo.course || 'N/A'}`,
      `Join Date: ${new Date(cadetInfo.joinDate).toLocaleDateString()}`,
      `Medical Records: ${medicalRecords.length} record${medicalRecords.length !== 1 ? 's' : ''}`
    ].join('\n')

    const lines = doc.splitTextToSize(profileInfo, 80)
    doc.text(lines, leftX + 5, yPos)
    yPos += lines.length * 4

    yPos += 10

    // Remarks (empty for cadet profile)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('REMARKS:', leftX, yPos)
    yPos += 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('', leftX + 5, yPos)

    yPos += 15

    // What was given section (empty for cadet profile)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('WHAT WAS GIVEN:', leftX, yPos)
    yPos += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('', leftX + 5, yPos)

    // Right Column - Vital Signs (blank for manual filling)
    yPos = 50 // Reset to top for right column

    // Temp
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('TEMP:', rightX, yPos)
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.3)
    doc.line(rightX + 12, yPos + 2, rightX + 40, yPos + 2)

    yPos += 8

    // BP
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('BP:', rightX, yPos)
    doc.line(rightX + 8, yPos + 2, rightX + 40, yPos + 2)

    yPos += 8

    // Pulse
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('PULSE:', rightX, yPos)
    doc.line(rightX + 15, yPos + 2, rightX + 40, yPos + 2)

    yPos += 8

    // SpO2
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('SpO2:', rightX, yPos)
    doc.line(rightX + 12, yPos + 2, rightX + 40, yPos + 2)

    yPos += 12

    // Pallor
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('PALLOR:', rightX, yPos)
    doc.line(rightX + 15, yPos + 2, rightX + 40, yPos + 2)

    yPos += 8

    // Oedema
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('OEDEMA:', rightX, yPos)
    doc.line(rightX + 17, yPos + 2, rightX + 40, yPos + 2)

    yPos += 8

    // Icterus
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('ICTERUS:', rightX, yPos)
    doc.line(rightX + 17, yPos + 2, rightX + 40, yPos + 2)

    yPos += 15

    // Signature Section at bottom
    yPos = 250

    // Draw signature lines
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.3)

    doc.line(20, yPos, 80, yPos) // Doctor signature line
    doc.line(130, yPos, 180, yPos) // Date line

    yPos += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.text("Doctor's Signature", 20, yPos)
    doc.text('Date', 130, yPos)

    yPos += 15

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.text('This document is generated electronically by HEALOTAC Medical Records Management System', 105, 280, { align: 'center' })
    doc.text(`Record created on: ${new Date().toLocaleDateString()}`, 105, 285, { align: 'center' })

    // Save the PDF
    const fileName = `MI_ROOM_${cadetInfo.name.replace(/\s+/g, '_')}_${cadetId}.pdf`
    doc.save(fileName)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !cadetInfo) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {error || 'Cadet not found'}
            </h2>
            <Link href="/cadets" className="text-primary hover:text-primary/80">
              Return to Cadets Page
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/cadets"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cadets
          </Link>

          <div className="text-right">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">Cadet ID</div>
              <div className="text-2xl font-bold text-primary">#{cadetId}</div>
            </div>
          </div>
        </div>

        {/* Cadet Info Card */}
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-2xl">
                  {cadetInfo.name.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {cadetInfo.name}
                      {cadetInfo.relegated === 'Y' && (
                        <>
                          <span className="text-red-600 dark:text-red-400 font-bold">R</span>
                          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                        </>
                      )}
                    </h1>
                    <Link
                      href={`/cadets/${cadetId}/edit`}
                      className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Edit cadet information"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-4">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {(() => {
                        const companyMap: { [key: string]: string } = {
                          'M': 'Meiktila',
                          'N': 'Naushera',
                          'Z': 'Zojila',
                          'J': 'Jessami',
                          'K': 'Kohima',
                          'P': 'Phillora'
                        }
                        return companyMap[cadetInfo.company] ? `${cadetInfo.company} - ${companyMap[cadetInfo.company]}` : cadetInfo.company
                      })()} Company, {cadetInfo.battalion}
                    </span>
                  </div>
                </div>

                {/* Basic Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Join Date</p>
                      <p className="text-sm font-medium">{new Date(cadetInfo.joinDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {cadetInfo.academyNumber && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Academy Number</p>
                        <p className="text-sm font-medium">{cadetInfo.academyNumber}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Medical Records</p>
                      <p className="text-sm font-medium">{medicalRecords.length}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-red-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Days Missed</p>
                        <div className="relative group">
                          <Info className="h-3 w-3 text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            Sundays are not included in the calculation
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">{totalTrainingDaysMissed.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Demographics Section */}
                {(cadetInfo.height || cadetInfo.weight || cadetInfo.age || cadetInfo.course || cadetInfo.sex || cadetInfo.academyNumber) && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Demographics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {cadetInfo.height && (
                        <div className="flex items-center gap-2">
                          <Ruler className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Height</p>
                            <p className="text-sm font-medium">{cadetInfo.height} cm</p>
                          </div>
                        </div>
                      )}

                      {cadetInfo.initialWeight && (
                        <div className="flex items-center gap-2">
                          <Weight className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Initial Weight</p>
                            <p className="text-sm font-medium">{cadetInfo.initialWeight} kg</p>
                          </div>
                        </div>
                      )}

                      {cadetInfo.currentWeight && (
                        <div className="flex items-center gap-2">
                          <Weight className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Weight</p>
                            <p className="text-sm font-medium">{cadetInfo.currentWeight} kg</p>
                          </div>
                        </div>
                      )}

                      {cadetInfo.age && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Age</p>
                            <p className="text-sm font-medium">{cadetInfo.age} years</p>
                          </div>
                        </div>
                      )}

                      {cadetInfo.course && (
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Course</p>
                            <p className="text-sm font-medium">{cadetInfo.course}</p>
                          </div>
                        </div>
                      )}

                      {cadetInfo.sex && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sex</p>
                            <p className="text-sm font-medium">{cadetInfo.sex}</p>
                          </div>
                        </div>
                      )}

                      {/* Edit Button removed - now next to name */}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Show More Button - Bottom Right Corner */}
          <div className="flex justify-end mt-4">
            <button
              id="showMoreCadetInfo"
              onClick={() => setShowMoreCadetInfo(!showMoreCadetInfo)}
              className="text-primary hover:text-primary/80 text-sm font-medium transition-colors cursor-pointer"
            >
              {showMoreCadetInfo ? 'Hide complete info' : 'Show complete info'}
            </button>
          </div>
        </div>

        {/* Expanded Cadet Information */}
        {showMoreCadetInfo && (
          <div className="card p-6 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Complete Cadet Information</h3>
              {isFemaleCadet && hasMenstrualData && (
                <button
                  onClick={() => setShowMenstrualModal(true)}
                  className="text-primary hover:text-primary/80 text-sm font-medium transition-colors cursor-pointer"
                >
                  Show Menstrual health
                </button>
              )}
            </div>

            {/* Health Parameters Section */}
            {(cadetInfo.bloodGroup || cadetInfo.bmi || cadetInfo.bodyFat || cadetInfo.calcanealBoneDensity ||
              cadetInfo.bp || cadetInfo.pulse || cadetInfo.so2 || cadetInfo.bcaFat ||
              cadetInfo.ecg || cadetInfo.temp || cadetInfo.smmKg || cadetInfo.pastMedicalHistory) && (
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Health Parameters</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-4 border-l-2 border-blue-200 dark:border-blue-600">
                    {cadetInfo.bloodGroup && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Blood Group:</span>
                        <span className="text-sm font-medium">{cadetInfo.bloodGroup}</span>
                      </div>
                    )}
                    {cadetInfo.bmi && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">BMI:</span>
                        <span className="text-sm font-medium">{cadetInfo.bmi}</span>
                      </div>
                    )}
                    {cadetInfo.bodyFat && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Body Fat:</span>
                        <span className="text-sm font-medium">{cadetInfo.bodyFat}%</span>
                      </div>
                    )}
                    {cadetInfo.calcanealBoneDensity && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bone Density:</span>
                        <span className="text-sm font-medium">{cadetInfo.calcanealBoneDensity}</span>
                      </div>
                    )}
                    {cadetInfo.bp && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Blood Pressure:</span>
                        <span className="text-sm font-medium">{cadetInfo.bp}</span>
                      </div>
                    )}
                    {cadetInfo.pulse && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pulse:</span>
                        <span className="text-sm font-medium">{cadetInfo.pulse} bpm</span>
                      </div>
                    )}
                    {cadetInfo.so2 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">SpO2:</span>
                        <span className="text-sm font-medium">{cadetInfo.so2}%</span>
                      </div>
                    )}
                    {cadetInfo.bcaFat && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">BCA Fat:</span>
                        <span className="text-sm font-medium">{cadetInfo.bcaFat}</span>
                      </div>
                    )}
                    {cadetInfo.ecg && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">ECG:</span>
                        <span className="text-sm font-medium">{cadetInfo.ecg}</span>
                      </div>
                    )}
                    {cadetInfo.temp && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Temperature:</span>
                        <span className="text-sm font-medium">{cadetInfo.temp}°C</span>
                      </div>
                    )}
                    {cadetInfo.smmKg && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">SMM:</span>
                        <span className="text-sm font-medium">{cadetInfo.smmKg} kg</span>
                      </div>
                    )}
                    {cadetInfo.pastMedicalHistory && (
                      <div className="col-span-full">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">Past Medical History:</span>
                        <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">{cadetInfo.pastMedicalHistory}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Vaccination Status Section */}
            {(cadetInfo.covidDose1 !== undefined || cadetInfo.hepatitisBDose1 !== undefined ||
              cadetInfo.tetanusToxoid !== undefined || cadetInfo.chickenPoxDose1 !== undefined ||
              cadetInfo.yellowFever !== undefined) && (
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Vaccination Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4 border-l-2 border-green-200 dark:border-green-600">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">COVID-19</h5>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Dose 1:</span>
                          <span className={`text-sm font-medium ${cadetInfo.covidDose1 ? 'text-green-600' : 'text-red-600'}`}>
                            {cadetInfo.covidDose1 ? '✓ Taken' : '✗ Not Taken'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Dose 2:</span>
                          <span className={`text-sm font-medium ${cadetInfo.covidDose2 ? 'text-green-600' : 'text-red-600'}`}>
                            {cadetInfo.covidDose2 ? '✓ Taken' : '✗ Not Taken'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Dose 3:</span>
                          <span className={`text-sm font-medium ${cadetInfo.covidDose3 ? 'text-green-600' : 'text-red-600'}`}>
                            {cadetInfo.covidDose3 ? '✓ Taken' : '✗ Not Taken'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hepatitis B</h5>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Dose 1:</span>
                          <span className={`text-sm font-medium ${cadetInfo.hepatitisBDose1 ? 'text-green-600' : 'text-red-600'}`}>
                            {cadetInfo.hepatitisBDose1 ? '✓ Taken' : '✗ Not Taken'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Dose 2:</span>
                          <span className={`text-sm font-medium ${cadetInfo.hepatitisBDose2 ? 'text-green-600' : 'text-red-600'}`}>
                            {cadetInfo.hepatitisBDose2 ? '✓ Taken' : '✗ Not Taken'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Other Vaccinations</h5>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Tetanus Toxoid:</span>
                          <span className={`text-sm font-medium ${cadetInfo.tetanusToxoid ? 'text-green-600' : 'text-red-600'}`}>
                            {cadetInfo.tetanusToxoid ? '✓ Taken' : '✗ Not Taken'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Chicken Pox Dose 1:</span>
                          <span className={`text-sm font-medium ${cadetInfo.chickenPoxDose1 ? 'text-green-600' : 'text-red-600'}`}>
                            {cadetInfo.chickenPoxDose1 ? '✓ Taken' : '✗ Not Taken'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Chicken Pox Dose 2:</span>
                          <span className={`text-sm font-medium ${cadetInfo.chickenPoxDose2 ? 'text-green-600' : 'text-red-600'}`}>
                            {cadetInfo.chickenPoxDose2 ? '✓ Taken' : '✗ Not Taken'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Chicken Pox Suffered:</span>
                          <span className={`text-sm font-medium ${cadetInfo.chickenPoxSuffered ? 'text-green-600' : 'text-red-600'}`}>
                            {cadetInfo.chickenPoxSuffered ? '✓ Yes' : '✗ No'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Yellow Fever:</span>
                          <span className={`text-sm font-medium ${cadetInfo.yellowFever ? 'text-green-600' : 'text-red-600'}`}>
                            {cadetInfo.yellowFever ? '✓ Taken' : '✗ Not Taken'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Physical Tests Section */}
            {(cadetInfo.enduranceTest || cadetInfo.agilityTest || cadetInfo.speedTest ||
              cadetInfo.verticalJump || cadetInfo.ballThrow || cadetInfo.lowerBackStrength ||
              cadetInfo.shoulderDynamometerLeft || cadetInfo.shoulderDynamometerRight ||
              cadetInfo.handGripDynamometerLeft || cadetInfo.handGripDynamometerRight ||
              cadetInfo.ppt || cadetInfo.ipet || cadetInfo.bpet || cadetInfo.swm) && (
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Physical Tests</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-orange-200 dark:border-orange-600">

                    {/* Physical Proficiency Tests */}
                    {(cadetInfo.ppt || cadetInfo.ipet || cadetInfo.bpet || cadetInfo.swm) && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Physical Proficiency Tests</h5>
                        <div className="space-y-2">
                          {cadetInfo.ppt && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">PPT:</span>
                              <span className={`text-sm font-medium ${cadetInfo.ppt === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>
                                {cadetInfo.ppt === 'Pass' ? '✓ Pass' : '✗ Fail'}
                              </span>
                            </div>
                          )}
                          {cadetInfo.ipet && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">IPET:</span>
                              <span className={`text-sm font-medium ${cadetInfo.ipet === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>
                                {cadetInfo.ipet === 'Pass' ? '✓ Pass' : '✗ Fail'}
                              </span>
                            </div>
                          )}
                          {cadetInfo.bpet && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">BPET:</span>
                              <span className={`text-sm font-medium ${cadetInfo.bpet === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>
                                {cadetInfo.bpet === 'Pass' ? '✓ Pass' : '✗ Fail'}
                              </span>
                            </div>
                          )}
                          {cadetInfo.swm && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">SWM:</span>
                              <span className={`text-sm font-medium ${cadetInfo.swm === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>
                                {cadetInfo.swm === 'Pass' ? '✓ Pass' : '✗ Fail'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Endurance, Agility, Speed Tests */}
                    {(cadetInfo.enduranceTest || cadetInfo.agilityTest || cadetInfo.speedTest) && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fitness Tests</h5>
                        <div className="space-y-2">
                          {cadetInfo.enduranceTest && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Endurance:</span>
                              <span className="text-sm font-medium">{cadetInfo.enduranceTest}</span>
                            </div>
                          )}
                          {cadetInfo.agilityTest && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Agility:</span>
                              <span className="text-sm font-medium">{cadetInfo.agilityTest}</span>
                            </div>
                          )}
                          {cadetInfo.speedTest && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Speed:</span>
                              <span className="text-sm font-medium">{cadetInfo.speedTest}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Strength Tests */}
                    {(cadetInfo.verticalJump || cadetInfo.ballThrow || cadetInfo.lowerBackStrength ||
                      cadetInfo.shoulderDynamometerLeft || cadetInfo.shoulderDynamometerRight ||
                      cadetInfo.handGripDynamometerLeft || cadetInfo.handGripDynamometerRight) && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Strength Tests</h5>
                          <div className="space-y-2">
                            {cadetInfo.verticalJump && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vertical Jump:</span>
                                <span className="text-sm font-medium">{cadetInfo.verticalJump}</span>
                              </div>
                            )}
                            {cadetInfo.ballThrow && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ball Throw:</span>
                                <span className="text-sm font-medium">{cadetInfo.ballThrow}</span>
                              </div>
                            )}
                            {cadetInfo.lowerBackStrength && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lower Back:</span>
                                <span className="text-sm font-medium">{cadetInfo.lowerBackStrength}</span>
                              </div>
                            )}
                            {cadetInfo.shoulderDynamometerLeft && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Shoulder Left:</span>
                                <span className="text-sm font-medium">{cadetInfo.shoulderDynamometerLeft}</span>
                              </div>
                            )}
                            {cadetInfo.shoulderDynamometerRight && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Shoulder Right:</span>
                                <span className="text-sm font-medium">{cadetInfo.shoulderDynamometerRight}</span>
                              </div>
                            )}
                            {cadetInfo.handGripDynamometerLeft && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hand Grip Left:</span>
                                <span className="text-sm font-medium">{cadetInfo.handGripDynamometerLeft}</span>
                              </div>
                            )}
                            {cadetInfo.handGripDynamometerRight && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hand Grip Right:</span>
                                <span className="text-sm font-medium">{cadetInfo.handGripDynamometerRight}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}

            {/* Overall Assessment */}
            {cadetInfo.overallAssessment && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Overall Assessment</h4>
                <div className="pl-4 border-l-2 border-purple-200 dark:border-purple-600">
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">{cadetInfo.overallAssessment}</p>
                </div>
              </div>
            )}

            {/* NOK Contact */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Emergency Contact</h4>
              <div className="pl-4 border-l-2 border-red-200 dark:border-red-600">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Next of Kin Contact</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {cadetInfo.nokContact || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Medical History Section */}
        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Medical History
                  </h2>
                  <div className="flex items-center gap-3">
                    {/* Records per page selector */}
                    <div className="flex items-center gap-2">
                      <label htmlFor="records-per-page" className="text-sm text-gray-600 dark:text-gray-400">
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
                    {(() => {
                      return hasActiveAdmission ? (
                        <div
                          className="inline-flex items-center justify-center p-2 bg-gray-400 text-gray-200 rounded-lg cursor-not-allowed"
                          title="Cannot add new records while cadet is admitted to MH/BH/CH. Mark as returned first."
                        >
                          <Plus className="h-4 w-4" />
                        </div>
                      ) : (
                        <Link
                          href={`/medical-records/new?cadetId=${cadetId}`}
                          className="inline-flex items-center justify-center p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                          title="Add another medical record"
                        >
                          <Plus className="h-4 w-4" />
                        </Link>
                      )
                    })()}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Complete medical record history for {cadetInfo.name}
                </p>
                {/* Record count display */}
                {medicalRecords.length > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Showing {pagination.startIndex + 1}-{Math.min(pagination.endIndex + 1, medicalRecords.length)} of {medicalRecords.length} records
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {medicalRecords.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Medical Records
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  This cadet has no medical records yet.
                </p>
              </div>
            ) : (
              <>
                <MedicalRecordsList records={pagination.getVisibleItems(medicalRecords)} cadetId={cadetId} cadetInfo={cadetInfo} onReturn={handleReturn} />

                {/* Pagination Controls */}
                <div className="mt-6 flex flex-col items-center gap-4">
                  <PaginationControls
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={pagination.goToPage}
                    hasNextPage={pagination.hasNextPage}
                    hasPrevPage={pagination.hasPrevPage}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Menstrual Health Modal */}
      {showMenstrualModal && cadetInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" onClick={() => setShowMenstrualModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="h-6 w-6 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 011.414 1.414L8.414 9.5H5a1 1 0 100 2h3.414l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                  Menstrual Health Records
                </h3>
                <button
                  onClick={() => setShowMenstrualModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Menstrual Cycle */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-1">
                    Menstrual Cycle
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">How frequently</h5>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {cadetInfo!.menstrualFrequency || 'Not recorded'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">How many days</h5>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {cadetInfo!.menstrualDays ? `${cadetInfo!.menstrualDays} days` : 'Not recorded'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Last menstrual period date</h5>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {cadetInfo!.lastMenstrualDate ? (() => {
                          const date = new Date(cadetInfo!.lastMenstrualDate);
                          return isNaN(date.getTime()) ? cadetInfo!.lastMenstrualDate : `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                        })() : 'Not recorded'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Menstrual Cycle Aids</h5>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {(() => {
                          const aids = cadetInfo!.menstrualAids;
                          if (!aids) return 'Not recorded';
                          if (Array.isArray(aids)) return aids.join(', ');
                          return aids;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sexual & Reproductive Health */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-1">
                    Sexual & Reproductive Health
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sexually Active</h5>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {cadetInfo!.sexuallyActive || 'Not recorded'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Marital Status</h5>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {cadetInfo!.maritalStatus || 'Not recorded'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pregnancy & Contraceptive History */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-1">
                    Pregnancy & Contraceptive History
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Pregnancy History</h5>
                      <p className="text-xs text-gray-900 dark:text-gray-100">
                        {cadetInfo!.pregnancyHistory || 'Not recorded'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Contraceptive History</h5>
                      <p className="text-xs text-gray-900 dark:text-gray-100">
                        {cadetInfo!.contraceptiveHistory || 'Not recorded'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-1">
                    Medical History
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Surgery History</h5>
                      <p className="text-xs text-gray-900 dark:text-gray-100">
                        {cadetInfo!.surgeryHistory || 'Not recorded'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Medical Condition</h5>
                      <p className="text-xs text-gray-900 dark:text-gray-100">
                        {cadetInfo!.medicalCondition || 'Not recorded'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hemoglobin Level</h5>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {cadetInfo!.hemoglobinLevel ? `${cadetInfo!.hemoglobinLevel} g/dL` : 'Not recorded'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
