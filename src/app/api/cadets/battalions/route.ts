import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cadets } from '@/lib/schema'

// GET /api/cadets/battalions - Get all unique battalions from database
export async function GET() {
  try {
    // Query database for all cadets and extract unique battalions
    const allCadets = await db.select().from(cadets)

    console.log('🔍 RAW CADETS DATA:', allCadets.length, 'total cadets')

    // Extract unique battalions using Set and sort them
    const battalions = [...new Set(allCadets.map(c => c.battalion))].sort()

    console.log('🛡️ FETCHED BATTALIONS FROM DATABASE:', {
      count: battalions.length,
      battalions: battalions,
      includes15th: battalions.includes('15th Battalion')
    })

    return NextResponse.json({ battalions })
  } catch (error) {
    console.error('❌ Error fetching battalions from database:', error)

    // Return empty array - no fallback data
    return NextResponse.json(
      { battalions: [], error: 'Failed to fetch battalions from database' },
      { status: 500 }
    )
  }
}
