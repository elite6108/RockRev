import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  ArrowRight,
  Plus,
  FileText,
  Trash2,
  Edit2,
  AlertTriangle,
  Save,
  X,
  ExternalLink,
} from 'lucide-react';
import { ToolboxTalkPDFUploadForm } from './ToolboxTalkPDFUploadForm';

interface ToolboxTalkPDFsProps {
  onBack: () => void;
}

interface PDFFile {
  id: string;
  name: string;
  created_at: string;
  size: number;
  url: string;
  displayName?: string;
}

export function ToolboxTalkPDFs({ onBack }: ToolboxTalkPDFsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<PDFFile | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    fetchPDFFiles();
  }, []);

  const fetchPDFFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: filesData, error: filesError } = await supabase.storage
        .from('toolbox-talks')
        .list();

      if (filesError) throw filesError;

      // Get display names from metadata
      const { data: metadataData, error: metadataError } = await supabase
        .from('toolbox_talk_pdfs')
        .select('file_name, display_name');

      if (metadataError) throw metadataError;

      const metadataMap = new Map(
        metadataData?.map((m) => [m.file_name, m.display_name]) || []
      );

      // Filter for PDF files only and map with display names
      const pdfFiles =
        filesData
          ?.filter((file) => file.name.toLowerCase().endsWith('.pdf'))
          .map((file) => ({
            id: file.id,
            name: file.name,
            created_at: file.created_at,
            size: file.metadata?.size || 0,
            url: supabase.storage.from('toolbox-talks').getPublicUrl(file.name)
              .data.publicUrl,
            displayName:
              metadataMap.get(file.name) || file.name.replace(/\.pdf$/i, ''),
          })) || [];

      setPdfFiles(pdfFiles);
    } catch (err) {
      console.error('Error fetching PDF files:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while fetching PDF files'
      );
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

      // Get the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Update or insert the display name in the metadata table
      const { error } = await supabase.from('toolbox_talk_pdfs').upsert({
        file_name: file.name,
        display_name: newName,
        user_id: user.id,
      });

      if (error) throw error;

      // Update local state
      setPdfFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, displayName: newName } : f))
      );
      setEditingFile(null);
      setEditingName('');
    } catch (err) {
      console.error('Error saving display name:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while saving the display name'
      );
    } finally {
      setSavingName(false);
    }
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;

    setLoading(true);
    setError(null);

    try {
      const { error: storageError } = await supabase.storage
        .from('toolbox-talks')
        .remove([fileToDelete.name]);

      if (storageError) throw storageError;

      // Also delete metadata
      const { error: metadataError } = await supabase
        .from('toolbox_talk_pdfs')
        .delete()
        .eq('file_name', fileToDelete.name);

      if (metadataError) throw metadataError;

      await fetchPDFFiles();
      setShowDeleteModal(false);
      setFileToDelete(null);
    } catch (err) {
      console.error('Error deleting file:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while deleting the file'
      );
    } finally {
      setLoading(false);
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
        Back to Toolbox Talks
      </button>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Toolbox Talk PDFs
            </h2>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Toolbox PDF
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-4 rounded-md">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : pdfFiles.length === 0 ? (
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No PDF files uploaded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      File Name
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Size
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Uploaded Date
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                  {pdfFiles.map((file) => (
                    <tr key={file.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 dark:text-gray-300 mr-2" />
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
                                  onClick={() =>
                                    saveDisplayName(file, editingName)
                                  }
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
                        {formatFileSize(file.size)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(file.created_at).toLocaleDateString()}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-4">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-white"
                            title="View PDF"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
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
      </div>

      {showUploadModal && (
        <ToolboxTalkPDFUploadForm
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            fetchPDFFiles();
            setShowUploadModal(false);
          }}
        />
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
              Are you sure you want to delete "{fileToDelete.displayName}"? This
              action cannot be undone.
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
