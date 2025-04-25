/*
  # Update quote numbers format

  1. Changes
    - Updates existing quote numbers from Q-###### to OPG-Q-######
    - Ensures all future quote numbers follow the new format
*/

-- Update existing quote numbers
UPDATE quotes
SET quote_number = REPLACE(quote_number, 'Q-', 'OPG-Q-')
WHERE quote_number LIKE 'Q-%';