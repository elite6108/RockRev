-- Add new columns to vehicles table
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS vin text,
  ADD COLUMN IF NOT EXISTS has_congestion boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_dartford boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_clean_air boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_interval_value text,
  ADD COLUMN IF NOT EXISTS service_interval_unit text DEFAULT 'Miles',
  ADD COLUMN IF NOT EXISTS notes text;

-- Set default values for existing rows
UPDATE vehicles SET
  has_congestion = false WHERE has_congestion IS NULL;

UPDATE vehicles SET
  has_dartford = false WHERE has_dartford IS NULL;

UPDATE vehicles SET
  has_clean_air = false WHERE has_clean_air IS NULL;

UPDATE vehicles SET
  service_interval_unit = 'Miles' WHERE service_interval_unit IS NULL;

-- Add NOT NULL constraints for boolean columns
ALTER TABLE vehicles
  ALTER COLUMN has_congestion SET NOT NULL,
  ALTER COLUMN has_dartford SET NOT NULL,
  ALTER COLUMN has_clean_air SET NOT NULL;