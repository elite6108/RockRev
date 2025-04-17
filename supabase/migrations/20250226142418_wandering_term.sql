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

-- Create temporary columns for the rename
ALTER TABLE accidents 
  ADD COLUMN "basicCause" text,
  ADD COLUMN "hazardSource" text;

-- Copy data from old columns to new columns
UPDATE accidents SET
  "basicCause" = basic_cause,
  "hazardSource" = hazard_source;

-- Drop old columns
ALTER TABLE accidents
  DROP COLUMN basic_cause,
  DROP COLUMN hazard_source;