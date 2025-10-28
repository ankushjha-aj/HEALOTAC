const { neon } = require('@neondatabase/serverless')
require('dotenv').config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL)

async function updateAdmins() {
  console.log('Updating admin users...')

  try {
    const bcrypt = require('bcryptjs')

    // Hash passwords
    const rmoPassword = await bcrypt.hash('rmo@ota', 12)
    const naPassword = await bcrypt.hash('na @ota', 12)

    // Insert new admin users
    await sql`
      INSERT INTO users (username, password, email, role)
      VALUES ('rmo', ${rmoPassword}, 'rmo@army.mil', 'admin'),
             ('na', ${naPassword}, 'na@army.mil', 'admin')
      ON CONFLICT (username) DO NOTHING
    `

    // Delete the old admin user
    await sql`
      DELETE FROM users WHERE username = 'admin'
    `

    console.log('✅ Admin users updated successfully!')
    console.log('New login credentials:')
    console.log('Username: rmo, Password: rmo@ota')
    console.log('Username: na, Password: na @ota')
  } catch (error) {
    console.error('❌ Update failed:', error)
    process.exit(1)
  }
}

updateAdmins()
