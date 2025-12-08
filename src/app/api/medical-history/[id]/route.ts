import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cadets, medicalRecords } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import { createAuthMiddleware } from '@/lib/auth'

// GET /api/medical-history/[id] - Get medical history for a cadet
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check authentication
  const authError = createAuthMiddleware(['admin', 'user'])(request)
  if (authError) return authError

  try {
    const cadetId = parseInt(params.id)

    console.log(`🔍 FETCHING MEDICAL HISTORY FOR CADET ID: ${cadetId} (type: ${typeof cadetId})`)

    if (isNaN(cadetId)) {
      return NextResponse.json(
        { error: 'Invalid cadet ID' },
        { status: 400 }
      )
    }

    // Fetch cadet information
    const cadetResult = await db.select().from(cadets).where(eq(cadets.id, cadetId)).limit(1)

    if (cadetResult.length === 0) {
      return NextResponse.json(
        { error: 'Cadet not found' },
        { status: 404 }
      )
    }

    const cadetInfo = {
      ...cadetResult[0],
      joinDate: cadetResult[0].joinDate.toISOString(),
      createdAt: cadetResult[0].createdAt.toISOString()
    }

    console.log('✅ CADET FOUND:', cadetInfo.name)

    // First, let's try a simple query to see if any records exist
    const allRecords = await db.select().from(medicalRecords)
    console.log(`📊 TOTAL MEDICAL RECORDS IN DB: ${allRecords.length}`)
    console.log('📋 ALL RECORDS:', allRecords.map(r => ({ id: r.id, cadetId: r.cadetId, medicalProblem: r.medicalProblem })))

    // Now query for this specific cadet - try multiple approaches
    console.log(`🔍 SEARCHING FOR RECORDS WITH cadetId = ${cadetId} (type: ${typeof cadetId})`)

    // AUTOMATIC COMPLETION LOGIC START
    // Fetch all active records for this cadet first
    const activeRecords = await db.select()
      .from(medicalRecords)
      .where(
        sql`${medicalRecords.cadetId} = ${cadetId} AND ${medicalRecords.medicalStatus} = 'Active'`
      );

    const now = new Date();
    // Normalize "now" to midnight for consistent day comparison if needed, 
    // but the user example suggests simple date comparison.
    // Let's stick to the current timestamp for strict expiry or normalized dates?
    // User said: "today is ninth... give credit attendance of three days... at or on 12 it should get to complete"
    // 9 + 3 = 12. So if Today >= 12th, it is complete.

    for (const record of activeRecords) {
      // Calculate total duration in days from relevant fields
      const attendC = record.attendC || 0;
      const miDetained = record.miDetained || 0;
      // Note: User explicitly mentioned "do it only for the attend C and MI detailed one" and "skip the monitoring spot right now"
      const totalDurationDays = attendC + miDetained;

      if (totalDurationDays > 0) {
        const reportDate = new Date(record.dateOfReporting);

        // Calculate completion date
        // Logic: Report Date + Duration = Completion Date
        // Example: Report 9th, Duration 3 days (9, 10, 11). Becomes free on 12th.
        const completionDate = new Date(reportDate);
        completionDate.setDate(completionDate.getDate() + totalDurationDays);

        // Check if current date is past or equal to completion date
        if (now >= completionDate) {
          console.log(`🔄 AUTO-COMPLETING Record ${record.id}: Duration ${totalDurationDays} days ended on ${completionDate.toISOString()}`);

          await db.update(medicalRecords)
            .set({
              medicalStatus: 'Completed',
              updatedAt: new Date()
            })
            .where(eq(medicalRecords.id, record.id));
        }
      }
    }
    // AUTOMATIC COMPLETION LOGIC END

    // Try a simple where query to fetch (potentially updated) records
    const medicalRecordsResult = await db.select().from(medicalRecords).where(eq(medicalRecords.cadetId, cadetId))

    console.log(`📊 QUERY RESULT: ${medicalRecordsResult.length} records`)

    console.log(`📊 FINAL RESULT: ${medicalRecordsResult.length} MEDICAL RECORDS FOR CADET ${cadetId}`)
    console.log('📋 RECORDS DETAILS:', medicalRecordsResult.map(r => ({ id: r.id, cadetId: r.cadetId, medicalProblem: r.medicalProblem })))

    return NextResponse.json({
      cadet: cadetInfo,
      records: medicalRecordsResult.map(record => ({
        ...record,
        dateOfReporting: record.dateOfReporting.toISOString(),
        createdAt: record.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('❌ Error fetching medical history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medical history' },
      { status: 500 }
    )
  }
}

// PATCH /api/medical-history/[id] - Update a specific medical record
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check authentication
  const authError = createAuthMiddleware(['admin', 'user'])(request)
  if (authError) return authError

  try {
    const recordId = parseInt(params.id)

    if (isNaN(recordId)) {
      return NextResponse.json(
        { error: 'Invalid record ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { totalTrainingDaysMissed: additionalDays } = body

    // Get current record
    const currentRecord = await db.select().from(medicalRecords).where(eq(medicalRecords.id, recordId)).limit(1)

    if (currentRecord.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    const currentDays = currentRecord[0].totalTrainingDaysMissed || 0
    const newTotal = currentDays + additionalDays

    // Update the record
    await db.update(medicalRecords)
      .set({ totalTrainingDaysMissed: newTotal, medicalStatus: 'Completed' })
      .where(eq(medicalRecords.id, recordId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error updating medical record:', error)
    return NextResponse.json(
      { error: 'Failed to update medical record' },
      { status: 500 }
    )
  }
}
