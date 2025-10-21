-- Add relegated column to cadets table
ALTER TABLE cadets
ADD COLUMN relegated VARCHAR(1) DEFAULT 'N' NOT NULL;
