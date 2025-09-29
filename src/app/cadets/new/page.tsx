'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewCadetPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    battalion: '',
    company: '',
    joinDate: '',
    status: 'Active',
    healthStatus: 'Fit',
    // New demographic fields
    height: '',
    weight: '',
    age: '',
    course: '',
    sex: '',
  })
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/cadets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('✅ CREATED CADET:', data)
        alert('Cadet added successfully!')
        router.push('/cadets')
      } else {
        setError(data.error || 'Failed to add cadet')
      }
    } catch (err) {
      console.error('❌ Error adding cadet:', err)
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/cadets"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Cadet</h1>
            <p className="text-gray-600 dark:text-gray-400">Enter cadet information to add to the system</p>
          </div>
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
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter cadet's full name"
                />
              </div>

              {/* Battalion */}
              <div>
                <label htmlFor="battalion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Battalion *
                </label>
                <input
                  type="text"
                  id="battalion"
                  name="battalion"
                  required
                  value={formData.battalion}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., 12th Battalion"
                />
              </div>

              {/* Company */}
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company *
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  required
                  value={formData.company}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Alpha, Beta, Gamma"
                />
              </div>

              {/* Join Date */}
              <div>
                <label htmlFor="joinDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Join Date *
                </label>
                <input
                  type="date"
                  id="joinDate"
                  name="joinDate"
                  required
                  value={formData.joinDate}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              {/* Status */}
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
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Health Status */}
              <div>
                <label htmlFor="healthStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Health Status
                </label>
                <select
                  id="healthStatus"
                  name="healthStatus"
                  value={formData.healthStatus}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="Fit">Fit</option>
                  <option value="Under Treatment">Under Treatment</option>
                  <option value="Recovering">Recovering</option>
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
                  min="0"
                  value={formData.height}
                  onChange={handleChange}
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
                  min="0"
                  value={formData.weight}
                  onChange={handleChange}
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
                  min="0"
                  value={formData.age}
                  onChange={handleChange}
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
                  value={formData.course}
                  onChange={handleChange}
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
                  value={formData.sex}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Link
                href="/cadets"
                className="btn-secondary"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding...' : 'Add Cadet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
