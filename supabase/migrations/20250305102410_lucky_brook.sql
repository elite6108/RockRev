-- Drop existing unique constraint on file_name
ALTER TABLE signage_artwork
DROP CONSTRAINT IF EXISTS signage_artwork_file_name_key;

-- Add new composite unique constraint
ALTER TABLE signage_artwork
ADD CONSTRAINT signage_artwork_file_name_user_id_key UNIQUE (file_name, user_id);