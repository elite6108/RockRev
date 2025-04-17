/*
  # Fix storage policies for company logo uploads

  1. Changes
    - Add missing storage policies for company logos bucket
    - Fix RLS policies to properly handle file paths
    - Add policy for handling file overwrites

  2. Security
    - Ensure users can only access their own files
    - Maintain public read access for logos
    - Add proper path validation
*/

-- Drop existing policies to recreate them with correct paths
DROP POLICY IF EXISTS "Company logos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own company logos" ON storage.objects;

-- Recreate policies with correct path handling
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
    AND STARTS_WITH(name, auth.uid()::text)
  );

CREATE POLICY "Users can update their own company logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND STARTS_WITH(name, auth.uid()::text)
  );

CREATE POLICY "Users can delete their own company logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND STARTS_WITH(name, auth.uid()::text)
  );

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;