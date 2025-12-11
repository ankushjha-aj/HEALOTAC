import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { createAuthMiddleware } from '@/lib/auth'

export async function POST(request: NextRequest) {
    // Auth check
    const authResponse = createAuthMiddleware(['super_admin'])(request)
    if (authResponse) return authResponse

    try {
        const { query } = await request.json()

        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 })
        }

        const db = getDb()

        // Execute arbitrary SQL
        // WARNING: This is a super-admin tool. SQL injection is a feature here, not a bug.
        const result = await db.execute(sql.raw(query))

        return NextResponse.json({
            rows: result.rows,
            rowCount: result.rowCount,
            fields: result.fields
        })
    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            detail: error.detail || 'SQL Execution Failed'
        }, { status: 500 })
    }
}
