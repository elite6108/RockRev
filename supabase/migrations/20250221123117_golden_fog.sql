-- Add due_payable column to quotes table
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS due_payable text;