/*
  # Add company settings table

  1. New Tables
    - `company_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `logo_url` (text, nullable)
      - `name` (text)
      - `address_line1` (text)
      - `address_line2` (text, nullable)
      - `town` (text)
      - `county` (text)
      - `post_code` (text)
      - `email` (text)
      - `phone` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `company_settings` table
    - Add policies for authenticated users to manage their own settings
*/

CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  logo_url text,
  name text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  town text NOT NULL,
  county text NOT NULL,
  post_code text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own company settings
CREATE POLICY "Users can read own company settings"
  ON company_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own company settings
CREATE POLICY "Users can create company settings"
  ON company_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own company settings
CREATE POLICY "Users can update own company settings"
  ON company_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update the updated_at timestamp
CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();