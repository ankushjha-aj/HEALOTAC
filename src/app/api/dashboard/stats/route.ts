import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { attendance, cadets } from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'
import { createAuthMiddleware } from '@/lib/auth'

export const dynamic = 'force-dynamic'

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

        // Fetch attendance records for the date, joined with cadet details
        // Use explicit table.column to ensure correct SQL generation

        const attendanceRecords = await db.select({
            attendance: attendance,
            cadet: cadets
        })
            .from(attendance)
            .leftJoin(cadets, eq(attendance.cadetId, cadets.id))
            .where(sql`TO_CHAR(attendance.date, 'YYYY-MM-DD') = ${queryDateString}`)


        let morningCount = 0
        let eveningCount = 0
        const attendees: any[] = []

        attendanceRecords.forEach(({ attendance: record, cadet }) => {
            if (record.morning) morningCount++
            if (record.evening) eveningCount++

            if ((record.morning || record.evening) && cadet) {
                attendees.push({
                    ...cadet,
                    attendanceStatus: {
                        morning: record.morning,
                        evening: record.evening
                    }
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
