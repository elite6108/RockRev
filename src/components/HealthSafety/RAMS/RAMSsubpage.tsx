import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { ArrowRight, Plus, Edit, Trash2, AlertTriangle, FileText, Loader2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { RAMSForm } from './RAMSForm/index';
import { generateRAMSPDF } from '../../../utils/pdf/rams';
import type { RAMS } from '../../../types/database';

interface RAMSsubpageProps {
  onBack: () => void;
}

export function RAMSsubpage({ onBack }: RAMSsubpageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ramsEntries, setRamsEntries] = useState<RAMS[]>([]);
  const [showRAMSModal, setShowRAMSModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<RAMS | null>(null);
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
        .from('rams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRamsEntries(data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: RAMS) => {
    setSelectedEntry(entry);
    setShowRAMSModal(true);
  };

  const handleDelete = (entry: RAMS) => {
    setSelectedEntry(entry);
    setShowDeleteModal(true);
  };

  const handleViewPDF = async (rams: RAMS) => {
    setGeneratingPDF(true);
    setPdfError(null);

    try {
      // Fetch company settings
      const { data: companySettings, error: companyError } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (companyError) throw new Error(`Failed to load company settings: ${companyError.message}`);
      if (!companySettings) throw new Error('Company settings not found. Please set up your company details first.');

      // Generate PDF
      const pdfDataUrl = await generateRAMSPDF({
        rams,
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

    } catch (error) {
      console.error('Error generating PDF:', error);
      setPdfError(error instanceof Error ? error.message : 'An unexpected error occurred while generating the PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedEntry) return;
    
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('rams')
        .delete()
        .eq('id', selectedEntry.id);

      if (error) throw error;
      
      await fetchData();
      setShowDeleteModal(false);
      setSelectedEntry(null);
    } catch (err) {
      console.error('Error deleting RAMS:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while deleting the RAMS entry');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredEntries = React.useMemo(() => {
    let filteredEntries = [...ramsEntries];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredEntries = filteredEntries.filter(entry => 
        entry.rams_number?.toString().toLowerCase().includes(query) ||
        entry.client_name?.toLowerCase().includes(query) ||
        entry.site_town?.toLowerCase().includes(query) ||
        entry.site_county?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortConfig) {
      filteredEntries.sort((a, b) => {
        if (sortConfig.key === 'rams_number') {
          return sortConfig.direction === 'asc' 
            ? (a.rams_number || '').localeCompare(b.rams_number || '')
            : (b.rams_number || '').localeCompare(a.rams_number || '');
        }
        if (sortConfig.key === 'date') {
          return sortConfig.direction === 'asc' 
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortConfig.key === 'client_name') {
          return sortConfig.direction === 'asc' 
            ? (a.client_name || '').localeCompare(b.client_name || '')
            : (b.client_name || '').localeCompare(a.client_name || '');
        }
        if (sortConfig.key === 'site') {
          const siteA = `${a.site_town}, ${a.site_county}`;
          const siteB = `${b.site_town}, ${b.site_county}`;
          return sortConfig.direction === 'asc' 
            ? siteA.localeCompare(siteB)
            : siteB.localeCompare(siteA);
        }
        return 0;
      });
    }

    return filteredEntries;
  }, [ramsEntries, searchQuery, sortConfig]);

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
            <h2 className="text-xl font-semibold text-gray-900">Risk Assessment Method Statements</h2>
            <button
              onClick={() => {
                setSelectedEntry(null);
                setShowRAMSModal(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New RAMS
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
                placeholder="Search RAMS entries..."
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

          {pdfError && (
            <div className="mb-4 p-4 text-sm text-red-600 bg-red-50 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error generating PDF</p>
                <p>{pdfError}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : sortedAndFilteredEntries.length === 0 ? (
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                {searchQuery ? 'No matching RAMS entries found' : 'No RAMS entries yet'}
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
                      onClick={() => handleSort('rams_number')}
                    >
                      <div className="flex items-center gap-2">
                        RAMS Number
                        {sortConfig?.key === 'rams_number' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-2">
                        Date
                        {sortConfig?.key === 'date' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                      onClick={() => handleSort('client_name')}
                    >
                      <div className="flex items-center gap-2">
                        Client Name
                        {sortConfig?.key === 'client' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                      onClick={() => handleSort('site')}
                    >
                      <div className="flex items-center gap-2">
                        Site Reference
                        {sortConfig?.key === 'site' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sortedAndFilteredEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        {entry.rams_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {entry.client_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {entry.site_town}, {entry.site_county}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                        <div className="flex justify-start space-x-4">
                          <button
                            onClick={() => handleViewPDF(entry)}
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
                            onClick={() => handleEdit(entry)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-white dark:hover:text-gray-300"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry)}
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

      {/* RAMS Form Modal */}
      {showRAMSModal && (
        <RAMSForm 
          onClose={() => {
            setShowRAMSModal(false);
            setSelectedEntry(null);
          }}
          onSuccess={fetchData}
          ramsToEdit={selectedEntry}
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
              Are you sure you want to delete this RAMS entry? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedEntry(null);
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