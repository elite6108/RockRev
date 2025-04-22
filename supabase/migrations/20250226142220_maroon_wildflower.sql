-- Add missing columns to accidents table
ALTER TABLE accidents
  ADD COLUMN IF NOT EXISTS photos jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Update existing columns to match form data
ALTER TABLE accidents
  ALTER COLUMN basic_cause DROP NOT NULL,
  ALTER COLUMN hazard_source DROP NOT NULL;

-- Add default values for existing rows
UPDATE accidents SET
  photos = '[]'::jsonb WHERE photos IS NULL;