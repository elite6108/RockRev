/*
  # Add display name to user profiles

  1. Changes
    - Add display_name column to auth.users
    - Add function to update display_name
*/

ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS display_name text;

-- Function to update display name
CREATE OR REPLACE FUNCTION auth.update_display_name(new_display_name text)
RETURNS void AS $$
BEGIN
  UPDATE auth.users
  SET display_name = new_display_name
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;