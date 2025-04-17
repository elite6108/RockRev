/*
  # Add payment terms columns

  1. Changes
    - Add `seven_days` and `thirty_days` columns to `payment_terms` table
    - Add default values for these columns

  2. Security
    - No changes to RLS policies needed
*/

-- Add new columns with default values
ALTER TABLE payment_terms 
ADD COLUMN seven_days text DEFAULT 'Payment is due within 7 days',
ADD COLUMN thirty_days text DEFAULT 'Payment is due within 30 days';