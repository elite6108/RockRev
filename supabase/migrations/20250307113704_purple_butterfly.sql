/*
  # Create policy sections table

  1. New Tables
    - `policy_sections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `section` (text)
      - `content` (text)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `policy_sections` table
    - Add policies for authenticated users to manage their own policy sections
*/

-- Create policy_sections table
CREATE TABLE IF NOT EXISTS policy_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  section text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE policy_sections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create own policy sections"
  ON policy_sections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own policy sections"
  ON policy_sections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own policy sections"
  ON policy_sections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own policy sections"
  ON policy_sections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_policy_sections_updated_at
  BEFORE UPDATE ON policy_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();