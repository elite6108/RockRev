/*
  # Add CPPs Table and Users Table

  1. New Tables
    - `users` (if not exists)
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `cpps`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `cpp_number` (text, unique)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `review_date` (timestamp)

  2. Security
    - Enable RLS on `cpps` table
    - Add policies for authenticated users
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create CPPs table
CREATE TABLE IF NOT EXISTS cpps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  cpp_number text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  review_date timestamptz NOT NULL
);

-- Enable RLS
ALTER TABLE cpps ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create own cpps"
  ON cpps
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own cpps"
  ON cpps
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own cpps"
  ON cpps
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cpps"
  ON cpps
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updating updated_at column
CREATE TRIGGER update_cpps_updated_at
  BEFORE UPDATE ON cpps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();