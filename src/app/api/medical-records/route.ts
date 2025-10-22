import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { medicalRecords, cadets } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { createAuthMiddleware } from '@/lib/auth'

// GET /api/medical-records - Get all medical records with cadet info
export async function GET(request: NextRequest) {
  // Check authentication
  const authError = createAuthMiddleware(['admin', 'user'])(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let query = db
      .select({
        id: medicalRecords.id,
        cadetId: medicalRecords.cadetId,
        // Cadet information via join
        name: cadets.name,
        company: cadets.company,
        battalion: cadets.battalion,
        // Medical record details
        dateOfReporting: medicalRecords.dateOfReporting,
        medicalProblem: medicalRecords.medicalProblem,
        diagnosis: medicalRecords.diagnosis,
        status: medicalRecords.status,
        attendC: medicalRecords.attendC,
        miDetained: medicalRecords.miDetained,
        totalTrainingDaysMissed: medicalRecords.totalTrainingDaysMissed,
        monitoringCase: medicalRecords.monitoringCase,
        contactNo: medicalRecords.contactNo,
        remarks: medicalRecords.remarks,
        createdAt: medicalRecords.createdAt,
        updatedAt: medicalRecords.updatedAt, // Add updatedAt field
      })
      .from(medicalRecords)
      .innerJoin(cadets, eq(medicalRecords.cadetId, cadets.id))
      .orderBy(medicalRecords.createdAt)

    // If search parameter is provided, filter results
    if (search) {
      // For now, we'll return all records and let the frontend filter
      // In a production app, you'd implement proper database-level search
      console.log('🔍 SEARCH QUERY:', search)
    }

    const allRecords = await query

    console.log('📊 FETCHED MEDICAL RECORDS:', allRecords.length, 'records')
    return NextResponse.json(allRecords)
  } catch (error) {
    console.error('❌ Error fetching medical records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medical records' },
      { status: 500 }
    )
  }
}

// POST /api/medical-records - Create new medical record
export async function POST(request: NextRequest) {
  // Check authentication - users can create records
  const authError = createAuthMiddleware(['admin', 'user'])(request)
  if (authError) return authError

  try {
    const {
      cadetId,
      dateOfReporting,
      medicalProblem,
      diagnosis,
      status,
      attendC,
      miDetained,
      totalTrainingDaysMissed,
      monitoringCase,
      contactNo,
      remarks
    } = await request.json()

    // Validate required fields
    if (!cadetId || !dateOfReporting || !medicalProblem) {
      return NextResponse.json(
        { error: 'Cadet ID, date of reporting, and medical problem are required' },
        { status: 400 }
      )
    }

    // Verify cadet exists
    const cadetExists = await db.select().from(cadets).where(eq(cadets.id, parseInt(cadetId))).limit(1)
    if (cadetExists.length === 0) {
      return NextResponse.json(
        { error: 'Selected cadet does not exist' },
        { status: 400 }
      )
    }

    // Derive total days missed from Attend C and MI Detained
    const attendCInt = attendC ? parseInt(attendC) : 0
    const miDetainedInt = miDetained ? parseInt(miDetained) : 0
    const totalDaysMissed = totalTrainingDaysMissed ? parseInt(totalTrainingDaysMissed) : (attendCInt + miDetainedInt)

    const [newRecord] = await db.insert(medicalRecords).values({
      cadetId: parseInt(cadetId),
      dateOfReporting: new Date(dateOfReporting),
      medicalProblem,
      diagnosis,
      status: status || 'Active',
      attendC: attendCInt,
      miDetained: miDetainedInt,
      totalTrainingDaysMissed: totalDaysMissed,
      monitoringCase: !!(monitoringCase === true || monitoringCase === 'Yes' || monitoringCase === 'yes' || monitoringCase === 'true'),
      contactNo,
      remarks,
    }).returning()

    console.log('✅ CREATED MEDICAL RECORD:', newRecord)
    return NextResponse.json(newRecord, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating medical record:', error)
    return NextResponse.json(
      { error: 'Failed to create medical record' },
      { status: 500 }
    )
  }
}
