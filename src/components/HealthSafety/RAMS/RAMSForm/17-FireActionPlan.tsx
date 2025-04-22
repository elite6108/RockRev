import React from 'react';
import type { RAMSFormData } from '../../../../types/rams';

interface FireActionPlanProps {
  data: RAMSFormData;
  onChange: (data: Partial<RAMSFormData>) => void;
}

export function FireActionPlan({ data, onChange }: FireActionPlanProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Fire Action Plan</h3>
      
      <div>
        <label htmlFor="fire_action_plan" className="block text-sm font-medium text-gray-700 mb-2">
          Fire Action Plan Information
        </label>
        <textarea
          id="fire_action_plan"
          value={data.fire_action_plan || 'Where possible, workers will follow the existing fire safety plan for the site, including using the designated evacuation points. Additionally, the work performed by On Point Groundworks Ltd involves groundworks, where the risk of fire is low. The heavy-duty machinery we hire undergoes servicing and maintenance before use. When raising fire alarm awareness, workers should not use an air horn, klaxon or whistle, as there may be other construction trades who will not be using the same awareness method so they will not understand. However, in the unlikely event of a fire on site—whether originating from a vehicle, machinery, or other trades/equipment not associated with us—the following practices should be observed:'}
          onChange={(e) => onChange({ fire_action_plan: e.target.value })}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>
  );
}