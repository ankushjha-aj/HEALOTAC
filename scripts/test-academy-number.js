#!/usr/bin/env node

// Test Academy Number Creation
// Run with: node scripts/test-academy-number.js

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

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Import schema
const { cadets } = require('../src/lib/schema.js');

async function testAcademyNumber() {
  try {
    console.log('🧪 Testing Academy Number Creation...');

    // Create a test cadet with academy number
    const [newCadet] = await db.insert(cadets).values({
      name: 'Test Cadet API',
      battalion: 'Test Battalion',
      company: 'Alpha',
      joinDate: new Date('2024-01-01'),
      status: 'Active',
      healthStatus: 'Fit',
      academyNumber: 99999,
    }).returning();

    console.log('✅ Created cadet:', newCadet);

    // Fetch all cadets to see if academy numbers are returned
    const allCadets = await db.select().from(cadets).limit(5);
    console.log('📊 Recent cadets:', allCadets.map(c => ({
      id: c.id,
      name: c.name,
      academyNumber: c.academyNumber
    })));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testAcademyNumber();
