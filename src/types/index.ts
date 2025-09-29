export interface Cadet {
  id: number | string
  name: string
  battalion: string
  company: string
  age?: number
  bloodGroup?: string
  height?: string
  weight?: string
  allergies?: string
  chronicConditions?: string
  emergencyContact?: string
  lastVisit?: string
  status: 'Active' | 'Inactive'
  healthStatus: 'Fit' | 'Under Treatment' | 'Recovering' | 'Medical Leave'
}

export interface MedicalRecord {
  id: number | string
  cadetId: number | string
  cadetName: string
  date: string
  type: 'checkup' | 'injury' | 'followup' | 'vaccination' | 'illness' | 'other'
  title: string
  problem?: string
  diagnosis: string
  treatment: string
  medications?: string
  remarks?: string
  doctor: string
  followUpDate?: string
  status?: 'active' | 'completed' | 'pending'
}

export interface MedicalFormData {
  cadetName: string
  company: string
  battalion: string
  dateOfReporting: string
  medicalProblem: string
  diagnosis: string
  status: string
  attendC: string
  trainingMissed: string
  contactNo: string
  remarks: string
  treatment: string
  medications: string
  followUpDate: string
  doctorName: string
}

export interface DashboardStats {
  label: string
  value: string
  icon: any
  change: string
}

export interface User {
  username: string
  role: 'admin' | 'attendant' | 'doctor' | 'viewer'
  permissions: string[]
}
