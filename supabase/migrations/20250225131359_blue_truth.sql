/*
  # Create RAMS table and related functionality

  1. New Tables
    - `rams`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `rams_number` (text, unique)
      - `date` (date)
      - `client_name` (text)
      - `site_town` (text)
      - `site_county` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Functions
    - Function to generate sequential RAMS numbers
    - Trigger to automatically set RAMS number on insert
    - Trigger to update updated_at timestamp

  3. Security
    - Enable RLS
    - Add policy for authenticated users
*/

-- Create RAMS table
CREATE TABLE IF NOT EXISTS rams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  rams_number text UNIQUE NOT NULL,
  date date DEFAULT CURRENT_DATE,
  client_name text NOT NULL,
  site_town text NOT NULL,
  site_county text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE rams ENABLE ROW LEVEL SECURITY;

-- Create function to generate sequential RAMS numbers
CREATE OR REPLACE FUNCTION generate_rams_number()
RETURNS text AS $$
DECLARE
  last_number integer;
  new_number text;
BEGIN
  -- Get the last number from existing RAMS numbers
  SELECT COALESCE(MAX(NULLIF(regexp_replace(rams_number, '^OPG-RAMS-', ''), '')), '000000')::integer
  INTO last_number
  FROM rams
  WHERE rams_number ~ '^OPG-RAMS-\d+$';

  -- Generate new number with OPG-RAMS- prefix
  new_number := 'OPG-RAMS-' || LPAD((last_number + 1)::text, 6, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate RAMS number
CREATE OR REPLACE FUNCTION set_rams_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.rams_number := generate_rams_number();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_rams_number
  BEFORE INSERT ON rams
  FOR EACH ROW
  EXECUTE FUNCTION set_rams_number();

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_rams_updated_at
  BEFORE UPDATE ON rams
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create policy for authenticated users to access RAMS
CREATE POLICY "Authenticated users can access rams"
  ON rams
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);