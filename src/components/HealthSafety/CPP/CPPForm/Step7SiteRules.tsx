import React, { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import type { CPPFormData } from '../../../../types/cpp';

interface Step7SiteRulesProps {
  data: CPPFormData;
  onChange: (data: Partial<CPPFormData>) => void;
}

const PPE_OPTIONS = [
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
  'Wear a safety harness'
] as const;

const RULE_OPTIONS = [
  'Delivery of stores and materials',
  'Contractor and visitor parking',
  'Use of radios on site',
  'Use of mobile phones on site',
  'Smoking on site',
  'Restricted areas on site',
  'Works Permits',
  'Other'
] as const;

const PPE_ICON_URLS = {
  'Safety Gloves': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-protective-gloves.png',
  'Safety Footwear': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-foot-protection.png',
  'Hi Vis Clothing': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-high-visibility-clothing.png',
  'Hard Hat': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-head-protection.png',
  'Safety Goggles': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-eye-protection.png',
  'Hearing Protection': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-ear-protection.png',
  'Protective Clothing': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-protective-clothing.png',
  'P3 Masks': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-a-mask.png',
  'Face Shield': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-a-face-shield.png',
  'Respirator Hoods': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-a-safety-harness.png',
  'Wear a safety harness': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-a-safety-harness.png'
};

export function Step7SiteRules({ data, onChange }: Step7SiteRulesProps) {
  const [newRule, setNewRule] = useState({
    type: '',
    rule: ''
  });

  const togglePPE = (ppe: string) => {
    const currentPPE = data.siteRules.ppeRequirements || [];
    const newPPE = currentPPE.includes(ppe)
      ? currentPPE.filter(p => p !== ppe)
      : [...currentPPE, ppe];
    
    onChange({
      siteRules: {
        ...data.siteRules,
        ppeRequirements: newPPE
      }
    });
  };

  const addRule = () => {
    if (!newRule.type || !newRule.rule) return;

    onChange({
      siteRules: {
        ...data.siteRules,
        generalRules: [...(data.siteRules.generalRules || []), `${newRule.type}: ${newRule.rule}`]
      }
    });

    setNewRule({ type: '', rule: '' });
  };

  const removeRule = (index: number) => {
    onChange({
      siteRules: {
        ...data.siteRules,
        generalRules: (data.siteRules.generalRules || []).filter((_, i) => i !== index)
      }
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Site Rules</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          PPE Requirements
        </label>
        <div className="max-h-[200px] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PPE_OPTIONS.map((ppe) => {
              const isSelected = (data.siteRules.ppeRequirements || []).includes(ppe);
              return (
                <button
                  key={ppe}
                  type="button"
                  onClick={() => togglePPE(ppe)}
                  className={`
                    flex items-center px-4 py-3 rounded-lg text-left transition-colors
                    ${isSelected 
                      ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700' 
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
                    } min-h-[80px]
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`
                      flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
                      ${isSelected 
                        ? 'bg-indigo-500 border-indigo-500' 
                        : 'border-gray-300'
                      }
                    `}>
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
      </div>

      <div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Other PPE Required
          </label>
          <input
            type="text"
            value={data.siteRules.otherPPE || ''}
            onChange={(e) => onChange({
              siteRules: {
                ...data.siteRules,
                otherPPE: e.target.value
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter any additional PPE requirements"
          />
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-4">
          Additional Rules
        </label>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Rule Type
              </label>
              <select
                value={newRule.type}
                onChange={(e) => setNewRule(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select rule type</option>
                {RULE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Site Rule
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newRule.rule}
                  onChange={(e) => setNewRule(prev => ({ ...prev, rule: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter site rule"
                />
                <button
                  type="button"
                  onClick={addRule}
                  disabled={!newRule.type || !newRule.rule}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {(data.siteRules.generalRules || []).map((rule, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm text-gray-700">{rule}</span>
                <button
                  type="button"
                  onClick={() => removeRule(index)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}