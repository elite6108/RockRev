-- Drop existing unique constraint on file_name and user_id
ALTER TABLE signage_artwork
DROP CONSTRAINT IF EXISTS signage_artwork_file_name_user_id_key;

-- Add new unique constraint on display_name and user_id instead
ALTER TABLE signage_artwork
ADD CONSTRAINT signage_artwork_display_name_user_id_key UNIQUE (display_name, user_id);