-- Add instantly column to payment_terms table
ALTER TABLE payment_terms
  ADD COLUMN IF NOT EXISTS instantly text NOT NULL DEFAULT 'Payment is required instantly';