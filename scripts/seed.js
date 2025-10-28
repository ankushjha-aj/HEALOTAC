const { neon } = require('@neondatabase/serverless')
require('dotenv').config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL)

async function seed() {
  console.log('Seeding database with relationships...')

  try {
    const bcrypt = require('bcryptjs')

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)

    await sql`
      INSERT INTO users (username, password, email, role)
      VALUES ('admin', ${hashedPassword}, 'admin@army.mil', 'admin')
      ON CONFLICT (username) DO NOTHING
    `

    // Create sample cadets
    await sql`
      INSERT INTO cadets (name, battalion, company, join_date) VALUES
      ('Vipin Kumar', '12th Battalion', 'Alpha', '2025-06-15'),
      ('Ankush Sharma', '12th Battalion', 'Gamma', '2025-07-01'),
      ('Gaurav Singh', '12th Battalion', 'Beta', '2025-05-20')
      ON CONFLICT DO NOTHING
    `

    // Get cadet IDs for medical records
    const cadets = await sql`SELECT id, name FROM cadets ORDER BY id`

    // Create sample medical records with cadet relationships
    const medicalRecordsData = [
      { cadetName: 'Vipin Kumar', problem: 'Ankle Sprain', diagnosis: 'Grade 2 sprain', status: 'Active', attendC: 1, trainingDays: 3, contact: '+91-9876543210', remarks: 'Rest and physiotherapy advised' },
      { cadetName: 'Ankush Sharma', problem: 'Viral Fever', diagnosis: 'Acute viral infection', status: 'Completed', attendC: 0, trainingDays: 2, contact: '+91-9876543211', remarks: 'Recovered after medication' },
      { cadetName: 'Gaurav Singh', problem: 'Minor Cut', diagnosis: 'Superficial wound', status: 'Completed', attendC: 0, trainingDays: 1, contact: '+91-9876543212', remarks: 'Healed well with dressing' }
    ]

    for (const record of medicalRecordsData) {
      const cadet = cadets.find(c => c.name === record.cadetName)
      if (cadet) {
        await sql`
          INSERT INTO medical_records (cadet_id, date_of_reporting, medical_problem, diagnosis, medical_status, attend_c, total_training_days_missed, contact_no, remarks)
          VALUES (${cadet.id}, '2025-09-20', ${record.problem}, ${record.diagnosis}, ${record.status}, ${record.attendC}, ${record.trainingDays}, ${record.contact}, ${record.remarks})
          ON CONFLICT DO NOTHING
        `
      }
    }

    console.log('✅ Database seeded successfully!')
    console.log('You can now login with:')
    console.log('Username: admin')
    console.log('Password: admin123')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seed()
