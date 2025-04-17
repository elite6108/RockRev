-- Create accidents table
CREATE TABLE IF NOT EXISTS accidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  report_number text UNIQUE NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('accident', 'nearMiss', 'incident')),
  incident_type text NOT NULL,
  riddor_reportable boolean NOT NULL DEFAULT false,
  location text NOT NULL,
  incident_location text NOT NULL,
  incident_date date NOT NULL,
  photos_taken boolean NOT NULL DEFAULT false,
  description text NOT NULL,
  basic_cause text NOT NULL,
  hazard_source text NOT NULL,
  root_causes jsonb NOT NULL DEFAULT '{}'::jsonb,
  immediate_actions text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')) DEFAULT 'draft',
  created_by_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE accidents ENABLE ROW LEVEL SECURITY;

-- Create function to generate sequential report numbers
CREATE OR REPLACE FUNCTION generate_accident_report_number(report_type text)
RETURNS text AS $$
DECLARE
  prefix text;
  last_number integer;
  new_number text;
BEGIN
  -- Set prefix based on report type
  CASE report_type
    WHEN 'accident' THEN prefix := 'OPG-ACC-';
    WHEN 'nearMiss' THEN prefix := 'OPG-NM-';
    WHEN 'incident' THEN prefix := 'OPG-INC-';
    ELSE RAISE EXCEPTION 'Invalid report type';
  END CASE;

  -- Get the last number from existing report numbers for this type
  SELECT COALESCE(MAX(NULLIF(regexp_replace(report_number, prefix, ''), '')), '000000')::integer
  INTO last_number
  FROM accidents
  WHERE report_number ~ ('^' || prefix || '\d+$');

  -- Generate new number
  new_number := prefix || LPAD((last_number + 1)::text, 6, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate report number
CREATE OR REPLACE FUNCTION set_accident_report_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.report_number := generate_accident_report_number(NEW.report_type);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_accident_report_number
  BEFORE INSERT ON accidents
  FOR EACH ROW
  EXECUTE FUNCTION set_accident_report_number();

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_accidents_updated_at
  BEFORE UPDATE ON accidents
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create policies for accidents
CREATE POLICY "Users can read own accidents"
  ON accidents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own accidents"
  ON accidents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accidents"
  ON accidents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own accidents"
  ON accidents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);