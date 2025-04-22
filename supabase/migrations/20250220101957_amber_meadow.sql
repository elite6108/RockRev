/*
  # Add VAT and Company Number fields to company settings

  1. Changes
    - Add vat_number column to company_settings table
    - Add company_number column to company_settings table
*/

ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS vat_number text,
  ADD COLUMN IF NOT EXISTS company_number text;