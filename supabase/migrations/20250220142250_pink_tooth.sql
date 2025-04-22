/*
  # Update quote number format

  1. Changes
    - Update quote number format from Q-###### to OPG-Q-######
    - Modify the generate_quote_number() function to use the new format
*/

-- Drop existing function and recreate with new format
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS text AS $$
DECLARE
  last_number integer;
  new_number text;
BEGIN
  -- Get the last number from existing quote numbers
  SELECT COALESCE(MAX(NULLIF(regexp_replace(quote_number, '^OPG-Q-', ''), '')), '000000')::integer
  INTO last_number
  FROM quotes
  WHERE quote_number ~ '^OPG-Q-\d+$';

  -- Generate new number with OPG-Q- prefix
  new_number := 'OPG-Q-' || LPAD((last_number + 1)::text, 6, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;