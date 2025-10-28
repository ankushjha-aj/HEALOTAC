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
}

interface Filters {
  battalions: string[]
  companies: string[]
  companiesByBattalion: Record<string, string[]>
}

export default function EditCadetPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const cadetId = parseInt(params.id)

  const [cadet, setCadet] = useState<CadetData | null>(null)
  const [filters, setFilters] = useState<Filters | null>(null)
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
    sex: ''
  })

  const fetchCadetAndFilters = useCallback(async () => {
    try {
      setLoading(true)
      const [cadetRes, filtersRes] = await Promise.all([
        fetch(`/api/cadets/${cadetId}`),
        fetch('/api/cadets/filters')
      ])

      if (!cadetRes.ok) {
        notFound()
      }

      const cadetData = await cadetRes.json()
      const filtersData = await filtersRes.json()

      setCadet(cadetData)
      setFilters(filtersData)

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
        sex: cadetData.sex || ''
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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

      // Prepare data for API
      const updateData = {
        name: formData.name,
        battalion: formData.battalion,
        company: formData.company,
        joinDate: formData.joinDate,
        height: formData.height ? parseInt(formData.height) : undefined,
        weight: formData.weight ? parseInt(formData.weight) : undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        course: formData.course || undefined,
        sex: formData.sex || undefined
      }

      const response = await fetch(`/api/cadets/${cadetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update cadet')
      }

      console.log('✅ CADET UPDATED SUCCESSFULLY')
      router.push(`/cadets/${cadetId}`)
    } catch (err) {
      console.error('❌ Error updating cadet:', err)
      setError(err instanceof Error ? err.message : 'Failed to update cadet')
    } finally {
      setSaving(false)
    }
  }

  // Get available companies for selected battalion (show all companies for editing)
  // const availableCompanies = filters?.companies || []

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
                    {filters?.battalions.map(battalion => (
                      <option key={battalion} value={battalion}>{battalion}</option>
                    ))}
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

            {/* Form Actions */}
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
