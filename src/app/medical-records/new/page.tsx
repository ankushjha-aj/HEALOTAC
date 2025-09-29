'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Link from 'next/link'
import { X, Plus, User } from 'lucide-react'

interface Cadet {
  id: number
  name: string
  company: string
  battalion: string
}

interface CadetFormData {
  name: string
  battalion: string
  company: string
  joinDate: string
  status: string
  healthStatus: string
  height?: string
  weight?: string
  age?: string
  course?: string
  sex?: string
}

export default function NewMedicalRecordPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cadets, setCadets] = useState<Cadet[]>([])
  const [loadingCadets, setLoadingCadets] = useState(true)
  const [showAddCadetModal, setShowAddCadetModal] = useState(false)
  const [isCreatingCadet, setIsCreatingCadet] = useState(false)
  const [formData, setFormData] = useState({
    // Form fields in required order
    cadetId: '',
    dateOfReporting: '',
    medicalProblem: '',
    diagnosis: '',
    status: 'Active',
    attendC: '0',
    contactNo: '',
    remarks: '',
    monitoringCase: 'No',
  })

  const [cadetFormData, setCadetFormData] = useState<CadetFormData>({
    name: '',
    battalion: '',
    company: '',
    joinDate: '',
    status: 'Active',
    healthStatus: 'Fit',
    height: '',
    weight: '',
    age: '',
    course: '',
    sex: '',
  })

  const [cadetError, setCadetError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch cadets for the dropdown
  useEffect(() => {
    const fetchCadets = async () => {
      try {
        const response = await fetch('/api/cadets')
        if (response.ok) {
          const cadetsData = await response.json()
          setCadets(cadetsData)
        }
      } catch (err) {
        console.error('Error fetching cadets:', err)
      } finally {
        setLoadingCadets(false)
      }
    }

    fetchCadets()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Handle special case for cadet selection
    if (name === 'cadetId' && value === 'add-new') {
      setShowAddCadetModal(true)
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCadetFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setCadetFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCreateCadet = async (e: React.FormEvent) => {
    e.preventDefault()
    setCadetError(null)
    setIsCreatingCadet(true)

    try {
      const response = await fetch('/api/cadets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cadetFormData),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('✅ CREATED CADET:', data)

        // Add the new cadet to the list
        setCadets(prev => [...prev, data])

        // Auto-select the new cadet
        setFormData(prev => ({
          ...prev,
          cadetId: data.id.toString()
        }))

        // Close modal and reset form
        setShowAddCadetModal(false)
        setCadetFormData({
          name: '',
          battalion: '',
          company: '',
          joinDate: '',
          status: 'Active',
          healthStatus: 'Fit',
          height: '',
          weight: '',
          age: '',
          course: '',
          sex: '',
        })

        alert('Cadet added successfully!')
      } else {
        setCadetError(data.error || 'Failed to add cadet')
      }
    } catch (err) {
      console.error('❌ Error adding cadet:', err)
      setCadetError(err instanceof Error ? err.message : 'Network error. Please try again.')
    } finally {
      setIsCreatingCadet(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const submitData = {
        cadetId: formData.cadetId,
        dateOfReporting: formData.dateOfReporting,
        medicalProblem: formData.medicalProblem,
        diagnosis: formData.diagnosis,
        status: formData.status,
        attendC: parseInt(formData.attendC),
        contactNo: formData.contactNo,
        remarks: formData.remarks,
        monitoringCase: formData.monitoringCase,
      }

      const response = await fetch('/api/medical-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('✅ CREATED MEDICAL RECORD:', data)
        alert('Medical record added successfully!')
        router.push('/reports')
      } else {
        setError(data.error || 'Failed to add medical record')
      }
    } catch (err) {
      console.error('❌ Error adding medical record:', err)
      setError(err instanceof Error ? err.message : 'Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Medical Record</h1>
          <p className="text-gray-600 dark:text-gray-400">Record a new medical visit or treatment</p>
        </div>

        {/* Form */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Select Cadet */}
              <div className="md:col-span-2">
                <label htmlFor="cadetId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Cadet *
                </label>
                {loadingCadets ? (
                  <div className="input-field flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Loading cadets...
                  </div>
                ) : (
                  <select
                    id="cadetId"
                    name="cadetId"
                    required
                    value={formData.cadetId}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select a cadet...</option>
                    {cadets.map((cadet) => (
                      <option key={cadet.id} value={cadet.id.toString()}>
                        {cadet.name} - {cadet.company} Company, {cadet.battalion}
                      </option>
                    ))}
                    <option value="add-new" className="border-t border-gray-200 mt-2 pt-2 font-medium text-primary">
                      ➕ Add New Cadet
                    </option>
                  </select>
                )}
                {cadets.length === 0 && !loadingCadets && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    No cadets available. Please add cadets first.
                  </p>
                )}
              </div>

              {/* 2. Date of reporting */}
              <div>
                <label htmlFor="dateOfReporting" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date of reporting *
                </label>
                <input
                  type="date"
                  id="dateOfReporting"
                  name="dateOfReporting"
                  required
                  value={formData.dateOfReporting}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              {/* 3. Medical Problem */}
              <div>
                <label htmlFor="medicalProblem" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Medical Problem *
                </label>
                <input
                  type="text"
                  id="medicalProblem"
                  name="medicalProblem"
                  required
                  value={formData.medicalProblem}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Ankle Sprain, Viral Fever"
                />
              </div>

              {/* 4. Diagnosis */}
              <div className="md:col-span-2">
                <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Diagnosis
                </label>
                <textarea
                  id="diagnosis"
                  name="diagnosis"
                  rows={3}
                  value={formData.diagnosis}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Detailed diagnosis information"
                />
              </div>

              {/* 5. Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* 6. Attend C */}
              <div>
                <label htmlFor="attendC" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Attend C
                </label>
                <select
                  id="attendC"
                  name="attendC"
                  value={formData.attendC}
                  onChange={handleChange}
                  className="input-field"
                >
                  {[...Array(11)].map((_, i) => (
                    <option key={i} value={i.toString()}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>

              {/* 7. Monitoring Case */}
              <div>
                <label htmlFor="monitoringCase" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Monitoring Case
                </label>
                <select
                  id="monitoringCase"
                  name="monitoringCase"
                  value={formData.monitoringCase}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              {/* 8. Contact No. */}
              <div>
                <label htmlFor="contactNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact No.
                </label>
                <input
                  type="tel"
                  id="contactNo"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Phone number"
                />
              </div>

              {/* 9. Remarks */}
              <div className="md:col-span-2">
                <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Remarks
                </label>
                <textarea
                  id="remarks"
                  name="remarks"
                  rows={3}
                  value={formData.remarks}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Any additional remarks or observations"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Link
                href="/dashboard"
                className="btn-secondary"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding Record...' : 'Add Medical Record'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add Cadet Modal */}
      {showAddCadetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Add New Cadet
                </h3>
                <button
                  onClick={() => setShowAddCadetModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCadet} className="space-y-4">
                {cadetError && (
                  <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    {cadetError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {/* Cadet Name */}
                  <div>
                    <label htmlFor="cadetName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="cadetName"
                      name="name"
                      required
                      value={cadetFormData.name}
                      onChange={handleCadetFormChange}
                      className="input-field"
                      placeholder="Enter full name"
                    />
                  </div>

                  {/* Battalion */}
                  <div>
                    <label htmlFor="cadetBattalion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Battalion *
                    </label>
                    <input
                      type="text"
                      id="cadetBattalion"
                      name="battalion"
                      required
                      value={cadetFormData.battalion}
                      onChange={handleCadetFormChange}
                      className="input-field"
                      placeholder="e.g., 12th Battalion"
                    />
                  </div>

                  {/* Company */}
                  <div>
                    <label htmlFor="cadetCompany" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company *
                    </label>
                    <select
                      id="cadetCompany"
                      name="company"
                      required
                      value={cadetFormData.company}
                      onChange={handleCadetFormChange}
                      className="input-field"
                    >
                      <option value="">Select company...</option>
                      <option value="Alpha">Alpha</option>
                      <option value="Beta">Beta</option>
                      <option value="Gamma">Gamma</option>
                      <option value="Delta">Delta</option>
                    </select>
                  </div>

                  {/* Join Date */}
                  <div>
                    <label htmlFor="cadetJoinDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Join Date *
                    </label>
                    <input
                      type="date"
                      id="cadetJoinDate"
                      name="joinDate"
                      required
                      value={cadetFormData.joinDate}
                      onChange={handleCadetFormChange}
                      className="input-field"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label htmlFor="cadetStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      id="cadetStatus"
                      name="status"
                      value={cadetFormData.status}
                      onChange={handleCadetFormChange}
                      className="input-field"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Graduated">Graduated</option>
                    </select>
                  </div>

                  {/* Health Status */}
                  <div>
                    <label htmlFor="cadetHealthStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Health Status
                    </label>
                    <select
                      id="cadetHealthStatus"
                      name="healthStatus"
                      value={cadetFormData.healthStatus}
                      onChange={handleCadetFormChange}
                      className="input-field"
                    >
                      <option value="Fit">Fit</option>
                      <option value="Under Treatment">Under Treatment</option>
                      <option value="Recovered">Recovered</option>
                    </select>
                  </div>

                  {/* Height (cm) */}
                  <div>
                    <label htmlFor="height" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      id="height"
                      name="height"
                      min={0}
                      value={cadetFormData.height}
                      onChange={handleCadetFormChange}
                      className="input-field"
                      placeholder="e.g., 175"
                    />
                  </div>

                  {/* Weight (kg) */}
                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      min={0}
                      value={cadetFormData.weight}
                      onChange={handleCadetFormChange}
                      className="input-field"
                      placeholder="e.g., 68"
                    />
                  </div>

                  {/* Age */}
                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      min={0}
                      value={cadetFormData.age}
                      onChange={handleCadetFormChange}
                      className="input-field"
                      placeholder="e.g., 21"
                    />
                  </div>

                  {/* Course */}
                  <div>
                    <label htmlFor="course" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Course
                    </label>
                    <input
                      type="text"
                      id="course"
                      name="course"
                      value={cadetFormData.course}
                      onChange={handleCadetFormChange}
                      className="input-field"
                      placeholder="e.g., NDA, CDS"
                    />
                  </div>

                  {/* Sex */}
                  <div>
                    <label htmlFor="sex" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sex
                    </label>
                    <select
                      id="sex"
                      name="sex"
                      value={cadetFormData.sex}
                      onChange={handleCadetFormChange}
                      className="input-field"
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowAddCadetModal(false)}
                    className="btn-secondary"
                    disabled={isCreatingCadet}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingCadet}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingCadet ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Adding Cadet...
                      </div>
                    ) : (
                      'Add Cadet'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
