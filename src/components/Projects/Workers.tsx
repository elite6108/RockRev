import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Upload,
  AlertTriangle,
} from 'lucide-react';

type Worker = {
  id: string;
  full_name: string;
  phone_number: string;
  dob: string | null;
  national_insurance: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  last_health_questionnaire: string | null;
  photo_url: string | null;
  first_name: string | null;
  last_name: string | null;
  last_main_questionnaire_date: string | null;
  email: string;
  company: string;
  is_active: boolean;
  created_at: string;
};

type WorkersProps = {
  onBack: () => void;
};

export function Workers({ onBack }: WorkersProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    company: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .order('full_name');

      if (error) throw error;

      setWorkers(data || []);
    } catch (err) {
      console.error('Error fetching workers:', err);
      setError('Failed to load workers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone_number: '',
      email: '',
      company: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    try {
      setUploading(true);

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `worker-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('workers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('workers').getPublicUrl(filePath);

      setFormData((prev) => ({
        ...prev,
        photo_url: data.publicUrl,
      }));
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not provided';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const dataToSubmit = {
        ...formData,
        is_active: true,
      };

      if (editingWorkerId) {
        // Update existing worker
        const { error } = await supabase
          .from('workers')
          .update(dataToSubmit)
          .eq('id', editingWorkerId);

        if (error) throw error;
      } else {
        // Add new worker
        const { error } = await supabase.from('workers').insert([dataToSubmit]);

        if (error) throw error;
      }

      // Refresh the workers list
      await fetchWorkers();

      // Reset form and state
      resetForm();
      setShowAddForm(false);
      setEditingWorkerId(null);
    } catch (err: any) {
      console.error('Error saving worker:', err);

      // Provide more specific error message
      let errorMessage = 'Failed to save worker. ';

      if (err.code) {
        switch (err.code) {
          case '23505': // Unique violation
            errorMessage += 'A worker with this email already exists.';
            break;
          case '23502': // Not null violation
            errorMessage += 'Please fill in all required fields.';
            break;
          case '42P01': // Undefined table
            errorMessage += 'Database table not found. Please contact support.';
            break;
          case '42703': // Undefined column
            errorMessage += `Database error: ${
              err.message || 'Unknown column error'
            }`;
            break;
          default:
            errorMessage += err.message || `Error code: ${err.code}`;
        }
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage +=
          'Unknown error occurred. Please try again or contact support.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (worker: Worker) => {
    setFormData({
      full_name: worker.full_name || '',
      phone_number: worker.phone_number || '',
      email: worker.email || '',
      company: worker.company || '',
      emergency_contact_name: worker.emergency_contact_name || '',
      emergency_contact_phone: worker.emergency_contact_phone || '',
    });

    setEditingWorkerId(worker.id);
    setShowAddForm(true);
  };

  const confirmDelete = (id: string) => {
    setWorkerToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!workerToDelete) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('workers')
        .delete()
        .eq('id', workerToDelete);

      if (error) throw error;

      // Refresh the workers list
      await fetchWorkers();

      // Close modal
      setShowDeleteModal(false);
      setWorkerToDelete(null);
    } catch (err) {
      console.error('Error deleting worker:', err);
      setError('Failed to delete worker. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </button>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Workers Management
      </h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Edit Worker
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="full_name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  id="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="phone_number"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  id="phone_number"
                  required
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="company"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Company *
                </label>
                <input
                  type="text"
                  name="company"
                  id="company"
                  required
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="emergency_contact_name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Emergency Contact Name *
                </label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  id="emergency_contact_name"
                  required
                  value={formData.emergency_contact_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="emergency_contact_phone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Emergency Contact Phone *
                </label>
                <input
                  type="text"
                  name="emergency_contact_phone"
                  id="emergency_contact_phone"
                  required
                  value={formData.emergency_contact_phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingWorkerId(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        {loading ? (
          <div className="p-6 text-center">Loading workers...</div>
        ) : workers.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No workers found. Workers must sign up through the Contractor Worker
            signup form.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Photo
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Full Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Contact
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Health Questionnaire
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {workers.map((worker) => (
                  <tr key={worker.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {worker.photo_url ? (
                        <img
                          src={worker.photo_url}
                          alt={worker.full_name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                            {worker.full_name?.substring(0, 2).toUpperCase() ||
                              'NA'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {worker.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {worker.phone_number || worker.email ? (
                        <div>
                          {worker.phone_number && (
                            <div>{worker.phone_number}</div>
                          )}
                          {worker.email && (
                            <div className="text-xs">{worker.email}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">
                          Not provided
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {worker.last_health_questionnaire ? (
                        formatDate(worker.last_health_questionnaire)
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">
                          Not provided
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          worker.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {worker.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(worker)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Edit worker"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(worker.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete worker"
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-300" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Delete Worker
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete this worker? This action
                    cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setWorkerToDelete(null);
                }}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
