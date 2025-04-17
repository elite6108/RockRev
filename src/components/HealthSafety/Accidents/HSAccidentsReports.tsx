import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  AlertTriangle,
  FileText,
  AlertCircle,
  AlertOctagon,
  Loader2,
  Edit,
  Trash2,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { NearMissForm } from './forms/NearMissForm';
import { generateAccidentPDF } from '../../../utils/accidentsPDFGenerator';

interface HSAccidentsReportsProps {
  onBack: () => void;
}

interface ReportType {
  type: string;
  description: string;
  riddorReportable: boolean;
}

type TabType = 'accident' | 'nearMiss' | 'incident';
type SelectedReport = {
  type: string;
  description: string;
  riddorReportable: boolean;
} | null;

const REPORT_TYPES = {
  accident: [
    {
      type: 'Injury',
      description: 'An accident that resulted in injury to a person',
      riddorReportable: true,
    },
    {
      type: 'Fatality',
      description: 'An accident that resulted in death',
      riddorReportable: true,
    },
    {
      type: 'Dangerous Occurrence',
      description: 'A significant incident with potential for serious injury',
      riddorReportable: true,
    },
  ],
  nearMiss: [
    {
      type: 'Near Miss',
      description:
        'An incident that could have resulted in injury or damage but was avoided',
      riddorReportable: false,
    },
    {
      type: 'Unsafe Act',
      description: 'A behavior or action that could lead to an accident',
      riddorReportable: false,
    },
    {
      type: 'Unsafe Condition',
      description: 'A physical condition that could lead to an accident',
      riddorReportable: false,
    },
  ],
  incident: [
    {
      type: 'Property Damage',
      description: 'Damage to property or equipment',
      riddorReportable: false,
    },
    {
      type: 'Environmental',
      description: 'An incident affecting the environment',
      riddorReportable: true,
    },
    {
      type: 'Security',
      description: 'A security-related incident',
      riddorReportable: false,
    },
  ],
};

export function HSAccidentsReports({ onBack }: HSAccidentsReportsProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('accident');
  const [selectedReport, setSelectedReport] = useState<SelectedReport>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [accidents, setAccidents] = useState<any[]>([]);

  useEffect(() => {
    fetchAccidents();
  }, []);

  const fetchAccidents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('accidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccidents(data || []);
    } catch (err) {
      console.error('Error fetching accidents:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while fetching accidents'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (accident: any) => {
    // TODO: Implement edit functionality
    console.log('Edit accident:', accident);
  };

  const handleDelete = async (accidentId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('accidents')
        .delete()
        .eq('id', accidentId);

      if (error) throw error;

      await fetchAccidents();
    } catch (err) {
      console.error('Error deleting accident:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while deleting the accident'
      );
    } finally {
      setLoading(false);
    }
  };

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'accident':
        return <AlertOctagon className="h-5 w-5" />;
      case 'nearMiss':
        return <AlertTriangle className="h-5 w-5" />;
      case 'incident':
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getReportData = () => {
    return REPORT_TYPES[activeTab];
  };

  const handleReportClick = (report: ReportType) => {
    setSelectedReport(report);
    setShowReportModal(false); // Close the modal when selecting a report type
  };

  const handleFormSubmit = async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('accidents').insert([
        {
          ...data,
          user_id: user.id,
          report_type: 'nearMiss',
          incident_type: selectedReport?.type || 'Near Miss',
          riddor_reportable: selectedReport?.riddorReportable || false,
          incident_date:
            data.injuryDate || new Date().toISOString().split('T')[0],
          created_by_name: user.user_metadata?.display_name || 'Unknown',
          status: 'draft',
        },
      ]);

      if (error) throw error;

      setSelectedReport(null);
      setError(null);
      await fetchAccidents(); // Refresh the list after adding new report
      onBack(); // Return to accidents page after successful submission
    } catch (err) {
      console.error('Error saving report:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while saving the report'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewPDF = async (accident: any) => {
    setGeneratingPDF(true);
    setPdfError(null);

    try {
      // Fetch company settings
      const { data: companySettings, error: companyError } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (companyError)
        throw new Error(
          `Failed to load company settings: ${companyError.message}`
        );
      if (!companySettings)
        throw new Error(
          'Company settings not found. Please set up your company details first.'
        );

      // Generate PDF
      const pdfDataUrl = await generateAccidentPDF({
        accident,
        companySettings,
      });

      // Create a link element to trigger the download
      const link = document.createElement('a');
      link.href = pdfDataUrl;
      link.download = `${accident.report_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setPdfError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while generating the PDF'
      );
    } finally {
      setGeneratingPDF(false);
    }
  };

  // If a report is selected, show the appropriate form
  if (selectedReport) {
    if (
      selectedReport.type === 'Near Miss' ||
      selectedReport.type === 'Unsafe Act' ||
      selectedReport.type === 'Unsafe Condition'
    ) {
      return (
        <NearMissForm
          onClose={() => setSelectedReport(null)}
          onSubmit={handleFormSubmit}
        />
      );
    }
    // Add other form components here as they are created
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedReport.type} Report
          </h2>
          <button
            onClick={() => setSelectedReport(null)}
            className="text-gray-400 hover:text-gray-500"
          >
            <ArrowRight className="h-6 w-6" />
          </button>
        </div>
        <div className="text-gray-500">
          This form is not yet implemented. Please check back later.
        </div>
      </div>
    );
  }

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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Reports</h2>
            <button
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FileText className="h-4 w-4 mr-2" />
              Add New Report
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-4 rounded-md">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Report list */}
          <div className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900"
                      >
                        Report Number
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Location
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Status
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {accidents.map((accident) => (
                      <tr key={accident.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                          {accident.report_number}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(
                            accident.incident_date
                          ).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {accident.incident_type}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {accident.location}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              accident.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-800'
                                : accident.status === 'submitted'
                                ? 'bg-blue-100 text-blue-800'
                                : accident.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {accident.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                          <div className="flex justify-end space-x-4">
                            <button
                              onClick={() => handleViewPDF(accident)}
                              disabled={generatingPDF}
                              className="text-gray-600 hover:text-gray-900"
                              title="Download PDF"
                            >
                              {generatingPDF ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEdit(accident)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(accident.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl m-4">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">New Report</h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <ArrowRight className="h-6 w-6" />
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  {[
                    { id: 'accident', name: 'Report an Accident' },
                    { id: 'nearMiss', name: 'Report A Near Miss' },
                    { id: 'incident', name: 'Report an Incident' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`
                        group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                        ${
                          activeTab === tab.id
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      {getTabIcon(tab.id as TabType)}
                      <span className="ml-2">{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Table */}
              <div className="mt-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900"
                        >
                          Incident Type
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Description
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900"
                        >
                          RIDDOR Reportable
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {getReportData().map((report, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleReportClick(report)}
                        >
                          <td className="whitespace-normal py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                            {report.type}
                          </td>
                          <td className="whitespace-normal px-3 py-4 text-sm text-gray-500">
                            {report.description}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                            {report.riddorReportable ? '✔️' : '❌'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
