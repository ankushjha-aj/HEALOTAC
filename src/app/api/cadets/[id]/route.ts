import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cadets, medicalRecords } from '@/lib/schema'
import { eq } from 'drizzle-orm'

// GET /api/cadets/[id] - Get single cadet
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cadetId = parseInt(params.id)

    const [cadet] = await db
      .select()
      .from(cadets)
      .where(eq(cadets.id, cadetId))
      .limit(1)

    if (!cadet) {
      return NextResponse.json(
        { error: 'Cadet not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(cadet)
  } catch (error) {
    console.error('❌ Error fetching cadet:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cadet' },
      { status: 500 }
    )
  }
}

// PUT /api/cadets/[id] - Update cadet
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, battalion, company, joinDate, status, academyNumber, height, weight, age, course, sex } = await request.json()

    const [updatedCadet] = await db
      .update(cadets)
      .set({
        name,
        battalion,
        company,
        joinDate: joinDate ? new Date(joinDate) : undefined,
        status,
        academyNumber: academyNumber ? parseInt(academyNumber) : undefined,
        height: typeof height === 'number' ? height : height ? parseInt(height) : undefined,
        weight: typeof weight === 'number' ? weight : weight ? parseInt(weight) : undefined,
        age: typeof age === 'number' ? age : age ? parseInt(age) : undefined,
        course,
        sex,
        updatedAt: new Date(),
      })
      .where(eq(cadets.id, parseInt(params.id)))
      .returning()

    if (!updatedCadet) {
      return NextResponse.json(
        { error: 'Cadet not found' },
        { status: 404 }
      )
    }

    console.log('🔄 UPDATED CADET:', updatedCadet)
    return NextResponse.json(updatedCadet)
  } catch (error) {
    console.error('❌ Error updating cadet:', error)
    return NextResponse.json(
      { error: 'Failed to update cadet' },
      { status: 500 }
    )
  }
}

// PATCH /api/cadets/[id] - Partial update cadet (for weight updates)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()
    const updateData: any = {}

    // Only allow updating weight for now
    if ('weight' in updates) {
      updateData.weight = typeof updates.weight === 'number' ? updates.weight : updates.weight ? parseInt(updates.weight) : undefined
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    updateData.updatedAt = new Date()

    const [updatedCadet] = await db
      .update(cadets)
      .set(updateData)
      .where(eq(cadets.id, parseInt(params.id)))
      .returning()

    if (!updatedCadet) {
      return NextResponse.json(
        { error: 'Cadet not found' },
        { status: 404 }
      )
    }

    console.log('🔄 PARTIALLY UPDATED CADET:', updatedCadet)
    return NextResponse.json(updatedCadet)
  } catch (error) {
    console.error('❌ Error partially updating cadet:', error)
    return NextResponse.json(
      { error: 'Failed to update cadet' },
      { status: 500 }
    )
  }
}

// DELETE /api/cadets/[id] - Delete cadet and associated medical records
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cadetId = parseInt(params.id)

    // First, delete all medical records associated with this cadet
    await db.delete(medicalRecords).where(eq(medicalRecords.cadetId, cadetId))

    console.log('🗑️ DELETED MEDICAL RECORDS for cadet ID:', cadetId)

    // Then delete the cadet
    const [deletedCadet] = await db
      .delete(cadets)
      .where(eq(cadets.id, cadetId))
      .returning()

    if (!deletedCadet) {
      return NextResponse.json(
        { error: 'Cadet not found' },
        { status: 404 }
      )
    }

    console.log('🗑️ DELETED CADET:', deletedCadet)
    return NextResponse.json({
      message: 'Cadet and associated medical records deleted successfully',
      deletedCadet: deletedCadet
    })
  } catch (error) {
    console.error('❌ Error deleting cadet:', error)
    return NextResponse.json(
      { error: 'Failed to delete cadet' },
      { status: 500 }
    )
  }
}
