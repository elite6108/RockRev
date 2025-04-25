/*
  # Remove PPE options from risk assessments

  1. Changes
    - Remove PPE column from risk_assessments table
    - Add new PPE column with empty array default
*/

DO $$ BEGIN
  -- Remove existing PPE column and add new one with empty array default
  ALTER TABLE risk_assessments 
    DROP COLUMN IF EXISTS ppe,
    ADD COLUMN ppe text[] DEFAULT '{}'::text[] NOT NULL;
END $$;