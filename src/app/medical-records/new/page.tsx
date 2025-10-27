'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Link from 'next/link'
import { X, Plus, User } from 'lucide-react'

interface Cadet {
  id: number
  name: string
  company: string
  battalion: string
  relegated?: string
}

interface CadetFormData {
  name: string
  battalion: string
  company: string
  joinDate: string
  academyNumber?: string
  height?: string
  weight?: string
  age?: string
  course?: string
  sex?: string
  relegated?: string
}

export default function NewMedicalRecordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cadets, setCadets] = useState<Cadet[]>([])
  const [loadingCadets, setLoadingCadets] = useState(true)
  const [showAddCadetModal, setShowAddCadetModal] = useState(false)
  const [isCreatingCadet, setIsCreatingCadet] = useState(false)
  const [cadetSearchTerm, setCadetSearchTerm] = useState('')
  const [showCadetSuggestions, setShowCadetSuggestions] = useState(false)
  const [selectedCadet, setSelectedCadet] = useState<Cadet | null>(null)
  const [formData, setFormData] = useState({
    // Form fields in required order
    cadetId: '',
    dateOfReporting: '',
    medicalProblem: '',
    diagnosis: '',
    status: 'Active',
    attendC: '0',
    miDetained: '0',
    contactNo: '',
    remarks: '',
    monitoringCase: 'No',
    weight: '',
  })

  const [cadetFormData, setCadetFormData] = useState<CadetFormData>({
    name: '',
    battalion: '',
    company: '',
    joinDate: '',
    academyNumber: '',
    height: '',
    weight: '',
    age: '',
    course: '',
    sex: '',
    relegated: 'N',
  })

  const [cadetError, setCadetError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})

  // Fetch cadets for the dropdown
  useEffect(() => {
    const fetchCadets = async () => {
      try {
        const token = localStorage.getItem('jwt_token')
        if (!token) {
          setError('Authentication required')
          setLoadingCadets(false)
          return
        }

        const response = await fetch('/api/cadets', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const cadetsData = await response.json()
          setCadets(cadetsData)
        } else if (response.status === 401) {
          setError('Authentication required')
        } else {
          throw new Error('Failed to fetch cadets')
        }
      } catch (err) {
        console.error('Error fetching cadets:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch cadets')
      } finally {
        setLoadingCadets(false)
      }
    }

    fetchCadets()
  }, [])

  // Handle cadetId from URL query parameter
  useEffect(() => {
    const cadetIdParam = searchParams.get('cadetId')
    if (cadetIdParam && cadets.length > 0) {
      const cadetId = parseInt(cadetIdParam)
      const cadet = cadets.find(c => c.id === cadetId)
      if (cadet) {
        handleCadetSelect(cadet)
      }
    }
  }, [cadets, searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      }

      // Mutual exclusion logic for Attend C and MI Detained
      if (name === 'attendC' && value !== '0') {
        newData.miDetained = '0'
      } else if (name === 'miDetained' && value !== '0') {
        newData.attendC = '0'
      }

      return newData
    })
  }

  // Handle cadet search input
  const handleCadetSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCadetSearchTerm(value)

    // Only show suggestions when there's actual text
    setShowCadetSuggestions(value.trim().length > 0)

    // Clear selection if search term is empty
    if (!value.trim()) {
      setSelectedCadet(null)
      setFormData(prev => ({ ...prev, cadetId: '' }))
    }
  }

  // Handle input focus - don't show suggestions automatically
  const handleCadetFocus = () => {
    // Only show suggestions if there's text already
    setShowCadetSuggestions(cadetSearchTerm.trim().length > 0)
  }

  // Handle cadet selection from suggestions
  const handleCadetSelect = (cadet: Cadet) => {
    setSelectedCadet(cadet)
    setCadetSearchTerm(`${cadet.name} - ${cadet.company} Company, ${cadet.battalion}`)
    setFormData(prev => ({ ...prev, cadetId: cadet.id.toString() }))
    setShowCadetSuggestions(false)
  }

  // Filter cadets based on search term (only when there's text)
  const filteredCadets = cadets.filter(cadet =>
    cadetSearchTerm.trim() !== '' && (
      cadet.name.toLowerCase().includes(cadetSearchTerm.toLowerCase()) ||
      cadet.company.toLowerCase().includes(cadetSearchTerm.toLowerCase()) ||
      cadet.battalion.toLowerCase().includes(cadetSearchTerm.toLowerCase())
    )
  )

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
      const token = localStorage.getItem('jwt_token')
      if (!token) {
        setCadetError('Authentication required')
        return
      }

      const response = await fetch('/api/cadets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
          academyNumber: '',
          height: '',
          weight: '',
          age: '',
          course: '',
          sex: '',
          relegated: 'N',
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

  const validateForm = () => {
    const errors: {[key: string]: string} = {}

    if (!formData.cadetId) {
      errors.cadetId = 'Please select a cadet'
    }

    if (!formData.dateOfReporting) {
      errors.dateOfReporting = 'Date of reporting is required'
    }

    if (!formData.medicalProblem.trim()) {
      errors.medicalProblem = 'Medical problem is required'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('jwt_token')
      if (!token) {
        setError('Authentication required')
        return
      }

      const submitData = {
        cadetId: formData.cadetId,
        dateOfReporting: formData.dateOfReporting,
        medicalProblem: formData.medicalProblem,
        diagnosis: formData.diagnosis,
        medicalStatus: formData.status,
        attendC: parseInt(formData.attendC),
        miDetained: parseInt(formData.miDetained),
        totalTrainingDaysMissed: parseInt(formData.attendC) + parseInt(formData.miDetained),
        contactNo: formData.contactNo,
        remarks: formData.remarks,
        monitoringCase: formData.monitoringCase,
      }

      const response = await fetch('/api/medical-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('✅ CREATED MEDICAL RECORD:', data)

        // Update cadet's weight if provided
        if (formData.weight && formData.weight.trim() !== '') {
          try {
            const weightResponse = await fetch(`/api/cadets/${formData.cadetId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ weight: parseFloat(formData.weight) }),
            })

            if (weightResponse.ok) {
              console.log('✅ UPDATED CADET WEIGHT')
            } else {
              console.warn('⚠️ Failed to update cadet weight, but medical record was created')
            }
          } catch (weightError) {
            console.warn('⚠️ Error updating cadet weight:', weightError)
          }
        }

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
              {/* 1. Find or Add Cadet */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cadet Selection *
                </label>
                <div className="flex gap-3">
                  {/* Cadet Search Input */}
                  <div className="flex-1 relative">
                    {loadingCadets ? (
                      <div className="input-field flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        Loading cadets...
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="Search for existing cadet by name, company, or battalion..."
                          value={cadetSearchTerm}
                          onChange={handleCadetSearch}
                          onFocus={handleCadetFocus}
                          onBlur={() => setTimeout(() => setShowCadetSuggestions(false), 200)}
                          className={`input-field ${fieldErrors.cadetId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                          required={!!formData.cadetId}
                        />

                        {/* Auto-complete suggestions */}
                        {showCadetSuggestions && filteredCadets.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredCadets.slice(0, 10).map((cadet) => (
                              <div
                                key={cadet.id}
                                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                                onClick={() => handleCadetSelect(cadet)}
                              >
                                <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                  {cadet.name}
                                  {cadet.relegated === 'Y' && (
                                    <>
                                      <span className="text-red-600 dark:text-red-400 font-bold">R</span>
                                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                    </>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {cadet.company} Company, {cadet.battalion}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Action buttons for cadet management */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCadetModal(true)}
                      className="btn-secondary text-sm px-3 py-1"
                      title="Add new cadet"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    {selectedCadet && (
                      <Link
                        href={`/cadets/${selectedCadet.id}/edit`}
                        className="btn-secondary text-sm px-3 py-1"
                        title="Edit selected cadet"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>

                {fieldErrors.cadetId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.cadetId}</p>
                )}

                {selectedCadet && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="text-sm">
                      <span className="font-medium text-green-800 dark:text-green-400">Selected:</span>{' '}
                      <span className="text-green-700 dark:text-green-300 flex items-center gap-2">
                        {selectedCadet.name}
                        {selectedCadet.relegated === 'Y' && (
                          <>
                            <span className="text-red-600 dark:text-red-400 font-bold">R</span>
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          </>
                        )}
                        - {selectedCadet.company} Company, {selectedCadet.battalion}
                      </span>
                    </div>
                  </div>
                )}

                {cadets.length === 0 && !loadingCadets && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    No cadets available. Use &quot;Add New&quot; to create the first cadet.
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
                  className={`input-field ${fieldErrors.dateOfReporting ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {fieldErrors.dateOfReporting && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.dateOfReporting}</p>
                )}
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
                  className={`input-field ${fieldErrors.medicalProblem ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="e.g., Ankle Sprain, Viral Fever"
                />
                {fieldErrors.medicalProblem && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.medicalProblem}</p>
                )}
              </div>

              {/* 4. Weight (kg) */}
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  min={0}
                  step="0.1"
                  value={formData.weight}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., 68.5"
                />
              </div>

              {/* 5. Diagnosis */}
              <div className="md:col-span-2">
                <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prescription
                </label>
                <textarea
                  id="diagnosis"
                  name="diagnosis"
                  rows={3}
                  value={formData.diagnosis}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="detailed prescription option"
                />
              </div>

              {/* 6. Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Medical Status
                </label>
                <select
                  id="status"
                  name="medicalStatus"
                  value={formData.status}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* 7. Attend C */}
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
                  disabled={formData.miDetained !== '0'}
                >
                  {[...Array(11)].map((_, i) => (
                    <option key={i} value={i.toString()}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>

              {/* 8. MI Detained */}
              <div>
                <label htmlFor="miDetained" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  MI Detained
                </label>
                <select
                  id="miDetained"
                  name="miDetained"
                  value={formData.miDetained}
                  onChange={handleChange}
                  className="input-field"
                  disabled={formData.attendC !== '0'}
                >
                  {[...Array(31)].map((_, i) => (
                    <option key={i} value={i.toString()}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
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

              {/* 9. Contact No. */}
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

              {/* 10. Remarks */}
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
                    <select
                      id="cadetBattalion"
                      name="battalion"
                      required
                      value={cadetFormData.battalion}
                      onChange={handleCadetFormChange}
                      className="input-field"
                    >
                      <option value="">Select battalion...</option>
                      <option value="Shivaji">Shivaji</option>
                      <option value="Ranjit Singh">Ranjit Singh</option>
                    </select>
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
                      <option value="M">M</option>
                      <option value="N">N</option>
                      <option value="Z">Z</option>
                      <option value="J">J</option>
                      <option value="K">K</option>
                      <option value="P">P</option>
                    </select>
                  </div>

                  {/* Academy Number */}
                  <div>
                    <label htmlFor="academyNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Academy Number
                    </label>
                    <input
                      type="number"
                      id="academyNumber"
                      name="academyNumber"
                      value={cadetFormData.academyNumber}
                      onChange={handleCadetFormChange}
                      className="input-field"
                      placeholder="e.g., 12345"
                      min={1}
                    />
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
                      type="number"
                      id="course"
                      name="course"
                      min={1}
                      value={cadetFormData.course}
                      onChange={handleCadetFormChange}
                      className="input-field"
                      placeholder="e.g., 1, 2, 3"
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
                    </select>
                  </div>

                  {/* Relegated */}
                  <div>
                    <label htmlFor="relegated" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Relegated
                    </label>
                    <select
                      id="relegated"
                      name="relegated"
                      value={cadetFormData.relegated}
                      onChange={handleCadetFormChange}
                      className="input-field"
                    >
                      <option value="N">N</option>
                      <option value="Y">Y</option>
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
