/*
  # Add content column to hs_policy_files table

  1. Changes
    - Add content column to store policy content
*/

ALTER TABLE hs_policy_files ADD COLUMN content text;