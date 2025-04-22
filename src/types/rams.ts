export interface RAMSFormData {
  id?: string;
  created_at?: string;
  updated_at?: string;
  rams_number?: string;
  // Project Information
  reference: string;
  client_name: string;
  site_manager: string;
  assessor: string;
  approved_by: string;

  // Site Information
  address_line1: string;
  address_line2: string;
  address_line3: string;
  site_town: string;
  site_county: string;
  post_code: string;
  site_hours: string;
  supervision: string;
  description?: string;
  sequence?: string;
  stability?: string;
  special_permits?: string;
  workers?: string;
  tools_equipment?: string;
  plant_equipment?: string;
  lighting?: string;
  deliveries?: string;
  services?: string;
  access_equipment?: string;
  hazardous_equipment?: string;
  welfare_first_aid?: string;
  nearest_hospital?: string;
  fire_action_plan?: string;
  protection_of_public?: string;
  clean_up?: string;
  order_of_works_safety?: string;
  order_of_works_task?: 'groundworks' | 'custom';
  order_of_works_custom?: string;
  delivery_info?: string;
  groundworks_info?: string;
  additional_info?: string;
  ppe?: string[];
  hazards?: any[];
}

export const ASSESSOR_OPTIONS = [
  'C. Harris',
  'M. Heartgrove',
  'G. Catania',
  'R. Barrett',
  'R. Stewart'
] as const;

export type Assessor = typeof ASSESSOR_OPTIONS[number];

export const DEFAULT_SITE_HOURS = "8.00 AM – 18.00 PM Monday to Friday, or site specific. Extensions with agreement"; 