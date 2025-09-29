import { notFound } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowLeft, Calendar, User, MapPin, Phone, FileText, Activity, Clock, Ruler, Weight, Users, GraduationCap, Edit } from 'lucide-react'
import Link from 'next/link'

interface CadetInfo {
  id: number
  name: string
  battalion: string
  company: string
  joinDate: string
  status: string
  healthStatus: string
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
    // Fetch cadet details and medical records
    const [cadetRes, recordsRes] = await Promise.all([
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cadets/${cadetId}`, {
        cache: 'no-store'
      }),
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/medical-history/${cadetId}`, {
        cache: 'no-store'
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {cadetInfo.name}
                    </h1>
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
                  {(cadetInfo.height || cadetInfo.weight || cadetInfo.age || cadetInfo.course || cadetInfo.sex) && (
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
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cadet ID</div>
                  <div className="text-2xl font-bold text-primary">#{cadetId}</div>
                  <Link
                    href={`/cadets/${cadetId}/edit`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Cadet
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Medical History Section */}
          <div className="card">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Medical History
                </h2>
                <Link
                  href={`/medical-history/${cadetId}`}
                  className="text-primary hover:text-primary/80 text-sm"
                >
                  View Timeline →
                </Link>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Complete medical record history for {cadetInfo.name}
              </p>
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
                <div className="space-y-4">
                  {medicalRecordsResult.slice(0, 5).map((record: MedicalRecord) => (
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
                        <div className="flex gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.status === 'Active'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : record.status === 'Completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {record.status}
                          </span>
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
                            <div>Attend C: {record.attendC}</div>
                            {record.trainingDaysMissed > 0 && (
                              <div>Training Days Missed: {record.trainingDaysMissed}</div>
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

                  {medicalRecordsResult.length > 5 && (
                    <div className="text-center pt-4">
                      <Link
                        href={`/medical-history/${cadetId}`}
                        className="text-primary hover:text-primary/80"
                      >
                        View all {medicalRecordsResult.length} records →
                      </Link>
                    </div>
                  )}
                </div>
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
