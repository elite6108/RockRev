-- Add new columns to equipment table
ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS purchase_date date,
  ADD COLUMN IF NOT EXISTS warranty_expiry date,
  ADD COLUMN IF NOT EXISTS inspection_interval text,
  ADD COLUMN IF NOT EXISTS inspection_frequency text,
  ADD COLUMN IF NOT EXISTS inspection_notes text,
  ADD COLUMN IF NOT EXISTS service_interval_value text,
  ADD COLUMN IF NOT EXISTS service_interval_unit text,
  ADD COLUMN IF NOT EXISTS service_notes text;

-- Remove default values after adding columns
ALTER TABLE equipment
  ALTER COLUMN category DROP DEFAULT,
  ALTER COLUMN location DROP DEFAULT;