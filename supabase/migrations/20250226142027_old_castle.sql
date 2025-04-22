-- Add actions column to accidents table
ALTER TABLE accidents
  ADD COLUMN IF NOT EXISTS actions jsonb NOT NULL DEFAULT '[]'::jsonb;