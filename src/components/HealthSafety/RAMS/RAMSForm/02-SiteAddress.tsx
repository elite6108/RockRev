import React from 'react';
import type { RAMSFormData } from '../../../../types/rams';

interface SiteAddressProps {
  data: RAMSFormData;
  onChange: (data: Partial<RAMSFormData>) => void;
}

export function SiteAddress({ data, onChange }: SiteAddressProps) {
  const handleChange =
    (field: keyof RAMSFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ [field]: e.target.value });
    };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Site Address</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="address_line1"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            1st Line
          </label>
          <input
            type="text"
            id="address_line1"
            value={data.address_line1}
            onChange={handleChange('address_line1')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="address_line2"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            2nd Line
          </label>
          <input
            type="text"
            id="address_line2"
            value={data.address_line2}
            onChange={handleChange('address_line2')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="address_line3"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            3rd Line
          </label>
          <input
            type="text"
            id="address_line3"
            value={data.address_line3}
            onChange={handleChange('address_line3')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="site_town"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Town
          </label>
          <input
            type="text"
            id="site_town"
            value={data.site_town}
            onChange={handleChange('site_town')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="site_county"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            County
          </label>
          <input
            type="text"
            id="site_county"
            value={data.site_county}
            onChange={handleChange('site_county')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="post_code"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Postcode
          </label>
          <input
            type="text"
            id="post_code"
            value={data.post_code}
            onChange={handleChange('post_code')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}
