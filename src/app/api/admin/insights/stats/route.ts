import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { createAuthMiddleware } from '@/lib/auth'

export async function GET(request: NextRequest) {
    // Auth check
    const authResponse = createAuthMiddleware(['super_admin'])(request)
    if (authResponse) return authResponse

    try {
        const db = getDb()

        // 1. Company Stats: Distribution + Health Status
        // We need Total vs Active Sick for each company
        // This requires a JOIN or subqueries
        const companyHealthQuery = sql`
      SELECT 
        c.company,
        COUNT(c.id) as total_cadets,
        COUNT(mr.id) as active_sick
      FROM cadets c
      LEFT JOIN medical_records mr ON c.id = mr.cadet_id AND mr.medical_status = 'Active'
      WHERE c.company IS NOT NULL
      GROUP BY c.company
      ORDER BY total_cadets DESC
    `
        const companyHealthResult = await db.execute(companyHealthQuery)

        // 2. BMI Stats: High vs Normal
        const bmiQuery = sql`
        SELECT 
            CASE 
                WHEN (regexp_replace(bmi, '[^0-9.]', '', 'g'))::numeric > 25 THEN 'Overweight'
                WHEN (regexp_replace(bmi, '[^0-9.]', '', 'g'))::numeric < 18.5 THEN 'Underweight'
                ELSE 'Normal'
            END as category,
            COUNT(*) as count
        FROM cadets 
        WHERE bmi IS NOT NULL AND bmi != ''
        GROUP BY 1
    `
        const bmiResult = await db.execute(bmiQuery)

        // 2b. High Risk List (Detailed)
        // Fetch individual cadets who are overweight
        const highRiskListQuery = sql`
        SELECT 
            id, name, company, academy_number, bmi
        FROM cadets 
        WHERE (regexp_replace(bmi, '[^0-9.]', '', 'g'))::numeric > 25
        LIMIT 50
    `
        const highRiskListResult = await db.execute(highRiskListQuery)

        // 3. Reporting Stats: Daily Active Count
        const activeCasesQuery = sql`
        SELECT COUNT(*) as count 
        FROM medical_records 
        WHERE medical_status = 'Active'
    `
        const activeResult = await db.execute(activeCasesQuery)

        // 4. Never Reported: Cadets with 0 records
        const neverReportedQuery = sql`
        SELECT COUNT(*) as count
        FROM cadets c
        LEFT JOIN medical_records mr ON c.id = mr.cadet_id
        WHERE mr.id IS NULL
    `
        const neverReportedResult = await db.execute(neverReportedQuery)

        // 5. Total Cadets
        const totalQuery = sql`SELECT COUNT(*) as count FROM cadets`
        const totalResult = await db.execute(totalQuery)

        return NextResponse.json({
            companyStats: companyHealthResult.rows,
            bmiStats: bmiResult.rows,
            highRiskCadets: highRiskListResult.rows,
            activeCases: activeResult.rows[0].count,
            neverReported: neverReportedResult.rows[0].count,
            totalCadets: totalResult.rows[0].count
        })
    } catch (error: any) {
        console.error('Insights Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
