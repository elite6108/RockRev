import React, { useState, useEffect } from 'react';
import { ArrowRight, FilePlus, Download, Trash2, Edit2, AlertTriangle, Loader2, FileUp, FileText, ExternalLink, Search, ChevronUp, ChevronDown, ChevronLeft, Save, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { CreatePolicyModal } from './CreatePolicyModal';
import { OtherPoliciesUploadModal } from './OtherPoliciesUploadModal';
import { generateOtherPolicyPDF } from '../../../utils/otherPoliciesPDFGenerator';

interface OtherPoliciesProps {
  onBack: () => void;
}

interface PDFFile {
  id: string;
  name: string;
  type: 'uploaded' | 'created';
  created_at: string;
  updated_at?: string;
  size: number;
  url: string;
  displayName?: string;
  content?: string;
  policy_number?: string;
  signed_url: string;
}

export function OtherPolicies({ onBack }: OtherPoliciesProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<PDFFile | null>(null);
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [editingPolicy, setEditingPolicy] = useState<PDFFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [editingPolicyNumber, setEditingPolicyNumber] = useState<string | null>(null);
  const [editingNumber, setEditingNumber] = useState('');
  const [savingNumber, setSavingNumber] = useState(false);

  useEffect(() => {
    fetchPDFFiles();
  }, []);

  const generateSignedUrl = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('other-policies')
        .createSignedUrl(fileName, 60 * 60); // 1 hour expiry
      
      if (error) throw error;
      return data?.signedUrl || '';
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return '';
    }
  };

  const fetchPDFFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch storage files
      const { data: filesData, error: filesError } = await supabase
        .storage
        .from('other-policies')
        .list();

      if (filesError) throw filesError;

      // Fetch metadata for all files
      const { data: metadataData, error: metadataError } = await supabase
        .from('other_policy_files')
        .select('*, policy_number')
        .order('created_at', { ascending: false });

      if (metadataError) throw metadataError;

      // Combine storage files and created policies
      const pdfFiles: PDFFile[] = [];

      // Add uploaded files
      if (filesData) {
        const uploadedFiles = await Promise.all(
          filesData
            .filter(file => file.name.toLowerCase().endsWith('.pdf'))
            .map(async (file) => {
              const signedUrl = await generateSignedUrl(file.name);
              const metadata = metadataData?.find(m => m.file_name === file.name);
              return {
                id: file.id,
                name: file.name,
                policy_number: metadataData?.find(m => m.file_name === file.name)?.policy_number,
                created_at: file.created_at,
                size: file.metadata?.size || 0,
                url: signedUrl,
                signed_url: signedUrl,
                displayName: metadata?.display_name || file.name.replace(/\.pdf$/i, ''),
                type: 'uploaded' as const
              };
            })
        );
        pdfFiles.push(...uploadedFiles);
      }

      // Add created policies
      const createdPolicies = metadataData
        ?.filter(m => m.type === 'created')
        .map(policy => ({
          id: policy.id,
          name: policy.file_name,
          created_at: policy.created_at,
          updated_at: policy.updated_at,
          policy_number: policy.policy_number,
          size: 0,
          displayName: policy.display_name,
          type: 'created' as const,
          content: policy.content
        })) || [];
      pdfFiles.push(...createdPolicies);

      setPdfFiles(pdfFiles);
    } catch (err) {
      console.error('Error fetching PDF files:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching PDF files');
    } finally {
      setLoading(false);
    }
  };

  // Add a function to refresh signed URLs
  const refreshSignedUrls = async () => {
    const updatedFiles = await Promise.all(
      pdfFiles.map(async (file) => {
        if (file.type === 'uploaded') {
          const signedUrl = await generateSignedUrl(file.name);
          return {
            ...file,
            url: signedUrl,
            signed_url: signedUrl,
          };
        }
        return file;
      })
    );
    setPdfFiles(updatedFiles);
  };

  // Refresh signed URLs every 45 minutes
  useEffect(() => {
    const interval = setInterval(refreshSignedUrls, 45 * 60 * 1000);
    return () => clearInterval(interval);
  }, [pdfFiles]);

  const handleDeleteFile = (file: PDFFile) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  const handleEditPolicy = (file: PDFFile) => {
    setEditingPolicy(file);
    setShowCreateModal(true);
  };

  const handleViewPDF = async (file: PDFFile) => {
    if (file.type === 'uploaded') {
      // Generate a fresh signed URL before opening
      const signedUrl = await generateSignedUrl(file.name);
      if (!signedUrl) {
        setPdfError('Unable to generate signed URL for the PDF');
        return;
      }
      window.open(signedUrl, '_blank');
      return;
    }

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
      const pdfDataUrl = await generateOtherPolicyPDF({
        title: file.displayName || '',
        content: file.content || '',
        policyNumber: file.policy_number,
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    
    try {
      setLoading(true);
      setError(null);

      const { error: storageError } = await supabase
        .storage
        .from('other-policies')
        .remove([fileToDelete.name]);

      if (storageError) throw storageError;

      // Also delete metadata
      const { error: metadataError } = await supabase
        .from('other_policy_files')
        .delete()
        .eq('file_name', fileToDelete.name);

      if (metadataError) throw metadataError;
      
      await fetchPDFFiles();
      setShowDeleteModal(false);
      setFileToDelete(null);
    } catch (err) {
      console.error('Error deleting file:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while deleting the file');
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

  const sortedAndFilteredFiles = React.useMemo(() => {
    let filteredFiles = [...pdfFiles];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredFiles = filteredFiles.filter(file => 
        file.displayName?.toLowerCase().includes(query) ||
        file.policy_number?.toString().includes(query)
      );
    }

    // Apply sorting
    if (sortConfig) {
      filteredFiles.sort((a, b) => {
        if (sortConfig.key === 'displayName') {
          const aValue = a.displayName || '';
          const bValue = b.displayName || '';
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (sortConfig.key === 'created_at') {
          const aDate = new Date(a.created_at).getTime();
          const bDate = new Date(b.created_at).getTime();
          return sortConfig.direction === 'asc' 
            ? aDate - bDate
            : bDate - aDate;
        }
        return 0;
      });
    }

    return filteredFiles;
  }, [pdfFiles, searchQuery, sortConfig]);

  const startEditingNumber = (file: PDFFile) => {
    setEditingPolicyNumber(file.id);
    setEditingNumber(file.policy_number || '');
  };

  const cancelEditingNumber = () => {
    setEditingPolicyNumber(null);
    setEditingNumber('');
  };

  const savePolicyNumber = async (file: PDFFile, newNumber: string) => {
    try {
      setSavingNumber(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First check if a record exists
      const { data: existingRecord } = await supabase
        .from('other_policy_files')
        .select('id')
        .eq('file_name', file.name)
        .single();

      let error;
      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('other_policy_files')
          .update({
            policy_number: newNumber,
            updated_at: new Date().toISOString()
          })
          .eq('file_name', file.name);
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('other_policy_files')
          .insert({
            file_name: file.name,
            policy_number: newNumber,
            user_id: user.id,
            type: file.type
          });
        error = insertError;
      }

      if (error) throw error;

      setPdfFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, policy_number: newNumber } : f
      ));
      setEditingPolicyNumber(null);
      setEditingNumber('');
    } catch (err) {
      console.error('Error saving policy number:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the policy number');
    } finally {
      setSavingNumber(false);
    }
  };

  return (
    <div className="h-full">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-white">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Health & Safety
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Other Policies</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mt-4 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Other Policies</h2>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <FileUp className="h-4 w-4 mr-2" />
            Upload Policy
          </button>
          <button
            onClick={() => {
              setEditingPolicy(null);
              setShowCreateModal(true);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <FilePlus className="h-4 w-4 mr-2" />
            Create Policy
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {pdfError && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{pdfError}</p>
        </div>
      )}

      {/* Search Input */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search policies..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-600 dark:text-white sm:text-sm"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        ) : sortedAndFilteredFiles.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-gray-500 dark:text-gray-400">No policies available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th 
                    scope="col" 
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer first:rounded-tl-lg"
                    onClick={() => handleSort('policy_number')}
                  >
                    <div className="flex items-center gap-2">
                      Policy Number
                      {sortConfig?.key === 'policy_number' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer"
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
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer"
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
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center gap-2">
                      Type
                      {sortConfig?.key === 'type' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer last:rounded-tr-lg"
                  >
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                {sortedAndFilteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white first:rounded-bl-lg">
                      {editingPolicyNumber === file.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingNumber}
                            onChange={(e) => setEditingNumber(e.target.value)}
                            className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Enter policy number"
                          />
                          <button
                            onClick={() => savePolicyNumber(file, editingNumber)}
                            disabled={savingNumber}
                            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEditingNumber}
                            className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="mr-2">{file.policy_number || '-'}</span>
                          <button
                            onClick={() => startEditingNumber(file)}
                            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {file.displayName || file.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(file.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {file.type === 'uploaded' ? 'Uploaded' : 'Created'}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium last:rounded-br-lg">
                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={() => handleViewPDF(file)}
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
                        {file.type === 'created' && (
                          <button
                            onClick={() => handleEditPolicy(file)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-white dark:hover:text-gray-300"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteFile(file)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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

      {showCreateModal && (
        <CreatePolicyModal
          onClose={() => {
            setShowCreateModal(false);
            setEditingPolicy(null);
          }}
          onSuccess={fetchPDFFiles}
          policyToEdit={editingPolicy}
        />
      )}

      {showUploadModal && (
        <OtherPoliciesUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={fetchPDFFiles}
        />
      )}

      {showDeleteModal && fileToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full m-4">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
              Confirm Deletion
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Are you sure you want to delete this policy? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setFileToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
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
    </div>
  );
}