#!/usr/bin/env node

// Simple Academy Number Migration Script
// Run with: node scripts/migrate-simple.js

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load environment variables
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local if it exists
try {
  const envPath = join(__dirname, '..', '.env.local');
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.replace(/"/g, '').trim();
    }
  });
} catch (error) {
  console.log('⚠️  Could not load .env.local file');
}

const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const { eq } = require('drizzle-orm');

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Import schema
const { cadets } = require('../src/lib/schema.js');

async function migrateAcademyNumbers() {
  try {
    console.log('🚀 Starting Academy Number Migration...');

    // Get all cadets without academy numbers
    const cadetsWithoutNumbers = await db
      .select()
      .from(cadets)
      .where(eq(cadets.academyNumber, null));

    console.log(`📊 Found ${cadetsWithoutNumbers.length} cadets without academy numbers`);

    if (cadetsWithoutNumbers.length === 0) {
      console.log('✅ All cadets already have academy numbers!');
      return;
    }

    // Generate academy numbers starting from 10000
    const baseNumber = 10000;

    for (let i = 0; i < cadetsWithoutNumbers.length; i++) {
      const cadet = cadetsWithoutNumbers[i];
      const academyNumber = baseNumber + cadet.id;

      await db
        .update(cadets)
        .set({ academyNumber })
        .where(eq(cadets.id, cadet.id));

      console.log(`✅ Updated ${cadet.name}: Academy Number ${academyNumber}`);
    }

    console.log('🎉 Academy Number Migration Complete!');
    console.log(`📈 Total cadets updated: ${cadetsWithoutNumbers.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateAcademyNumbers().then(() => {
  console.log('🏁 Migration script finished successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Migration script failed:', error);
  process.exit(1);
});
