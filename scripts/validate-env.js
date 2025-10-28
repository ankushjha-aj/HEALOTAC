require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET'
];

let missingVars = [];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
}

if (missingVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please check your .env.local file and ensure all required variables are set.');
  process.exit(1);
}

console.log('Environment variables validated successfully.');
