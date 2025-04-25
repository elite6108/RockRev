/*
  # Add CPP Number Generation
  
  1. Changes
    - Add sequence for CPP numbers
    - Add trigger to automatically generate CPP numbers
    - Add function to set CPP number
    - Add cpp_number column if not exists
    - Add unique constraint on cpp_number
*/

-- Create sequence for CPP numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS cpp_number_seq;

-- Add cpp_number column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cpps' AND column_name = 'cpp_number'
  ) THEN
    ALTER TABLE public.cpps 
    ADD COLUMN cpp_number text NOT NULL DEFAULT 'CPP-' || LPAD(nextval('cpp_number_seq')::text, 3, '0');
  END IF;
END $$;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'cpps' AND column_name = 'cpp_number'
  ) THEN
    ALTER TABLE public.cpps
    ADD CONSTRAINT cpps_cpp_number_key UNIQUE (cpp_number);
  END IF;
END $$;

-- Create or replace function to set CPP number
CREATE OR REPLACE FUNCTION set_cpp_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.cpp_number IS NULL THEN
    NEW.cpp_number := 'CPP-' || LPAD(nextval('cpp_number_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_set_cpp_number'
  ) THEN
    CREATE TRIGGER trigger_set_cpp_number
      BEFORE INSERT ON public.cpps
      FOR EACH ROW
      EXECUTE FUNCTION set_cpp_number();
  END IF;
END $$;