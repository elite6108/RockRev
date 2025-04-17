import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, FileUp, Trash2, AlertTriangle, FileText, Loader2, ExternalLink, Edit2, Save, X, RefreshCw } from 'lucide-react';
import { supabase } from "../../../lib/supabase";
import { PolicyPDFUploadModal } from './PolicyPDFUploadModal';
import { generateHSPolicyPDF } from '../../../utils/HSPolicyPDFGenerator';
import { HSPolicyEditor } from './HSPolicyEditor';

interface HSPolicyProps {
  onBack: () => void;
}

interface PDFFile {
  id: string;
  name: string;
  type: 'uploaded' | 'created';
  policy_number?: string;
  created_at: string;
  updated_at?: string;
  size: number;
  url: string;
  displayName?: string;
  content?: string;
}

export function HSPolicy({ onBack }: HSPolicyProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<PDFFile | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [showBlankModal, setShowBlankModal] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    fetchPDFFiles();
  }, []);

  const fetchPDFFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting to fetch PDF files...');

      // First, check if we can access the storage bucket
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .from('hs-policies')
        .list();
      
      if (bucketError) {
        console.error('Error accessing storage bucket:', bucketError);
        throw bucketError;
      }
      console.log('Storage bucket accessed successfully');
      console.log('Files in bucket:', bucketData);

      // Fetch metadata for uploaded files and created H&S policies
      const { data: policiesData, error: metadataError } = await supabase
        .from('hs_policy_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (metadataError) {
        console.error('Error fetching metadata:', metadataError);
        throw metadataError;
      }
      console.log('Metadata fetched successfully');
      console.log('Number of policies in database:', policiesData?.length || 0);
      console.log('Policies data:', policiesData);

      const metadataMap = new Map(policiesData?.filter(p => p.type === 'uploaded').map(m => [m.file_name, m.display_name]) || []);
      console.log('Metadata map created');
      console.log('Number of entries in metadata map:', metadataMap.size);
      console.log('Metadata map entries:', Array.from(metadataMap.entries()));

      // Process uploaded files
      const uploadedFiles = bucketData
        ?.filter(file => file.name.toLowerCase().endsWith('.pdf'))
        .map(file => {
          const fileData = {
            id: file.id,
            name: file.name,
            created_at: file.created_at,
            size: file.metadata?.size || 0,
            url: supabase.storage.from('hs-policies').getPublicUrl(file.name).data.publicUrl,
            displayName: metadataMap.get(file.name) || file.name.replace(/\.pdf$/i, ''),
            type: 'uploaded' as const
          };
          console.log('Processing uploaded file:', fileData);
          return fileData;
        }) || [];
      console.log('Processed uploaded files');
      console.log('Number of uploaded files:', uploadedFiles.length);
      console.log('Uploaded files:', uploadedFiles);

      // Process created policies
      const createdFiles = (policiesData || [])
        .filter(policy => policy.type === 'created')
        .map(policy => {
          const policyData = {
            id: policy.id,
            name: policy.file_name,
            displayName: policy.display_name,
            created_at: policy.created_at,
            updated_at: policy.updated_at,
            size: 0,
            url: '',
            type: 'created' as const,
            content: policy.content
          };
          console.log('Processing created policy:', policyData);
          return policyData;
        });
      console.log('Processed created files');
      console.log('Number of created files:', createdFiles.length);
      console.log('Created files:', createdFiles);

      // Combine both types of files
      const allFiles = [...createdFiles, ...uploadedFiles];
      console.log('Combined all files');
      console.log('Total number of files:', allFiles.length);
      console.log('All files:', allFiles);
      
      setPdfFiles(allFiles);
    } catch (err) {
      console.error('Error fetching PDF files:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching PDF files');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = (file: PDFFile) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  const startEditing = (file: PDFFile) => {
    setEditingFile(file.id);
    setEditingName(file.displayName || file.name.replace(/\.pdf$/i, ''));
  };

  const cancelEditing = () => {
    setEditingFile(null);
    setEditingName('');
  };

  const saveDisplayName = async (file: PDFFile, newName: string) => {
    try {
      setSavingName(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('hs_policy_files')
        .upsert({
          file_name: file.name,
          display_name: newName,
          user_id: user.id
        });

      if (error) throw error;

      setPdfFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, displayName: newName } : f
      ));
      setEditingFile(null);
      setEditingName('');
    } catch (err) {
      console.error('Error saving display name:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the display name');
    } finally {
      setSavingName(false);
    }
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    
    setLoading(true);
    setError(null);

    try {
      if (fileToDelete.type === 'uploaded') {
        // Delete uploaded file from storage
        const { error: storageError } = await supabase
          .storage
          .from('hs-policies')
          .remove([fileToDelete.name]);

        if (storageError) throw storageError;

        // Delete metadata for uploaded file
        const { error: metadataError } = await supabase
          .from('hs_policy_files')
          .delete()
          .eq('file_name', fileToDelete.name);

        if (metadataError) throw metadataError;
      } else {
        // Delete created policy from database
        const { error: deleteError } = await supabase
          .from('hs_policy_files')
          .delete()
          .eq('id', fileToDelete.id);

        if (deleteError) throw deleteError;
      }
      
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

  const handleViewPDF = async (file: PDFFile) => {
    if (file.type === 'uploaded') {
      window.open(file.url, '_blank');
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

      // Parse content from JSON string
      let content;
      try {
        content = JSON.parse(file.content || '{}');
      } catch (err) {
        console.error('Error parsing content:', err);
        content = { sections: [] };
      }

      const combinedContent = content.sections
        .sort((a: any, b: any) => a.order - b.order)
        .map((section: any) => `<h2>${section.title}</h2>${section.content}`)
        .join('\n\n');

      // Generate PDF
      const pdfDataUrl = await generateHSPolicyPDF({
        title: file.displayName || '',
        content: combinedContent,
        policyNumber: parseInt(file.policy_number || '0'),
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

  return (
    <>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
      >
        <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
        Back to Policies
      </button>
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">H&S Policy</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={fetchPDFFiles}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Upload PDF
              </button>
              <button
                onClick={() => setShowBlankModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Document
              </button>
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
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Policy ID
                    </th>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      File Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Created Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Last Edited
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Size
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {pdfFiles.map((file) => (
                    <tr key={file.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        HSPOL-{String(file.policy_number || '').padStart(2, '0')}
                      </td>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-2" />
                          {editingFile === file.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                autoFocus
                              />
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => saveDisplayName(file, editingName)}
                                  disabled={savingName}
                                  className="text-green-600 hover:text-green-700 p-1"
                                  title="Save"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="text-gray-400 hover:text-gray-500 p-1"
                                  title="Cancel"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span>{file.displayName}</span>
                              <button
                                onClick={() => startEditing(file)}
                                className="ml-2 text-gray-400 hover:text-gray-600 p-1"
                                title="Edit name"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(file.created_at).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {file.updated_at ? new Date(file.updated_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-4">
                          {file.type === 'uploaded' ? (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-gray-900"
                              title="View PDF"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  const url = new URL(window.location.href);
                                  url.searchParams.set('id', file.id);
                                  window.history.pushState({}, '', url);
                                  setShowBlankModal(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-white dark:hover:text-gray-300"
                                title="Edit Policy"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleViewPDF(file)}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
                                title="View PDF"
                              >
                                <FileText className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteFile(file)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {pdfFiles.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-500">
                        No PDF files found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <PolicyPDFUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={fetchPDFFiles}
        />
      )}

      {/* Create Document Modal */}
      {showBlankModal && (
        <HSPolicyEditor onClose={() => setShowBlankModal(false)} />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && fileToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm w-full m-4">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
              Confirm Deletion
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to delete "{fileToDelete.displayName}"? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setFileToDelete(null);
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