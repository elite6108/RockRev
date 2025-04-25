/*
  # Update CPP Schema
  
  1. Changes
    - Add all required JSONB columns to match form data structure
    - Add trigger for CPP number generation
    - Add sequence for CPP numbers
    - Add constraints and defaults
    
  2. Notes
    - All columns are JSONB to allow flexible data structures
    - Null values are allowed since not all fields are required
*/

-- Create sequence for CPP numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS cpp_number_seq;

-- Create function to set CPP number
CREATE OR REPLACE FUNCTION set_cpp_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.cpp_number IS NULL THEN
    NEW.cpp_number := 'CPP-' || LPAD(nextval('cpp_number_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_set_cpp_number ON cpps;

-- Create trigger
CREATE TRIGGER trigger_set_cpp_number
  BEFORE INSERT ON cpps
  FOR EACH ROW
  EXECUTE FUNCTION set_cpp_number();

-- Add columns if they don't exist
DO $$ 
BEGIN
  -- Front Cover
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'front_cover') THEN
    ALTER TABLE cpps ADD COLUMN front_cover JSONB;
  END IF;

  -- Project Description
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'project_description') THEN
    ALTER TABLE cpps ADD COLUMN project_description JSONB;
  END IF;

  -- Site Information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'site_information') THEN
    ALTER TABLE cpps ADD COLUMN site_information JSONB;
  END IF;

  -- Hours Team
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'hours_team') THEN
    ALTER TABLE cpps ADD COLUMN hours_team JSONB;
  END IF;

  -- Management Work
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'management_work') THEN
    ALTER TABLE cpps ADD COLUMN management_work JSONB;
  END IF;

  -- Management Structure
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'management_structure') THEN
    ALTER TABLE cpps ADD COLUMN management_structure JSONB;
  END IF;

  -- Site Rules
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'site_rules') THEN
    ALTER TABLE cpps ADD COLUMN site_rules JSONB;
  END IF;

  -- Arrangements
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'arrangements') THEN
    ALTER TABLE cpps ADD COLUMN arrangements JSONB;
  END IF;

  -- Site Induction
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'site_induction') THEN
    ALTER TABLE cpps ADD COLUMN site_induction JSONB;
  END IF;

  -- Welfare Arrangements
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'welfare_arrangements') THEN
    ALTER TABLE cpps ADD COLUMN welfare_arrangements JSONB;
  END IF;

  -- First Aid Arrangements
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'first_aid_arrangements') THEN
    ALTER TABLE cpps ADD COLUMN first_aid_arrangements JSONB;
  END IF;

  -- Rescue Plan
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'rescue_plan') THEN
    ALTER TABLE cpps ADD COLUMN rescue_plan JSONB;
  END IF;

  -- Specific Measures
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'specific_measures') THEN
    ALTER TABLE cpps ADD COLUMN specific_measures JSONB;
  END IF;

  -- Hazards
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'hazards') THEN
    ALTER TABLE cpps ADD COLUMN hazards JSONB;
  END IF;

  -- High Risk Work
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'high_risk_work') THEN
    ALTER TABLE cpps ADD COLUMN high_risk_work JSONB;
  END IF;

  -- Notifiable Work
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'notifiable_work') THEN
    ALTER TABLE cpps ADD COLUMN notifiable_work JSONB;
  END IF;

  -- Contractors
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'contractors') THEN
    ALTER TABLE cpps ADD COLUMN contractors JSONB;
  END IF;

  -- Monitoring
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'monitoring') THEN
    ALTER TABLE cpps ADD COLUMN monitoring JSONB;
  END IF;

  -- HS File
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'hs_file') THEN
    ALTER TABLE cpps ADD COLUMN hs_file JSONB;
  END IF;

  -- Hazard Identification
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'hazard_identification') THEN
    ALTER TABLE cpps ADD COLUMN hazard_identification JSONB;
  END IF;

  -- CPP Number (if not exists)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'cpp_number') THEN
    ALTER TABLE cpps ADD COLUMN cpp_number text;
  END IF;

  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'cpps' AND column_name = 'cpp_number'
  ) THEN
    ALTER TABLE cpps ADD CONSTRAINT cpps_cpp_number_key UNIQUE (cpp_number);
  END IF;
END $$;