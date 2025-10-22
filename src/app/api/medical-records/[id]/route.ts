import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { medicalRecords } from '@/lib/schema'
import { eq } from 'drizzle-orm'

// GET /api/medical-records/[id] - Get single medical record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [record] = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.id, parseInt(params.id)))
      .limit(1)

    if (!record) {
      return NextResponse.json(
        { error: 'Medical record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error('❌ Error fetching medical record:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medical record' },
      { status: 500 }
    )
  }
}

// PUT /api/medical-records/[id] - Update medical record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const [updatedRecord] = await db
      .update(medicalRecords)
      .set({
        cadetId: cadetId ? parseInt(cadetId) : undefined,
        dateOfReporting: dateOfReporting ? new Date(dateOfReporting) : undefined,
        medicalProblem,
        diagnosis,
        status,
        attendC: attendC !== undefined ? parseInt(attendC) : undefined,
        miDetained: miDetained !== undefined ? parseInt(miDetained) : undefined,
        totalTrainingDaysMissed: totalTrainingDaysMissed !== undefined ? parseInt(totalTrainingDaysMissed) : undefined,
        monitoringCase,
        contactNo,
        remarks,
        updatedAt: new Date(),
      })
      .where(eq(medicalRecords.id, parseInt(params.id)))
      .returning()

    if (!updatedRecord) {
      return NextResponse.json(
        { error: 'Medical record not found' },
        { status: 404 }
      )
    }

    console.log('🔄 UPDATED MEDICAL RECORD:', updatedRecord)
    return NextResponse.json(updatedRecord)
  } catch (error) {
    console.error('❌ Error updating medical record:', error)
    return NextResponse.json(
      { error: 'Failed to update medical record' },
      { status: 500 }
    )
  }
}

// DELETE /api/medical-records/[id] - Delete medical record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [deletedRecord] = await db
      .delete(medicalRecords)
      .where(eq(medicalRecords.id, parseInt(params.id)))
      .returning()

    if (!deletedRecord) {
      return NextResponse.json(
        { error: 'Medical record not found' },
        { status: 404 }
      )
    }

    console.log('🗑️ DELETED MEDICAL RECORD:', deletedRecord)
    return NextResponse.json({ message: 'Medical record deleted successfully' })
  } catch (error) {
    console.error('❌ Error deleting medical record:', error)
    return NextResponse.json(
      { error: 'Failed to delete medical record' },
      { status: 500 }
    )
  }
}
