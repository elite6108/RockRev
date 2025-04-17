import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import type { RAMS } from '../../../../types/database';
import type { RAMSFormData } from '../../../../types/rams';

// Import all screen components
import { ProjectInformation } from './01-ProjectInformation';
import { SiteAddress } from './02-SiteAddress';
import { SiteHours } from './03-SiteHours';
import { SupervisorArrangements } from './04-SupervisorArrangements';
import { DescriptionOfWorks } from './05-DescriptionOfWorks';
import { OperationalSequence } from './06-OperationalSequence';
import { StabilityAndPermits } from './07-StabilityAndPermits';
import { Workers } from './08-Workers';
import { ToolsAndPlant } from './09-ToolsAndPlant';
import { Lighting } from './10-Lighting';
import { Deliveries } from './11-Deliveries';
import { Services } from './12-Services';
import { AccessEquipment } from './13-AccessEquipment';
import { HazardousEquipment } from './14-HazardousEquipment';
import { PPE } from './15-PPE';
import { WelfareAndFirstAid } from './16-WelfareAndFirstAid';
import { FireActionPlan } from './17-FireActionPlan';
import { ProtectionOfPublic } from './18-ProtectionOfPublic';
import { CleanUp } from './19-CleanUp';
import { OrderOfWorks } from './20-OrderOfWorks';
import { OrderOfWorksTasks } from './21-OrderOfWorksTasks';
import { RisksAndHazards } from './22-RisksAndHazards';

interface RAMSFormProps {
  onClose: () => void;
  onSuccess: () => void;
  ramsToEdit?: RAMS | null;
}

type Step = 
  | '01-project'
  | '02-site'
  | '03-hours'
  | '04-supervisor'
  | '05-description'
  | '06-sequence'
  | '07-stability'
  | '08-workers'
  | '09-tools'
  | '10-lighting'
  | '11-deliveries'
  | '12-services'
  | '13-access'
  | '14-hazardous'
  | '15-ppe'
  | '16-welfare'
  | '17-fire'
  | '18-public'
  | '19-cleanup'
  | '20-works'
  | '21-tasks'
  | '22-hazards';

