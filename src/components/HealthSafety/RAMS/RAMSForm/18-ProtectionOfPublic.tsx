import React from 'react';
import type { RAMSFormData } from '../../../../types/rams';

interface ProtectionOfPublicProps {
  data: RAMSFormData;
  onChange: (data: Partial<RAMSFormData>) => void;
}

export function ProtectionOfPublic({ data, onChange }: ProtectionOfPublicProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Protection of Public</h3>
      
      <div>
        <label htmlFor="protection_of_public" className="block text-sm font-medium text-gray-700 mb-2">
          Public Protection Information
        </label>
        <textarea
          id="protection_of_public"
          value={data.protection_of_public || 'The construction site will be cordoned off and vacant whilst the works are ongoing. Such cordon will be made by site "main/prime contractors" who have hired On Point Groundworks Ltd. "Main/prime contractor" will always ensure the safety of the public, including suitable fencing, cones, and warning signs. The access/egress to the site is destructed to authorised persons only and the site will be manned daily.'}
          onChange={(e) => onChange({ protection_of_public: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>
  );
}