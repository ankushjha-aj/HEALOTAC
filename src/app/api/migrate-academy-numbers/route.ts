import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cadets } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting Academy Number Migration...')

    // Get all cadets without academy numbers
    const cadetsWithoutNumbers = await db
      .select()
      .from(cadets)
      .where(eq(cadets.academyNumber, null))

    console.log(`📊 Found ${cadetsWithoutNumbers.length} cadets without academy numbers`)

    if (cadetsWithoutNumbers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All cadets already have academy numbers!',
        updated: 0
      })
    }

    // Generate academy numbers starting from 10000 (to make them look official)
    const baseNumber = 10000
    const updatedCadets = []

    for (let i = 0; i < cadetsWithoutNumbers.length; i++) {
      const cadet = cadetsWithoutNumbers[i]
      const academyNumber = baseNumber + cadet.id

      await db
        .update(cadets)
        .set({ academyNumber })
        .where(eq(cadets.id, cadet.id))

      updatedCadets.push({
        id: cadet.id,
        name: cadet.name,
        academyNumber
      })
    }

    console.log('🎉 Academy Number Migration Complete!')

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${cadetsWithoutNumbers.length} cadets with academy numbers`,
      updated: cadetsWithoutNumbers.length,
      cadets: updatedCadets
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Migration failed'
      },
      { status: 500 }
    )
  }
}
