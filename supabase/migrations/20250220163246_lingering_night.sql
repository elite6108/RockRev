/*
  # Update RLS Policies for Full Access

  1. Changes
    - Update all policies to allow any authenticated user to access all data
    - Remove user_id checks from policies
    - Maintain basic authentication check to prevent public access

  2. Security
    - Any authenticated user can access all data
    - Public access still restricted
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can create suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can update own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can delete own suppliers" ON suppliers;

DROP POLICY IF EXISTS "Users can read own projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

DROP POLICY IF EXISTS "Users can read own purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can create purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can update own purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can delete own purchase orders" ON purchase_orders;

DROP POLICY IF EXISTS "Users can read own customers" ON customers;
DROP POLICY IF EXISTS "Users can create customers" ON customers;
DROP POLICY IF EXISTS "Users can update own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete own customers" ON customers;

DROP POLICY IF EXISTS "Users can read own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can create quotes" ON quotes;
DROP POLICY IF EXISTS "Users can update own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can delete own quotes" ON quotes;

DROP POLICY IF EXISTS "Users can read own company settings" ON company_settings;
DROP POLICY IF EXISTS "Users can create company settings" ON company_settings;
DROP POLICY IF EXISTS "Users can update own company settings" ON company_settings;

-- Create new policies for suppliers
CREATE POLICY "Authenticated users can read suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (true);

-- Create new policies for projects
CREATE POLICY "Authenticated users can read projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (true);

-- Create new policies for purchase_orders
CREATE POLICY "Authenticated users can read purchase orders"
  ON purchase_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create purchase orders"
  ON purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update purchase orders"
  ON purchase_orders FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete purchase orders"
  ON purchase_orders FOR DELETE
  TO authenticated
  USING (true);

-- Create new policies for customers
CREATE POLICY "Authenticated users can read customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- Create new policies for quotes
CREATE POLICY "Authenticated users can read quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create quotes"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete quotes"
  ON quotes FOR DELETE
  TO authenticated
  USING (true);

-- Create new policies for company_settings
CREATE POLICY "Authenticated users can read company settings"
  ON company_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create company settings"
  ON company_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update company settings"
  ON company_settings FOR UPDATE
  TO authenticated
  USING (true);