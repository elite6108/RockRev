import React, { useState } from 'react';
import { ArrowRight, FileText, FileWarning } from 'lucide-react';
import { HSPolicy } from './HSPolicy';
import { OtherPolicies } from './OtherPolicies';

interface HSPoliciesProps {
  onBack: () => void;
}

export function HSPolicies({ onBack }: HSPoliciesProps) {
  const [showHSPolicy, setShowHSPolicy] = useState(false);
  const [showOtherPolicies, setShowOtherPolicies] = useState(false);

  if (showHSPolicy) {
    return <HSPolicy onBack={() => setShowHSPolicy(false)} />;
  }

  if (showOtherPolicies) {
    return <OtherPolicies onBack={() => setShowOtherPolicies(false)} />;
  }

  return (
    <>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
      >
        <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
        Back to Dashboard
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* H&S Policy Widget */}
        <button
          onClick={() => setShowHSPolicy(true)}
          className="bg-white shadow rounded-lg p-6 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">H&S Policy</h3>
              <p className="mt-1 text-sm text-gray-500">
                View and manage H&S policies
              </p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </button>

        {/* Other Policies Widget */}
        <button
          onClick={() => setShowOtherPolicies(true)}
          className="bg-white shadow rounded-lg p-6 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Other Policies
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                View and manage other policies
              </p>
            </div>
            <FileWarning className="h-8 w-8 text-gray-400" />
          </div>
        </button>
      </div>
    </>
  );
}
