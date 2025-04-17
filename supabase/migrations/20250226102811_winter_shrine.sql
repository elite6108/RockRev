/*
  # Add new fields to vehicle_checklists table

  1. New Columns
    - driver_name (text)
    - mileage (text)
    - frequency (text) with check constraint for daily/weekly/monthly
*/

ALTER TABLE vehicle_checklists
  ADD COLUMN IF NOT EXISTS driver_name text NOT NULL,
  ADD COLUMN IF NOT EXISTS mileage text NOT NULL,
  ADD COLUMN IF NOT EXISTS frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly'));