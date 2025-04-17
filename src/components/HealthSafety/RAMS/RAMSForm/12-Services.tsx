import React from 'react';
import type { RAMSFormData } from '../../../../types/rams';

interface ServicesProps {
  data: RAMSFormData;
  onChange: (data: Partial<RAMSFormData>) => void;
}

export function Services({ data, onChange }: ServicesProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Services</h3>
      
      <div>
        <label htmlFor="services" className="block text-sm font-medium text-gray-700 mb-2">
          Services Information
        </label>
        <textarea
          id="services"
          value={data.services || 'Main power will be utilised for the 110V tools using centre tap earth electrical transformers. If 240V is required for construction tools, additional transformers will be used along with an RCD breaker.'}
          onChange={(e) => onChange({ services: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>
  );
}