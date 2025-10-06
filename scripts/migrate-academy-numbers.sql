-- Academy Number Migration SQL Script
-- Run this directly in your Neon database console or PostgreSQL client

-- Update all cadets that have null academy numbers
-- Academy numbers will be assigned as 10000 + cadet.id (e.g., cadet ID 24 -> 10024)

UPDATE cadets
SET academy_number = 10000 + id
WHERE academy_number IS NULL;

-- Verify the update worked
SELECT id, name, academy_number
FROM cadets
WHERE academy_number IS NOT NULL
ORDER BY academy_number;

-- Count how many cadets were updated
SELECT COUNT(*) as total_cadets_with_academy_numbers
FROM cadets
WHERE academy_number IS NOT NULL;
