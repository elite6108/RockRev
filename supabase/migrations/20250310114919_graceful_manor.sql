/*
  # Add CPP Columns

  1. New Columns
    - Adds JSON columns to store CPP form data:
      - frontCover
      - projectDescription 
      - siteInformation
      - hoursTeam
      - managementWork
      - managementStructure
      - siteRules
      - arrangements
      - siteInduction
      - welfareArrangements
      - firstAidArrangements
      - rescuePlan
      - specificMeasures
      - hazards
      - highRiskWork
      - notifiableWork
      - monitoring
      - hsFile
      - hazardIdentification
*/

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
ADD COLUMN IF NOT EXISTS monitoring jsonb,
ADD COLUMN IF NOT EXISTS hsFile jsonb,
ADD COLUMN IF NOT EXISTS hazardIdentification jsonb;