export function RAMSForm({ onClose, onSuccess, ramsToEdit }: RAMSFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>('01-project');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RAMSFormData>({
    reference: ramsToEdit?.reference || '',
    client_name: ramsToEdit?.client_name || '',
    site_manager: ramsToEdit?.site_manager || '',
    assessor: ramsToEdit?.assessor || '',
    approved_by: ramsToEdit?.approved_by || 'R. Stewart',
    address_line1: ramsToEdit?.address_line1 || '',
    address_line2: ramsToEdit?.address_line2 || '',
    address_line3: ramsToEdit?.address_line3 || '',
    site_town: ramsToEdit?.site_town || '',
    site_county: ramsToEdit?.site_county || '',
    post_code: ramsToEdit?.post_code || '',
    site_hours: ramsToEdit?.site_hours || '',
    supervision: ramsToEdit?.supervision || '',
    description: ramsToEdit?.description || '',
    sequence: ramsToEdit?.sequence || '',
    stability: ramsToEdit?.stability || '',
    special_permits: ramsToEdit?.special_permits || '',
    workers: ramsToEdit?.workers || '',
    tools_equipment: ramsToEdit?.tools_equipment || '',
    plant_equipment: ramsToEdit?.plant_equipment || '',
    lighting: ramsToEdit?.lighting || '',
    deliveries: ramsToEdit?.deliveries || '',
    services: ramsToEdit?.services || '',
    access_equipment: ramsToEdit?.access_equipment || '',
    hazardous_equipment: ramsToEdit?.hazardous_equipment || '',
    welfare_first_aid: ramsToEdit?.welfare_first_aid || '',
    nearest_hospital: ramsToEdit?.nearest_hospital || '',
    fire_action_plan: ramsToEdit?.fire_action_plan || '',
    protection_of_public: ramsToEdit?.protection_of_public || '',
    clean_up: ramsToEdit?.clean_up || '',
    order_of_works_safety: ramsToEdit?.order_of_works_safety || '',
    order_of_works_task: ramsToEdit?.order_of_works_task || 'groundworks',
    order_of_works_custom: ramsToEdit?.order_of_works_custom || '',
    delivery_info: ramsToEdit?.delivery_info || '',
    groundworks_info: ramsToEdit?.groundworks_info || '',
    additional_info: ramsToEdit?.additional_info || '',
    ppe: ramsToEdit?.ppe || [],
    hazards: ramsToEdit?.hazards || []
  });

  const handleChange = (data: Partial<RAMSFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...data
    }));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case '01-project':
        if (!formData.reference) return 'Reference is required';
        if (!formData.client_name) return 'Client is required';
        if (!formData.site_manager) return 'Site Manager is required';
        if (!formData.assessor) return 'Assessor is required';
        break;
      case '02-site':
        if (!formData.address_line1) return 'First line of address is required';
        if (!formData.site_town) return 'Town is required';
        if (!formData.site_county) return 'County is required';
        if (!formData.post_code) return 'Post code is required';
        break;
      case '05-description':
        if (!formData.description) return 'Description is required';
        break;
      case '06-sequence':
        if (!formData.sequence) return 'Operational sequence is required';
        break;
      case '22-hazards':
        if (!formData.hazards?.length) return 'At least one hazard is required';
        break;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!e.isTrusted) {
      // Prevent programmatic form submissions
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const validationError = validateCurrentStep();
      if (validationError) {
        throw new Error(validationError);
      }

      let error;
      if (ramsToEdit) {
        // Update existing RAMS
        ({ error } = await supabase
          .from('rams')
          .update({
            reference: formData.reference,
            client_name: formData.client_name,
            site_manager: formData.site_manager,
            assessor: formData.assessor,
            approved_by: formData.approved_by,
            address_line1: formData.address_line1,
            address_line2: formData.address_line2 || null,
            address_line3: formData.address_line3 || null,
            site_town: formData.site_town,
            site_county: formData.site_county,
            post_code: formData.post_code,
            site_hours: formData.site_hours,
            supervision: formData.supervision,
            description: formData.description || null,
            sequence: formData.sequence || null,
            stability: formData.stability || null,
            special_permits: formData.special_permits || null,
            workers: formData.workers || null,
            tools_equipment: formData.tools_equipment || null,
            plant_equipment: formData.plant_equipment || null,
            lighting: formData.lighting || null,
            deliveries: formData.deliveries || null,
            services: formData.services || null,
            access_equipment: formData.access_equipment || null,
            hazardous_equipment: formData.hazardous_equipment || null,
            welfare_first_aid: formData.welfare_first_aid || null,
            nearest_hospital: formData.nearest_hospital || null,
            fire_action_plan: formData.fire_action_plan || null,
            protection_of_public: formData.protection_of_public || null,
            clean_up: formData.clean_up || null,
            order_of_works_safety: formData.order_of_works_safety || null,
            order_of_works_task: formData.order_of_works_task || null,
            order_of_works_custom: formData.order_of_works_custom || null,
            delivery_info: formData.delivery_info || null,
            groundworks_info: formData.groundworks_info || null,
            additional_info: formData.additional_info || null,
            ppe: formData.ppe || [],
            hazards: formData.hazards || []
          })
          .eq('id', ramsToEdit.id));
      } else {
        // Create new RAMS
        ({ error } = await supabase
          .from('rams')
          .insert([{
            ...formData,
            user_id: user.id,
            date: new Date().toISOString().split('T')[0]
          }]));
      }

      if (error) throw error;
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving RAMS:', err);
      // Show detailed error message
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null) {
        // Handle Supabase error object
        const supabaseError = err as { message?: string; details?: string; hint?: string };
        setError(
          [
            supabaseError.message,
            supabaseError.details,
            supabaseError.hint
          ].filter(Boolean).join('\n')
        );
      } else {
        setError('An unexpected error occurred while saving the RAMS');
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    const steps: Step[] = [
      '01-project', '02-site', '03-hours', '04-supervisor',
      '05-description', '06-sequence', '07-stability', '08-workers',
      '09-tools', '10-lighting', '11-deliveries', '12-services',
      '13-access', '14-hazardous', '15-ppe', '16-welfare',
      '17-fire', '18-public', '19-cleanup', '20-works',
      '21-tasks', '22-hazards'
    ];

    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const previousStep = () => {
    setError(null);
    const steps: Step[] = [
      '01-project', '02-site', '03-hours', '04-supervisor',
      '05-description', '06-sequence', '07-stability', '08-workers',
      '09-tools', '10-lighting', '11-deliveries', '12-services',
      '13-access', '14-hazardous', '15-ppe', '16-welfare',
      '17-fire', '18-public', '19-cleanup', '20-works',
      '21-tasks', '22-hazards'
    ];

    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const getCurrentStepNumber = () => {
    const steps: Step[] = [
      '01-project', '02-site', '03-hours', '04-supervisor',
      '05-description', '06-sequence', '07-stability', '08-workers',
      '09-tools', '10-lighting', '11-deliveries', '12-services',
      '13-access', '14-hazardous', '15-ppe', '16-welfare',
      '17-fire', '18-public', '19-cleanup', '20-works',
      '21-tasks', '22-hazards'
    ];
    return steps.indexOf(currentStep) + 1;
  };

  const renderStep = () => {
    switch (currentStep) {
      case '01-project':
        return <ProjectInformation data={formData} onChange={handleChange} />;
      case '02-site':
        return <SiteAddress data={formData} onChange={handleChange} />;
      case '03-hours':
        return <SiteHours data={formData} onChange={handleChange} />;
      case '04-supervisor':
        return <SupervisorArrangements data={formData} onChange={handleChange} />;
      case '05-description':
        return <DescriptionOfWorks data={formData} onChange={handleChange} />;
      case '06-sequence':
        return <OperationalSequence data={formData} onChange={handleChange} />;
      case '07-stability':
        return <StabilityAndPermits data={formData} onChange={handleChange} />;
      case '08-workers':
        return <Workers data={formData} onChange={handleChange} />;
      case '09-tools':
        return <ToolsAndPlant data={formData} onChange={handleChange} />;
      case '10-lighting':
        return <Lighting data={formData} onChange={handleChange} />;
      case '11-deliveries':
        return <Deliveries data={formData} onChange={handleChange} />;
      case '12-services':
        return <Services data={formData} onChange={handleChange} />;
      case '13-access':
        return <AccessEquipment data={formData} onChange={handleChange} />;
      case '14-hazardous':
        return <HazardousEquipment data={formData} onChange={handleChange} />;
      case '15-ppe':
        return <PPE data={formData} onChange={handleChange} />;
      case '16-welfare':
        return <WelfareAndFirstAid data={formData} onChange={handleChange} />;
      case '17-fire':
        return <FireActionPlan data={formData} onChange={handleChange} />;
      case '18-public':
        return <ProtectionOfPublic data={formData} onChange={handleChange} />;
      case '19-cleanup':
        return <CleanUp data={formData} onChange={handleChange} />;
      case '20-works':
        return <OrderOfWorks data={formData} onChange={handleChange} />;
      case '21-tasks':
        return <OrderOfWorksTasks data={formData} onChange={handleChange} />;
      case '22-hazards':
        return <RisksAndHazards data={formData} onChange={handleChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-start sm:items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 max-h-[calc(100vh-2rem)] sm:max-h-[800px] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 px-8 py-4 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{ramsToEdit ? 'Edit RAMS' : 'New RAMS'}</h2>
              <p className="text-sm text-gray-500 mt-1">Step {getCurrentStepNumber()} of 22</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="mt-4">
            <div className="flex space-x-1">
              {Array.from({ length: 22 }).map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 h-2 rounded-full ${
                    index + 1 <= getCurrentStepNumber() ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderStep()}

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-4 rounded-md">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between pt-6 border-t space-y-4 sm:space-y-0">
              <div>
                {currentStep !== '01-project' && (
                  <button
                    type="button"
                    onClick={previousStep}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Previous
                  </button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-red-600 dark:hover:text-white"
                >
                  Cancel
                </button>
                {currentStep === '22-hazards' ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}