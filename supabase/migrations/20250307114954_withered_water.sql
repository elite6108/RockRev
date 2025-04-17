/*
  # Create policy content table

  1. New Tables
    - `policy_content`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `section_id` (text) - Unique identifier for the section
      - `section_title` (text) - Display title of the section
      - `content` (text) - The actual content
      - `order` (integer) - Display order in the document
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS policy_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  section_id text NOT NULL,
  section_title text NOT NULL,
  content text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE policy_content ENABLE ROW LEVEL SECURITY;

-- Create unique constraint for user_id + section_id
ALTER TABLE policy_content ADD CONSTRAINT policy_content_user_section_unique UNIQUE (user_id, section_id);

-- Create policies
CREATE POLICY "Users can create own policy content"
  ON policy_content
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own policy content"
  ON policy_content
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own policy content"
  ON policy_content
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own policy content"
  ON policy_content
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_policy_content_updated_at
  BEFORE UPDATE ON policy_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();