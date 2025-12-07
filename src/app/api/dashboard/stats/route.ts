import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { attendance, cadets } from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'
import { createAuthMiddleware } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/dashboard/stats
// GET /api/dashboard/stats?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
    const authError = createAuthMiddleware(['admin', 'user'])(request)
    if (authError) return authError

    try {
        const searchParams = request.nextUrl.searchParams
        const dateParam = searchParams.get('date')

        let queryDateString: string

        if (dateParam) {
            queryDateString = dateParam
        } else {
            // Default to today in IST (Indian Standard Time)
            const now = new Date()
            const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
            const istDate = new Date(istString)
            // Format as YYYY-MM-DD
            const year = istDate.getFullYear()
            const month = String(istDate.getMonth() + 1).padStart(2, '0')
            const day = String(istDate.getDate()).padStart(2, '0')
            queryDateString = `${year}-${month}-${day}`
        }

        // Use fresh database connection for real-time data
        const db = getDb()

        // Fetch attendance records for the date using raw SQL
        // Build query string manually to avoid Drizzle parameter binding issues
        const querySQL = `SELECT 
            a.id as attendance_id, a.cadet_id, a.date, a.morning, a.evening, a.updated_at,
            c.id, c.name, c.battalion, c.company, c.academy_number, c.blood_group, c.relegated, c.is_foreign
        FROM attendance a
        LEFT JOIN cadets c ON a.cadet_id = c.id
        WHERE a.date::date = '${queryDateString}'::date
        ORDER BY a.updated_at ASC`

        const attendanceRecords = await db.execute(sql.raw(querySQL))

        let morningCount = 0
        let eveningCount = 0
        const attendees: any[] = []

        const rows = attendanceRecords.rows || []
        rows.forEach((row: any) => {
            if (row.morning) morningCount++
            if (row.evening) eveningCount++

            if (row.morning || row.evening) {
                attendees.push({
                    id: row.id,
                    name: row.name,
                    battalion: row.battalion,
                    company: row.company,
                    academyNumber: row.academy_number,
                    bloodGroup: row.blood_group,
                    relegated: row.relegated,
                    isForeign: row.is_foreign,
                    attendanceStatus: {
                        morning: row.morning,
                        evening: row.evening
                    },
                    updatedAt: row.updated_at
                })
            }
        })

        const totalCount = morningCount + eveningCount

        return NextResponse.json({
            stats: {
                morning: morningCount,
                evening: eveningCount,
                total: totalCount
            },
            attendees
        })
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}
