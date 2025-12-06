import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

// Legacy static connection (for backwards compatibility)
const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql)

// Fresh connection function - use this for real-time data
// Creates a new connection each time to avoid connection caching
export function getDb() {
    const freshSql = neon(process.env.DATABASE_URL!)
    return drizzle(freshSql)
}
