/*
  # Add additional_info column to RAMS table

  1. Changes
    - Adds additional_info column to rams table
*/

ALTER TABLE rams
ADD COLUMN additional_info text DEFAULT NULL;