/*
  # Add content and type columns to hs_policy_files table

  1. Changes
    - Add content column to store policy content
    - Add type column to distinguish between uploaded and created policies
    - Add check constraint for type values
*/

-- Add content column
ALTER TABLE hs_policy_files 
ADD COLUMN IF NOT EXISTS content text;

-- Add type column with check constraint
ALTER TABLE hs_policy_files 
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'uploaded'
CHECK (type IN ('uploaded', 'created'));

-- Add index on type column for better query performance
CREATE INDEX IF NOT EXISTS idx_hs_policy_files_type ON hs_policy_files(type);