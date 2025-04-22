-- Add presenter and attendees columns to toolbox_talks table
ALTER TABLE toolbox_talks
  ADD COLUMN IF NOT EXISTS presenter text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS attendees jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Remove default values after adding columns
ALTER TABLE toolbox_talks
  ALTER COLUMN presenter DROP DEFAULT;

-- Create storage bucket for toolbox talks PDFs if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('toolbox-talks', 'toolbox-talks', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for toolbox talks PDFs
CREATE POLICY "Toolbox talks PDFs are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'toolbox-talks');

CREATE POLICY "Users can upload toolbox talks PDFs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'toolbox-talks');

CREATE POLICY "Users can update their own toolbox talks PDFs"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'toolbox-talks');

CREATE POLICY "Users can delete their own toolbox talks PDFs"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'toolbox-talks');