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

