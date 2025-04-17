/*
  # Add notes field to purchase orders

  1. Changes
    - Add notes column to purchase_orders table
*/

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS notes text;