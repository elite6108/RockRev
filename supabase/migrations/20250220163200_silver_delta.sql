/*
  # Fix Delete Policies and Cascade Behavior

  1. Changes
    - Add delete policies for suppliers, projects, and purchase_orders tables
    - Add cascade delete for related records
    - Fix foreign key constraints

  2. Security
    - Only authenticated users can delete their own records
    - Cascading deletes ensure referential integrity
*/

-- Add delete policy for suppliers
CREATE POLICY "Users can delete own suppliers"
  ON suppliers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add delete policy for projects
CREATE POLICY "Users can delete own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add delete policy for purchase_orders
CREATE POLICY "Users can delete own purchase orders"
  ON purchase_orders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop existing foreign key constraints
ALTER TABLE purchase_orders
DROP CONSTRAINT IF EXISTS purchase_orders_project_id_fkey,
DROP CONSTRAINT IF EXISTS purchase_orders_supplier_id_fkey;

-- Re-create constraints with ON DELETE CASCADE
ALTER TABLE purchase_orders
ADD CONSTRAINT purchase_orders_project_id_fkey
FOREIGN KEY (project_id)
REFERENCES projects(id)
ON DELETE CASCADE;

ALTER TABLE purchase_orders
ADD CONSTRAINT purchase_orders_supplier_id_fkey
FOREIGN KEY (supplier_id)
REFERENCES suppliers(id)
ON DELETE CASCADE;