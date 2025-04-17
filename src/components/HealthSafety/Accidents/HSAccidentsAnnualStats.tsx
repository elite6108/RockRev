import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HSAccidentsAnnualStatsProps {
  onBack: () => void;
}

export function HSAccidentsAnnualStats({ onBack }: HSAccidentsAnnualStatsProps) {
  return (
    <>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
      >
        <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
        Back to Accidents
      </button>
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Annual Statistics</h2>
          <div className="text-gray-500">
            Annual statistics content will go here...
          </div>
        </div>
      </div>
    </>
  );
}