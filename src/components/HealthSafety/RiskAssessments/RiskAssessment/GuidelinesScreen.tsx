import React from 'react';

interface GuidelinesScreenProps {
  data: {
    guidelines: string;
  };
  onChange: (data: Partial<typeof GuidelinesScreenProps.prototype.data>) => void;
}

export function GuidelinesScreen({ data, onChange }: GuidelinesScreenProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Guidelines</h3>
      
      <div>
        <label htmlFor="guidelines" className="block text-sm font-medium text-gray-700 mb-2">
          Enter Guidelines
        </label>
        <textarea
          id="guidelines"
          value={data.guidelines}
          onChange={(e) => onChange({ guidelines: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter guidelines here..."
        />
      </div>
    </div>
  );
}