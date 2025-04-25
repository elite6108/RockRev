/*
  # Add Vehicle Checklists

  1. New Tables
    - `vehicle_checklists`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `vehicle_id` (uuid, references vehicles)
      - `check_date` (date)
      - `items` (jsonb)
      - `notes` (text)
      - `created_by_name` (text)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policy for authenticated users
*/

-- Create vehicle_checklists table
CREATE TABLE IF NOT EXISTS vehicle_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  vehicle_id uuid REFERENCES vehicles ON DELETE CASCADE NOT NULL,
  check_date date DEFAULT CURRENT_DATE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_by_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('pass', 'fail')) DEFAULT 'pass',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE vehicle_checklists ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to access vehicle_checklists
CREATE POLICY "Authenticated users can access vehicle_checklists"
  ON vehicle_checklists
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_vehicle_checklists_updated_at
  BEFORE UPDATE ON vehicle_checklists
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();