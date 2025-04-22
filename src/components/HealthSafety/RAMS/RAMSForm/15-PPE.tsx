import React, { useState } from 'react';
import { Check, Search } from 'lucide-react';
import type { RAMSFormData } from '../../../../types/rams';

interface PPEProps {
  data: RAMSFormData;
  onChange: (data: Partial<RAMSFormData>) => void;
}

const PRIORITY_PPE = [
  'Safety Gloves',
  'Safety Footwear',
  'Hi Vis Clothing',
  'Hard Hat',
  'Safety Goggles',
  'Hearing Protection',
  'Protective Clothing',
  'P3 Masks',
  'Face Shield',
  'Respirator Hoods',
];

const OTHER_PPE = [
  'Connect an earth terminal to the ground',
  'Disconnect before carrying out maintenance or repair',
  'Disconnect mains plug from electrical outlet',
  'Disinfect surface',
  'Disinfect your hands',
  'Ensure continuous ventilation',
  'Entry only with supervisor outside',
  'General mandatory action sign',
  'Install locks and keep locked',
  'Install or check guard',
  'Opaque eye protection must be worn',
  'Place trash in the bin',
  'Refer to instruction manual',
  'Secure gas cylinders',
  'Sound your horn',
  'Use barrier cream',
  'Use breathing equipment',
  'Use footbridge',
  'Use footwear with antistatic or antispark features',
  'Use gas detector',
  'Use guard to protect from injury from the table saw',
  'Use handrail',
  'Use protective apron',
  'Use this walkway',
  'Ventilate before and during entering',
  'Wash your hands',
  'Wear a safety harness',
  'Wear a welding mask',
  'Wear safety belts',
];

const PPE_ICON_URLS = {
  'Safety Gloves':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-protective-gloves.png',
  'Safety Footwear':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-foot-protection.png',
  'Hi Vis Clothing':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-high-visibility-clothing.png',
  'Hard Hat':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-head-protection.png',
  'Safety Goggles':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-eye-protection.png',
  'Hearing Protection':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-ear-protection.png',
  'Protective Clothing':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-protective-clothing.png',
  'P3 Masks':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-a-mask.png',
  'Face Shield':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-a-face-shield.png',
  'Respirator Hoods':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-a-safety-harness.png',
  'Connect an earth terminal to the ground':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/connect-an-earth-terminal-to-the-ground.png',
  'Disconnect before carrying out maintenance or repair':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/disconnect-before-carrying-out-maintenance-or-repair.png',
  'Disconnect mains plug from electrical outlet':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/disconnect-mains-plug-from-electrical-outlet.png',
  'Disinfect surface':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/disinfect-surface.png',
  'Disinfect your hands':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/disinfect-your-hands.png',
  'Ensure continuous ventilation':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/ensure-continuous-ventilation.png',
  'Entry only with supervisor outside':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/entry-only-with-supervisor-outside.png',
  'General mandatory action sign':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/general-mandatory-action-sign.png',
  'Install locks and keep locked':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/install-locks-and-keep-locked.png',
  'Install or check guard':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/install-or-check-guard.png',
  'Opaque eye protection must be worn':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/opaque-eye-protection-must-be-worn.png',
  'Place trash in the bin':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/place-trash-in-the-bin.png',
  'Refer to instruction manual':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/refer-to-instruction-manual.png',
  'Secure gas cylinders':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/secure-gas-cylinders.png',
  'Sound your horn':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/sound-your-horn.png',
  'Use barrier cream':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/use-barrier-cream.png',
  'Use breathing equipment':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/use-breathing-equipment.png',
  'Use footbridge':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/use-footbridge.png',
  'Use footwear with antistatic or antispark features':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/use-footwear-with-anti-static-or-anti-spark-features.png',
  'Use gas detector':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/use-gas-detector.png',
  'Use guard to protect from injury from the table saw':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/use-guard-to-protect-from-injury-from-the-table-saw.png',
  'Use handrail':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/use-handrail.png',
  'Use protective apron':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/use-protective-apron.png',
  'Use this walkway':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/use-this-walkway.png',
  'Ventilate before and during entering':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/ventilate-before-and-during-entering.png',
  'Wash your hands':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wash-your-hands.png',
  'Wear a safety harness':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-a-safety-harness.png',
  'Wear a welding mask':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-a-welding-mask.png',
  'Wear safety belts':
    'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-safety-belts.png',
};

export function PPE({ data, onChange }: PPEProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const togglePPE = (ppe: string) => {
    const newSelected = data.ppe?.includes(ppe)
      ? (data.ppe || []).filter((p) => p !== ppe)
      : [...(data.ppe || []), ppe];

    onChange({ ppe: newSelected });
  };

  const filterPPE = (items: string[]) => {
    return items.filter((ppe) =>
      ppe.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">PPE Requirements</h3>

      {/* Search Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search PPE items..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div className="overflow-y-auto max-h-[300px] space-y-6">
        {/* Priority PPE Section */}
        {(searchQuery === '' || filterPPE(PRIORITY_PPE).length > 0) && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-500">Common PPE</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filterPPE(PRIORITY_PPE).map((ppe) => {
                const isSelected = data.ppe?.includes(ppe);
                return (
                  <button
                    key={ppe}
                    type="button"
                    onClick={() => togglePPE(ppe)}
                    className={`
                      flex items-center px-4 py-3 rounded-lg text-left transition-colors
                      ${
                        isSelected
                          ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700'
                          : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
                      } min-h-[80px]
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`
                        flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
                        ${
                          isSelected
                            ? 'bg-indigo-500 border-indigo-500'
                            : 'border-gray-300'
                        }
                      `}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 flex items-center space-x-3">
                        {PPE_ICON_URLS[ppe] && (
                          <img
                            src={PPE_ICON_URLS[ppe]}
                            alt={ppe}
                            className="w-12 h-12 object-contain flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <span className="text-sm font-medium">{ppe}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Other PPE Section */}
        {(searchQuery === '' || filterPPE(OTHER_PPE).length > 0) && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-500">
              Additional PPE
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filterPPE(OTHER_PPE).map((ppe) => {
                const isSelected = data.ppe?.includes(ppe);
                return (
                  <button
                    key={ppe}
                    type="button"
                    onClick={() => togglePPE(ppe)}
                    className={`
                      flex items-center px-4 py-3 rounded-lg text-left transition-colors
                      ${
                        isSelected
                          ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700'
                          : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
                      } min-h-[80px]
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`
                        flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
                        ${
                          isSelected
                            ? 'bg-indigo-500 border-indigo-500'
                            : 'border-gray-300'
                        }
                      `}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 flex items-center space-x-3">
                        {PPE_ICON_URLS[ppe] && (
                          <img
                            src={PPE_ICON_URLS[ppe]}
                            alt={ppe}
                            className="w-12 h-12 object-contain flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <span className="text-sm font-medium">{ppe}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {searchQuery !== '' &&
          filterPPE([...PRIORITY_PPE, ...OTHER_PPE]).length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No PPE items found matching your search
            </div>
          )}
      </div>
    </div>
  );
}
