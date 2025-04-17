/*
  # Add new fields to RAMS table

  1. New Fields
    - reference (text, not null)
    - site_manager (text, not null)
    - assessor (text, not null)
    - approved_by (text, not null, default 'R. Stewart')
    - address_line1 (text, not null)
    - address_line2 (text)
    - address_line3 (text)
    - post_code (text, not null)
    - site_hours (text, not null)
    - supervision (text, not null)

  2. Changes
    - Adds default values for site_hours and supervision
    - Makes certain fields required with NOT NULL constraints
    - Handles existing rows by setting default values before NOT NULL constraints
*/

-- First, add columns with defaults where possible
ALTER TABLE rams
  ADD COLUMN IF NOT EXISTS reference text DEFAULT '',
  ADD COLUMN IF NOT EXISTS site_manager text DEFAULT '',
  ADD COLUMN IF NOT EXISTS assessor text DEFAULT '',
  ADD COLUMN IF NOT EXISTS approved_by text DEFAULT 'R. Stewart',
  ADD COLUMN IF NOT EXISTS address_line1 text DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS address_line3 text,
  ADD COLUMN IF NOT EXISTS post_code text DEFAULT '',
  ADD COLUMN IF NOT EXISTS site_hours text DEFAULT '8.00 AM – 18.00 PM Monday to Friday, or site specific. Extensions with agreement',
  ADD COLUMN IF NOT EXISTS supervision text DEFAULT 'The works will be managed by the site foreman outlined above. Site management will provide authorisation to begin work. All official communication will be through Robert Stewart, especially if there are any adjustments to the project whilst work is being carried out.';

-- Update any existing NULL values with defaults
UPDATE rams SET
  reference = '' WHERE reference IS NULL;

UPDATE rams SET
  site_manager = '' WHERE site_manager IS NULL;

UPDATE rams SET
  assessor = '' WHERE assessor IS NULL;

UPDATE rams SET
  approved_by = 'R. Stewart' WHERE approved_by IS NULL;

UPDATE rams SET
  address_line1 = '' WHERE address_line1 IS NULL;

UPDATE rams SET
  post_code = '' WHERE post_code IS NULL;

UPDATE rams SET
  site_hours = '8.00 AM – 18.00 PM Monday to Friday, or site specific. Extensions with agreement' 
  WHERE site_hours IS NULL;

UPDATE rams SET
  supervision = 'The works will be managed by the site foreman outlined above. Site management will provide authorisation to begin work. All official communication will be through Robert Stewart, especially if there are any adjustments to the project whilst work is being carried out.'
  WHERE supervision IS NULL;

-- Now add NOT NULL constraints
ALTER TABLE rams
  ALTER COLUMN reference SET NOT NULL,
  ALTER COLUMN site_manager SET NOT NULL,
  ALTER COLUMN assessor SET NOT NULL,
  ALTER COLUMN approved_by SET NOT NULL,
  ALTER COLUMN address_line1 SET NOT NULL,
  ALTER COLUMN post_code SET NOT NULL,
  ALTER COLUMN site_hours SET NOT NULL,
  ALTER COLUMN supervision SET NOT NULL;