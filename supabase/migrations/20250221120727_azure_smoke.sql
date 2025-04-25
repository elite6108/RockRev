/*
  # Add Quote Terms Table

  1. New Tables
    - `quote_terms`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `terms` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `quote_terms` table
    - Add policy for authenticated users to access quote terms
*/

-- Create quote_terms table
CREATE TABLE IF NOT EXISTS quote_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  terms text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE quote_terms ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to access quote terms
CREATE POLICY "Authenticated users can access quote_terms"
  ON quote_terms
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_quote_terms_updated_at
  BEFORE UPDATE ON quote_terms
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();