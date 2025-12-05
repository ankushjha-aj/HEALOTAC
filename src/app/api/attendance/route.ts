import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { attendance } from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'
import { createAuthMiddleware } from '@/lib/auth'

// GET /api/attendance?cadetId=1&startDate=2023-01-01&endDate=2023-01-07
export async function GET(request: NextRequest) {
    const authError = createAuthMiddleware(['admin', 'user'])(request)
    if (authError) return authError

    const searchParams = request.nextUrl.searchParams
    const cadetId = searchParams.get('cadetId')

    if (!cadetId) {
        return NextResponse.json({ error: 'Cadet ID is required' }, { status: 400 })
    }

    try {
        const records = await db.select()
            .from(attendance)
            .where(eq(attendance.cadetId, parseInt(cadetId)))

        return NextResponse.json(records)
    } catch (error) {
        console.error('Error fetching attendance:', error)
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
    }
}

// POST /api/attendance
export async function POST(request: NextRequest) {
    const authError = createAuthMiddleware(['admin', 'user'])(request)
    if (authError) return authError

    try {
        const { cadetId, date, morning, evening } = await request.json()

        if (!cadetId || !date) {
            return NextResponse.json({ error: 'Cadet ID and date are required' }, { status: 400 })
        }

        // The date from frontend is YYYY-MM-DD string (e.g., "2025-12-06")
        const dateString = date // Already "YYYY-MM-DD" format

        // Use current UTC time for timestamps
        const now = new Date()

        // Use atomic PostgreSQL UPSERT with ON CONFLICT
        // This handles race conditions properly
        let result

        if (morning !== undefined && evening !== undefined) {
            // Both fields provided - simple upsert
            result = await db.execute(
                sql`INSERT INTO attendance (cadet_id, date, morning, evening, created_at, updated_at)
                    VALUES (${cadetId}, ${dateString}::date, ${morning}, ${evening}, ${now}, ${now})
                    ON CONFLICT (cadet_id, date) 
                    DO UPDATE SET 
                        morning = ${morning},
                        evening = ${evening},
                        updated_at = ${now}
                    RETURNING *`
            )
        } else if (morning !== undefined) {
            // Only morning provided
            result = await db.execute(
                sql`INSERT INTO attendance (cadet_id, date, morning, evening, created_at, updated_at)
                    VALUES (${cadetId}, ${dateString}::date, ${morning}, false, ${now}, ${now})
                    ON CONFLICT (cadet_id, date) 
                    DO UPDATE SET 
                        morning = ${morning},
                        updated_at = ${now}
                    RETURNING *`
            )
        } else if (evening !== undefined) {
            // Only evening provided
            result = await db.execute(
                sql`INSERT INTO attendance (cadet_id, date, morning, evening, created_at, updated_at)
                    VALUES (${cadetId}, ${dateString}::date, false, ${evening}, ${now}, ${now})
                    ON CONFLICT (cadet_id, date) 
                    DO UPDATE SET 
                        evening = ${evening},
                        updated_at = ${now}
                    RETURNING *`
            )
        } else {
            return NextResponse.json({ error: 'At least morning or evening must be provided' }, { status: 400 })
        }

        console.log('Upsert result:', result.rows[0])
        return NextResponse.json(result.rows[0])
    } catch (error) {
        console.error('Error saving attendance:', error)
        return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 })
    }
}
