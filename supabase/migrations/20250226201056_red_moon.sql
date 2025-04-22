-- Add payment_terms column to quotes table
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS payment_terms text;