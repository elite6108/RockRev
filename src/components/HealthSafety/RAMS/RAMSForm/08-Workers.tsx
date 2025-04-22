import React from 'react';
import type { RAMSFormData } from '../../../../types/rams';

interface WorkersProps {
  data: RAMSFormData;
  onChange: (data: Partial<RAMSFormData>) => void;
}

export function Workers({ data, onChange }: WorkersProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Workers</h3>
      
      <div>
        <label htmlFor="workers" className="block text-sm font-medium text-gray-700 mb-2">
          Workers Information
        </label>
        <textarea
          id="workers"
          value={data.workers || 'Skilled and experienced workers from On Point Groundworks Ltd. Groundwork plant equipment machine operators (diggers, dumpers, rollers, Vac Ex) are expected to hold the appropriate training and certification to be able to use the machinery and plant equipment.'}
          onChange={(e) => onChange({ workers: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>
  );
}