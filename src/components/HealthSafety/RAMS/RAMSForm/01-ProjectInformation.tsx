import React, { useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import type { RAMSFormData } from '../../../../types/rams';

interface ProjectInformationProps {
  data: RAMSFormData;
  onChange: (data: Partial<RAMSFormData>) => void;
}

export function ProjectInformation({ data, onChange }: ProjectInformationProps) {
  const handleChange = (field: keyof RAMSFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    onChange({ [field]: e.target.value });
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user?.user_metadata?.display_name) {
          onChange({ assessor: user.user_metadata.display_name });
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Project Information</h3>
      
      <div>
        <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
          Reference
        </label>
        <input
          type="text"
          id="reference"
          value={data.reference}
          onChange={handleChange('reference')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="client_name" className="block text-sm font-medium text-gray-700 mb-2">
          Client
        </label>
        <input
          type="text"
          id="client_name"
          value={data.client_name}
          onChange={handleChange('client_name')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="site_manager" className="block text-sm font-medium text-gray-700 mb-2">
          Site Manager
        </label>
        <input
          type="text"
          id="site_manager"
          value={data.site_manager}
          onChange={handleChange('site_manager')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="assessor" className="block text-sm font-medium text-gray-700 mb-2">
          Assessor
        </label>
        <input
          type="text"
          id="assessor"
          value={data.assessor}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
          placeholder="Loading assessor name..."
        />
      </div>

      <div>
        <label htmlFor="approved_by" className="block text-sm font-medium text-gray-700 mb-2">
          Approved By
        </label>
        <input
          type="text"
          id="approved_by"
          value="R. Stewart"
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
        />
      </div>
    </div>
  );
}