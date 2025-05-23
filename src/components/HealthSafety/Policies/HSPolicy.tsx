import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, FileUp, Trash2, AlertTriangle, FileText, Loader2, ExternalLink, Edit2, Save, X, RefreshCw, ChevronLeft } from 'lucide-react';
import { supabase } from "../../../lib/supabase";
import { HSPolicyUploadModal } from './HSPolicyUploadModal';
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
  signed_url?: string;
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

  useEffect(() => {
    if (showUploadModal) {
      console.log('Upload modal shown with props:', {
        bucketName: "hs-policies",
        metadataTable: "hs_policy_files"
      });
    }
  }, [showUploadModal]);

  const generateSignedUrl = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('hs-policies')
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

      // Process uploaded files with signed URLs
      const uploadedFiles = await Promise.all(
        bucketData
          ?.filter(file => file.name.toLowerCase().endsWith('.pdf'))
          .map(async (file) => {
            const signedUrl = await generateSignedUrl(file.name);
            const fileData = {
              id: file.id,
              name: file.name,
              created_at: file.created_at,
              size: file.metadata?.size || 0,
              url: signedUrl,
              signed_url: signedUrl,
              displayName: metadataMap.get(file.name) || file.name.replace(/\.pdf$/i, ''),
              type: 'uploaded' as const
            };
            console.log('Processing uploaded file:', fileData);
            return fileData;
          }) || []
      );
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
            signed_url: '',
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

      // First check if a record exists
      const { data: existingRecord } = await supabase
        .from('hs_policy_files')
        .select('id')
        .eq('file_name', file.name)
        .single();

      let error;
      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('hs_policy_files')
          .update({
            display_name: newName,
            updated_at: new Date().toISOString()
          })
          .eq('file_name', file.name);
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('hs_policy_files')
          .insert({
            file_name: file.name,
            display_name: newName,
            user_id: user.id,
            type: file.type
          });
        error = insertError;
      }

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
        <span className="text-gray-900 dark:text-white font-medium">Health & Safety Policy</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mt-4 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Health & Safety Policy</h2>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <FileUp className="h-4 w-4 mr-2" />
            Upload Policy
          </button>
          <button
            onClick={() => setShowBlankModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Plus className="h-4 w-4 mr-2" />
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

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        ) : pdfFiles.length === 0 ? (
          <div className="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-700/50">
            <p className="text-gray-500 dark:text-gray-400">No policies yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white first:rounded-tl-lg">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Created
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Last Updated
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Type
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 last:rounded-tr-lg">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                {pdfFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 dark:text-white first:rounded-bl-lg">
                      {editingFile === file.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <button
                            onClick={() => saveDisplayName(file, editingName)}
                            disabled={savingName}
                            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="mr-2">{file.displayName || file.name}</span>
                          <button
                            onClick={() => startEditing(file)}
                            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(file.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {file.updated_at && file.updated_at !== file.created_at
                        ? new Date(file.updated_at).toLocaleDateString()
                        : '-'}
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

      {/* Modals */}
      {showUploadModal && (
        <HSPolicyUploadModal
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

      {showBlankModal && (
        <HSPolicyEditor
          onClose={() => setShowBlankModal(false)}
          onSuccess={fetchPDFFiles}
        />
      )}
    </div>
  );
}