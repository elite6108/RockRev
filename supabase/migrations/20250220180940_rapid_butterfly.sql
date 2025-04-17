/*
  # Update policies for shared company access
  
  This migration updates the policies to allow all authenticated users to access all company data,
  removing user-specific restrictions since this is a single-company CRM.

  1. Changes
    - Drop user-specific policies
    - Create new policies allowing all authenticated users to access all data
    - Simplify storage policies for company logos
    
  2. Security
    - Maintains authentication requirement
    - Allows all authenticated users to access all company data
    - Simplifies access patterns for shared company resources
*/

-- Drop existing user-specific policies
DROP POLICY IF EXISTS "Users can read own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can create own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can update own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can delete own suppliers" ON suppliers;

DROP POLICY IF EXISTS "Users can read own projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

DROP POLICY IF EXISTS "Users can read own purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can create own purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can update own purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can delete own purchase_orders" ON purchase_orders;

DROP POLICY IF EXISTS "Users can read own company_settings" ON company_settings;
DROP POLICY IF EXISTS "Users can create own company_settings" ON company_settings;
DROP POLICY IF EXISTS "Users can update own company_settings" ON company_settings;

DROP POLICY IF EXISTS "Users can read own customers" ON customers;
DROP POLICY IF EXISTS "Users can create customers" ON customers;
DROP POLICY IF EXISTS "Users can update own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete own customers" ON customers;

DROP POLICY IF EXISTS "Users can read own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can create quotes" ON quotes;
DROP POLICY IF EXISTS "Users can update own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can delete own quotes" ON quotes;

-- Create new shared access policies for suppliers
CREATE POLICY "Authenticated users can access suppliers"
  ON suppliers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new shared access policies for projects
CREATE POLICY "Authenticated users can access projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new shared access policies for purchase_orders
CREATE POLICY "Authenticated users can access purchase_orders"
  ON purchase_orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new shared access policies for company_settings
CREATE POLICY "Authenticated users can access company_settings"
  ON company_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new shared access policies for customers
CREATE POLICY "Authenticated users can access customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new shared access policies for quotes
CREATE POLICY "Authenticated users can access quotes"
  ON quotes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update storage policies for company logos
DROP POLICY IF EXISTS "Users can upload company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own company logos" ON storage.objects;

CREATE POLICY "Authenticated users can manage company logos"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'company-logos')
  WITH CHECK (bucket_id = 'company-logos');