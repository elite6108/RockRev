/*
  # Add missing columns to RAMS table
  
  1. Changes
    - Add missing columns for RAMS:
      - hazards (JSONB array)
      - fire_action_plan (text)
      - clean_up (text)
      - order_of_works_safety (text)
      - order_of_works_custom (text)
      - delivery_info (text)
      - groundworks_info (text)
      - additional_info (text)
      - ppe (text array)

  2. Security
    - No changes to RLS policies needed
*/

-- Add missing columns to RAMS table
ALTER TABLE rams 
ADD COLUMN IF NOT EXISTS hazards JSONB[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS fire_action_plan TEXT,
ADD COLUMN IF NOT EXISTS clean_up TEXT,
ADD COLUMN IF NOT EXISTS order_of_works_safety TEXT,
ADD COLUMN IF NOT EXISTS order_of_works_custom TEXT,
ADD COLUMN IF NOT EXISTS delivery_info TEXT,
ADD COLUMN IF NOT EXISTS groundworks_info TEXT,
ADD COLUMN IF NOT EXISTS additional_info TEXT,
ADD COLUMN IF NOT EXISTS ppe TEXT[] DEFAULT '{}';