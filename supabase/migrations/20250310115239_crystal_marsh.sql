/*
  # Add CPP JSON Columns
  
  1. New Columns
    Adds JSONB columns to store CPP form data:
    - frontCover: Project and document information
    - projectDescription: Project details and scope
    - siteInformation: Site address and details
    - hoursTeam: Working hours and team members
    - managementWork: Supervision and training arrangements
    - managementStructure: Roles and responsibilities
    - siteRules: Site rules and PPE requirements
    - arrangements: Site arrangements and procedures
    - siteInduction: Induction process and topics
    - welfareArrangements: Welfare facilities
    - firstAidArrangements: First aid and emergency info
    - rescuePlan: Emergency procedures
    - specificMeasures: Specific control measures
    - hazards: Identified hazards and controls
    - highRiskWork: High risk construction activities
    - notifiableWork: F10 notification details
    - contractors: Contractor information
    - monitoring: Inspection and review process
    - hsFile: Health and safety file details
    - hazardIdentification: Hazard identification details

  2. Changes
    - All columns are JSONB type to store structured JSON data
    - All columns are nullable since fields are not mandatory
    - Adds review_date column for tracking review cycles
*/

-- Add JSONB columns for storing form data
ALTER TABLE public.cpps
ADD COLUMN IF NOT EXISTS frontCover jsonb,
ADD COLUMN IF NOT EXISTS projectDescription jsonb,
ADD COLUMN IF NOT EXISTS siteInformation jsonb,
ADD COLUMN IF NOT EXISTS hoursTeam jsonb,
ADD COLUMN IF NOT EXISTS managementWork jsonb,
ADD COLUMN IF NOT EXISTS managementStructure jsonb,
ADD COLUMN IF NOT EXISTS siteRules jsonb,
ADD COLUMN IF NOT EXISTS arrangements jsonb,
ADD COLUMN IF NOT EXISTS siteInduction jsonb,
ADD COLUMN IF NOT EXISTS welfareArrangements jsonb,
ADD COLUMN IF NOT EXISTS firstAidArrangements jsonb,
ADD COLUMN IF NOT EXISTS rescuePlan jsonb,
ADD COLUMN IF NOT EXISTS specificMeasures jsonb,
ADD COLUMN IF NOT EXISTS hazards jsonb,
ADD COLUMN IF NOT EXISTS highRiskWork jsonb,
ADD COLUMN IF NOT EXISTS notifiableWork jsonb,
ADD COLUMN IF NOT EXISTS contractors jsonb,
ADD COLUMN IF NOT EXISTS monitoring jsonb,
ADD COLUMN IF NOT EXISTS hsFile jsonb,
ADD COLUMN IF NOT EXISTS hazardIdentification jsonb,
ADD COLUMN IF NOT EXISTS review_date timestamptz;

-- Add comment to explain the table structure
COMMENT ON TABLE public.cpps IS 'Construction Phase Plans with JSON data structure';