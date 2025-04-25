/*
  # Update signage artwork categories

  1. Changes
    - Add check constraint to ensure valid categories
    - Update any existing rows to have valid categories
    - Set default category for new rows

  2. Security
    - No changes to RLS policies needed
*/

-- First ensure any existing rows have a valid category
UPDATE signage_artwork 
SET category = 'mandatory' 
WHERE category IS NULL OR category NOT IN ('mandatory', 'safe-conditions', 'fire-protection', 'prohibited', 'warning');

-- Add check constraint to ensure valid categories
DO $$ 
BEGIN
  -- Drop the constraint if it exists
  ALTER TABLE signage_artwork 
  DROP CONSTRAINT IF EXISTS signage_artwork_category_check;

  -- Add the constraint
  ALTER TABLE signage_artwork 
  ADD CONSTRAINT signage_artwork_category_check 
  CHECK (category IN ('mandatory', 'safe-conditions', 'fire-protection', 'prohibited', 'warning'));
END $$;

-- Set default for new rows
ALTER TABLE signage_artwork 
ALTER COLUMN category SET DEFAULT 'mandatory';