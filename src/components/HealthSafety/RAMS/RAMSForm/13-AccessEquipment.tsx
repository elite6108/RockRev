import React from 'react';
import type { RAMSFormData } from '../../../../types/rams';

interface AccessEquipmentProps {
  data: RAMSFormData;
  onChange: (data: Partial<RAMSFormData>) => void;
}

export function AccessEquipment({ data, onChange }: AccessEquipmentProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Access Equipment</h3>
      
      <div>
        <label htmlFor="access_equipment" className="block text-sm font-medium text-gray-700 mb-2">
          Access Equipment Information
        </label>
        <textarea
          id="access_equipment"
          value={data.access_equipment || 'Work will not be carried out on any towers or at heights.'}
          onChange={(e) => onChange({ access_equipment: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>
  );
}