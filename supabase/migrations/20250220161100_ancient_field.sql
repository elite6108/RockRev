/*
  # Fix customer deletion constraint

  1. Changes
    - Add ON DELETE CASCADE to quotes.customer_id foreign key
    - This allows deleting customers even when they have associated quotes
*/

-- Drop the existing foreign key constraint
ALTER TABLE quotes
DROP CONSTRAINT IF EXISTS quotes_customer_id_fkey;

-- Re-create the constraint with ON DELETE CASCADE
ALTER TABLE quotes
ADD CONSTRAINT quotes_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES customers(id)
ON DELETE CASCADE;