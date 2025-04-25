/*
  # Update CPPs Table Schema
  
  1. New Columns
    - frontcover: Project and document information
    - projectdescription: Project details and scope
    - siteinformation: Site address and details
    - hoursteam: Working hours and team members
    - managementwork: Supervision and training arrangements
    - managementstructure: Roles and responsibilities
    - siterules: Site rules and PPE requirements
    - siteinduction: Induction process and topics
    - welfarearrangements: Welfare facilities
    - firstaidarrangements: First aid and emergency info
    - rescueplan: Emergency procedures
    - specificmeasures: Specific control measures
    - hazards: Identified hazards and controls
    - highriskwork: High risk construction activities
    - notifiablework: F10 notification details
    - contractors: Contractor information
    - monitoring: Inspection and review process
    - hsfile: Health and safety file details
    - hazardidentification: Hazard identification details
  
  2. Changes
    - All columns are JSONB type and nullable
    - Adds review_date column
    - Adds comment explaining table purpose
*/

-- Drop existing columns if they exist with incorrect casing
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'firstAidArrangements') THEN
    ALTER TABLE public.cpps DROP COLUMN "firstAidArrangements";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cpps' AND column_name = 'arrangements') THEN
    ALTER TABLE public.cpps DROP COLUMN "arrangements";
  END IF;
END $$;

-- Add or update columns with correct casing
ALTER TABLE public.cpps
ADD COLUMN IF NOT EXISTS frontcover jsonb,
ADD COLUMN IF NOT EXISTS projectdescription jsonb,
ADD COLUMN IF NOT EXISTS siteinformation jsonb,
ADD COLUMN IF NOT EXISTS hoursteam jsonb,
ADD COLUMN IF NOT EXISTS managementwork jsonb,
ADD COLUMN IF NOT EXISTS managementstructure jsonb,
ADD COLUMN IF NOT EXISTS siterules jsonb,
ADD COLUMN IF NOT EXISTS arrangements jsonb,
ADD COLUMN IF NOT EXISTS siteinduction jsonb,
ADD COLUMN IF NOT EXISTS welfarearrangements jsonb,
ADD COLUMN IF NOT EXISTS firstaidarrangements jsonb,
ADD COLUMN IF NOT EXISTS rescueplan jsonb,
ADD COLUMN IF NOT EXISTS specificmeasures jsonb,
ADD COLUMN IF NOT EXISTS hazards jsonb,
ADD COLUMN IF NOT EXISTS highriskwork jsonb,
ADD COLUMN IF NOT EXISTS notifiablework jsonb,
ADD COLUMN IF NOT EXISTS contractors jsonb,
ADD COLUMN IF NOT EXISTS monitoring jsonb,
ADD COLUMN IF NOT EXISTS hsfile jsonb,
ADD COLUMN IF NOT EXISTS hazardidentification jsonb;

-- Add review_date column if not exists
ALTER TABLE public.cpps 
ADD COLUMN IF NOT EXISTS review_date timestamptz;

-- Add comment to explain the table structure
COMMENT ON TABLE public.cpps IS 'Construction Phase Plans with JSON data structure';