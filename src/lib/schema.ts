import { pgTable, serial, text, varchar, timestamp, integer, boolean, decimal } from 'drizzle-orm/pg-core'

// Users table for authentication
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  password: text('password').notNull(),
  email: varchar('email', { length: 255 }),
  role: varchar('role', { length: 20 }).default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Cadets table (patients)
export const cadets = pgTable('cadets', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  battalion: varchar('battalion', { length: 100 }).notNull(),
  company: varchar('company', { length: 50 }).notNull(),
  joinDate: timestamp('join_date').notNull(),
  // Academy number field
  academyNumber: integer('academy_number'),
  // New demographic fields
  height: integer('height'), // in cm
  weight: integer('weight'), // in kg
  age: integer('age'),
  course: varchar('course', { length: 100 }),
  sex: varchar('sex', { length: 10 }),
  relegated: varchar('relegated', { length: 1 }).default('N').notNull(),
  // Health Parameters
  bloodGroup: varchar('blood_group', { length: 10 }),
  bmi: varchar('bmi', { length: 20 }),
  bodyFat: varchar('body_fat', { length: 20 }),
  calcanealBoneDensity: varchar('calcaneal_bone_density', { length: 20 }),
  bp: varchar('bp', { length: 20 }),
  pulse: varchar('pulse', { length: 20 }),
  so2: varchar('so2', { length: 20 }),
  bcaFat: varchar('bca_fat', { length: 20 }),
  ecg: varchar('ecg', { length: 20 }),
  temp: varchar('temp', { length: 20 }),
  smmKg: varchar('smm_kg', { length: 20 }),
  // Vaccination Status
  covidDose1: boolean('covid_dose_1').default(false).notNull(),
  covidDose2: boolean('covid_dose_2').default(false).notNull(),
  covidDose3: boolean('covid_dose_3').default(false).notNull(),
  hepatitisBDose1: boolean('hepatitis_b_dose_1').default(false).notNull(),
  hepatitisBDose2: boolean('hepatitis_b_dose_2').default(false).notNull(),
  tetanusToxoid: boolean('tetanus_toxoid').default(false).notNull(),
  chickenPoxDose1: boolean('chicken_pox_dose_1').default(false).notNull(),
  chickenPoxDose2: boolean('chicken_pox_dose_2').default(false).notNull(),
  chickenPoxSuffered: boolean('chicken_pox_suffered').default(false).notNull(),
  yellowFever: boolean('yellow_fever').default(false).notNull(),
  pastMedicalHistory: text('past_medical_history'),
  // Tests
  enduranceTest: varchar('endurance_test', { length: 50 }),
  agilityTest: varchar('agility_test', { length: 50 }),
  speedTest: varchar('speed_test', { length: 50 }),
  // Strength Tests
  verticalJump: varchar('vertical_jump', { length: 50 }),
  ballThrow: varchar('ball_throw', { length: 50 }),
  lowerBackStrength: varchar('lower_back_strength', { length: 50 }),
  shoulderDynamometerLeft: varchar('shoulder_dynamometer_left', { length: 50 }),
  shoulderDynamometerRight: varchar('shoulder_dynamometer_right', { length: 50 }),
  handGripDynamometerLeft: varchar('hand_grip_dynamometer_left', { length: 50 }),
  handGripDynamometerRight: varchar('hand_grip_dynamometer_right', { length: 50 }),
  // Overall Assessment
  overallAssessment: varchar('overall_assessment', { length: 100 }),
  // Menstrual & Medical History (Female only)
  menstrualFrequency: varchar('menstrual_frequency', { length: 20 }),
  menstrualDays: integer('menstrual_days'),
  lastMenstrualDate: timestamp('last_menstrual_date'),
  menstrualAids: text('menstrual_aids'), // JSON array stored as text
  sexuallyActive: varchar('sexually_active', { length: 10 }),
  maritalStatus: varchar('marital_status', { length: 20 }),
  pregnancyHistory: text('pregnancy_history'),
  contraceptiveHistory: text('contraceptive_history'),
  surgeryHistory: text('surgery_history'),
  medicalCondition: text('medical_condition'),
  hemoglobinLevel: decimal('hemoglobin_level', { precision: 4, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Medical Records table
export const medicalRecords = pgTable('medical_records', {
  id: serial('id').primaryKey(),
  // Foreign key to cadets table
  cadetId: integer('cadet_id').references(() => cadets.id).notNull(),
  // Medical details (removed redundant cadet info fields)
  dateOfReporting: timestamp('date_of_reporting').notNull(),
  medicalProblem: text('medical_problem').notNull(),
  diagnosis: text('diagnosis'),
  medicalStatus: varchar('medical_status', { length: 20 }).default('Active').notNull(),
  attendC: integer('attend_c').default(0).notNull(),
  miDetained: integer('mi_detained').default(0).notNull(),
  exPpg: integer('ex_ppg').default(0).notNull(),
  attendB: integer('attend_b').default(0).notNull(),
  physiotherapy: integer('physiotherapy').default(0).notNull(),
  totalTrainingDaysMissed: integer('total_training_days_missed').default(0).notNull(),
  monitoringCase: boolean('monitoring_case').default(false).notNull(),
  contactNo: varchar('contact_no', { length: 20 }),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Types for TypeScript
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Cadet = typeof cadets.$inferSelect
export type NewCadet = typeof cadets.$inferInsert

export type MedicalRecord = typeof medicalRecords.$inferSelect
export type NewMedicalRecord = typeof medicalRecords.$inferInsert

