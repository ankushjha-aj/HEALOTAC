import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cadets, medicalRecords } from '@/lib/schema'
import { eq } from 'drizzle-orm'

// GET /api/medical-history/[id] - Get medical history for a cadet
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Try a simple where query
    const simpleQuery = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.cadetId, cadetId))

    console.log(`📊 SIMPLE QUERY RESULT: ${simpleQuery.length} records`)

    // Try with explicit type conversion
    const typeQuery = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.cadetId, parseInt(cadetId.toString())))

    console.log(`📊 TYPE CONVERSION QUERY RESULT: ${typeQuery.length} records`)

    // Use the simple query result
    const medicalRecordsResult = simpleQuery

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
