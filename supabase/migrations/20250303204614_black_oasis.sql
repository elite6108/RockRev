-- Create storage bucket for RAMS files
INSERT INTO storage.buckets (id, name, public)
VALUES ('rams-files', 'rams-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for RAMS files
CREATE POLICY "RAMS files are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'rams-files');

CREATE POLICY "Authenticated users can manage RAMS files"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'rams-files')
  WITH CHECK (bucket_id = 'rams-files');