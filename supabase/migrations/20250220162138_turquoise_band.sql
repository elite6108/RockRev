/*
  # Add backup system tables and functions

  1. New Tables
    - `backups`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `data` (jsonb, stores the backup data)
      - `created_at` (timestamptz)
      - `version` (text)
      - `description` (text)

  2. Security
    - Enable RLS on backups table
    - Add policies for user access
*/

-- Create backups table
CREATE TABLE IF NOT EXISTS backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  version text NOT NULL,
  description text
);

-- Enable RLS
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Policies for backups
CREATE POLICY "Users can read own backups"
  ON backups
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create backups"
  ON backups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own backups"
  ON backups
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to clean up old backups (keep only last 10)
CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS trigger AS $$
BEGIN
  DELETE FROM backups
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id
    FROM backups
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to cleanup old backups after insert
CREATE TRIGGER trigger_cleanup_old_backups
  AFTER INSERT ON backups
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_backups();