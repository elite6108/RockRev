-- Create storage bucket for signage artwork
INSERT INTO storage.buckets (id, name, public)
VALUES ('signage-artwork', 'signage-artwork', true)
ON CONFLICT (id) DO NOTHING;

-- Create table for signage artwork metadata
CREATE TABLE IF NOT EXISTS signage_artwork (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  file_name text NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(file_name)
);

-- Enable Row Level Security
ALTER TABLE signage_artwork ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can access signage_artwork" ON signage_artwork;

-- Create policy for authenticated users to access signage_artwork
CREATE POLICY "Authenticated users can access signage_artwork"
  ON signage_artwork
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_signage_artwork_updated_at ON signage_artwork;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_signage_artwork_updated_at
  BEFORE UPDATE ON signage_artwork
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Signage artwork files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage signage artwork" ON storage.objects;

-- Create storage policies for signage-artwork bucket
CREATE POLICY "Signage artwork files are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'signage-artwork');

CREATE POLICY "Authenticated users can manage signage artwork"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'signage-artwork')
  WITH CHECK (bucket_id = 'signage-artwork');