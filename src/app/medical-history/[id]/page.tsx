import { notFound } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowLeft, Calendar, User, MapPin, Phone, FileText, Activity, Clock } from 'lucide-react'
import Link from 'next/link'

interface MedicalRecord {
  id: number
  cadetId: number // Add cadetId field
  name: string
  company: string
  battalion: string
  dateOfReporting: string
  medicalProblem: string
  diagnosis?: string
  status: string
  attendC: number
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
}

export default async function MedicalHistoryPage({
  params,
}: {
  params: { id: string }
}) {
  const cadetId = parseInt(params.id)

  if (isNaN(cadetId)) {
    notFound()
  }

  try {
    // Fetch data from API route
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/medical-history/${cadetId}`, {
      cache: 'no-store' // Ensure fresh data
    })

    if (!response.ok) {
      if (response.status === 404) {
        notFound()
      }
      throw new Error(`Failed to fetch medical history: ${response.status}`)
    }

    const data = await response.json()
    const { cadet: cadetInfo, records: medicalRecordsResult } = data

    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
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
                      <MapPin className="h-4 w-4" />
                      <span>{cadetInfo.company} Company, {cadetInfo.battalion}</span>
                    </div>
                    {cadetInfo.contactNo && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{cadetInfo.contactNo}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Records</div>
                <div className="text-2xl font-bold text-primary">{medicalRecordsResult.length}</div>
                <div className="text-xs text-gray-400">Cadet ID: {cadetId}</div>
              </div>
            </div>
          </div>

          {/* Medical History Timeline */}
          <div className="card">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Medical History Timeline
              </h2>
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
                  <p className="text-gray-600 dark:text-gray-400">
                    This cadet has no medical records yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {medicalRecordsResult.map((record: any, index: number) => (
                    <div key={record.id} className="relative">
                      {/* Timeline line */}
                      {index < medicalRecordsResult.length - 1 && (
                        <div className="absolute left-6 top-16 w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>
                      )}

                      <div className="flex gap-4">
                        {/* Timeline dot */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                          record.status === 'Active'
                            ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                            : record.status === 'Completed'
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400'
                        }`}>
                          <Activity className="h-5 w-5" />
                        </div>

                        {/* Record content */}
                        <div className="flex-1 pb-8">
                          <div className="card p-4">
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                                </div>
                              </div>
                            </div>

                            {record.remarks && (
                              <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Remarks
                                </label>
                                <p className="text-sm text-gray-900 dark:text-white mt-1">
                                  {record.remarks}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          {medicalRecordsResult.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {medicalRecordsResult.filter((r: any) => r.status === 'Active').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Cases</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {medicalRecordsResult.filter((r: any) => r.status === 'Completed').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed Cases</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {medicalRecordsResult.reduce((sum: number, r: any) => sum + (r.totalTrainingDaysMissed ?? 0), 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Training Days Missed</div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    console.error('Error loading medical history:', error)
    notFound()
  }
}
