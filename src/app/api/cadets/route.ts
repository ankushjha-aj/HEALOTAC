import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cadets } from '@/lib/schema'
import { createAuthMiddleware } from '@/lib/auth'

// GET /api/cadets - Get all cadets
export async function GET(request: NextRequest) {
  // Check authentication
  const authError = createAuthMiddleware(['admin', 'user'])(request)
  if (authError) return authError

  try {
    const allCadets = await db.select().from(cadets).orderBy(cadets.createdAt)
    console.log('📊 FETCHED CADETS:', allCadets.length, 'records')
    return NextResponse.json(allCadets)
  } catch (error) {
    console.error('❌ Error fetching cadets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cadets' },
      { status: 500 }
    )
  }
}

// POST /api/cadets - Create new cadet
export async function POST(request: NextRequest) {
  // Check authentication - only admin can create cadets
  const authError = createAuthMiddleware(['admin'])(request)
  if (authError) return authError

  try {
    const { name, battalion, company, joinDate, status, healthStatus, height, weight, age, course, sex } = await request.json()

    // Validate required fields
    if (!name || !battalion || !company || !joinDate) {
      return NextResponse.json(
        { error: 'Name, battalion, company, and join date are required' },
        { status: 400 }
      )
    }

    const [newCadet] = await db.insert(cadets).values({
      name,
      battalion,
      company,
      joinDate: new Date(joinDate),
      status: status || 'Active',
      healthStatus: healthStatus || 'Fit',
      height: typeof height === 'number' ? height : height ? parseInt(height) : null,
      weight: typeof weight === 'number' ? weight : weight ? parseInt(weight) : null,
      age: typeof age === 'number' ? age : age ? parseInt(age) : null,
      course: course || null,
      sex: sex || null,
    }).returning()

    console.log('✅ CREATED CADET:', newCadet)
    return NextResponse.json(newCadet, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating cadet:', error)
    return NextResponse.json(
      { error: 'Failed to create cadet' },
      { status: 500 }
    )
  }
}
