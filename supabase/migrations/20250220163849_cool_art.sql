/*
  # Fix Delete Functionality

  1. Changes
    - Drop existing RLS policies for all tables
    - Create new policies that allow any authenticated user to perform CRUD operations
    - This change enables all users to interact with all data, regardless of who created it

  2. Security Note
    - This change removes user-level data isolation
    - All authenticated users will have full access to all data
    - Only use this in trusted environments where all users should have full access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can create suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can update own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can delete own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can read suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can create suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON suppliers;

DROP POLICY IF EXISTS "Users can read own projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can read projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON projects;

DROP POLICY IF EXISTS "Users can read own purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can create purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can update own purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can delete own purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can read purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can create purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can update purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can delete purchase orders" ON purchase_orders;

-- Create new policies for suppliers
CREATE POLICY "Full access for authenticated users"
  ON suppliers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new policies for projects
CREATE POLICY "Full access for authenticated users"
  ON projects
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new policies for purchase_orders
CREATE POLICY "Full access for authenticated users"
  ON purchase_orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);