/*
  # Add Equipment Checklist Images Storage

  1. New Storage Bucket
    - Creates a new storage bucket for equipment checklist images
    - Enables public access for reading images
    - Sets appropriate security policies

  2. Security
    - Enables RLS
    - Adds policy for public read access
    - Adds policies for authenticated users to upload/delete
*/

-- Create storage bucket for equipment checklist images
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-checklist-images', 'equipment-checklist-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for equipment checklist images
CREATE POLICY "Equipment checklist images are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'equipment-checklist-images');

CREATE POLICY "Authenticated users can manage equipment checklist images"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'equipment-checklist-images')
  WITH CHECK (bucket_id = 'equipment-checklist-images');