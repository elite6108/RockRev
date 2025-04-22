-- Create equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  serial_number text NOT NULL,
  calibration_date date,
  service_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create equipment_checklists table
CREATE TABLE IF NOT EXISTS equipment_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  equipment_id uuid REFERENCES equipment ON DELETE CASCADE NOT NULL,
  check_date date DEFAULT CURRENT_DATE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_by_name text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  status text NOT NULL CHECK (status IN ('pass', 'fail')) DEFAULT 'pass',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_checklists ENABLE ROW LEVEL SECURITY;

-- Create policies for equipment
CREATE POLICY "Users can read own equipment"
  ON equipment FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own equipment"
  ON equipment FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own equipment"
  ON equipment FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own equipment"
  ON equipment FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for equipment_checklists
CREATE POLICY "Users can read own equipment_checklists"
  ON equipment_checklists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own equipment_checklists"
  ON equipment_checklists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own equipment_checklists"
  ON equipment_checklists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own equipment_checklists"
  ON equipment_checklists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create triggers to update updated_at timestamp
CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_equipment_checklists_updated_at
  BEFORE UPDATE ON equipment_checklists
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();