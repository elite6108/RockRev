import React, { useState } from 'react';
import {
  ArrowRight,
  FileText,
  ClipboardList,
  BarChart,
  CalendarRange,
} from 'lucide-react';
import { HSAccidentsActions } from './HSAccidentsActions';
import { HSAccidentsReports } from './HSAccidentsReports';
import { HSAccidentsStatistics } from './HSAccidentsStatistics';
import { HSAccidentsAnnualStats } from './HSAccidentsAnnualStats';

interface HSAccidentsProps {
  onBack: () => void;
}

export function HSAccidents({ onBack }: HSAccidentsProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showAnnualStats, setShowAnnualStats] = useState(false);

  // Mock data - replace with actual data from your database
  const stats = {
    inProgressNotSubmitted: 2,
    inProgressSubmitted: 3,
    measures: 15,
    daysSinceLastIncident: 45,
    incidentsYTD: 8,
    nearMissesYTD: 12,
    riddorYTD: 1,
    minorAccidentsYTD: 6,
    environmentalYTD: 3,
    utilityYTD: 2,
    theftViolenceYTD: 0,
    positiveInterventions: 24,
    unsafeActionsYTD: 5,
    unsafeConditionsYTD: 7,
  };

  if (showActions) {
    return <HSAccidentsActions onBack={() => setShowActions(false)} />;
  }

  if (showReports) {
    return <HSAccidentsReports onBack={() => setShowReports(false)} />;
  }

  if (showStatistics) {
    return <HSAccidentsStatistics onBack={() => setShowStatistics(false)} />;
  }

  if (showAnnualStats) {
    return <HSAccidentsAnnualStats onBack={() => setShowAnnualStats(false)} />;
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accident Overview - Takes up full width on mobile, 1/3 on desktop */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Accident Overview
            </h2>

            <div className="space-y-6">
              {/* Reports Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Reports</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-orange-600">
                      In Progress - Not Submitted
                    </p>
                    <p className="text-2xl font-bold text-orange-700">
                      {stats.inProgressNotSubmitted}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-600">
                      In Progress - Submitted
                    </p>
                    <p className="text-2xl font-bold text-yellow-700">
                      {stats.inProgressSubmitted}
                    </p>
                  </div>
                </div>
              </div>

              {/* Measures Section */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-600">Measures</h3>
                <p className="text-2xl font-bold text-green-700">
                  {stats.measures}
                </p>
              </div>

              {/* Days Since Last Incident */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-600">
                  Days Since Last Incident
                </h3>
                <p className="text-2xl font-bold text-blue-700">
                  {stats.daysSinceLastIncident}
                </p>
              </div>

              {/* YTD Statistics */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Year to Date Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Incidents</p>
                    <p className="text-xl font-bold text-gray-700">
                      {stats.incidentsYTD}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Near Misses</p>
                    <p className="text-xl font-bold text-gray-700">
                      {stats.nearMissesYTD}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600">RIDDOR</p>
                    <p className="text-xl font-bold text-red-700">
                      {stats.riddorYTD}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Minor Accidents</p>
                    <p className="text-xl font-bold text-gray-700">
                      {stats.minorAccidentsYTD}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">Environmental</p>
                    <p className="text-xl font-bold text-green-700">
                      {stats.environmentalYTD}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Utility</p>
                    <p className="text-xl font-bold text-blue-700">
                      {stats.utilityYTD}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600">Theft/Violence</p>
                    <p className="text-xl font-bold text-purple-700">
                      {stats.theftViolenceYTD}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-sm text-indigo-600">
                      Positive Interventions
                    </p>
                    <p className="text-xl font-bold text-indigo-700">
                      {stats.positiveInterventions}
                    </p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <p className="text-sm text-amber-600">Unsafe Actions</p>
                    <p className="text-xl font-bold text-amber-700">
                      {stats.unsafeActionsYTD}
                    </p>
                  </div>
                  <div className="bg-rose-50 p-4 rounded-lg">
                    <p className="text-sm text-rose-600">Unsafe Conditions</p>
                    <p className="text-xl font-bold text-rose-700">
                      {stats.unsafeConditionsYTD}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Other Widgets */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Actions Widget */}
          <button
            onClick={() => setShowActions(true)}
            className="bg-white shadow rounded-lg p-6 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Actions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  View and manage accident actions
                </p>
              </div>
              <ClipboardList className="h-8 w-8 text-gray-400" />
            </div>
          </button>

          {/* Reports Widget */}
          <button
            onClick={() => setShowReports(true)}
            className="bg-white shadow rounded-lg p-6 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Reports</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Access accident reports
                </p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </button>

          {/* Statistics Widget */}
          <button
            onClick={() => setShowStatistics(true)}
            className="bg-white shadow rounded-lg p-6 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Statistics
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  View accident statistics
                </p>
              </div>
              <BarChart className="h-8 w-8 text-gray-400" />
            </div>
          </button>

          {/* Annual Statistics Widget */}
          <button
            onClick={() => setShowAnnualStats(true)}
            className="bg-white shadow rounded-lg p-6 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Annual Statistics
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  View yearly accident data
                </p>
              </div>
              <CalendarRange className="h-8 w-8 text-gray-400" />
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
