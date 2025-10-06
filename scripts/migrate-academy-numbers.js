#!/usr/bin/env node

// Quick Academy Number Migration Script
// Run with: node scripts/migrate-academy-numbers.js

import { db } from '../src/lib/db'
import { cadets } from '../src/lib/schema'
import { eq } from 'drizzle-orm'

async function migrateAcademyNumbers() {
  try {
    console.log('🚀 Starting Academy Number Migration...')
    console.log('📅', new Date().toISOString())

    // Get all cadets without academy numbers
    const cadetsWithoutNumbers = await db
      .select()
      .from(cadets)
      .where(eq(cadets.academyNumber, null))

    console.log(`📊 Found ${cadetsWithoutNumbers.length} cadets without academy numbers`)

    if (cadetsWithoutNumbers.length === 0) {
      console.log('✅ All cadets already have academy numbers!')
      return
    }

    // Generate academy numbers starting from 10000 (to make them look official)
    const baseNumber = 10000

    console.log('🔄 Updating cadets...')

    for (let i = 0; i < cadetsWithoutNumbers.length; i++) {
      const cadet = cadetsWithoutNumbers[i]
      const academyNumber = baseNumber + cadet.id

      await db
        .update(cadets)
        .set({ academyNumber })
        .where(eq(cadets.id, cadet.id))

      console.log(`✅ ${cadet.name}: ${academyNumber}`)
    }

    console.log('🎉 Academy Number Migration Complete!')
    console.log(`📈 Total cadets updated: ${cadetsWithoutNumbers.length}`)
    console.log('⏰', new Date().toISOString())

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
migrateAcademyNumbers().then(() => {
  console.log('🏁 Migration script finished successfully!')
  process.exit(0)
}).catch((error) => {
  console.error('💥 Migration script failed:', error)
  process.exit(1)
})
