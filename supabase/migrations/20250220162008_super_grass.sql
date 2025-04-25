/*
  # Fix supplier name uniqueness

  1. Changes
    - Remove global unique constraint on supplier name
    - Add unique constraint for supplier name per user
    - This allows different users to have suppliers with the same name
    - Ensures a single user can't have duplicate supplier names

  2. Security
    - Maintains existing RLS policies
    - No changes to access control
*/

-- Drop the existing unique constraint on name
ALTER TABLE suppliers
DROP CONSTRAINT IF EXISTS suppliers_name_key;

-- Add a new unique constraint that combines name and user_id
ALTER TABLE suppliers
ADD CONSTRAINT suppliers_name_user_id_key UNIQUE (name, user_id);