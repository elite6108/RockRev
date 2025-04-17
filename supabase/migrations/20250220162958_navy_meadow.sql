/*
  # Fix Purchase Order Numbers

  1. Changes
    - Update order number generation to use OPG-PO- prefix
    - Update existing order numbers to use new format
    - Fix unique constraint issue

  2. Notes
    - This ensures consistency with quote numbers (OPG-Q-)
    - Prevents duplicate order number errors
*/

-- Update the function to generate order numbers with OPG-PO- prefix
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS text AS $$
DECLARE
  last_number integer;
  new_number text;
BEGIN
  -- Get the last number from existing PO numbers
  SELECT COALESCE(MAX(NULLIF(regexp_replace(order_number, '^OPG-PO-', ''), '')), '000000')::integer
  INTO last_number
  FROM purchase_orders
  WHERE order_number ~ '^OPG-PO-\d+$';

  -- Generate new number with OPG-PO- prefix
  new_number := 'OPG-PO-' || LPAD((last_number + 1)::text, 6, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Update existing order numbers
UPDATE purchase_orders
SET order_number = REPLACE(order_number, 'OPG-', 'OPG-PO-')
WHERE order_number LIKE 'OPG-%'
AND order_number NOT LIKE 'OPG-PO-%';