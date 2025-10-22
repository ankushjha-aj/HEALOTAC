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

    // Fetch medical records for this cadet
    const medicalRecordsResult = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.cadetId, cadetId))
      .orderBy(medicalRecords.dateOfReporting)

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
