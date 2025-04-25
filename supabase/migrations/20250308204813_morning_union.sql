/*
  # Add policy number sequence

  1. New Sequences
    - Create sequence for policy numbers starting at 1
  
  2. Changes
    - Add trigger to automatically set policy number on insert
*/

-- Create sequence for policy numbers
CREATE SEQUENCE IF NOT EXISTS hs_policy_number_seq START 1;

-- Add trigger function to set policy number
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
CREATE TRIGGER trigger_set_hs_policy_number
  BEFORE INSERT ON hs_policy_files
  FOR EACH ROW
  EXECUTE FUNCTION set_hs_policy_number();