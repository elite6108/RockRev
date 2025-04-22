-- Create accidents table if it doesn't exist
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
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  description text NOT NULL,
  "basicCause" text,
  "hazardSource" text,
  root_causes jsonb NOT NULL DEFAULT '{}'::jsonb,
  immediate_actions text NOT NULL,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')) DEFAULT 'draft',
  created_by_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);