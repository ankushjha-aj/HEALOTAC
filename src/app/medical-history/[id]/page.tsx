'use client'

import { notFound } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowLeft, Calendar, User, MapPin, Phone, FileText, Activity, Clock, Ruler, Weight, Users, GraduationCap, Edit, Plus, Save, X } from 'lucide-react'
import Link from 'next/link'
import MedicalRecordsList from '../../cadets/[id]/MedicalRecordsList'
import { useState, useEffect, useCallback } from 'react'

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

interface CadetInfo {
  id: number
  name: string
  battalion: string
  company: string
  joinDate: string
  status: string
  healthStatus: string
  createdAt: string
  contactNo?: string
  course?: string
  academyNumber?: number
}

export default function MedicalHistoryPage({
  params,
}: {
  params: { id: string }
}) {
  const cadetId = parseInt(params.id)
  const [cadetInfo, setCadetInfo] = useState<CadetInfo | null>(null)
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [cadetRes, recordsRes] = await Promise.all([
        fetch(`/api/cadets/${cadetId}`, {
          credentials: 'include'
        }),
        fetch(`/api/medical-history/${cadetId}`, {
          credentials: 'include'
        })
      ])

      if (!cadetRes.ok) {
        throw new Error('Failed to fetch cadet')
      }

      const cadetData = await cadetRes.json()
      const { records: medicalRecordsResult } = recordsRes.ok ? await recordsRes.json() : { records: [] }

      setCadetInfo(cadetData)
      setMedicalRecords(medicalRecordsResult)
    } catch (err) {
      console.error('Error loading medical history:', err)
      setError(err instanceof Error ? err.message : 'Failed to load medical history')
    } finally {
      setLoading(false)
    }
  }, [cadetId])

  useEffect(() => {
    if (isNaN(cadetId)) {
      notFound()
      return
    }
    fetchData()
  }, [cadetId, fetchData])

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
              {error || 'Medical history not found'}
            </h2>
            <Link href="/medical-history" className="text-primary hover:text-primary/80">
              Return to Medical History
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/medical-history"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Medical History
          </Link>
        </div>

        {/* Cadet Info Card */}
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-xl">
                  {cadetInfo.name.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {cadetInfo.name}
                </h1>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <span>{cadetInfo.company} Company, {cadetInfo.battalion}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Records</div>
              <div className="text-2xl font-bold text-primary">{medicalRecords.length}</div>
            </div>
          </div>
        </div>

        {/* Medical History Section */}
        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Medical History Timeline
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Complete medical record history for {cadetInfo.name}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {medicalRecords.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Medical Records
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  This cadet has no medical records yet.
                </p>
              </div>
            ) : (
              <MedicalRecordsList records={medicalRecords} cadetId={cadetId} />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
