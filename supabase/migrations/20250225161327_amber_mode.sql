/*
  # Vehicle Management System

  1. New Tables
    - `vehicles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `registration` (text, unique)
      - `make` (text)
      - `model` (text)
      - `driver` (text)
      - `mot_date` (date)
      - `tax_date` (date)
      - `service_date` (date)
      - `insurance_date` (date)
      - `breakdown_date` (date)
      - `congestion_date` (date)
      - `dartford_date` (date)
      - `clean_air_date` (date)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on vehicles table
    - Add policies for authenticated users
*/

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  registration text NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  driver text NOT NULL,
  mot_date date,
  tax_date date,
  service_date date,
  insurance_date date,
  breakdown_date date,
  congestion_date date,
  dartford_date date,
  clean_air_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(registration, user_id)
);

-- Enable Row Level Security
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to access vehicles
CREATE POLICY "Authenticated users can access vehicles"
  ON vehicles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();