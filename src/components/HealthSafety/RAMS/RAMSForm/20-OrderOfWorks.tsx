import React from 'react';
import type { RAMSFormData } from '../../../../types/rams';

interface OrderOfWorksProps {
  data: RAMSFormData;
  onChange: (data: Partial<RAMSFormData>) => void;
}

export function OrderOfWorks({ data, onChange }: OrderOfWorksProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Order of Works</h3>
      
      <div>
        <label htmlFor="order_of_works_safety" className="block text-sm font-medium text-gray-700 mb-2">
          Safety Order of Works
        </label>
        <textarea
          id="order_of_works_safety"
          value={data.order_of_works_safety || '1. PPE is required as advised above before entering and working on site\n2. Unload from the van and transport the materials to the working area, as instructed below\n3. Workers will adhere to site rules and communicate with site manager as required\n4. Power cables will be covered down using mats where possible and if required'}
          onChange={(e) => onChange({ order_of_works_safety: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>
  );
}