import { notFound } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface MedicalRecord {
  id: number
  cadetId: number
  name: string
  company: string
  battalion: string
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
                      <span>{cadetInfo.company} Company, {cadetInfo.battalion}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Records</div>
                <div className="text-2xl font-bold text-primary">{medicalRecordsResult.length}</div>
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
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div className="flex-1 pb-8">
                          <div className="card p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                  {record.medicalProblem}
                                </h3>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(record.dateOfReporting).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  record.medicalStatus === 'Active'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                    : record.medicalStatus === 'Completed'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                }`}>
                                  {record.medicalStatus}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Simple medical record display - full functionality coming soon.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    console.error('Error loading medical history:', error)
    notFound()
  }
}
