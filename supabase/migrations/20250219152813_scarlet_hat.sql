/*
  # Add suppliers and update purchase orders

  1. New Tables
    - `suppliers`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
      - `user_id` (uuid, references auth.users)

  2. Updates to purchase_orders
    - Add `po_number` (text, unique)
    - Add `project_id` (uuid, references projects)
    - Add `supplier_id` (uuid, references suppliers)
    - Add `created_by_name` (text)
    - Add `order_date` (date)
    - Add `items` (jsonb array for line items)

  3. Security
    - Enable RLS on suppliers table
    - Add policies for suppliers table
*/

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

-- Enable RLS on suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Policies for suppliers
CREATE POLICY "Users can read suppliers"
  ON suppliers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create suppliers"
  ON suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add new columns to purchase_orders
ALTER TABLE purchase_orders 
  ADD COLUMN IF NOT EXISTS po_number text UNIQUE,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects,
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES suppliers,
  ADD COLUMN IF NOT EXISTS created_by_name text,
  ADD COLUMN IF NOT EXISTS order_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb;

-- Create function to generate sequential PO numbers
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS text AS $$
DECLARE
  last_number integer;
  new_number text;
BEGIN
  -- Get the last number from existing PO numbers
  SELECT COALESCE(MAX(NULLIF(regexp_replace(po_number, '^OPG-', ''), '')), '000000')::integer
  INTO last_number
  FROM purchase_orders
  WHERE po_number ~ '^OPG-\d+$';

  -- Generate new number
  new_number := 'OPG-' || LPAD((last_number + 1)::text, 6, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate PO number
CREATE OR REPLACE FUNCTION set_po_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.po_number IS NULL THEN
    NEW.po_number := generate_po_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_po_number
  BEFORE INSERT ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_po_number();