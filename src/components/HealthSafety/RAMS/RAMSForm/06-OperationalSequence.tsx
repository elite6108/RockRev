import React from 'react';
import type { RAMSFormData } from '../../../../types/rams';

interface OperationalSequenceProps {
  data: RAMSFormData;
  onChange: (data: Partial<RAMSFormData>) => void;
}

export function OperationalSequence({ data, onChange }: OperationalSequenceProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Operational Sequence</h3>
      
      <div>
        <label htmlFor="sequence" className="block text-sm font-medium text-gray-700 mb-2">
          Sequence of Operations
        </label>
        <textarea
          id="sequence"
          value={data.sequence}
          onChange={(e) => onChange({ sequence: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>
  );
}