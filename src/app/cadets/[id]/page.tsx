'use client'

import { notFound } from 'next/navigation'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowLeft, Calendar, User, MapPin, Phone, FileText, Activity, Clock, Ruler, Weight, Users, GraduationCap, Edit, Plus, Save, X } from 'lucide-react'
import Link from 'next/link'
import MedicalRecordsList from './MedicalRecordsList'
import { useState, useEffect } from 'react'

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
  updatedAt: string
  relegated?: string
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
  contactNo: string
  remarks: string
  createdAt: string
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
  const [editingWeight, setEditingWeight] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [updatingWeight, setUpdatingWeight] = useState(false)

  useEffect(() => {
    console.log(`🔄 USEEFFECT TRIGGERED: cadetId=${cadetId}`)
    fetchCadetData()
  }, [cadetId])

  // Check for refresh parameter using searchParams
  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      console.log('🔄 DETECTED REFRESH PARAMETER - refreshing data directly')
      // Remove the refresh parameter from URL
      router.replace(window.location.pathname)
      // Trigger refresh directly
      fetchCadetData()
    }
  }, [searchParams])

  const fetchCadetData = async () => {
    try {
      console.log(`📡 FETCHING CADET DATA for cadet ${cadetId}`)
      setLoading(true)
      setError(null)

      const [cadetRes, recordsRes] = await Promise.all([
        fetch(`/api/cadets/${cadetId}`, {
          credentials: 'include'
        }),
        fetch(`/api/medical-history/${cadetId}`)
      ])

      if (!cadetRes.ok) {
        throw new Error('Failed to fetch cadet')
      }

      const cadetData: CadetInfo = await cadetRes.json()
      const recordsResponse = recordsRes.ok ? await recordsRes.json() : { records: [] }
      const { records: medicalRecordsResult } = recordsResponse

      console.log(`✅ RECEIVED CADET DATA:`, cadetData)
      console.log(`✅ RAW RECORDS RESPONSE:`, recordsResponse)
      console.log(`✅ RECEIVED MEDICAL RECORDS:`, medicalRecordsResult.length, 'records')
      console.log(`✅ RECORDS RESPONSE STATUS:`, recordsRes.status, recordsRes.ok)

      setCadetInfo(cadetData)
      setMedicalRecords(medicalRecordsResult)
      setWeightInput(cadetData.weight?.toString() || '')
    } catch (err) {
      console.error('❌ Error loading cadet details:', err)
      setError(err instanceof Error ? err.message : 'Failed to load cadet details')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateWeight = async () => {
    if (!cadetInfo) return

    try {
      setUpdatingWeight(true)
      const weightValue = weightInput ? parseInt(weightInput) : undefined

      const response = await fetch(`/api/cadets/${cadetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ weight: weightValue }),
      })

      if (!response.ok) {
        throw new Error('Failed to update weight')
      }

      // Update local state
      setCadetInfo({ ...cadetInfo, weight: weightValue })
      setEditingWeight(false)
    } catch (err) {
      console.error('Error updating weight:', err)
      alert('Failed to update weight. Please try again.')
    } finally {
      setUpdatingWeight(false)
    }
  }

  // Calculate total training days missed
  const totalTrainingDaysMissed = medicalRecords.reduce((total: number, record: MedicalRecord) => {
    let days = record.totalTrainingDaysMissed || 0

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
                      <span>{cadetInfo.company} Company, {cadetInfo.battalion}</span>
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
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Days Missed</p>
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">{totalTrainingDaysMissed}</p>
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

                        {cadetInfo.weight && (
                          <div className="flex items-center gap-2 group">
                            <Weight className="h-4 w-4 text-primary" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Weight</p>
                              {editingWeight ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <input
                                    type="number"
                                    value={weightInput}
                                    onChange={(e) => setWeightInput(e.target.value)}
                                    className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-20"
                                    placeholder="kg"
                                    min="0"
                                    disabled={updatingWeight}
                                  />
                                  <button
                                    onClick={handleUpdateWeight}
                                    disabled={updatingWeight}
                                    className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                                    title="Save weight"
                                  >
                                    {updatingWeight ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b border-green-600"></div>
                                    ) : (
                                      <Save className="h-3 w-3" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingWeight(false)
                                      setWeightInput(cadetInfo.weight?.toString() || '')
                                    }}
                                    disabled={updatingWeight}
                                    className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                                    title="Cancel editing"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">{cadetInfo.weight} kg</p>
                                  <button
                                    onClick={() => setEditingWeight(true)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-primary transition-opacity"
                                    title="Edit weight"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
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

                  {/* Action Buttons if no demographics - removed */}
                  {!(cadetInfo.height || cadetInfo.weight || cadetInfo.age || cadetInfo.course || cadetInfo.sex || cadetInfo.academyNumber) && (
                    <div className="mt-6">
                      {/* Edit button removed */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

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
                      <Link
                        href={`/medical-records/new?cadetId=${cadetId}`}
                        className="inline-flex items-center justify-center p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        title="Add another medical record"
                      >
                        <Plus className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/medical-history/${cadetId}`}
                        className="text-primary hover:text-primary/80 text-sm"
                      >
                        View Timeline →
                      </Link>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Complete medical record history for {cadetInfo.name}
                  </p>
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
                <MedicalRecordsList records={medicalRecords} cadetId={cadetId} showAll />
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
}
