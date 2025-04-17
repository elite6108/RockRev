import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { ArrowRight, Plus, Edit, Trash2, AlertTriangle, FileText, Loader2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { RiskAssessmentForm } from './RiskAssessmentForm';
import { generateRiskAssessmentPDF } from '../../../utils/riskAssessmentPDFGenerator';
import type { RiskAssessment } from '../../../types/database';

interface RiskAssessmentsubpageProps {
  onBack: () => void;
}

export function RiskAssessmentsubpage({ onBack }: RiskAssessmentsubpageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<RiskAssessment | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('risk_assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRiskAssessments(data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (assessment: RiskAssessment) => {
    setSelectedAssessment(assessment);
    setShowModal(true);
  };

  const handleViewPDF = async (assessment: RiskAssessment) => {
    setGeneratingPDF(true);
    setPdfError(null);
    console.log('Starting PDF generation for assessment:', assessment.ra_id);

    try {
      // Fetch company settings
      console.log('Fetching company settings...');
      const { data: companySettings, error: companyError } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (companyError) {
        console.error('Error fetching company settings:', companyError);
        throw new Error(`Failed to load company settings: ${companyError.message}`);
      }
      if (!companySettings) {
        console.error('No company settings found');
        throw new Error('Company settings not found. Please set up your company details first.');
      }

      console.log('Company settings loaded successfully');
      console.log('Starting PDF generation...');

      // Generate PDF
      const pdfDataUrl = await generateRiskAssessmentPDF({
        assessment,
        companySettings
      });

      // Convert base64 data URL to Blob
      const base64Data = pdfDataUrl.split(',')[1];
      const binaryData = atob(base64Data);
      const array = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        array[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([array], { type: 'application/pdf' });
      
      // Create and open Object URL
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      // Clean up the Object URL after the window is loaded
      if (newWindow) {
        newWindow.addEventListener('load', () => {
          URL.revokeObjectURL(url);
        });
      }

      console.log('PDF opened in new tab');

    } catch (error) {
      console.error('Error in handleViewPDF:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      setPdfError(error instanceof Error ? error.message : 'An unexpected error occurred while generating the PDF');
    } finally {
      setGeneratingPDF(false);
      console.log('PDF generation process completed');
    }
  };

  const handleDelete = (assessment: RiskAssessment) => {
    setSelectedAssessment(assessment);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedAssessment) return;
    
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('risk_assessments')
        .delete()
        .eq('id', selectedAssessment.id);

      if (error) throw error;
      
      await fetchData();
      setShowDeleteModal(false);
      setSelectedAssessment(null);
    } catch (err) {
      console.error('Error deleting risk assessment:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while deleting the risk assessment');
    } finally {
      setLoading(false);
    }
  };

  const getReviewStatus = (reviewDate: string) => {
    const review = new Date(reviewDate);
    const today = new Date();
    const daysUntilReview = Math.floor((review.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilReview < 0) {
      return {
        text: 'Review Overdue',
        className: 'bg-red-100 text-red-800'
      };
    } else if (daysUntilReview <= 30) {
      return {
        text: 'Review Due Soon',
        className: 'bg-yellow-100 text-yellow-800'
      };
    }
    return {
      text: 'Active',
      className: 'bg-green-100 text-green-800'
    };
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredAssessments = React.useMemo(() => {
    let filteredAssessments = [...riskAssessments];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredAssessments = filteredAssessments.filter(assessment => 
        assessment.name.toLowerCase().includes(query) ||
        assessment.ra_id?.toString().includes(query)
      );
    }

    // Apply sorting
    if (sortConfig) {
      filteredAssessments.sort((a, b) => {
        if (sortConfig.key === 'name') {
          return sortConfig.direction === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        }
        if (sortConfig.key === 'ra_id') {
          return sortConfig.direction === 'asc'
            ? (a.ra_id || '').localeCompare(b.ra_id || '')
            : (b.ra_id || '').localeCompare(a.ra_id || '');
        }
        if (sortConfig.key === 'created_at') {
          return sortConfig.direction === 'asc' 
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortConfig.key === 'review_date') {
          return sortConfig.direction === 'asc' 
            ? new Date(a.review_date).getTime() - new Date(b.review_date).getTime()
            : new Date(b.review_date).getTime() - new Date(a.review_date).getTime();
        }
        if (sortConfig.key === 'status') {
          const statusA = getReviewStatus(a.review_date).text;
          const statusB = getReviewStatus(b.review_date).text;
          return sortConfig.direction === 'asc' 
            ? statusA.localeCompare(statusB)
            : statusB.localeCompare(statusA);
        }
        return 0;
      });
    }

    return filteredAssessments;
  }, [riskAssessments, searchQuery, sortConfig]);

  return (
    <>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
      >
        <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
        Back to RAMS
      </button>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Risk Assessments</h2>
            <button
              onClick={() => {
                setSelectedAssessment(null);
                setShowModal(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Risk Assessment
            </button>
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search risk assessments..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-4 rounded-md">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : sortedAndFilteredAssessments.length === 0 ? (
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                {searchQuery ? 'No matching risk assessments found' : 'No risk assessments yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                      onClick={() => handleSort('ra_id')}
                    >
                      <div className="flex items-center gap-2">
                        RA Number
                        {sortConfig?.key === 'ra_id' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Name
                        {sortConfig?.key === 'name' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-2">
                        Created
                        {sortConfig?.key === 'created_at' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                      onClick={() => handleSort('review_date')}
                    >
                      <div className="flex items-center gap-2">
                        Review Date
                        {sortConfig?.key === 'review_date' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        {sortConfig?.key === 'status' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sortedAndFilteredAssessments.map((assessment) => {
                    const status = getReviewStatus(assessment.review_date);
                    return (
                      <tr key={assessment.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                          {assessment.ra_id}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {assessment.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(assessment.created_at).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(assessment.review_date).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.className}`}>
                            {status.text}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                          <div className="flex justify-end space-x-4">
                            <button
                              onClick={() => handleViewPDF(assessment)}
                              disabled={generatingPDF}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white inline-flex items-center disabled:opacity-50"
                              title="View PDF"
                            >
                              {generatingPDF ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEdit(assessment)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-white dark:hover:text-gray-300"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(assessment)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Risk Assessment Form Modal */}
      {showModal && (
        <RiskAssessmentForm
          onClose={() => {
            setShowModal(false);
            setSelectedAssessment(null);
          }}
          onSuccess={fetchData}
          assessmentToEdit={selectedAssessment}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm w-full m-4">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
              Confirm Deletion
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to delete this risk assessment? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAssessment(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}