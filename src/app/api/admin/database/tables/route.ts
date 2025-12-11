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

    const dbUrl = process.env.DATABASE_URL || ''
    const host = dbUrl.split('@')[1]?.split('/')[0] || 'Unknown Host'

    // Query information_schema for user tables
    const query = `
      SELECT 
        table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `

    const result = await db.execute(sql.raw(query))

    return NextResponse.json({
      tables: result.rows, // array of objects {table_name: '...'}
      host: host
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
