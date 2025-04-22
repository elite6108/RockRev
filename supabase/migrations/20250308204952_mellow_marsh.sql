/*
  # Add policy number to hs_policy_files

  1. New Columns
    - Add policy_number column to hs_policy_files table
  
  2. Changes
    - Create sequence for auto-incrementing policy numbers
    - Add trigger to automatically set policy number on insert
*/

-- Create sequence for policy numbers
CREATE SEQUENCE IF NOT EXISTS hs_policy_number_seq START 1;

-- Add policy_number column
ALTER TABLE hs_policy_files 
ADD COLUMN IF NOT EXISTS policy_number integer;

-- Create function to set policy number
CREATE OR REPLACE FUNCTION set_hs_policy_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.policy_number IS NULL THEN
    NEW.policy_number := nextval('hs_policy_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_hs_policy_number ON hs_policy_files;
CREATE TRIGGER trigger_set_hs_policy_number
  BEFORE INSERT ON hs_policy_files
  FOR EACH ROW
  EXECUTE FUNCTION set_hs_policy_number();

-- Update existing records
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM hs_policy_files WHERE policy_number IS NULL ORDER BY created_at ASC
  LOOP
    UPDATE hs_policy_files 
    SET policy_number = nextval('hs_policy_number_seq')
    WHERE id = r.id;
  END LOOP;
END $$;