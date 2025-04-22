/*
  # Create PPE Icons Storage Bucket

  1. New Storage Bucket
    - Creates a new public storage bucket for PPE icons if it doesn't exist
    - Enables public access for reading icons
    - Sets appropriate security policies

  2. Security
    - Enables RLS
    - Adds policy for public read access
    - Adds policies for authenticated users to upload/delete
*/

DO $$
BEGIN
  -- Create the storage bucket if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'ppe-icons'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('ppe-icons', 'ppe-icons', true);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;
END $$;

-- Allow public read access to all files in the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ppe-icons');

-- Allow authenticated users to upload and delete files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ppe-icons');

CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ppe-icons');