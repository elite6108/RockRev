/*
  # Add missing columns to RAMS table

  1. New Columns
    - `clean_up` (text) - For storing clean up procedures
    - `order_of_works_safety` (text) - For storing safety-related work order
    - `order_of_works_task` (text) - For storing task type ('groundworks' or 'custom')
    - `order_of_works_custom` (text) - For storing custom work order
    - `delivery_info` (text) - For storing delivery information
    - `groundworks_info` (text) - For storing groundworks information
    - `additional_info` (text) - For storing additional information

  2. Changes
    - Add new columns with appropriate defaults and constraints
    - Add check constraint for order_of_works_task
*/

-- Add new columns
ALTER TABLE rams
ADD COLUMN IF NOT EXISTS clean_up text,
ADD COLUMN IF NOT EXISTS order_of_works_safety text,
ADD COLUMN IF NOT EXISTS order_of_works_task text DEFAULT 'groundworks',
ADD COLUMN IF NOT EXISTS order_of_works_custom text,
ADD COLUMN IF NOT EXISTS delivery_info text,
ADD COLUMN IF NOT EXISTS groundworks_info text,
ADD COLUMN IF NOT EXISTS additional_info text;

-- Add check constraint for order_of_works_task
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rams_order_of_works_task_check'
  ) THEN
    ALTER TABLE rams
    ADD CONSTRAINT rams_order_of_works_task_check
    CHECK (order_of_works_task IN ('groundworks', 'custom'));
  END IF;
END $$;