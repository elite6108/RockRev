/*
  # Add delivery address to purchase orders

  1. Changes
    - Add delivery_to column to purchase_orders table
*/

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS delivery_to text;