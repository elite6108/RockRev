import React, { useState } from 'react';
import { ArrowRight, FileText, ClipboardList, FileUp } from 'lucide-react';
import { ToolboxTalksList } from './ToolboxTalksList';
import { CompletedTalksList } from './CompletedTalksList';
import { ToolboxTalkPDFs } from './ToolboxTalkPDFs';

interface HSToolboxTalksProps {
  onBack: () => void;
}

export function HSToolboxTalks({ onBack }: HSToolboxTalksProps) {
  const [showTalksList, setShowTalksList] = useState(false);
  const [showCompletedTalks, setShowCompletedTalks] = useState(false);
  const [showPDFs, setShowPDFs] = useState(false);

  if (showTalksList) {
    return <ToolboxTalksList onBack={() => setShowTalksList(false)} />;
  }

  if (showCompletedTalks) {
    return <CompletedTalksList onBack={() => setShowCompletedTalks(false)} />;
  }

  if (showPDFs) {
    return <ToolboxTalkPDFs onBack={() => setShowPDFs(false)} />;
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Toolbox Talks Widget */}
        <button
          onClick={() => setShowTalksList(true)}
          className="bg-white shadow rounded-lg p-6 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Toolbox Talks
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                View and manage toolbox talks
              </p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </button>

        {/* Completed Talks Widget */}
        <button
          onClick={() => setShowCompletedTalks(true)}
          className="bg-white shadow rounded-lg p-6 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Completed Talks
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                View completed toolbox talks
              </p>
            </div>
            <ClipboardList className="h-8 w-8 text-gray-400" />
          </div>
        </button>

        {/* PDF Files Widget */}
        <button
          onClick={() => setShowPDFs(true)}
          className="bg-white shadow rounded-lg p-6 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">PDF Files</h3>
              <p className="mt-1 text-sm text-gray-500">
                Manage toolbox talk PDFs
              </p>
            </div>
            <FileUp className="h-8 w-8 text-gray-400" />
          </div>
        </button>
      </div>
    </>
  );
}
