/*
  # Add category to signage artwork

  1. Changes
    - Add category column to signage_artwork table
    - Add check constraint to ensure valid categories
    - Set default category to 'mandatory'

  2. Security
    - No changes to RLS policies needed
*/

-- Add category column with check constraint
ALTER TABLE signage_artwork 
ADD COLUMN category text NOT NULL DEFAULT 'mandatory'
CHECK (category IN ('mandatory', 'safe-conditions', 'fire-protection', 'prohibited', 'warning'));