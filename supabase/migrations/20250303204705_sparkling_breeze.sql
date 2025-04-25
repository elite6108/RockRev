-- Create storage bucket for other policies if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('other-policies', 'other-policies', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Other policies are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage other-policies" ON storage.objects;

-- Create storage policies for other policies
CREATE POLICY "Other policies are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'other-policies');

CREATE POLICY "Authenticated users can manage other-policies"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'other-policies')
  WITH CHECK (bucket_id = 'other-policies');