/*
  # Add type column to hs_policy_files table

  1. Changes
    - Add type column to distinguish between uploaded and created policies
    - Set default value to 'uploaded'
    - Add check constraint to ensure valid types
*/

ALTER TABLE hs_policy_files 
ADD COLUMN type text NOT NULL DEFAULT 'uploaded' 
CHECK (type IN ('uploaded', 'created'));