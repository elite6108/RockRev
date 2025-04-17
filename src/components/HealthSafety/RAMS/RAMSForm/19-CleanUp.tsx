import React from 'react';
import type { RAMSFormData } from '../../../../types/rams';

interface CleanUpProps {
  data: RAMSFormData;
  onChange: (data: Partial<RAMSFormData>) => void;
}

export function CleanUp({ data, onChange }: CleanUpProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Clean Up</h3>
      
      <div>
        <label htmlFor="clean_up" className="block text-sm font-medium text-gray-700 mb-2">
          Clean Up Information
        </label>
        <textarea
          id="clean_up"
          value={data.clean_up || '1. All waste must be taken back to the van in the appropriate waste boxes to be disposed at commercial waste sites\n2. Final checks of the installation area will be carried out to achieve the best possible and highest standard\n3. Remove all equipment and leave no waste behind\n4. Client site representative or/and On Point Groundworks Ltd will sign off on completion of the work'}
          onChange={(e) => onChange({ clean_up: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>
  );
}