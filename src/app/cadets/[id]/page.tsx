import { notFound } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowLeft, Calendar, User, MapPin, Phone, FileText, Activity, Clock, Ruler, Weight, Users, GraduationCap, Edit, Plus } from 'lucide-react'
import Link from 'next/link'
import MedicalRecordsList from './MedicalRecordsList'

interface CadetInfo {
  id: number
  name: string
  battalion: string
  company: string
  joinDate: string
  status: string
  healthStatus: string
  academyNumber?: number
  height?: number
  weight?: number
  age?: number
  course?: string
  sex?: string
  createdAt: string
  updatedAt: string
}

interface MedicalRecord {
  id: number
  cadetId: number
  dateOfReporting: string
  medicalProblem: string
  diagnosis?: string
  status: string
  attendC: number
  trainingDaysMissed: number
  monitoringCase: boolean
  contactNo: string
  remarks: string
  createdAt: string
}

export default async function CadetDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const cadetId = parseInt(params.id)

  if (isNaN(cadetId)) {
    notFound()
  }

  try {
    const [cadetRes, recordsRes] = await Promise.all([
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cadets/${cadetId}`, {
        cache: 'no-store',
        credentials: 'include'
      }),
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/medical-history/${cadetId}`, {
        cache: 'no-store',
        credentials: 'include'
      })
    ])

    if (!cadetRes.ok) {
      notFound()
    }

    const cadetInfo: CadetInfo = await cadetRes.json()
    const { records: medicalRecordsResult } = recordsRes.ok ? await recordsRes.json() : { records: [] }

    // Calculate total training days missed
    const totalTrainingDaysMissed = medicalRecordsResult.reduce((total: number, record: MedicalRecord) => {
      return total + (record.trainingDaysMissed || 0)
    }, 0)

    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
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
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {cadetInfo.name}
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
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Join Date</p>
                        <p className="text-sm font-medium">{new Date(cadetInfo.joinDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          cadetInfo.status === 'Active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {cadetInfo.status}
                        </span>
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
                      <Activity className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Health Status</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          cadetInfo.healthStatus === 'Fit'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : cadetInfo.healthStatus === 'Under Treatment'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                          {cadetInfo.healthStatus}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Medical Records</p>
                        <p className="text-sm font-medium">{medicalRecordsResult.length}</p>
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
                          <div className="flex items-center gap-2">
                            <Weight className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Weight</p>
                              <p className="text-sm font-medium">{cadetInfo.weight} kg</p>
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

              <div className="text-center">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Cadet ID</div>
                  <div className="text-2xl font-bold text-primary">#{cadetId}</div>
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
              {medicalRecordsResult.length === 0 ? (
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
                <MedicalRecordsList records={medicalRecordsResult} cadetId={cadetId} />
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    console.error('Error loading cadet details:', error)
    notFound()
  }
}
