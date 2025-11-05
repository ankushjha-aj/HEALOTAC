'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowLeft, Save, User, MapPin, Calendar, Activity, Ruler, Weight, Users, GraduationCap } from 'lucide-react'
import Link from 'next/link'

interface CadetData {
  id: number
  name: string
  battalion: string
  company: string
  joinDate: string
  height?: number
  weight?: number
  age?: number
  course?: string
  sex?: string
  academyNumber?: number
  relegated?: string
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

export default function EditCadetPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const cadetId = parseInt(params.id)

  const [cadet, setCadet] = useState<CadetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    battalion: '',
    company: '',
    joinDate: '',
    height: '',
    weight: '',
    age: '',
    course: '',
    sex: '',
    academyNumber: '',
    relegated: '',
    // Menstrual & Medical History (Female only)
    menstrualFrequency: '',
    menstrualDays: '',
    lastMenstrualDate: '',
    menstrualAids: '',
    sexuallyActive: '',
    maritalStatus: '',
    pregnancyHistory: '',
    contraceptiveHistory: '',
    surgeryHistory: '',
    medicalCondition: '',
    hemoglobinLevel: '',
  })

  const fetchCadetAndFilters = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('jwt_token')
      if (!token) {
        setError('Authentication required')
        return
      }

      const cadetRes = await fetch(`/api/cadets/${cadetId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!cadetRes.ok) {
        notFound()
      }

      const cadetData = await cadetRes.json()

      setCadet(cadetData)

      // Populate form with existing data
      setFormData({
        name: cadetData.name || '',
        battalion: cadetData.battalion || '',
        company: cadetData.company || '',
        joinDate: cadetData.joinDate ? cadetData.joinDate.split('T')[0] : '',
        height: cadetData.height ? cadetData.height.toString() : '',
        weight: cadetData.weight ? cadetData.weight.toString() : '',
        age: cadetData.age ? cadetData.age.toString() : '',
        course: cadetData.course || '',
        sex: cadetData.sex || '',
        academyNumber: cadetData.academyNumber ? cadetData.academyNumber.toString() : '',
        relegated: cadetData.relegated || 'N',
        // Menstrual & Medical History (Female only)
        menstrualFrequency: cadetData.menstrualFrequency || '',
        menstrualDays: cadetData.menstrualDays || '',
        lastMenstrualDate: cadetData.lastMenstrualDate ? cadetData.lastMenstrualDate.split('T')[0] : '',
        menstrualAids: (() => {
          const aids = cadetData.menstrualAids;
          if (Array.isArray(aids)) {
            // Convert array back to select value
            const sortedAids = [...aids].sort();
            const aidsMap: { [key: string]: string } = {
              'Menstrual Cup': '1',
              'Sanitary Pads': '2', 
              'Tampon': '3'
            }
            const numericValue = sortedAids.map(aid => aidsMap[aid]).join('');
            // Reverse map to combined option
            const reverseMap: { [key: string]: string } = {
              '1': 'Menstrual Cup',
              '2': 'Sanitary Pads',
              '3': 'Tampon',
              '12': 'Menstrual Cup + Sanitary Pads',
              '13': 'Menstrual Cup + Tampon',
              '23': 'Sanitary Pads + Tampon',
              '123': 'All (Menstrual Cup + Sanitary Pads + Tampon)'
            }
            return reverseMap[numericValue] || '';
          }
          return aids || '';
        })(),
        sexuallyActive: cadetData.sexuallyActive || '',
        maritalStatus: cadetData.maritalStatus || '',
        pregnancyHistory: cadetData.pregnancyHistory || '',
        contraceptiveHistory: cadetData.contraceptiveHistory || '',
        surgeryHistory: cadetData.surgeryHistory || '',
        medicalCondition: cadetData.medicalCondition || '',
        hemoglobinLevel: cadetData.hemoglobinLevel || '',
      })
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load cadet data')
    } finally {
      setLoading(false)
    }
  }, [cadetId])

  useEffect(() => {
    fetchCadetAndFilters()
  }, [cadetId, fetchCadetAndFilters])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => {

      // Default handling
      return {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.name || !formData.battalion || !formData.company || !formData.joinDate) {
        throw new Error('Name, battalion, company, and join date are required')
      }

      const token = localStorage.getItem('jwt_token')
      if (!token) {
        throw new Error('Authentication required')
      }

      // Prepare data for API - include all fields for PATCH
      const updateData = {
        name: formData.name,
        battalion: formData.battalion,
        company: formData.company,
        joinDate: formData.joinDate,
        height: formData.height ? parseInt(formData.height) : undefined,
        weight: formData.weight ? parseInt(formData.weight) : undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        course: formData.course || undefined,
        sex: formData.sex || undefined,
        academyNumber: formData.academyNumber ? parseInt(formData.academyNumber) : undefined,
        relegated: formData.relegated || 'N',
        // Menstrual & Medical History (Female only)
        menstrualFrequency: formData.menstrualFrequency || undefined,
        menstrualDays: formData.menstrualDays ? parseInt(formData.menstrualDays) : undefined,
        lastMenstrualDate: formData.lastMenstrualDate ? (() => {
          const date = new Date(formData.lastMenstrualDate);
          return isNaN(date.getTime()) ? null : date;
        })() : null,
        menstrualAids: formData.menstrualAids ? (() => {
          // Convert select value back to array
          const value = formData.menstrualAids;
          const aidsMap: { [key: string]: string[] } = {
            'Menstrual Cup': ['Menstrual Cup'],
            'Sanitary Pads': ['Sanitary Pads'],
            'Tampon': ['Tampon'],
            'Menstrual Cup + Sanitary Pads': ['Menstrual Cup', 'Sanitary Pads'],
            'Menstrual Cup + Tampon': ['Menstrual Cup', 'Tampon'],
            'Sanitary Pads + Tampon': ['Sanitary Pads', 'Tampon'],
            'All (Menstrual Cup + Sanitary Pads + Tampon)': ['Menstrual Cup', 'Sanitary Pads', 'Tampon']
          }
          return aidsMap[value] || [];
        })() : null,
        sexuallyActive: formData.sexuallyActive || undefined,
        maritalStatus: formData.maritalStatus || undefined,
        pregnancyHistory: formData.pregnancyHistory || undefined,
        contraceptiveHistory: formData.contraceptiveHistory || undefined,
        surgeryHistory: formData.surgeryHistory || undefined,
        medicalCondition: formData.medicalCondition || undefined,
        hemoglobinLevel: formData.hemoglobinLevel ? parseFloat(formData.hemoglobinLevel) : undefined,
      }

      const response = await fetch(`/api/cadets/${cadetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update cadet')
      }

      console.log('✅ CADET UPDATED SUCCESSFULLY')
      router.push(`/cadets/${cadetId}?refresh=true`)
    } catch (err) {
      console.error('❌ Error updating cadet:', err)
      setError(err instanceof Error ? err.message : 'Failed to update cadet')
    } finally {
      setSaving(false)
    }
  }

  // Get available companies for selected battalion (show all companies for editing)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading cadet data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !cadet) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
          <Link href="/cadets" className="btn-primary">
            Back to Cadets
          </Link>
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
            href={`/cadets/${cadetId}`}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cadet Details
          </Link>
        </div>

        {/* Edit Form */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Cadet Information
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="joinDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Join Date *
                  </label>
                  <input
                    type="date"
                    id="joinDate"
                    name="joinDate"
                    value={formData.joinDate}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Military Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Military Assignment
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="battalion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Battalion *
                  </label>
                  <select
                    id="battalion"
                    name="battalion"
                    value={formData.battalion}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select Battalion</option>
                    <option value="Shivaji">Shivaji</option>
                    <option value="Ranjit Singh">Ranjit Singh</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company *
                  </label>
                  <select
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select Company</option>
                    <option value="M">M</option>
                    <option value="N">N</option>
                    <option value="Z">Z</option>
                    <option value="J">J</option>
                    <option value="K">K</option>
                    <option value="P">P</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Demographics (Optional) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Demographics (Optional)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    id="height"
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g. 175"
                    min="100"
                    max="250"
                  />
                </div>

                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g. 70"
                    min="30"
                    max="200"
                  />
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g. 21"
                    min="16"
                    max="50"
                  />
                </div>

                <div>
                  <label htmlFor="academyNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Academy Number
                  </label>
                  <input
                    type="number"
                    id="academyNumber"
                    name="academyNumber"
                    value={formData.academyNumber}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g. 12345"
                    min="1"
                  />
                </div>

                <div>
                  <label htmlFor="relegated" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Relegated Status
                  </label>
                  <select
                    id="relegated"
                    name="relegated"
                    value={formData.relegated}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="N">No (N)</option>
                    <option value="Y">Yes (Y)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="course" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Course
                  </label>
                  <input
                    type="number"
                    id="course"
                    name="course"
                    value={formData.course}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g. 1, 2, 3"
                    min={1}
                  />
                </div>

                <div>
                  <label htmlFor="sex" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sex
                  </label>
                  <select
                    id="sex"
                    name="sex"
                    value={formData.sex}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Menstrual & Medical History (Female only) */}
            {formData.sex === 'Female' && (
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                  Menstrual & Medical History (For Female Cadets Only)
                </h4>

                <div className="grid grid-cols-1 gap-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                  <div className="col-span-full">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Menstrual Cycle:
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="menstrualFrequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          How frequently
                        </label>
                        <select
                          id="menstrualFrequency"
                          name="menstrualFrequency"
                          className="input-field"
                          value={formData.menstrualFrequency}
                          onChange={handleInputChange}
                        >
                          <option value="">Select frequency...</option>
                          <option value="Regular">Regular</option>
                          <option value="Irregular">Irregular</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="menstrualDays" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          How many days
                        </label>
                        <input
                          id="menstrualDays"
                          min="1"
                          max="10"
                          className="input-field"
                          placeholder="e.g., 5"
                          type="number"
                          name="menstrualDays"
                          value={formData.menstrualDays}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="lastMenstrualDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Last menstrual period date
                        </label>
                        <input
                          id="lastMenstrualDate"
                          className="input-field"
                          type="date"
                          name="lastMenstrualDate"
                          value={formData.lastMenstrualDate}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-full">
                    <label htmlFor="menstrualAidsDropdown" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Menstrual Cycle Aids
                    </label>
                    <select
                      id="menstrualAidsDropdown"
                      name="menstrualAids"
                      className="input-field"
                      value={formData.menstrualAids}
                      onChange={handleInputChange}
                    >
                      <option value="">Select...</option>
                      <option value="Menstrual Cup">Menstrual Cup</option>
                      <option value="Sanitary Pads">Sanitary Pads</option>
                      <option value="Tampon">Tampon</option>
                      <option value="Menstrual Cup + Sanitary Pads">Menstrual Cup + Sanitary Pads</option>
                      <option value="Menstrual Cup + Tampon">Menstrual Cup + Tampon</option>
                      <option value="Sanitary Pads + Tampon">Sanitary Pads + Tampon</option>
                      <option value="All (Menstrual Cup + Sanitary Pads + Tampon)">All (Menstrual Cup + Sanitary Pads + Tampon)</option>
                    </select>
                  </div>
                </div>

                {/* Sexual & Reproductive Health */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">Sexual & Reproductive Health</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="sexuallyActive" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sexually Active
                      </label>
                      <select
                        id="sexuallyActive"
                        name="sexuallyActive"
                        value={formData.sexuallyActive}
                        onChange={handleInputChange}
                        className="input-field"
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Marital Status
                      </label>
                      <select
                        id="maritalStatus"
                        name="maritalStatus"
                        value={formData.maritalStatus}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                      >
                        <option value="">Select</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Pregnancy & Contraceptive History */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">Pregnancy & Contraceptive History</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="pregnancyHistory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Pregnancy History
                      </label>
                      <textarea
                        id="pregnancyHistory"
                        name="pregnancyHistory"
                        value={formData.pregnancyHistory}
                        onChange={handleInputChange}
                        className="input-field"
                        rows={3}
                        placeholder="Describe pregnancy history..."
                      />
                    </div>

                    <div>
                      <label htmlFor="contraceptiveHistory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Contraceptive History
                      </label>
                      <textarea
                        id="contraceptiveHistory"
                        name="contraceptiveHistory"
                        value={formData.contraceptiveHistory}
                        onChange={handleInputChange}
                        className="input-field"
                        rows={3}
                        placeholder="Describe contraceptive history..."
                      />
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">Medical History</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="surgeryHistory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Surgery History
                      </label>
                      <textarea
                        id="surgeryHistory"
                        name="surgeryHistory"
                        value={formData.surgeryHistory}
                        onChange={handleInputChange}
                        className="input-field"
                        rows={3}
                        placeholder="Describe surgical history..."
                      />
                    </div>

                    <div>
                      <label htmlFor="medicalCondition" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Medical Condition
                      </label>
                      <textarea
                        id="medicalCondition"
                        name="medicalCondition"
                        value={formData.medicalCondition}
                        onChange={handleInputChange}
                        className="input-field"
                        rows={3}
                        placeholder="Describe any medical conditions..."
                      />
                    </div>

                    <div>
                      <label htmlFor="hemoglobinLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hemoglobin Level (g/dL)
                      </label>
                      <input
                        type="number"
                        id="hemoglobinLevel"
                        name="hemoglobinLevel"
                        value={formData.hemoglobinLevel}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="e.g. 12.5"
                        step="0.1"
                        min="0"
                        max="20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link
                href={`/cadets/${cadetId}`}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
