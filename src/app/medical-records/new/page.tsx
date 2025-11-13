'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Link from 'next/link'
import { X, Plus, User } from 'lucide-react'
import { useUser } from '@/hooks/useUser'

interface Cadet {
  id: number
  name: string
  company: string
  battalion: string
  joinDate?: string
  academyNumber?: number | null
  height?: number | null
  initialWeight?: number | null
  currentWeight?: number | null
  weight?: number | null
  age?: number | null
  course?: string | null
  sex?: string | null
  relegated?: string
  createdAt: string
}

interface CadetFormData {
  name: string
  isForeign: boolean
  country: string
  battalion: string
  company: string
  joinDate: string
  academyNumber?: string
  height?: string
  initialWeight?: string
  weight?: string
  age?: string
  course?: string
  sex?: string
  nokContact?: string
  relegated?: string
  // Health Parameters
  bloodGroup?: string
  bmi?: string
  bodyFat?: string
  calcanealBoneDensity?: string
  bp?: string
  pulse?: string
  so2?: string
  bcaFat?: string
  ecg?: string
  temp?: string
  smmKg?: string
  // Vaccination Status
  covidDose1?: boolean
  covidDose2?: boolean
  covidDose3?: boolean
  hepatitisBDose1?: boolean
  hepatitisBDose2?: boolean
  tetanusToxoid?: boolean
  chickenPoxDose1?: boolean
  chickenPoxDose2?: boolean
  chickenPoxSuffered?: boolean
  yellowFever?: boolean
  pastMedicalHistory?: string
  // Tests
  enduranceTest?: string
  agilityTest?: string
  speedTest?: string
  // Strength Tests
  verticalJump?: string
  ballThrow?: string
  lowerBackStrength?: string
  shoulderDynamometerLeft?: string
  shoulderDynamometerRight?: string
  handGripDynamometerLeft?: string
  handGripDynamometerRight?: string
  // Overall Assessment
  overallAssessment?: string
  // Menstrual & Medical History (Female only)
  menstrualFrequency?: string
  menstrualDays?: string
  lastMenstrualDate?: string
  menstrualAids?: string[]
  sexuallyActive?: string
  maritalStatus?: string
  pregnancyHistory?: string
  contraceptiveHistory?: string
  surgeryHistory?: string
  medicalCondition?: string
  hemoglobinLevel?: string
}

function NewMedicalRecordPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cadets, setCadets] = useState<Cadet[]>([])
  const [loadingCadets, setLoadingCadets] = useState(true)
  const [showAddCadetModal, setShowAddCadetModal] = useState(false)
  const [isCreatingCadet, setIsCreatingCadet] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showRecordConfirmation, setShowRecordConfirmation] = useState(false)
  const [cadetSearchTerm, setCadetSearchTerm] = useState('')
  const [showCadetSuggestions, setShowCadetSuggestions] = useState(false)
  const [selectedCadet, setSelectedCadet] = useState<Cadet | null>(null)
  const [formData, setFormData] = useState({
    cadetId: '',
    dateOfReporting: new Date().toISOString().split('T')[0], // Default to today's date
    medicalProblem: '',
    diagnosis: '',
    status: 'Active',
    trainingType: 'none', // 'none', 'attendC', or 'miDetained'
    trainingDays: '0', // Combined value for both Attend C and MI Detained
    exPpg: '0',
    attendB: '0',
    physiotherapy: '0',
    contactNo: '',
    remarks: '',
    monitoringCase: 'No',
    admittedInMH: 'No', // New field for admission in MH/BH/CH
    weight: '',
  })

  const [cadetFormData, setCadetFormData] = useState<CadetFormData>({
    name: '',
    isForeign: false,
    country: '',
    battalion: '',
    company: '',
    joinDate: '',
    academyNumber: '',
    height: '',
    initialWeight: '',
    weight: '',
    age: '',
    course: '',
    sex: '',
    nokContact: '',
    relegated: 'N',
    // Health Parameters
    bloodGroup: '',
    bmi: '',
    bodyFat: '',
    calcanealBoneDensity: '',
    bp: '',
    pulse: '',
    so2: '',
    bcaFat: '',
    ecg: '',
    temp: '',
    smmKg: '',
    // Vaccination Status
    covidDose1: false,
    covidDose2: false,
    covidDose3: false,
    hepatitisBDose1: false,
    hepatitisBDose2: false,
    tetanusToxoid: false,
    chickenPoxDose1: false,
    chickenPoxDose2: false,
    chickenPoxSuffered: false,
    yellowFever: false,
    pastMedicalHistory: '',
    // Tests
    enduranceTest: '',
    agilityTest: '',
    speedTest: '',
    // Strength Tests
    verticalJump: '',
    ballThrow: '',
    lowerBackStrength: '',
    shoulderDynamometerLeft: '',
    shoulderDynamometerRight: '',
    handGripDynamometerLeft: '',
    handGripDynamometerRight: '',
    // Overall Assessment
    overallAssessment: '',
    // Menstrual & Medical History (Female only)
    menstrualFrequency: '',
    menstrualDays: '',
    lastMenstrualDate: '',
    menstrualAids: [],
    sexuallyActive: '',
    maritalStatus: '',
    pregnancyHistory: '',
    contraceptiveHistory: '',
    surgeryHistory: '',
    medicalCondition: '',
    hemoglobinLevel: '',
  })

  const [cadetError, setCadetError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})

  // Fetch cadets for the dropdown
  useEffect(() => {
    const fetchCadets = async () => {
      try {
        const token = localStorage.getItem('jwt_token')
        console.log('🔑 CADETS API - JWT TOKEN:', token ? 'Token found' : 'No token found')
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

        console.log('📡 CADETS API RESPONSE STATUS:', response.status)

        if (response.ok) {
          const cadetsData = await response.json()
          console.log('✅ CADETS FETCHED:', cadetsData.length, 'cadets')
          setCadets(cadetsData)
        } else if (response.status === 401) {
          console.error('❌ CADETS API: Authentication failed')
          setError('Authentication required')
        } else {
          const errorData = await response.json()
          console.error('❌ CADETS API ERROR:', errorData)
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

  // Handle cadetId from URL query parameter - runs when cadets load or URL changes
  useEffect(() => {
    const cadetIdParam = searchParams.get('cadetId')
    if (cadetIdParam && !selectedCadet) {
      const cadetId = parseInt(cadetIdParam)

      // First try to find in already loaded cadets
      const cadet = cadets.find(c => c.id === cadetId)
      if (cadet) {
        console.log('🔍 Pre-selecting cadet from URL (found in loaded cadets):', cadet.name, '(ID:', cadetId, ')')
        handleCadetSelect(cadet)
      } else if (cadets.length > 0) {
        // Cadets are loaded but cadet not found
        console.warn('⚠️ Cadet with ID', cadetId, 'not found in cadets list')
      } else {
        // Cadets not loaded yet, try to fetch this specific cadet
        console.log('📡 Cadets not loaded yet, fetching specific cadet:', cadetId)
        fetch(`/api/cadets/${cadetId}`)
          .then(response => response.json())
          .then(cadetData => {
            if (cadetData && !cadetData.error) {
              console.log('✅ Fetched cadet from API:', cadetData.name)
              // Create a cadet object from the API response
              const cadet = {
                id: cadetData.id,
                name: cadetData.name,
                company: cadetData.company,
                battalion: cadetData.battalion,
                relegated: cadetData.relegated || 'N',
                createdAt: cadetData.createdAt || new Date().toISOString()
              }
              handleCadetSelect(cadet)
            } else {
              console.warn('⚠️ Cadet not found in API:', cadetId)
            }
          })
          .catch(error => {
            console.error('❌ Error fetching cadet:', error)
          })
      }
    }
  }, [cadets, searchParams, selectedCadet])

  // Additional effect to handle the case where component mounts with cadetId but cadets aren't loaded yet
  useEffect(() => {
    const cadetIdParam = searchParams.get('cadetId')
    if (cadetIdParam && !loadingCadets && cadets.length === 0 && !selectedCadet) {
      console.log('📡 Cadets not loaded yet, will retry selection when they load')
    }
  }, [loadingCadets, cadets.length, searchParams, selectedCadet])

  // ESC key handler for confirmation modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmation) {
          setShowConfirmation(false)
        } else if (showRecordConfirmation) {
          setShowRecordConfirmation(false)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showConfirmation, showRecordConfirmation])

  // Auto-show add cadet modal for NA users
  useEffect(() => {
    if (user?.role === 'user') {
      // Modal no longer auto-shows, user clicks button instead
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      }

      // Handle training type changes
      if (name === 'trainingType') {
        if (value === 'none') {
          newData.trainingDays = '0'
        } else if (value !== prev.trainingType) {
          // Reset training days when switching between attendC and miDetained
          newData.trainingDays = '0'
        }
      }

      // Handle admittedInMH changes
      if (name === 'admittedInMH') {
        if (value === 'Yes') {
          newData.monitoringCase = 'Yes'
        } else if (prev.admittedInMH === 'Yes') {
          // Reset monitoring case when changing from Yes to No
          newData.monitoringCase = 'No'
        }
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
  const handleCadetSelect = async (cadet: Cadet) => {
    try {
      // Check if cadet has active MH/BH/CH admissions
      const token = localStorage.getItem('jwt_token')
      if (token) {
        const medicalRecordsResponse = await fetch(`/api/medical-history/${cadet.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (medicalRecordsResponse.ok) {
          const { records } = await medicalRecordsResponse.json()
          const hasActiveAdmission = records.some((record: any) =>
            record.admittedInMH === 'Yes' && record.medicalStatus === 'Active'
          )

          if (hasActiveAdmission) {
            alert('Cannot select this cadet for a new medical record as they have active MH/BH/CH admissions. Please mark them as returned first.')
            return
          }
        }
      }

      setSelectedCadet(cadet)
      setCadetSearchTerm(`${cadet.name} - ${cadet.company} Company, ${cadet.battalion}`)
      setFormData(prev => ({ 
        ...prev, 
        cadetId: cadet.id.toString()
      }))
      setShowCadetSuggestions(false)
    } catch (error) {
      console.error('Error checking cadet admission status:', error)
      // Allow selection if check fails to avoid blocking functionality
      setSelectedCadet(cadet)
      setCadetSearchTerm(`${cadet.name} - ${cadet.company} Company, ${cadet.battalion}`)
      setFormData(prev => ({ 
        ...prev, 
        cadetId: cadet.id.toString()
      }))
      setShowCadetSuggestions(false)
    }
  }

  // Filter cadets based on search term (only when there's text)
  const filteredCadets = cadets.filter(cadet =>
    cadetSearchTerm.trim() !== '' && (
      cadet.name.toLowerCase().includes(cadetSearchTerm.toLowerCase()) ||
      cadet.company.toLowerCase().includes(cadetSearchTerm.toLowerCase()) ||
      cadet.battalion.toLowerCase().includes(cadetSearchTerm.toLowerCase()) ||
      (cadet.academyNumber && cadet.academyNumber.toString().includes(cadetSearchTerm))
    )
  )

  // Helper function to convert menstrual aids array to dropdown value
  const getMenstrualAidsDropdownValue = (aids: string[]) => {
    if (!aids || aids.length === 0) return ''
    
    const sortedAids = [...aids].sort()
    const aidsMap: { [key: string]: string } = {
      'Menstrual Cup': '1',
      'Sanitary Pads': '2', 
      'Tampon': '3'
    }
    
    const numericValue = sortedAids.map(aid => aidsMap[aid]).join('')
    return numericValue
  }


  const handleCadetFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setCadetFormData(prev => {
      // Special handling for menstrual aids dropdown
      if (name === 'menstrualAidsDropdown') {
        // Convert numeric value to array of aids
        const aidsMap: { [key: string]: string[] } = {
          '1': ['Menstrual Cup'],
          '2': ['Sanitary Pads'],
          '3': ['Tampon'],
          '12': ['Menstrual Cup', 'Sanitary Pads'],
          '13': ['Menstrual Cup', 'Tampon'],
          '23': ['Sanitary Pads', 'Tampon'],
          '123': ['Menstrual Cup', 'Sanitary Pads', 'Tampon']
        }
        return {
          ...prev,
          menstrualAids: aidsMap[value] || []
        }
      }

      // Special handling for checkbox arrays
      if (type === 'checkbox' && name === 'menstrualAids') {
        return {
          ...prev,
          [name]: checked
            ? [...(prev[name] || []), value]
            : (prev[name] || []).filter((item: string) => item !== value)
        }
      }

      // Default handling for other inputs
      return {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }
    })
  }

  const handleCreateCadet = async (e: React.FormEvent) => {
    e.preventDefault()
    setCadetError(null)
    setShowConfirmation(true)
  }

  const confirmCreateCadet = async () => {
    setShowConfirmation(false)
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

      console.log('📤 SENDING CADET DATA TO API:', cadetFormData)

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
          isForeign: false,
          country: '',
          battalion: '',
          company: '',
          joinDate: '',
          academyNumber: '',
          height: '',
          initialWeight: '',
          weight: '',
          age: '',
          course: '',
          sex: '',
          nokContact: '',
          relegated: 'N',
          // Health Parameters
          bloodGroup: '',
          bmi: '',
          bodyFat: '',
          calcanealBoneDensity: '',
          bp: '',
          pulse: '',
          so2: '',
          bcaFat: '',
          ecg: '',
          temp: '',
          smmKg: '',
          // Vaccination Status
          covidDose1: false,
          covidDose2: false,
          covidDose3: false,
          hepatitisBDose1: false,
          hepatitisBDose2: false,
          tetanusToxoid: false,
          chickenPoxDose1: false,
          chickenPoxDose2: false,
          chickenPoxSuffered: false,
          yellowFever: false,
          pastMedicalHistory: '',
          // Tests
          enduranceTest: '',
          agilityTest: '',
          speedTest: '',
          // Strength Tests
          verticalJump: '',
          ballThrow: '',
          lowerBackStrength: '',
          shoulderDynamometerLeft: '',
          shoulderDynamometerRight: '',
          handGripDynamometerLeft: '',
          handGripDynamometerRight: '',
          // Overall Assessment
          overallAssessment: '',
          // Menstrual & Medical History (Female only)
          menstrualFrequency: '',
          menstrualDays: '',
          lastMenstrualDate: '',
          menstrualAids: [],
          sexuallyActive: '',
          maritalStatus: '',
          pregnancyHistory: '',
          contraceptiveHistory: '',
          surgeryHistory: '',
          medicalCondition: '',
          hemoglobinLevel: '',
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

    if (!formData.cadetId || formData.cadetId.trim() === '') {
      errors.cadetId = 'Please select a cadet'
    }

    if (!formData.dateOfReporting) {
      errors.dateOfReporting = 'Date of reporting is required'
    }

    if (!formData.medicalProblem.trim()) {
      errors.medicalProblem = 'Medical problem description is required'
    }

    // Validate date format for lastMenstrualDate if provided
    if (cadetFormData.lastMenstrualDate && cadetFormData.lastMenstrualDate.trim() !== '') {
      // HTML5 date input handles validation, just check if it's a valid date string
      const date = new Date(cadetFormData.lastMenstrualDate);
      if (isNaN(date.getTime())) {
        errors.lastMenstrualDate = 'Please enter a valid date'
      }
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
    setShowRecordConfirmation(true)
  }

  const confirmSubmit = async () => {
    setShowRecordConfirmation(false)
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('jwt_token')
      console.log('🔑 JWT TOKEN RETRIEVED:', token ? 'Token found' : 'No token found')
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
        attendC: formData.trainingType === 'attendC' ? parseInt(formData.trainingDays) : 0,
        miDetained: formData.trainingType === 'miDetained' ? parseInt(formData.trainingDays) : 0,
        exPpg: parseInt(formData.exPpg),
        attendB: parseInt(formData.attendB),
        physiotherapy: parseInt(formData.physiotherapy),
        totalTrainingDaysMissed: parseInt(formData.trainingDays) || 0,
        contactNo: formData.contactNo,
        remarks: formData.remarks,
        monitoringCase: formData.monitoringCase,
        admittedInMH: formData.admittedInMH,
      }

      console.log('📝 FRONTEND SENDING MEDICAL RECORD DATA:', submitData)
      console.log('👤 SELECTED CADET:', selectedCadet)

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
              body: JSON.stringify({ currentWeight: parseFloat(formData.weight) }),
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
        // Small delay to ensure database commit is complete
        setTimeout(() => {
          router.push(`/cadets/${formData.cadetId}?refresh=true`)
        }, 500)
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
        {user?.role === 'user' ? (
          // NA user: Cadet management interface
          <>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cadet Management</h1>
              <p className="text-gray-600 dark:text-gray-400">Add new cadets to the system</p>
            </div>

            {/* Add Cadet Button */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowAddCadetModal(true)}
                className="btn-primary flex items-center gap-2 px-6 py-3 text-lg"
              >
                <Plus className="h-6 w-6" />
                Add New Cadet
              </button>
            </div>

            {/* Display added cadets */}
            {cadets.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Added Cadets</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cadets.map((cadet) => (
                    <div key={cadet.id} className="card p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{cadet.name}</h3>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Battalion:</span> {cadet.battalion}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Academy Number:</span> {cadet.academyNumber || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Company:</span> {cadet.company}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Added {new Date(cadet.createdAt).toLocaleDateString()}
                          </div>
                          {cadet.relegated === 'Y' && (
                            <div className="mt-1">
                              <span className="text-red-600 dark:text-red-400 font-bold">R</span>
                              <span className="w-2 h-2 bg-red-500 rounded-full inline-block ml-1"></span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cadets.length === 0 && !loadingCadets && (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-lg font-medium">No cadets added yet</p>
                  <p className="text-sm">Click the "Add New Cadet" button to get started</p>
                </div>
              </div>
            )}
          </>
        ) : (
          // RMO user: Full medical record form
          <>
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
                            Loading cadets... {searchParams.get('cadetId') && 'Pre-selecting from cadet details...'}
                          </div>
                        ) : (
                          <>
                            <input
                              type="text"
                              placeholder="Search for existing cadet by name, company, battalion, or academy number..."
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
                          {searchParams.get('cadetId') && (
                            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                              ✓ Pre-selected from cadet details
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {cadets.length === 0 && !loadingCadets && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        No cadets available. Use &quot;Add New&quot; to create the first cadet.
                      </p>
                    )}
                  </div>

                  {/* Demographics Section - Display selected cadet's info */}
                  {selectedCadet && (
                    <div className="md:col-span-2">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                        Cadet Demographics
                      </h4>
                      <div className="grid grid-cols-1 gap-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {/* Battalion */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Battalion
                            </label>
                            <input
                              type="text"
                              value={selectedCadet.battalion}
                              readOnly
                              className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            />
                          </div>

                          {/* Company */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Company
                            </label>
                            <input
                              type="text"
                              value={selectedCadet.company}
                              readOnly
                              className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            />
                          </div>

                          {/* Academy Number */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Academy Number
                            </label>
                            <input
                              type="text"
                              value={selectedCadet.academyNumber || 'N/A'}
                              readOnly
                              className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            />
                          </div>

                          {/* Join Date */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Join Date
                            </label>
                            <input
                              type="text"
                              value={selectedCadet.joinDate ? new Date(selectedCadet.joinDate).toLocaleDateString() : 'N/A'}
                              readOnly
                              className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            />
                          </div>

                          {/* Height */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Height (cm)
                            </label>
                            <input
                              type="text"
                              value={selectedCadet.height ? `${selectedCadet.height} cm` : 'N/A'}
                              readOnly
                              className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            />
                          </div>

                          {/* Weight */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Initial Weight (kg)
                            </label>
                            <input
                              type="text"
                              value={selectedCadet.weight ? `${selectedCadet.weight} kg` : 'N/A'}
                              readOnly
                              className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            />
                          </div>

                          {/* Age */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Age
                            </label>
                            <input
                              type="text"
                              value={selectedCadet.age || 'N/A'}
                              readOnly
                              className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            />
                          </div>

                          {/* Course */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Course
                            </label>
                            <input
                              type="text"
                              value={selectedCadet.course || 'N/A'}
                              readOnly
                              className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            />
                          </div>

                          {/* Sex */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Sex
                            </label>
                            <input
                              type="text"
                              value={selectedCadet.sex || 'N/A'}
                              readOnly
                              className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            />
                          </div>

                          {/* Relegated */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Relegated
                            </label>
                            <input
                              type="text"
                              value={selectedCadet.relegated === 'Y' ? 'Yes' : 'No'}
                              readOnly
                              className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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
                      max={new Date().toISOString().split('T')[0]} // Prevent future dates
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

                  {/* 4. Current Weight (kg) */}
                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Weight (kg) *
                    </label>
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      min={0}
                      step="0.1"
                      required
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
                      placeholder="Detailed prescription option"
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

                  {/* 7. Training Days (Combined Attend C / MI Detained) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Training Days
                    </label>
                    <div className="space-y-2">
                      {/* Training Type Selection */}
                      <select
                        name="trainingType"
                        value={formData.trainingType}
                        onChange={handleChange}
                        disabled={formData.admittedInMH === 'Yes'}
                        className={`input-field ${formData.admittedInMH === 'Yes' ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                      >
                        <option value="none">None</option>
                        <option value="attendC">Attend C</option>
                        <option value="miDetained">MI Detained</option>
                      </select>

                      {/* Training Days Input - Only show if a type is selected */}
                      {formData.trainingType !== 'none' && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-0">
                            {formData.trainingType === 'attendC' ? 'Attend C:' : 'MI Detained:'}
                          </span>
                          <input
                            type="number"
                            name="trainingDays"
                            min="0"
                            max={formData.trainingType === 'attendC' ? '10' : '30'}
                            value={formData.trainingDays}
                            onChange={handleChange}
                            disabled={formData.admittedInMH === 'Yes'}
                            className={`input-field flex-1 ${formData.admittedInMH === 'Yes' ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                            placeholder="0"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 9. Ex-PPG */}
                  <div>
                    <label htmlFor="exPpg" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ex-PPG
                    </label>
                    <input
                      type="number"
                      id="exPpg"
                      name="exPpg"
                      min="0"
                      value={formData.exPpg}
                      onChange={handleChange}
                      disabled={formData.admittedInMH === 'Yes'}
                      className={`input-field ${formData.admittedInMH === 'Yes' ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                      placeholder="0"
                    />
                  </div>

                  {/* 10. Attend B */}
                  <div>
                    <label htmlFor="attendB" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Attend B
                    </label>
                    <input
                      type="number"
                      id="attendB"
                      name="attendB"
                      min="0"
                      value={formData.attendB}
                      onChange={handleChange}
                      disabled={formData.admittedInMH === 'Yes'}
                      className={`input-field ${formData.admittedInMH === 'Yes' ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                      placeholder="0"
                    />
                  </div>

                  {/* 11. Physiotherapy */}
                  <div>
                    <label htmlFor="physiotherapy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Physiotherapy
                    </label>
                    <input
                      type="number"
                      id="physiotherapy"
                      name="physiotherapy"
                      min="0"
                      value={formData.physiotherapy}
                      onChange={handleChange}
                      disabled={formData.admittedInMH === 'Yes'}
                      className={`input-field ${formData.admittedInMH === 'Yes' ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                      placeholder="0"
                    />
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
                      disabled={formData.admittedInMH === 'Yes'}
                      className={`input-field ${formData.admittedInMH === 'Yes' ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  {/* 8. Admitted in MH/BH/CH */}
                  <div>
                    <label htmlFor="admittedInMH" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Admitted in MH/BH/CH
                    </label>
                    <select
                      id="admittedInMH"
                      name="admittedInMH"
                      value={formData.admittedInMH}
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
                      Contact No. *
                    </label>
                    <input
                      type="tel"
                      id="contactNo"
                      name="contactNo"
                      required
                      value={formData.contactNo}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Phone number"
                      maxLength={10}
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
          </>
        )}

        {/* Add Cadet Modal */}
        {showAddCadetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
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

                  {/* Foreign Candidate Checkbox */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        id="isForeign"
                        name="isForeign"
                        checked={cadetFormData.isForeign}
                        onChange={handleCadetFormChange}
                        className="mr-2"
                      />
                      Foreign Candidate
                    </label>
                  </div>

                  {/* Demographics Section */}
                  <div className="col-span-full">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                      Demographics
                    </h4>
                    <div className="grid grid-cols-1 gap-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-2 gap-4">
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
                            Academy Number *
                          </label>
                          <input
                            type="number"
                            id="academyNumber"
                            name="academyNumber"
                            required
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
                            Height (cm) *
                          </label>
                          <input
                            type="number"
                            id="height"
                            name="height"
                            required
                            min={0}
                            value={cadetFormData.height}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 175"
                          />
                        </div>

                        {/* Initial Weight (kg) */}
                        <div>
                          <label htmlFor="initialWeight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Initial Weight (kg) *
                          </label>
                          <input
                            type="number"
                            id="initialWeight"
                            name="initialWeight"
                            required
                            min={0}
                            step="0.1"
                            value={cadetFormData.initialWeight}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 68.5"
                          />
                        </div>

                        {/* Age */}
                        <div>
                          <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Age *
                          </label>
                          <input
                            type="number"
                            id="age"
                            name="age"
                            required
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
                            Course *
                          </label>
                          <input
                            type="number"
                            id="course"
                            name="course"
                            required
                            min={1}
                            value={cadetFormData.course}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 121, 122, 123"
                          />
                        </div>

                        {/* Sex */}
                        <div>
                          <label htmlFor="sex" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Sex *
                          </label>
                          <select
                            id="sex"
                            name="sex"
                            required
                            value={cadetFormData.sex}
                            onChange={handleCadetFormChange}
                            className="input-field"
                          >
                            <option value="">Select...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>

                        {/* NOK Contact */}
                        <div>
                          <label htmlFor="nokContact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            NOK Contact *
                          </label>
                          <input
                            type="tel"
                            id="nokContact"
                            name="nokContact"
                            required
                            value={cadetFormData.nokContact}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., +91 9876543210"
                            maxLength={20}
                          />
                        </div>
                        <div>
                          <label htmlFor="relegated" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Relegated *
                          </label>
                          <select
                            id="relegated"
                            name="relegated"
                            required
                            value={cadetFormData.relegated}
                            onChange={handleCadetFormChange}
                            className="input-field"
                          >
                            <option value="N">N</option>
                            <option value="Y">Y</option>
                          </select>
                        </div>
                      </div>

                      {/* Country */}
                      {cadetFormData.isForeign && (
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Country
                            </label>
                            <select
                              id="country"
                              name="country"
                              value={cadetFormData.country}
                              onChange={handleCadetFormChange}
                              className="input-field"
                            >
                              <option value="">Select country...</option>
                            <option value="Afghanistan">Afghanistan</option>
                            <option value="Albania">Albania</option>
                            <option value="Algeria">Algeria</option>
                            <option value="Andorra">Andorra</option>
                            <option value="Angola">Angola</option>
                            <option value="Antigua and Barbuda">Antigua and Barbuda</option>
                            <option value="Argentina">Argentina</option>
                            <option value="Armenia">Armenia</option>
                            <option value="Australia">Australia</option>
                            <option value="Austria">Austria</option>
                            <option value="Azerbaijan">Azerbaijan</option>
                            <option value="Bahamas">Bahamas</option>
                            <option value="Bahrain">Bahrain</option>
                            <option value="Bangladesh">Bangladesh</option>
                            <option value="Barbados">Barbados</option>
                            <option value="Belarus">Belarus</option>
                            <option value="Belgium">Belgium</option>
                            <option value="Belize">Belize</option>
                            <option value="Benin">Benin</option>
                            <option value="Bhutan">Bhutan</option>
                            <option value="Bolivia">Bolivia</option>
                            <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
                            <option value="Botswana">Botswana</option>
                            <option value="Brazil">Brazil</option>
                            <option value="Brunei">Brunei</option>
                            <option value="Bulgaria">Bulgaria</option>
                            <option value="Burkina Faso">Burkina Faso</option>
                            <option value="Burundi">Burundi</option>
                            <option value="Cabo Verde">Cabo Verde</option>
                            <option value="Cambodia">Cambodia</option>
                            <option value="Cameroon">Cameroon</option>
                            <option value="Canada">Canada</option>
                            <option value="Central African Republic">Central African Republic</option>
                            <option value="Chad">Chad</option>
                            <option value="Chile">Chile</option>
                            <option value="China">China</option>
                            <option value="Colombia">Colombia</option>
                            <option value="Comoros">Comoros</option>
                            <option value="Congo">Congo</option>
                            <option value="Costa Rica">Costa Rica</option>
                            <option value="Croatia">Croatia</option>
                            <option value="Cuba">Cuba</option>
                            <option value="Cyprus">Cyprus</option>
                            <option value="Czech Republic">Czech Republic</option>
                            <option value="Denmark">Denmark</option>
                            <option value="Djibouti">Djibouti</option>
                            <option value="Dominica">Dominica</option>
                            <option value="Dominican Republic">Dominican Republic</option>
                            <option value="Ecuador">Ecuador</option>
                            <option value="Egypt">Egypt</option>
                            <option value="El Salvador">El Salvador</option>
                            <option value="Equatorial Guinea">Equatorial Guinea</option>
                            <option value="Eritrea">Eritrea</option>
                            <option value="Estonia">Estonia</option>
                            <option value="Eswatini">Eswatini</option>
                            <option value="Ethiopia">Ethiopia</option>
                            <option value="Fiji">Fiji</option>
                            <option value="Finland">Finland</option>
                            <option value="France">France</option>
                            <option value="Gabon">Gabon</option>
                            <option value="Gambia">Gambia</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Germany">Germany</option>
                            <option value="Ghana">Ghana</option>
                            <option value="Greece">Greece</option>
                            <option value="Grenada">Grenada</option>
                            <option value="Guatemala">Guatemala</option>
                            <option value="Guinea">Guinea</option>
                            <option value="Guinea-Bissau">Guinea-Bissau</option>
                            <option value="Guyana">Guyana</option>
                            <option value="Haiti">Haiti</option>
                            <option value="Honduras">Honduras</option>
                            <option value="Hungary">Hungary</option>
                            <option value="Iceland">Iceland</option>
                            <option value="India">India</option>
                            <option value="Indonesia">Indonesia</option>
                            <option value="Iran">Iran</option>
                            <option value="Iraq">Iraq</option>
                            <option value="Ireland">Ireland</option>
                            <option value="Israel">Israel</option>
                            <option value="Italy">Italy</option>
                            <option value="Jamaica">Jamaica</option>
                            <option value="Japan">Japan</option>
                            <option value="Jordan">Jordan</option>
                            <option value="Kazakhstan">Kazakhstan</option>
                            <option value="Kenya">Kenya</option>
                            <option value="Kiribati">Kiribati</option>
                            <option value="Korea, North">Korea, North</option>
                            <option value="Korea, South">Korea, South</option>
                            <option value="Kosovo">Kosovo</option>
                            <option value="Kuwait">Kuwait</option>
                            <option value="Kyrgyzstan">Kyrgyzstan</option>
                            <option value="Laos">Laos</option>
                            <option value="Latvia">Latvia</option>
                            <option value="Lebanon">Lebanon</option>
                            <option value="Lesotho">Lesotho</option>
                            <option value="Liberia">Liberia</option>
                            <option value="Libya">Libya</option>
                            <option value="Liechtenstein">Liechtenstein</option>
                            <option value="Lithuania">Lithuania</option>
                            <option value="Luxembourg">Luxembourg</option>
                            <option value="Madagascar">Madagascar</option>
                            <option value="Malawi">Malawi</option>
                            <option value="Malaysia">Malaysia</option>
                            <option value="Maldives">Maldives</option>
                            <option value="Mali">Mali</option>
                            <option value="Malta">Malta</option>
                            <option value="Marshall Islands">Marshall Islands</option>
                            <option value="Mauritania">Mauritania</option>
                            <option value="Mauritius">Mauritius</option>
                            <option value="Mexico">Mexico</option>
                            <option value="Micronesia">Micronesia</option>
                            <option value="Moldova">Moldova</option>
                            <option value="Monaco">Monaco</option>
                            <option value="Mongolia">Mongolia</option>
                            <option value="Montenegro">Montenegro</option>
                            <option value="Morocco">Morocco</option>
                            <option value="Mozambique">Mozambique</option>
                            <option value="Myanmar">Myanmar</option>
                            <option value="Namibia">Namibia</option>
                            <option value="Nauru">Nauru</option>
                            <option value="Nepal">Nepal</option>
                            <option value="Netherlands">Netherlands</option>
                            <option value="New Zealand">New Zealand</option>
                            <option value="Nicaragua">Nicaragua</option>
                            <option value="Niger">Niger</option>
                            <option value="Nigeria">Nigeria</option>
                            <option value="North Macedonia">North Macedonia</option>
                            <option value="Norway">Norway</option>
                            <option value="Oman">Oman</option>
                            <option value="Pakistan">Pakistan</option>
                            <option value="Palau">Palau</option>
                            <option value="Palestine">Palestine</option>
                            <option value="Panama">Panama</option>
                            <option value="Papua New Guinea">Papua New Guinea</option>
                            <option value="Paraguay">Paraguay</option>
                            <option value="Peru">Peru</option>
                            <option value="Philippines">Philippines</option>
                            <option value="Poland">Poland</option>
                            <option value="Portugal">Portugal</option>
                            <option value="Qatar">Qatar</option>
                            <option value="Romania">Romania</option>
                            <option value="Russia">Russia</option>
                            <option value="Rwanda">Rwanda</option>
                            <option value="Saint Kitts and Nevis">Saint Kitts and Nevis</option>
                            <option value="Saint Lucia">Saint Lucia</option>
                            <option value="Saint Vincent and the Grenadines">Saint Vincent and the Grenadines</option>
                            <option value="Samoa">Samoa</option>
                            <option value="San Marino">San Marino</option>
                            <option value="Sao Tome and Principe">Sao Tome and Principe</option>
                            <option value="Saudi Arabia">Saudi Arabia</option>
                            <option value="Senegal">Senegal</option>
                            <option value="Serbia">Serbia</option>
                            <option value="Seychelles">Seychelles</option>
                            <option value="Sierra Leone">Sierra Leone</option>
                            <option value="Singapore">Singapore</option>
                            <option value="Slovakia">Slovakia</option>
                            <option value="Slovenia">Slovenia</option>
                            <option value="Solomon Islands">Solomon Islands</option>
                            <option value="Somalia">Somalia</option>
                            <option value="South Africa">South Africa</option>
                            <option value="South Sudan">South Sudan</option>
                            <option value="Spain">Spain</option>
                            <option value="Sri Lanka">Sri Lanka</option>
                            <option value="Sudan">Sudan</option>
                            <option value="Suriname">Suriname</option>
                            <option value="Sweden">Sweden</option>
                            <option value="Switzerland">Switzerland</option>
                            <option value="Syria">Syria</option>
                            <option value="Taiwan">Taiwan</option>
                            <option value="Tajikistan">Tajikistan</option>
                            <option value="Tanzania">Tanzania</option>
                            <option value="Thailand">Thailand</option>
                            <option value="Timor-Leste">Timor-Leste</option>
                            <option value="Togo">Togo</option>
                            <option value="Tonga">Tonga</option>
                            <option value="Trinidad and Tobago">Trinidad and Tobago</option>
                            <option value="Tunisia">Tunisia</option>
                            <option value="Turkey">Turkey</option>
                            <option value="Turkmenistan">Turkmenistan</option>
                            <option value="Tuvalu">Tuvalu</option>
                            <option value="Uganda">Uganda</option>
                            <option value="Ukraine">Ukraine</option>
                            <option value="United Arab Emirates">United Arab Emirates</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="United States">United States</option>
                            <option value="Uruguay">Uruguay</option>
                            <option value="Uzbekistan">Uzbekistan</option>
                            <option value="Vanuatu">Vanuatu</option>
                            <option value="Vatican City">Vatican City</option>
                            <option value="Venezuela">Venezuela</option>
                            <option value="Vietnam">Vietnam</option>
                            <option value="Yemen">Yemen</option>
                            <option value="Zambia">Zambia</option>
                            <option value="Zimbabwe">Zimbabwe</option>
                          </select>
                        </div>
                      </div>
                      )}
                    </div>
                  </div>

                  {/* Health Parameters Section */}
                  <div className="col-span-full">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                      Health Parameters
                    </h4>
                    <div className="grid grid-cols-1 gap-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Blood Group *
                          </label>
                          <select
                            id="bloodGroup"
                            name="bloodGroup"
                            required
                            value={cadetFormData.bloodGroup}
                            onChange={handleCadetFormChange}
                            className="input-field"
                          >
                            <option value="">Select blood group...</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="bmi" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            BMI
                          </label>
                          <input
                            type="text"
                            id="bmi"
                            name="bmi"
                            value={cadetFormData.bmi}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 22.5"
                          />
                        </div>
                        <div>
                          <label htmlFor="bodyFat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Body Fat %
                          </label>
                          <input
                            type="text"
                            id="bodyFat"
                            name="bodyFat"
                            value={cadetFormData.bodyFat}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 15.2"
                          />
                        </div>
                        <div>
                          <label htmlFor="calcanealBoneDensity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Calcaneal Bone Density
                          </label>
                          <input
                            type="text"
                            id="calcanealBoneDensity"
                            name="calcanealBoneDensity"
                            value={cadetFormData.calcanealBoneDensity}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 0.85"
                          />
                        </div>
                        <div>
                          <label htmlFor="bp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            BP
                          </label>
                          <input
                            type="text"
                            id="bp"
                            name="bp"
                            value={cadetFormData.bp}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 120/80"
                          />
                        </div>
                        <div>
                          <label htmlFor="pulse" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Pulse
                          </label>
                          <input
                            type="text"
                            id="pulse"
                            name="pulse"
                            value={cadetFormData.pulse}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 72"
                          />
                        </div>
                        <div>
                          <label htmlFor="so2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            SpO2
                          </label>
                          <input
                            type="text"
                            id="so2"
                            name="so2"
                            value={cadetFormData.so2}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 98"
                          />
                        </div>
                        <div>
                          <label htmlFor="bcaFat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            BCA Fat (%)
                          </label>
                          <input
                            type="text"
                            id="bcaFat"
                            name="bcaFat"
                            value={cadetFormData.bcaFat}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 12.3"
                          />
                        </div>
                        <div>
                          <label htmlFor="ecg" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            ECG
                          </label>
                          <input
                            type="text"
                            id="ecg"
                            name="ecg"
                            value={cadetFormData.ecg}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="Normal/Abnormal"
                          />
                        </div>
                        <div>
                          <label htmlFor="temp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Temperature (TEMP)
                          </label>
                          <input
                            type="text"
                            id="temp"
                            name="temp"
                            value={cadetFormData.temp}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 98.6"
                          />
                        </div>
                        <div>
                          <label htmlFor="smmKg" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            SMM (KG)
                          </label>
                          <input
                            type="text"
                            id="smmKg"
                            name="smmKg"
                            value={cadetFormData.smmKg}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 35.2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vaccination Status Section */}
                  <div className="col-span-full">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                      Vaccination Status
                    </h4>
                    <div className="grid grid-cols-1 gap-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Covid Vaccine:</h5>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="covidDose1"
                              checked={cadetFormData.covidDose1}
                              onChange={handleCadetFormChange}
                              className="mr-2"
                            />
                            1st Dose
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="covidDose2"
                              checked={cadetFormData.covidDose2}
                              onChange={handleCadetFormChange}
                              className="mr-2"
                            />
                            2nd Dose
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="covidDose3"
                              checked={cadetFormData.covidDose3}
                              onChange={handleCadetFormChange}
                              className="mr-2"
                            />
                            3rd Dose
                          </label>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hepatitis B Vaccine:</h5>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="hepatitisBDose1"
                              checked={cadetFormData.hepatitisBDose1}
                              onChange={handleCadetFormChange}
                              className="mr-2"
                            />
                            1st Dose
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="hepatitisBDose2"
                              checked={cadetFormData.hepatitisBDose2}
                              onChange={handleCadetFormChange}
                              className="mr-2"
                            />
                            2nd Dose
                          </label>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tetanus Toxoid:</h5>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="tetanusToxoid"
                              value="true"
                              checked={cadetFormData.tetanusToxoid === true}
                              onChange={() => setCadetFormData(prev => ({ ...prev, tetanusToxoid: true }))}
                              className="mr-2"
                            />
                            Yes
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="tetanusToxoid"
                              value="false"
                              checked={cadetFormData.tetanusToxoid === false}
                              onChange={() => setCadetFormData(prev => ({ ...prev, tetanusToxoid: false }))}
                              className="mr-2"
                            />
                            No
                          </label>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chicken Pox:</h5>
                        <div className="flex gap-4 flex-wrap">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="chickenPoxDose1"
                              checked={cadetFormData.chickenPoxDose1}
                              onChange={handleCadetFormChange}
                              className="mr-2"
                            />
                            1st Dose
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="chickenPoxDose2"
                              checked={cadetFormData.chickenPoxDose2}
                              onChange={handleCadetFormChange}
                              className="mr-2"
                            />
                            2nd Dose
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="chickenPoxSuffered"
                              checked={cadetFormData.chickenPoxSuffered}
                              onChange={handleCadetFormChange}
                              className="mr-2"
                            />
                            Suffered in childhood
                          </label>
                        </div>
                      </div>
                      {cadetFormData.isForeign && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Yellow Fever (Foreign Cadets only):</h5>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="yellowFever"
                              value="true"
                              checked={cadetFormData.yellowFever === true}
                              onChange={() => setCadetFormData(prev => ({ ...prev, yellowFever: true }))}
                              className="mr-2"
                            />
                            Yes
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="yellowFever"
                              value="false"
                              checked={cadetFormData.yellowFever === false}
                              onChange={() => setCadetFormData(prev => ({ ...prev, yellowFever: false }))}
                              className="mr-2"
                            />
                            No
                          </label>
                        </div>
                      </div>
                      )}
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Past Medical History:</h5>
                        <textarea
                          id="pastMedicalHistory"
                          name="pastMedicalHistory"
                          rows={3}
                          value={cadetFormData.pastMedicalHistory}
                          onChange={handleCadetFormChange}
                          className="input-field"
                          placeholder="Detailed history of injuries, fractures, surgeries, diseases, depression, or suicidal attempts..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Endurance Test Section */}
                  <div className="col-span-full">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                      Endurance Test
                    </h4>
                    <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                      <div>
                        <label htmlFor="enduranceTest" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Multi-Stage Fitness Test / 800m Running
                        </label>
                        <input
                          type="text"
                          id="enduranceTest"
                          name="enduranceTest"
                          value={cadetFormData.enduranceTest}
                          onChange={handleCadetFormChange}
                          className="input-field"
                          placeholder="e.g., Level 12, 8:45"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Agility Test Section */}
                  <div className="col-span-full">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                      Agility Test
                    </h4>
                    <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                      <div>
                        <label htmlFor="agilityTest" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Illinois Agility Run Test
                        </label>
                        <input
                          type="text"
                          id="agilityTest"
                          name="agilityTest"
                          value={cadetFormData.agilityTest}
                          onChange={handleCadetFormChange}
                          className="input-field"
                          placeholder="e.g., 15.2 seconds"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Speed Test Section */}
                  <div className="col-span-full">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                      Speed Test
                    </h4>
                    <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                      <div>
                        <label htmlFor="speedTest" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          30 Meter Fly
                        </label>
                        <input
                          type="text"
                          id="speedTest"
                          name="speedTest"
                          value={cadetFormData.speedTest}
                          onChange={handleCadetFormChange}
                          className="input-field"
                          placeholder="e.g., 4.2 seconds"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Strength Test Section */}
                  <div className="col-span-full">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                      Strength Tests
                    </h4>
                    <div className="grid grid-cols-1 gap-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="verticalJump" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Vertical Jump *
                          </label>
                          <input
                            type="text"
                            id="verticalJump"
                            name="verticalJump"
                            required
                            value={cadetFormData.verticalJump}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 45 cm"
                          />
                        </div>
                        <div>
                          <label htmlFor="ballThrow" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Ball Throw *
                          </label>
                          <input
                            type="text"
                            id="ballThrow"
                            name="ballThrow"
                            required
                            value={cadetFormData.ballThrow}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 8.5 m"
                          />
                        </div>
                        <div>
                          <label htmlFor="lowerBackStrength" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Lower Back Strength *
                          </label>
                          <input
                            type="text"
                            id="lowerBackStrength"
                            name="lowerBackStrength"
                            required
                            value={cadetFormData.lowerBackStrength}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 120 kg"
                          />
                        </div>
                        <div>
                          <label htmlFor="shoulderDynamometerLeft" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Shoulder Dynamometer (Left) *
                          </label>
                          <input
                            type="text"
                            id="shoulderDynamometerLeft"
                            name="shoulderDynamometerLeft"
                            required
                            value={cadetFormData.shoulderDynamometerLeft}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 25 kg"
                          />
                        </div>
                        <div>
                          <label htmlFor="shoulderDynamometerRight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Shoulder Dynamometer (Right) *
                          </label>
                          <input
                            type="text"
                            id="shoulderDynamometerRight"
                            name="shoulderDynamometerRight"
                            required
                            value={cadetFormData.shoulderDynamometerRight}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 28 kg"
                          />
                        </div>
                        <div>
                          <label htmlFor="handGripDynamometerLeft" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Hand Grip Dynamometer (Left) *
                          </label>
                          <input
                            type="text"
                            id="handGripDynamometerLeft"
                            name="handGripDynamometerLeft"
                            required
                            value={cadetFormData.handGripDynamometerLeft}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 45 kg"
                          />
                        </div>
                        <div>
                          <label htmlFor="handGripDynamometerRight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Hand Grip Dynamometer (Right) *
                          </label>
                          <input
                            type="text"
                            id="handGripDynamometerRight"
                            name="handGripDynamometerRight"
                            required
                            value={cadetFormData.handGripDynamometerRight}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 48 kg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overall Assessment Section */}
                  <div className="col-span-full">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                      Overall Assessment
                    </h4>
                    <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                      <div>
                        <label htmlFor="overallAssessment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Overall Assessment
                        </label>
                        <textarea
                          id="overallAssessment"
                          name="overallAssessment"
                          rows={3}
                          value={cadetFormData.overallAssessment}
                          onChange={handleCadetFormChange}
                          className="input-field"
                          placeholder="Overall remarks or grading"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Menstrual & Medical History Section - Only show for Female cadets */}
                  {cadetFormData.sex === 'Female' && (
                    <div className="col-span-full">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                        Menstrual & Medical History (For Female Cadets Only)
                      </h4>
                      <div className="grid grid-cols-1 gap-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600 bg-pink-50 dark:bg-pink-900/10 p-4 rounded-lg">

                        {/* Menstrual Cycle */}
                        <div className="col-span-full">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Menstrual Cycle:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label htmlFor="menstrualFrequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                How frequently
                              </label>
                              <select
                                id="menstrualFrequency"
                                name="menstrualFrequency"
                                value={cadetFormData.menstrualFrequency}
                                onChange={handleCadetFormChange}
                                className="input-field"
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
                                type="number"
                                id="menstrualDays"
                                name="menstrualDays"
                                min="1"
                                max="10"
                                value={cadetFormData.menstrualDays}
                                onChange={handleCadetFormChange}
                                className="input-field"
                                placeholder="e.g., 5"
                              />
                            </div>
                            <div>
                              <label htmlFor="lastMenstrualDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Last menstrual period date
                              </label>
                              <input
                                type="date"
                                id="lastMenstrualDate"
                                name="lastMenstrualDate"
                                value={cadetFormData.lastMenstrualDate}
                                onChange={handleCadetFormChange}
                                className={`input-field ${fieldErrors.lastMenstrualDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                              />
                              {fieldErrors.lastMenstrualDate && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.lastMenstrualDate}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Menstrual Cycle Aids */}
                        <div className="col-span-full">
                          <label htmlFor="menstrualAidsDropdown" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Menstrual Cycle Aids
                          </label>
                          <select
                            id="menstrualAidsDropdown"
                            name="menstrualAidsDropdown"
                            value={getMenstrualAidsDropdownValue(cadetFormData.menstrualAids || [])}
                            onChange={handleCadetFormChange}
                            className="input-field"
                          >
                            <option value="">Select menstrual aids...</option>
                            <option value="1">Menstrual Cup</option>
                            <option value="2">Sanitary Pads</option>
                            <option value="3">Tampon</option>
                            <option value="12">Menstrual Cup + Sanitary Pads</option>
                            <option value="13">Menstrual Cup + Tampon</option>
                            <option value="23">Sanitary Pads + Tampon</option>
                            <option value="123">All (Menstrual Cup + Sanitary Pads + Tampon)</option>
                          </select>
                        </div>

                        {/* Whether Sexually Active */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Whether Sexually Active
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="sexuallyActive"
                                value="Yes"
                                checked={cadetFormData.sexuallyActive === 'Yes'}
                                onChange={handleCadetFormChange}
                                className="mr-2"
                              />
                              Yes
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="sexuallyActive"
                                value="No"
                                checked={cadetFormData.sexuallyActive === 'No'}
                                onChange={handleCadetFormChange}
                                className="mr-2"
                              />
                              No
                            </label>
                          </div>
                        </div>

                        {/* Marital Status */}
                        <div>
                          <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Marital Status
                          </label>
                          <select
                            id="maritalStatus"
                            name="maritalStatus"
                            value={cadetFormData.maritalStatus}
                            onChange={handleCadetFormChange}
                            className="input-field"
                          >
                            <option value="">Select status...</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                          </select>
                        </div>

                        {/* History of any Pregnancy / Abortion */}
                        <div className="col-span-full">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            History of any Pregnancy / Abortion
                          </label>
                          <div className="flex gap-4 items-center">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="pregnancyRadio"
                                value="Yes"
                                checked={cadetFormData.pregnancyHistory !== '' && cadetFormData.pregnancyHistory !== undefined}
                                onChange={() => setCadetFormData(prev => ({ ...prev, pregnancyHistory: 'Please specify...' }))}
                                className="mr-2"
                              />
                              Yes
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="pregnancyRadio"
                                value="No"
                                checked={cadetFormData.pregnancyHistory === ''}
                                onChange={() => setCadetFormData(prev => ({ ...prev, pregnancyHistory: '' }))}
                                className="mr-2"
                              />
                              No
                            </label>
                          </div>
                          {(cadetFormData.pregnancyHistory !== '' && cadetFormData.pregnancyHistory !== undefined) && (
                            <input
                              type="text"
                              name="pregnancyHistory"
                              value={cadetFormData.pregnancyHistory}
                              onChange={handleCadetFormChange}
                              className="input-field mt-2"
                              placeholder="Please specify..."
                            />
                          )}
                        </div>

                        {/* History of Contraceptive Used */}
                        <div className="col-span-full">
                          <label htmlFor="contraceptiveHistory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            History of Contraceptive Used (Past or Present)
                          </label>
                          <textarea
                            id="contraceptiveHistory"
                            name="contraceptiveHistory"
                            rows={2}
                            value={cadetFormData.contraceptiveHistory}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., Oral contraceptives, IUD, etc."
                          />
                        </div>

                        {/* Underwent any Surgery */}
                        <div className="col-span-full">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Underwent any Surgery
                          </label>
                          <div className="flex gap-4 items-center">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="surgeryRadio"
                                value="Yes"
                                checked={cadetFormData.surgeryHistory !== '' && cadetFormData.surgeryHistory !== undefined}
                                onChange={() => setCadetFormData(prev => ({ ...prev, surgeryHistory: 'Please specify the surgery...' }))}
                                className="mr-2"
                              />
                              Yes
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="surgeryRadio"
                                value="No"
                                checked={cadetFormData.surgeryHistory === ''}
                                onChange={() => setCadetFormData(prev => ({ ...prev, surgeryHistory: '' }))}
                                className="mr-2"
                              />
                              No
                            </label>
                          </div>
                          {(cadetFormData.surgeryHistory !== '' && cadetFormData.surgeryHistory !== undefined) && (
                            <input
                              type="text"
                              name="surgeryHistory"
                              value={cadetFormData.surgeryHistory}
                              onChange={handleCadetFormChange}
                              className="input-field mt-2"
                              placeholder="Please specify the surgery..."
                            />
                          )}
                        </div>

                        {/* Any Medical Condition under Medication */}
                        <div className="col-span-full">
                          <label htmlFor="medicalCondition" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Any Medical Condition under Medication
                          </label>
                          <textarea
                            id="medicalCondition"
                            name="medicalCondition"
                            rows={2}
                            value={cadetFormData.medicalCondition}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., PCOS, Thyroid disorder, etc."
                          />
                        </div>

                        {/* Latest Hb % / Hemoglobin Level */}
                        <div>
                          <label htmlFor="hemoglobinLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Latest Hb % / Hemoglobin Level
                          </label>
                          <input
                            type="number"
                            id="hemoglobinLevel"
                            name="hemoglobinLevel"
                            min="0"
                            max="20"
                            step="0.1"
                            value={cadetFormData.hemoglobinLevel}
                            onChange={handleCadetFormChange}
                            className="input-field"
                            placeholder="e.g., 12.5"
                          />
                        </div>
                      </div>
                    </div>
                  )}
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

      {/* Medical Record Confirmation Modal */}
      {showRecordConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" onClick={() => setShowRecordConfirmation(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Confirm Medical Record Addition
                </h3>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Please confirm your action. <br />
                  Adding this Medical record is a permanent operation and cannot be reversed. <br />
                  Ensure all information has been verified before proceeding.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowRecordConfirmation(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSubmit}
                  disabled={isSubmitting}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Adding...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" onClick={() => setShowConfirmation(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Confirm Cadet Addition
                </h3>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Please confirm your action. <br />
                  Adding this cadet record is a permanent operation and cannot be reversed. <br />
                  Ensure all information has been verified before proceeding.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCreateCadet}
                  disabled={isCreatingCadet}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingCadet ? 'Adding...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  )
}

export default function NewMedicalRecordPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    }>
      <NewMedicalRecordPageInner />
    </Suspense>
  )
}
