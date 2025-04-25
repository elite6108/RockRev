/*
  # Update CPPs Table Schema
  
  1. Changes
    - Add all required JSONB columns to match frontend form data
    - All columns are nullable since fields are not mandatory
    - Use snake_case for column names to match PostgreSQL conventions
    - Add comments for better documentation
*/

-- Add new columns with snake_case naming
ALTER TABLE public.cpps
ADD COLUMN IF NOT EXISTS front_cover jsonb,
ADD COLUMN IF NOT EXISTS project_description jsonb,
ADD COLUMN IF NOT EXISTS site_information jsonb,
ADD COLUMN IF NOT EXISTS hours_team jsonb,
ADD COLUMN IF NOT EXISTS management_work jsonb,
ADD COLUMN IF NOT EXISTS management_structure jsonb,
ADD COLUMN IF NOT EXISTS site_rules jsonb,
ADD COLUMN IF NOT EXISTS arrangements jsonb,
ADD COLUMN IF NOT EXISTS site_induction jsonb,
ADD COLUMN IF NOT EXISTS welfare_arrangements jsonb,
ADD COLUMN IF NOT EXISTS first_aid_arrangements jsonb,
ADD COLUMN IF NOT EXISTS rescue_plan jsonb,
ADD COLUMN IF NOT EXISTS specific_measures jsonb,
ADD COLUMN IF NOT EXISTS hazards jsonb,
ADD COLUMN IF NOT EXISTS high_risk_work jsonb,
ADD COLUMN IF NOT EXISTS notifiable_work jsonb,
ADD COLUMN IF NOT EXISTS contractors jsonb,
ADD COLUMN IF NOT EXISTS monitoring jsonb,
ADD COLUMN IF NOT EXISTS hs_file jsonb,
ADD COLUMN IF NOT EXISTS hazard_identification jsonb;

-- Add comment to explain the table structure
COMMENT ON TABLE public.cpps IS 'Construction Phase Plans with JSON data structure';

-- Add comments for each column
COMMENT ON COLUMN public.cpps.front_cover IS 'Project and document information';
COMMENT ON COLUMN public.cpps.project_description IS 'Project details and scope';
COMMENT ON COLUMN public.cpps.site_information IS 'Site address and details';
COMMENT ON COLUMN public.cpps.hours_team IS 'Working hours and team members';
COMMENT ON COLUMN public.cpps.management_work IS 'Supervision and training arrangements';
COMMENT ON COLUMN public.cpps.management_structure IS 'Roles and responsibilities';
COMMENT ON COLUMN public.cpps.site_rules IS 'Site rules and PPE requirements';
COMMENT ON COLUMN public.cpps.arrangements IS 'Site arrangements and procedures';
COMMENT ON COLUMN public.cpps.site_induction IS 'Induction process and topics';
COMMENT ON COLUMN public.cpps.welfare_arrangements IS 'Welfare facilities';
COMMENT ON COLUMN public.cpps.first_aid_arrangements IS 'First aid and emergency info';
COMMENT ON COLUMN public.cpps.rescue_plan IS 'Emergency procedures';
COMMENT ON COLUMN public.cpps.specific_measures IS 'Specific control measures';
COMMENT ON COLUMN public.cpps.hazards IS 'Identified hazards and controls';
COMMENT ON COLUMN public.cpps.high_risk_work IS 'High risk construction activities';
COMMENT ON COLUMN public.cpps.notifiable_work IS 'F10 notification details';
COMMENT ON COLUMN public.cpps.contractors IS 'Contractor information';
COMMENT ON COLUMN public.cpps.monitoring IS 'Inspection and review process';
COMMENT ON COLUMN public.cpps.hs_file IS 'Health and safety file details';
COMMENT ON COLUMN public.cpps.hazard_identification IS 'Hazard identification details';