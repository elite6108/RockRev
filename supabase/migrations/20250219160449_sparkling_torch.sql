/*
  # Add address fields to suppliers table

  1. Changes
    - Add address fields to suppliers table:
      - address_line1 (text, required)
      - address_line2 (text, nullable)
      - town (text, required)
      - county (text, required)
      - post_code (text, required)

  2. Notes
    - All fields except address_line2 are required
    - Existing RLS policies will continue to apply
*/

ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS address_line1 text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS town text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS county text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS post_code text NOT NULL DEFAULT '';

-- Remove the default values after adding the columns
ALTER TABLE suppliers
  ALTER COLUMN address_line1 DROP DEFAULT,
  ALTER COLUMN town DROP DEFAULT,
  ALTER COLUMN county DROP DEFAULT,
  ALTER COLUMN post_code DROP DEFAULT;