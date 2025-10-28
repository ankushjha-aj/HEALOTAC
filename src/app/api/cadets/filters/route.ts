import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cadets } from '@/lib/schema'

// GET /api/cadets/filters - Get unique filter options from database only
export async function GET() {
  try {
    // Query database for all cadets to extract unique filter values
    const allCadets = await db.select().from(cadets)

    // Extract unique values from actual database records
    const battalions = [...new Set(allCadets.map(c => c.battalion))].sort()
    const companies = [...new Set(allCadets.map(c => c.company))].sort()

    // Group companies by battalion based on actual data
    const companiesByBattalion = allCadets.reduce((acc, cadet) => {
      if (!acc[cadet.battalion]) {
        acc[cadet.battalion] = []
      }
      if (!acc[cadet.battalion].includes(cadet.company)) {
        acc[cadet.battalion].push(cadet.company)
      }
      return acc
    }, {} as Record<string, string[]>)

    // Sort companies within each battalion
    Object.keys(companiesByBattalion).forEach(battalion => {
      companiesByBattalion[battalion].sort()
    })

    const filters = {
      battalions,
      companies,
      companiesByBattalion
    }

    console.log('📊 FETCHED FILTERS FROM DATABASE:', {
      battalions: filters.battalions.length,
      companies: filters.companies.length,
      battalionsList: filters.battalions,
      totalCadets: allCadets.length
    })

    return NextResponse.json(filters)
  } catch (error) {
    console.error('❌ Error fetching filters from database:', error)

    // Return empty arrays instead of fallback data - this ensures filters are database-driven only
    const emptyFilters = {
      battalions: [],
      companies: [],
      companiesByBattalion: {}
    }

    console.log('📊 RETURNING EMPTY FILTERS (database error or no data)')

    return NextResponse.json(emptyFilters)
  }
}
