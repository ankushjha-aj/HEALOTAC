import { db } from '@/lib/db'
import { cadets } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export default async function migrateAcademyNumbers() {
  try {
    console.log('🚀 Starting Academy Number Migration...')

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

    for (let i = 0; i < cadetsWithoutNumbers.length; i++) {
      const cadet = cadetsWithoutNumbers[i]
      const academyNumber = baseNumber + cadet.id

      await db
        .update(cadets)
        .set({ academyNumber })
        .where(eq(cadets.id, cadet.id))

      console.log(`✅ Updated ${cadet.name}: Academy Number ${academyNumber}`)
    }

    console.log('🎉 Academy Number Migration Complete!')
    console.log(`📈 Total cadets updated: ${cadetsWithoutNumbers.length}`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}
