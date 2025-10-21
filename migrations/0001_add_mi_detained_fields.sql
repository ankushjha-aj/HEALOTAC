-- Add MI Detained and Total Training Days Missed columns to medical_records table
ALTER TABLE medical_records
ADD COLUMN mi_detained INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN total_training_days_missed INTEGER DEFAULT 0 NOT NULL;
