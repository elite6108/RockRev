import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  Trash2,
  Save,
  X,
  AlertTriangle,
  FileText,
  ChevronLeft,
  Edit,
  Search,
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

type RiskAssessmentSignature = {
  id: string;
  risk_assessment_id: string;
  worker_id: string;
  signature_data: string;
  signed_at: string;
  risk_assessment: {
    name: string;
    ra_id: string;
  };
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
  const [showRiskAssessmentModal, setShowRiskAssessmentModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [riskAssessmentSignatures, setRiskAssessmentSignatures] = useState<RiskAssessmentSignature[]>([]);
  const [loadingSignatures, setLoadingSignatures] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const fetchRiskAssessmentSignatures = async (workerId: string) => {
    try {
      setLoadingSignatures(true);
      setError(null);

      const { data, error } = await supabase
        .from('workers_risk_assessment_signatures')
        .select(`
          *,
          risk_assessment:risk_assessments(name, ra_id)
        `)
        .eq('worker_id', workerId)
        .order('signed_at', { ascending: false });

      if (error) throw error;

      setRiskAssessmentSignatures(data || []);
    } catch (err) {
      console.error('Error fetching risk assessment signatures:', err);
      setError('Failed to load risk assessment signatures. Please try again.');
    } finally {
      setLoadingSignatures(false);
    }
  };

  const handleViewRiskAssessments = async (worker: Worker) => {
    setSelectedWorker(worker);
    await fetchRiskAssessmentSignatures(worker.id);
    setShowRiskAssessmentModal(true);
  };

  // Add filtering function
  const filteredWorkers = workers.filter((worker) => {
    const query = searchQuery.toLowerCase();
    return (
      worker.full_name?.toLowerCase().includes(query) ||
      worker.email?.toLowerCase().includes(query) ||
      worker.phone_number?.toLowerCase().includes(query) ||
      worker.company?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-white mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Workers</span>
      </div>

      {/* Header - Removed Add Worker button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Workers Management</h2>
      </div>

      {/* Search Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, phone or company..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Workers Table - Use filteredWorkers instead of workers */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                    Photo
                  </th>
                  <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                    Full Name
                  </th>
                  <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                    Contact
                  </th>
                  <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                    Health Questionnaire
                  </th>
                  <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                    Status
                  </th>
                  <th className="sticky top-0 px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No workers found. Workers must sign up through the Contractor Worker signup form.
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                              {worker.full_name?.substring(0, 2).toUpperCase() || 'NA'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer"
                        onClick={() => handleViewRiskAssessments(worker)}
                      >
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
                        <div className="flex justify-end space-x-4">
                          <button
                            onClick={() => handleEdit(worker)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(worker.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Worker Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingWorkerId ? 'Edit Worker' : 'Add New Worker'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingWorkerId(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company *
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Emergency Contact Name *
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Emergency Contact Phone *
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingWorkerId(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {editingWorkerId ? 'Update' : 'Add'} Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Risk Assessment Signatures Modal */}
      {showRiskAssessmentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-4xl w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Risk Assessment Signatures - {selectedWorker?.full_name}
              </h3>
              <button
                onClick={() => {
                  setShowRiskAssessmentModal(false);
                  setSelectedWorker(null);
                  setRiskAssessmentSignatures([]);
                }}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Risk Assessment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Signed At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Signature
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loadingSignatures ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : riskAssessmentSignatures.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No risk assessment signatures found for this worker.
                      </td>
                    </tr>
                  ) : (
                    riskAssessmentSignatures.map((signature) => (
                      <tr key={signature.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {signature.risk_assessment.name} (RA {signature.risk_assessment.ra_id})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {formatDate(signature.signed_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img
                            src={signature.signature_data}
                            alt="Signature"
                            className="h-12 w-32 object-contain"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full m-4">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
              Confirm Deletion
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Are you sure you want to delete this worker? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setWorkerToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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
