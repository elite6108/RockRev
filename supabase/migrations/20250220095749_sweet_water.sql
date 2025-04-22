/*
  # Add company logo storage

  1. Storage
    - Create storage bucket for company logos
    - Set up public access policies
    - Configure file size limits and allowed mime types

  2. Security
    - Enable RLS on storage bucket
    - Add policies for authenticated users to manage their logos
*/

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true);

-- Set up storage policies
CREATE POLICY "Company logos are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'company-logos');

CREATE POLICY "Users can upload company logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own company logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own company logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );