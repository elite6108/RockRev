-- Create toolbox_talks table
CREATE TABLE IF NOT EXISTS toolbox_talks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  talk_number text NOT NULL,
  title text NOT NULL,
  site_reference text NOT NULL,
  project_id uuid REFERENCES projects NOT NULL,
  completed_by text NOT NULL,
  completed_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL CHECK (status IN ('draft', 'completed')) DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE toolbox_talks ENABLE ROW LEVEL SECURITY;

-- Create policies for toolbox_talks
CREATE POLICY "Users can read own toolbox_talks"
  ON toolbox_talks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own toolbox_talks"
  ON toolbox_talks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own toolbox_talks"
  ON toolbox_talks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own toolbox_talks"
  ON toolbox_talks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_toolbox_talks_updated_at
  BEFORE UPDATE ON toolbox_talks
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();