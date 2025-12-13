import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { createAuthMiddleware } from '@/lib/auth'

export async function GET(request: NextRequest) {
    // Auth check
    const authResponse = createAuthMiddleware(['super_admin'])(request)
    if (authResponse) return authResponse

    try {
        const { searchParams } = new URL(request.url)
        const company = searchParams.get('company')
        const type = searchParams.get('type') // 'all', 'healthy', 'sick'

        if (!company) {
            return NextResponse.json({ error: 'Company is required' }, { status: 400 })
        }

        const db = getDb()
        let query;

        if (type === 'sick') {
            // Fetch only active sick cadets in this company
            query = sql`
            SELECT 
                c.id, c.name, c.company, c.academy_number, 
                mr.medical_problem as status,
                mr.date_of_reporting
            FROM cadets c
            JOIN medical_records mr ON c.id = mr.cadet_id
            WHERE c.company = ${company} 
            AND mr.medical_status = 'Active'
        `
        } else if (type === 'never_reported') {
            // Fetch cadets who have NEVER appeared in medical_records
            // OR have no records at all.
            query = sql`
            SELECT 
                c.id, c.name, c.company, c.academy_number, 
                'Clean Record' as status
            FROM cadets c
            LEFT JOIN medical_records mr ON c.id = mr.cadet_id
            WHERE mr.id IS NULL
        `
        } else if (type === 'healthy') {
            // Fetch cadets in this company NOT in active medical records
            query = sql`
            SELECT 
                c.id, c.name, c.company, c.academy_number, 
                'Fit' as status
            FROM cadets c
            LEFT JOIN medical_records mr ON c.id = mr.cadet_id AND mr.medical_status = 'Active'
            WHERE c.company = ${company} 
            AND mr.id IS NULL
        `
        } else {
            // Fetch ALL cadets in this company (for Pie Chart click)
            // We'll join to see if they are sick or fit
            query = sql`
            SELECT 
                c.id, c.name, c.company, c.academy_number,
                CASE 
                    WHEN mr.id IS NOT NULL THEN mr.medical_problem 
                    ELSE 'Fit' 
                END as status
            FROM cadets c
            LEFT JOIN medical_records mr ON c.id = mr.cadet_id AND mr.medical_status = 'Active'
            WHERE c.company = ${company}
        `
        }

        const result = await db.execute(query)

        return NextResponse.json({ cadets: result.rows })

    } catch (error: any) {
        console.error('Drilldown Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
