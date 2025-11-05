import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cadets, medicalRecords } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { createAuthMiddleware } from '@/lib/auth'

// GET /api/cadets/[id] - Get single cadet
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check authentication
  const authError = createAuthMiddleware(['admin', 'user'])(request)
  if (authError) return authError

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

    // Parse menstrualAids from JSON string to array/string if it exists
    let parsedMenstrualAids = null
    if (cadet.menstrualAids) {
      try {
        parsedMenstrualAids = JSON.parse(cadet.menstrualAids)
      } catch (parseError) {
        // If JSON parsing fails, treat it as a plain string
        console.warn('⚠️ Failed to parse menstrualAids JSON for cadet', cadet.id, ':', parseError, '- treating as plain string')
        parsedMenstrualAids = cadet.menstrualAids
      }
    }

    const processedCadet = {
      ...cadet,
      menstrualAids: parsedMenstrualAids
    }

    return NextResponse.json(processedCadet)
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
    const { name, battalion, company, joinDate, academyNumber, height, weight, age, course, sex, relegated } = await request.json()

    const [updatedCadet] = await db
      .update(cadets)
      .set({
        name,
        battalion,
        company,
        joinDate: joinDate ? new Date(joinDate) : undefined,
        academyNumber: academyNumber ? parseInt(academyNumber) : undefined,
        height: typeof height === 'number' ? height : height ? parseInt(height) : undefined,
        weight: typeof weight === 'number' ? weight : weight ? parseInt(weight) : undefined,
        age: typeof age === 'number' ? age : age ? parseInt(age) : undefined,
        course,
        sex,
        relegated,
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

// PATCH /api/cadets/[id] - Partial update cadet (for weight and menstrual data updates)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()
    const updateData: any = {}

    // Handle weight updates
    if ('weight' in updates) {
      updateData.weight = typeof updates.weight === 'number' ? updates.weight : updates.weight ? parseInt(updates.weight) : undefined
    }

    // Handle menstrual health data updates
    if ('menstrualFrequency' in updates) {
      updateData.menstrualFrequency = updates.menstrualFrequency || null
    }
    if ('menstrualDays' in updates) {
      updateData.menstrualDays = updates.menstrualDays ? parseInt(updates.menstrualDays) : null
    }
    if ('lastMenstrualDate' in updates) {
      updateData.lastMenstrualDate = updates.lastMenstrualDate ? new Date(updates.lastMenstrualDate) : null
    }
    if ('menstrualAids' in updates) {
      updateData.menstrualAids = updates.menstrualAids && updates.menstrualAids.length > 0 ? JSON.stringify(updates.menstrualAids) : null
    }
    if ('sexuallyActive' in updates) {
      updateData.sexuallyActive = updates.sexuallyActive || null
    }
    if ('maritalStatus' in updates) {
      updateData.maritalStatus = updates.maritalStatus || null
    }
    if ('pregnancyHistory' in updates) {
      updateData.pregnancyHistory = updates.pregnancyHistory || null
    }
    if ('contraceptiveHistory' in updates) {
      updateData.contraceptiveHistory = updates.contraceptiveHistory || null
    }
    if ('surgeryHistory' in updates) {
      updateData.surgeryHistory = updates.surgeryHistory || null
    }
    if ('medicalCondition' in updates) {
      updateData.medicalCondition = updates.medicalCondition || null
    }
    if ('hemoglobinLevel' in updates) {
      updateData.hemoglobinLevel = updates.hemoglobinLevel ? parseFloat(updates.hemoglobinLevel) : null
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

    // Parse menstrualAids from JSON string to array/string if it exists
    let parsedMenstrualAids = null
    if (updatedCadet.menstrualAids) {
      try {
        parsedMenstrualAids = JSON.parse(updatedCadet.menstrualAids)
      } catch (parseError) {
        // If JSON parsing fails, treat it as a plain string
        console.warn('⚠️ Failed to parse menstrualAids JSON for updated cadet:', parseError, '- treating as plain string')
        parsedMenstrualAids = updatedCadet.menstrualAids
      }
    }

    const processedCadet = {
      ...updatedCadet,
      menstrualAids: parsedMenstrualAids
    }

    console.log('🔄 PARTIALLY UPDATED CADET:', processedCadet)
    return NextResponse.json(processedCadet)
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
