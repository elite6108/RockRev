/*
  # Update storage bucket configuration

  1. Changes
    - Updates the storage bucket configuration to allow listing more items
    - Sets the list limit to 300 items for the signage-artwork bucket
*/

-- Update storage bucket configuration
ALTER TABLE storage.buckets
ADD COLUMN IF NOT EXISTS list_limit INTEGER DEFAULT 100;

UPDATE storage.buckets
SET list_limit = 300
WHERE name = 'signage-artwork';