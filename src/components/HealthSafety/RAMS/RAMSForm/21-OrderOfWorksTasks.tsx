import React, { useState } from 'react';
import type { RAMSFormData } from '../../../../types/rams';

interface OrderOfWorksTasksProps {
  data: RAMSFormData;
  onChange: (data: Partial<RAMSFormData>) => void;
}

export function OrderOfWorksTasks({ data, onChange }: OrderOfWorksTasksProps) {
  const [activeTab, setActiveTab] = useState<'groundworks' | 'custom'>(data.order_of_works_task || 'groundworks');

  const handleTabChange = (tab: 'groundworks' | 'custom') => {
    setActiveTab(tab);
    onChange({ order_of_works_task: tab });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Order of Works Tasks</h3>

      <div className="flex flex-col sm:flex-row gap-4 sm:space-x-4 mb-6">
        <button
          type="button"
          onClick={() => handleTabChange('groundworks')}
          className={`w-full px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            activeTab === 'groundworks'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Groundworks for Padel Courts
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('custom')}
          className={`w-full px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            activeTab === 'custom'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Custom
        </button>
      </div>

      {activeTab === 'groundworks' ? (
        <div className="space-y-6">
          <div>
            <label htmlFor="delivery_info" className="block text-sm font-medium text-gray-700 mb-2">
              Delivery
            </label>
            <textarea
              id="delivery_info"
              value={data.delivery_info || '1. On Point Groundworks Ltd workers will inform site management, other trades of material deliveries due in for that day. This communication is vital, so all parties are aware of deliveries for the project.\n2. Once a supplier arrives with their delivery, our workers will guide the vehicle to the working area as near as possible.\n3. Depending on the materials, the driver of the vehicle will either have equipment to unload the materials, to which our workers will then transport to the working area – using trolleys or carts, to minimise manual handling.\n4. If the materials being delivered are sand, concrete or other aggregates, then our workers will lay down tarpaulin to ensure any spillages can be contained. Materials will be poured into dump trucks that our workers will drive to the working area.'}
              onChange={(e) => onChange({ delivery_info: e.target.value })}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="groundworks_info" className="block text-sm font-medium text-gray-700 mb-2">
              Groundworks
            </label>
            <textarea
              id="groundworks_info"
              value={data.groundworks_info || '1. Set out and mark up ring-beam perimeter as per planning drawing.\n2. Cut and break out existing tarmac surface in line with the proposed ring-beam.\n3. Excavate the strip foundation and remove all waste to the designated area for soil/waste collection.\n4. Excavate and install ducting for power to courts. The route for this to be discussed on site with client.\n5. Build timber shuttering and install the footing.\n6. Pour concrete. Tamp and hand finish to ensure suitable surface to take the court structure. Note: the concrete will be taken by dump truck from mixer to the courts where possible to avoid spillage.\n7. Remote shuttering, back fill the ring-beam with hardcore and whacker.\n8. Power wash existing tarmac surface, add keying agent if required.\n9. Lay 30mm of hand finished 6m tarmac ready for the erection of the courts and laying of the astro court surface.\n10. Clean site and remove all waste/rubbish and excess materials in accordance with UK law and correct disposal.'}
              onChange={(e) => onChange({ groundworks_info: e.target.value })}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label htmlFor="order_of_works_custom" className="block text-sm font-medium text-gray-700 mb-2">
              Custom Order of Works
            </label>
            <textarea
              id="order_of_works_custom"
              value={data.order_of_works_custom}
              onChange={(e) => onChange({ order_of_works_custom: e.target.value })}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter custom order of works..."
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="additional_info" className="block text-sm font-medium text-gray-700 mb-2">
          Additional Information
        </label>
        <textarea
          id="additional_info"
          value={data.additional_info}
          onChange={(e) => onChange({ additional_info: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter any additional information..."
        />
      </div>
    </div>
  );
}