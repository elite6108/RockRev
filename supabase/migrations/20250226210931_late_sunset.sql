-- Add payment_terms column to quotes table
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS payment_terms text;

-- Create toolbox_talk_pdfs table for storing PDF metadata
CREATE TABLE IF NOT EXISTS toolbox_talk_pdfs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  file_name text NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(file_name)
);

-- Enable Row Level Security
ALTER TABLE toolbox_talk_pdfs ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to access toolbox_talk_pdfs
CREATE POLICY "Authenticated users can access toolbox_talk_pdfs"
  ON toolbox_talk_pdfs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_toolbox_talk_pdfs_updated_at
  BEFORE UPDATE ON toolbox_talk_pdfs
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();