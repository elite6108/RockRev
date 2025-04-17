/*
  # Update Storage Configuration

  1. Changes
    - Increases the storage.buckets list limit for signage-artwork bucket
    - Allows listing up to 300 items at once
*/

ALTER TABLE storage.buckets 
ADD COLUMN IF NOT EXISTS list_options jsonb DEFAULT '{}'::jsonb;

UPDATE storage.buckets 
SET list_options = jsonb_set(
  COALESCE(list_options, '{}'::jsonb),
  '{maxResults}',
  '300'::jsonb
)
WHERE name = 'signage-artwork';