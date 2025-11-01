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
    const {
      name, battalion, company, joinDate, academyNumber, height, weight, age, course, sex, relegated,
      // Health Parameters
      bloodGroup, bmi, bodyFat, calcanealBoneDensity, bp, pulse, so2, bcaFat, ecg, temp, smmKg,
      // Vaccination Status
      covidDose1, covidDose2, covidDose3, hepatitisBDose1, hepatitisBDose2, tetanusToxoid,
      chickenPoxDose1, chickenPoxDose2, chickenPoxSuffered, yellowFever, pastMedicalHistory,
      // Tests
      enduranceTest, agilityTest, speedTest,
      // Strength Tests
      verticalJump, ballThrow, lowerBackStrength, shoulderDynamometerLeft, shoulderDynamometerRight,
      handGripDynamometerLeft, handGripDynamometerRight,
      // Overall Assessment
      overallAssessment
    } = await request.json()

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
      academyNumber: academyNumber ? parseInt(academyNumber) : null,
      height: typeof height === 'number' ? height : height ? parseInt(height) : null,
      weight: typeof weight === 'number' ? weight : weight ? parseInt(weight) : null,
      age: typeof age === 'number' ? age : age ? parseInt(age) : null,
      course: course ? course.toString() : null,
      sex: sex || null,
      relegated: relegated || 'N',
      // Health Parameters
      bloodGroup: bloodGroup || null,
      bmi: bmi || null,
      bodyFat: bodyFat || null,
      calcanealBoneDensity: calcanealBoneDensity || null,
      bp: bp || null,
      pulse: pulse || null,
      so2: so2 || null,
      bcaFat: bcaFat || null,
      ecg: ecg || null,
      temp: temp || null,
      smmKg: smmKg || null,
      // Vaccination Status
      covidDose1: covidDose1 !== undefined ? covidDose1 : false,
      covidDose2: covidDose2 !== undefined ? covidDose2 : false,
      covidDose3: covidDose3 !== undefined ? covidDose3 : false,
      hepatitisBDose1: hepatitisBDose1 !== undefined ? hepatitisBDose1 : false,
      hepatitisBDose2: hepatitisBDose2 !== undefined ? hepatitisBDose2 : false,
      tetanusToxoid: tetanusToxoid !== undefined ? tetanusToxoid : false,
      chickenPoxDose1: chickenPoxDose1 !== undefined ? chickenPoxDose1 : false,
      chickenPoxDose2: chickenPoxDose2 !== undefined ? chickenPoxDose2 : false,
      chickenPoxSuffered: chickenPoxSuffered !== undefined ? chickenPoxSuffered : false,
      yellowFever: yellowFever !== undefined ? yellowFever : false,
      pastMedicalHistory: pastMedicalHistory || null,
      // Tests
      enduranceTest: enduranceTest || null,
      agilityTest: agilityTest || null,
      speedTest: speedTest || null,
      // Strength Tests
      verticalJump: verticalJump || null,
      ballThrow: ballThrow || null,
      lowerBackStrength: lowerBackStrength || null,
      shoulderDynamometerLeft: shoulderDynamometerLeft || null,
      shoulderDynamometerRight: shoulderDynamometerRight || null,
      handGripDynamometerLeft: handGripDynamometerLeft || null,
      handGripDynamometerRight: handGripDynamometerRight || null,
      // Overall Assessment
      overallAssessment: overallAssessment || null,
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
