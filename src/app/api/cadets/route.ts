import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cadets } from '@/lib/schema'
import { desc } from 'drizzle-orm'
import { createAuthMiddleware } from '@/lib/auth'

// GET /api/cadets - Get all cadets
export async function GET(request: NextRequest) {
  // Check authentication
  const authError = createAuthMiddleware(['admin', 'user'])(request)
  if (authError) return authError

  try {
    const allCadets = await db.select().from(cadets).orderBy(desc(cadets.createdAt))
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
  // Check authentication - allow both admin and user to create cadets
  const authError = createAuthMiddleware(['admin', 'user'])(request)
  if (authError) return authError

  try {
    const {
      name, battalion, company, joinDate, academyNumber, height, initialWeight, weight, age, course, sex, nokContact, relegated,
      // Health Parameters
      bloodGroup, bmi, bodyFat, calcanealBoneDensity, bp, pulse, so2, bcaFat, ecg, temp, smmKg,
      // Vaccination Status
      covidDose1, covidDose2, covidDose3, hepatitisBDose1, hepatitisBDose2, tetanusToxoid,
      chickenPoxDose1, chickenPoxDose2, chickenPoxSuffered, yellowFever, pastMedicalHistory,
      // Tests
      // Tests
      enduranceTest, agilityTest, speedTest,
      // Physical Test
      ppt, ipet, bpet, swm,
      // Strength Tests
      verticalJump, ballThrow, lowerBackStrength, shoulderDynamometerLeft, shoulderDynamometerRight,
      handGripDynamometerLeft, handGripDynamometerRight,
      // Overall Assessment
      overallAssessment,
      // Menstrual & Medical History (Female only)
      menstrualFrequency, menstrualDays, lastMenstrualDate, menstrualAids,
      sexuallyActive, maritalStatus, pregnancyHistory, contraceptiveHistory,
      surgeryHistory, medicalCondition, hemoglobinLevel,
      isForeign, country
    } = await request.json()

    console.log('📥 RECEIVED CADET DATA:', {
      name, battalion, company, joinDate, sex, menstrualFrequency, menstrualDays, menstrualAids, isForeign, country
    })

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
      academyNumber: academyNumber ? academyNumber.toString() : null,
      height: height ? height.toString() : null,
      initialWeight: initialWeight ? initialWeight.toString() : null,
      weight: weight ? weight.toString() : null,
      age: age ? age.toString() : null,
      course: course ? course.toString() : null,
      sex: sex || null,
      isForeign: !!isForeign,
      country: country || null,
      nokContact: nokContact ? nokContact.toString() : null,
      relegated: relegated || 'N',
      // Health Parameters
      bloodGroup: bloodGroup || null,
      bmi: bmi ? bmi.toString() : null,
      bodyFat: bodyFat ? bodyFat.toString() : null,
      calcanealBoneDensity: calcanealBoneDensity ? calcanealBoneDensity.toString() : null,
      bp: bp ? bp.toString() : null,
      pulse: pulse ? pulse.toString() : null,
      so2: so2 ? so2.toString() : null,
      bcaFat: bcaFat ? bcaFat.toString() : null,
      ecg: ecg ? ecg.toString() : null,
      temp: temp ? temp.toString() : null,
      smmKg: smmKg ? smmKg.toString() : null,
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
      enduranceTest: enduranceTest ? enduranceTest.toString() : null,
      agilityTest: agilityTest ? agilityTest.toString() : null,
      speedTest: speedTest ? speedTest.toString() : null,
      // Physical Test
      ppt: ppt || null,
      ipet: ipet || null,
      bpet: bpet || null,
      swm: swm || null,
      // Strength Tests
      verticalJump: verticalJump ? verticalJump.toString() : null,
      ballThrow: ballThrow ? ballThrow.toString() : null,
      lowerBackStrength: lowerBackStrength ? lowerBackStrength.toString() : null,
      shoulderDynamometerLeft: shoulderDynamometerLeft ? shoulderDynamometerLeft.toString() : null,
      shoulderDynamometerRight: shoulderDynamometerRight ? shoulderDynamometerRight.toString() : null,
      handGripDynamometerLeft: handGripDynamometerLeft ? handGripDynamometerLeft.toString() : null,
      handGripDynamometerRight: handGripDynamometerRight ? handGripDynamometerRight.toString() : null,
      // Overall Assessment
      overallAssessment: overallAssessment ? overallAssessment.toString() : null,
      // Menstrual & Medical History (Female only)
      menstrualFrequency: menstrualFrequency ? menstrualFrequency.toString() : null,
      menstrualDays: menstrualDays ? menstrualDays.toString() : null,
      lastMenstrualDate: lastMenstrualDate ? lastMenstrualDate : null,
      menstrualAids: menstrualAids && menstrualAids.length > 0 ? JSON.stringify(menstrualAids) : null,
      sexuallyActive: sexuallyActive ? sexuallyActive.toString() : null,
      maritalStatus: maritalStatus ? maritalStatus.toString() : null,
      pregnancyHistory: pregnancyHistory || null,
      contraceptiveHistory: contraceptiveHistory || null,
      surgeryHistory: surgeryHistory || null,
      medicalCondition: medicalCondition || null,
      hemoglobinLevel: hemoglobinLevel ? hemoglobinLevel.toString() : null,
    }).returning()

    console.log('✅ CREATED CADET:', newCadet)
    // Parse menstrualAids from JSON string to array if it exists
    let parsedMenstrualAids = null
    try {
      parsedMenstrualAids = newCadet.menstrualAids ? JSON.parse(newCadet.menstrualAids) : null
    } catch (parseError) {
      console.warn('⚠️ Failed to parse menstrualAids JSON:', parseError)
      parsedMenstrualAids = null
    }

    const processedCadet = {
      ...newCadet,
      menstrualAids: parsedMenstrualAids
    }
    return NextResponse.json(processedCadet, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating cadet:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      constraint: (error as any)?.constraint,
      detail: (error as any)?.detail
    })
    return NextResponse.json(
      { error: 'Failed to create cadet', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
