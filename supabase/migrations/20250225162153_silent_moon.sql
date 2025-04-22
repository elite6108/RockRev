-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  full_name text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  licence_number text NOT NULL,
  licence_expiry date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(licence_number, user_id)
);

-- Enable Row Level Security
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to access drivers
CREATE POLICY "Authenticated users can access drivers"
  ON drivers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();