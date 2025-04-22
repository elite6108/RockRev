/*
  # Fix Purchase Order Number Generation

  1. Changes
    - Make order_number field auto-generated before insert
    - Update trigger to run BEFORE INSERT instead of after
    - Ensure order_number is set before any constraints are checked

  2. Security
    - No changes to RLS policies
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_set_po_number ON purchase_orders;

-- Recreate the trigger to run BEFORE INSERT
CREATE TRIGGER trigger_set_po_number
  BEFORE INSERT ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_po_number();

-- Recreate the function to ensure it's the latest version
CREATE OR REPLACE FUNCTION set_po_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set the order_number, regardless of whether it's NULL
  NEW.order_number := generate_po_number();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;