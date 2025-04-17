/*
  # Add Payment Terms Table

  1. New Tables
    - `payment_terms`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `bank_name` (text)
      - `account_number` (text)
      - `sort_code` (text)
      - `terms` (text)
      - `seven_days` (text)
      - `thirty_days` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `payment_terms` table
    - Add policy for authenticated users to access payment terms
*/

-- Create payment_terms table
CREATE TABLE IF NOT EXISTS payment_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  sort_code text NOT NULL,
  terms text NOT NULL,
  seven_days text NOT NULL,
  thirty_days text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE payment_terms ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to access payment terms
CREATE POLICY "Authenticated users can access payment_terms"
  ON payment_terms
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_payment_terms_updated_at
  BEFORE UPDATE ON payment_terms
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();