-- Fix for the "relation 'last_health_questionnaire' does not exist" error
-- This migration ensures the workers table exists with the correct structure
-- and creates the necessary RPC functions for debugging table structures

-- Create functions to list tables and columns for debugging
CREATE OR REPLACE FUNCTION list_tables()
RETURNS TABLE (table_name text) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT tablename::text FROM pg_tables 
  WHERE schemaname = 'public' 
  ORDER BY tablename;
$$;

CREATE OR REPLACE FUNCTION list_table_columns(table_name text)
RETURNS TABLE (column_name text, data_type text) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT column_name::text, data_type::text 
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = $1
  ORDER BY ordinal_position;
$$;

-- Grant execute permissions on the debugging functions
GRANT EXECUTE ON FUNCTION list_tables TO authenticated;
GRANT EXECUTE ON FUNCTION list_tables TO anon;
GRANT EXECUTE ON FUNCTION list_table_columns TO authenticated;
GRANT EXECUTE ON FUNCTION list_table_columns TO anon;

-- Make sure workers table exists with the right structure
DO $$
BEGIN
  -- Create workers table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workers') THEN
    CREATE TABLE workers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email TEXT UNIQUE NOT NULL,
      first_name TEXT,
      last_name TEXT,
      full_name TEXT,
      company TEXT,
      phone TEXT,
      last_short_questionnaire_date TIMESTAMPTZ,
      last_health_questionnaire TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    -- Make sure the last_health_questionnaire column exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'workers' 
      AND column_name = 'last_health_questionnaire'
    ) THEN
      ALTER TABLE workers ADD COLUMN last_health_questionnaire TIMESTAMPTZ;
    END IF;
  END IF;
END
$$;

-- Create health_checks table if it doesn't exist
CREATE TABLE IF NOT EXISTS health_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  fit_to_work BOOLEAN DEFAULT TRUE,
  taking_medications BOOLEAN DEFAULT FALSE,
  wearing_correct_ppe BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create health_questionnaires table if it doesn't exist
CREATE TABLE IF NOT EXISTS health_questionnaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_email TEXT,
  submission_date TIMESTAMPTZ NOT NULL,
  questionnaire_type TEXT NOT NULL,
  -- Medical Declaration
  epilepsy BOOLEAN DEFAULT FALSE,
  blackouts BOOLEAN DEFAULT FALSE,
  diabetes BOOLEAN DEFAULT FALSE,
  eyesight BOOLEAN DEFAULT FALSE,
  color_blindness BOOLEAN DEFAULT FALSE,
  hearing_impairment BOOLEAN DEFAULT FALSE,
  physical_disability BOOLEAN DEFAULT FALSE,
  arthritis BOOLEAN DEFAULT FALSE,
  back_problems BOOLEAN DEFAULT FALSE,
  hernia BOOLEAN DEFAULT FALSE, 
  hypertension BOOLEAN DEFAULT FALSE,
  heart_disease BOOLEAN DEFAULT FALSE,
  respiratory_disease BOOLEAN DEFAULT FALSE,
  medical_details TEXT,
  prescribed_medications TEXT,
  -- Occupational Health History
  hazardous_material_exposure BOOLEAN DEFAULT FALSE,
  hazardous_material_details TEXT,
  work_related_health_problems BOOLEAN DEFAULT FALSE,
  work_related_health_details TEXT,
  work_restrictions BOOLEAN DEFAULT FALSE,
  work_restrictions_details TEXT,
  -- Declaration
  full_name TEXT,
  digital_signature TEXT,
  confirmation_checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a trigger function to update the workers table when a health questionnaire is submitted
CREATE OR REPLACE FUNCTION update_worker_from_questionnaire()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to update the worker record if it exists
  UPDATE workers
  SET last_health_questionnaire = NEW.submission_date
  WHERE email = NEW.user_email;
  
  -- If no rows were updated, insert a new worker record
  IF NOT FOUND THEN
    INSERT INTO workers (email, full_name, last_health_questionnaire)
    VALUES (NEW.user_email, NEW.full_name, NEW.submission_date);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_worker_from_questionnaire_trigger ON health_questionnaires;

-- Create the trigger
CREATE TRIGGER update_worker_from_questionnaire_trigger
AFTER INSERT ON health_questionnaires
FOR EACH ROW
EXECUTE FUNCTION update_worker_from_questionnaire();

-- Grant permissions to access these tables
GRANT ALL ON TABLE workers TO authenticated;
GRANT ALL ON TABLE workers TO anon;
GRANT ALL ON TABLE health_checks TO authenticated;
GRANT ALL ON TABLE health_checks TO anon;
GRANT ALL ON TABLE health_questionnaires TO authenticated;
GRANT ALL ON TABLE health_questionnaires TO anon;
