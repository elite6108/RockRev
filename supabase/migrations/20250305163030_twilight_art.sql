/*
  # Create PPE Icons Storage Bucket

  1. New Storage Bucket
    - Creates a new bucket called 'ppe-icons' for storing PPE icon images
    - Enables public access for reading icons
    - Restricts uploads to authenticated users only

  2. Security
    - Enables RLS policies for the bucket
    - Adds policy for public read access
    - Adds policy for authenticated users to upload/delete
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('ppe-icons', 'ppe-icons', true);

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public access to read icons
CREATE POLICY "Give public access to PPE icons" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'ppe-icons');

-- Allow authenticated users to upload and delete icons
CREATE POLICY "Allow authenticated users to upload PPE icons" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ppe-icons');

CREATE POLICY "Allow authenticated users to delete their PPE icons" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'ppe-icons' AND auth.uid() = owner);