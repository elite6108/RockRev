/*
  # Add Quotes functionality

  1. New Tables
    - `quotes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `quote_number` (text, unique)
      - `customer_id` (uuid, references customers)
      - `project_id` (uuid, references projects)
      - `project_location` (text)
      - `status` (text: 'new', 'accepted', 'rejected')
      - `created_by_name` (text)
      - `quote_date` (date)
      - `amount` (decimal)
      - `items` (jsonb array)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on quotes table
    - Add policies for CRUD operations
*/

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  quote_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers NOT NULL,
  project_id uuid REFERENCES projects NOT NULL,
  project_location text,
  status text NOT NULL CHECK (status IN ('new', 'accepted', 'rejected')) DEFAULT 'new',
  created_by_name text NOT NULL,
  quote_date date DEFAULT CURRENT_DATE,
  amount decimal(10,2) DEFAULT 0.00,
  items jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Create function to generate sequential quote numbers
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS text AS $$
DECLARE
  last_number integer;
  new_number text;
BEGIN
  -- Get the last number from existing quote numbers
  SELECT COALESCE(MAX(NULLIF(regexp_replace(quote_number, '^Q-', ''), '')), '000000')::integer
  INTO last_number
  FROM quotes
  WHERE quote_number ~ '^Q-\d+$';

  -- Generate new number
  new_number := 'Q-' || LPAD((last_number + 1)::text, 6, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate quote number
CREATE OR REPLACE FUNCTION set_quote_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.quote_number := generate_quote_number();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_quote_number
  BEFORE INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION set_quote_number();

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Policies
CREATE POLICY "Users can read own quotes"
  ON quotes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create quotes"
  ON quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotes"
  ON quotes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quotes"
  ON quotes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);