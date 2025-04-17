import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  ArrowRight,
  Plus,
  Trash2,
  AlertTriangle,
  Paperclip,
  Edit2,
  Save,
  X,
  CheckSquare,
  Square,
} from 'lucide-react';

interface HSUploadArtworkProps {
  onBack: () => void;
}

interface ArtworkFile {
  id: string;
  name: string;
  displayName: string;
  url: string;
  created_at: string;
}

export function HSUploadArtwork({ onBack }: HSUploadArtworkProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<ArtworkFile[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<ArtworkFile | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isGridView, setIsGridView] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrls, setCopiedUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFiles();
  }, []);

  const filteredFiles = files
    .filter((file) => {
      const query = searchQuery.toLowerCase();
      return file.displayName.toLowerCase().includes(query);
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all files using pagination
      let allFiles = [];
      let offset = 0;
      const limit = 100;

      while (true) {
        const { data: filesData, error: filesError } = await supabase.storage
          .from('signage-artwork')
          .list('', {
            limit: limit,
            offset: offset,
            sortBy: { column: 'name', order: 'asc' },
          });

        if (filesError) throw filesError;
        if (!filesData || filesData.length === 0) break;

        allFiles = [...allFiles, ...filesData];
        if (filesData.length < limit) break;
        offset += limit;
      }

      const { data: metadataData, error: metadataError } = await supabase
        .from('signage_artwork')
        .select('file_name, display_name');

      if (metadataError) throw metadataError;

      const metadataMap = new Map(
        metadataData?.map((m) => [m.file_name, m.display_name]) || []
      );

      const artworkFiles =
        allFiles
          ?.filter((file) => /\.(jpg|jpeg|png|svg)$/i.test(file.name))
          .map((file) => ({
            id: file.id,
            name: file.name,
            displayName:
              metadataMap.get(file.name) || file.name.replace(/\.[^/.]+$/, ''),
            url: supabase.storage
              .from('signage-artwork')
              .getPublicUrl(file.name).data.publicUrl,
            created_at: file.created_at,
          })) || [];

      // Sort files alphabetically by display name
      artworkFiles.sort((a, b) => a.displayName.localeCompare(b.displayName));
      setFiles(artworkFiles);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while fetching files'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const files = Array.from(e.target.files);
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const getUniqueDisplayName = async (baseName: string, userId: string) => {
        let counter = 1;
        let displayName = baseName;

        while (true) {
          const { data, error } = await supabase
            .from('signage_artwork')
            .select('id')
            .eq('display_name', displayName)
            .eq('user_id', userId)
            .maybeSingle();

          if (error) throw error;
          if (!data) break; // Name is unique

          // Add counter to name
          displayName = `${baseName} (${counter})`;
          counter++;
        }

        return displayName;
      };

      // Validate total upload size (max 50MB)
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const maxTotalSize = 50 * 1024 * 1024; // 50MB
      if (totalSize > maxTotalSize) {
        throw new Error('Total upload size exceeds 50MB limit');
      }

      const sanitizeFileName = (name: string) => {
        // Get file extension
        const ext = name.slice(((name.lastIndexOf('.') - 1) >>> 0) + 2);
        // Get base name without extension
        const baseName = name.substring(0, name.lastIndexOf('.'));
        // Sanitize base name
        const sanitizedBase = baseName
          .replace(/[^a-zA-Z0-9]/g, '-')
          .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
          .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
          .toLowerCase();
        // Return sanitized name with extension
        return `${sanitizedBase}.${ext}`;
      };

      // Validate files
      const invalidFiles = files.filter(
        (file) => !/\.(jpe?g|png|svg)$/i.test(file.name.toLowerCase())
      );
      if (invalidFiles.length > 0) {
        throw new Error(
          `Invalid file type(s): ${invalidFiles
            .map((f) => f.name)
            .join(', ')}. Only JPG, PNG, and SVG files are allowed.`
        );
      }

      // Validate file sizes (max 5MB each)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      const oversizedFiles = files.filter((file) => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        throw new Error(
          `File(s) too large: ${oversizedFiles
            .map((f) => f.name)
            .join(', ')}. Maximum size per file is 5MB.`
        );
      }

      // Upload all files
      for (const file of files) {
        const sanitizedName = sanitizeFileName(file.name);
        const fileName = `${Date.now()}-${sanitizedName}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('signage-artwork')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          if (uploadError.message.includes('duplicate')) {
            throw new Error(
              `File "${file.name}" already exists. Please rename the file or choose a different one.`
            );
          }
          throw new Error(
            `Failed to upload "${file.name}": ${uploadError.message}`
          );
        }

        if (!uploadData) {
          throw new Error(
            `Failed to upload "${file.name}": No response from server`
          );
        }

        // Store metadata
        const { error: metadataError } = await supabase
          .from('signage_artwork')
          .insert([
            {
              file_name: fileName,
              display_name: await getUniqueDisplayName(
                file.name.substring(0, file.name.lastIndexOf('.')),
                user.id
              ),
              user_id: user.id,
            },
          ]);

        if (metadataError) {
          // Try to clean up the uploaded file if metadata insertion fails
          await supabase.storage.from('signage-artwork').remove([fileName]);
          throw new Error(
            `Failed to save metadata for "${file.name}": ${metadataError.message}`
          );
        }
      }

      await fetchFiles();
      setShowUploadModal(false);
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while uploading files'
      );
    } finally {
      setLoading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleDelete = (file: ArtworkFile) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;

    setLoading(true);
    setError(null);

    try {
      const { error: storageError } = await supabase.storage
        .from('signage-artwork')
        .remove([fileToDelete.name]);

      if (storageError) throw storageError;

      // Delete metadata
      const { error: metadataError } = await supabase
        .from('signage_artwork')
        .delete()
        .eq('file_name', fileToDelete.name);

      if (metadataError) throw metadataError;

      await fetchFiles();
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

  const startEditing = (file: ArtworkFile) => {
    setEditingFile(file.id);
    setEditingName(file.displayName);
  };

  const cancelEditing = () => {
    setEditingFile(null);
    setEditingName('');
  };

  const saveDisplayName = async (file: ArtworkFile, newName: string) => {
    try {
      setSavingName(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('signage_artwork').upsert({
        file_name: file.name,
        display_name: newName,
        user_id: user.id,
      });

      if (error) throw error;

      setFiles((prev) =>
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

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrls((prev) => new Set(prev).add(url));
      setTimeout(() => {
        setCopiedUrls((prev) => {
          const newSet = new Set(prev);
          newSet.delete(url);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      setError('Failed to copy URL to clipboard');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Delete files from storage
      const filesToDelete = files.filter((file) => selectedFiles.has(file.id));

      for (const file of filesToDelete) {
        const { error: storageError } = await supabase.storage
          .from('signage-artwork')
          .remove([file.name]);

        if (storageError) throw storageError;

        // Delete metadata
        const { error: metadataError } = await supabase
          .from('signage_artwork')
          .delete()
          .eq('file_name', file.name);

        if (metadataError) throw metadataError;
      }

      await fetchFiles();
      setSelectedFiles(new Set());
    } catch (err) {
      console.error('Error deleting files:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while deleting files'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    setLoading(true);
    setError(null);

    try {
      // Delete all files from storage
      const { error: storageError } = await supabase.storage
        .from('signage-artwork')
        .remove(files.map((file) => file.name));

      if (storageError) throw storageError;

      // Delete all metadata
      const { error: metadataError } = await supabase
        .from('signage_artwork')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (metadataError) throw metadataError;

      await fetchFiles();
      setShowDeleteAllModal(false);
    } catch (err) {
      console.error('Error deleting all files:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while deleting all files'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  return (
    <>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
      >
        <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
        Back to Signage
      </button>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center mb-6">
            <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Artwork Files{' '}
                <span className="text-gray-500">({files.length})</span>
              </h2>
              <button
                onClick={() => setIsGridView(!isGridView)}
                className="w-full sm:w-auto px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {isGridView ? 'List View' : 'Grid View'}
              </button>
            </div>
            <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-4">
                {selectedFiles.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedFiles.size})
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteAllModal(true)}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </button>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".jpg,.jpeg,.png,.svg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Files
                </label>
              </div>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : files.length === 0 ? (
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No artwork files uploaded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {isGridView ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="relative bg-gray-50 rounded-lg p-4 group"
                    >
                      <div className="absolute top-2 left-2 z-10">
                        <button
                          onClick={() => toggleFileSelection(file.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {selectedFiles.has(file.id) ? (
                            <CheckSquare className="h-6 w-6" />
                          ) : (
                            <Square className="h-6 w-6" />
                          )}
                        </button>
                      </div>

                      <div className="w-20 h-20 mx-auto bg-white rounded-lg overflow-hidden mb-4">
                        <img
                          src={file.url}
                          alt={file.displayName}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://via.placeholder.com/200?text=Preview+Not+Available';
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        {editingFile === file.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md"
                              autoFocus
                            />
                            <button
                              onClick={() => saveDisplayName(file, editingName)}
                              disabled={savingName}
                              className="text-green-600 hover:text-green-700"
                              title="Save"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="text-gray-400 hover:text-gray-500"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {file.displayName}
                            </span>
                            <button
                              onClick={() => startEditing(file)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Edit name"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <button
                            onClick={() => copyToClipboard(file.url)}
                            className={`${
                              copiedUrls.has(file.url)
                                ? 'text-blue-600'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                            title="Copy URL"
                          >
                            <Paperclip className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(file)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900"
                      >
                        <span className="sr-only">Select</span>
                      </th>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        URL
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredFiles.map((file) => (
                      <tr key={file.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                          <button
                            onClick={() => toggleFileSelection(file.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {selectedFiles.has(file.id) ? (
                              <CheckSquare className="h-5 w-5" />
                            ) : (
                              <Square className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
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
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <button
                            onClick={() => copyToClipboard(file.url)}
                            className={`${
                              copiedUrls.has(file.url)
                                ? 'text-blue-600'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                            title="Copy URL"
                          >
                            <Paperclip className="h-4 w-4" />
                          </button>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                          <button
                            onClick={() => handleDelete(file)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

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

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm w-full m-4">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
              Delete All Artwork Files
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to delete all artwork files? This action
              cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
