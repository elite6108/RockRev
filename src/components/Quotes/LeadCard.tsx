import React, { useState } from 'react';
import { Lead, LeadStatus } from './LeadManagement';
import {
  Mail,
  Phone,
  Building,
  MessageSquare,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LeadCardProps {
  lead: Lead;
  onUpdate: () => void;
}

const statusColors = {
  new: 'bg-blue-100 text-blue-800 dark:bg-[rgb(13,50,99)] dark:text-white',
  cold: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white',
  hot: 'bg-red-100 text-red-800 dark:bg-[rgb(137,3,3)] dark:text-white',
  converted:
    'bg-green-100 text-green-800 dark:bg-[rgb(4,97,36)] dark:text-white',
};

export function LeadCard({ lead, onUpdate }: LeadCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.from('leads').delete().eq('id', lead.id);

      if (error) throw error;
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', lead.id);

      if (error) throw error;
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-white"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {lead.name}
            </h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-white"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-gray-400 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-2 mt-2">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Mail className="h-4 w-4 mr-2" />
              {lead.email}
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Phone className="h-4 w-4 mr-2" />
              {lead.phone}
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Building className="h-4 w-4 mr-2" />
              {lead.company}
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <MessageSquare className="h-4 w-4 mr-2" />
              {lead.message}
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-white">
              <span className="font-medium">Budget:</span>
              <span className="ml-1">
                £
                {parseFloat(
                  lead.budget?.replace(/[^0-9.-]+/g, '')
                )?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              statusColors[lead.status]
            }`}
          >
            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
          </span>
          <div className="flex space-x-1">
            {Object.keys(statusColors).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status as LeadStatus)}
                className={`p-1 rounded-full ${
                  status === lead.status
                    ? 'bg-gray-200 dark:bg-gray-600'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    statusColors[status as LeadStatus].split(' ')[0]
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-xs text-red-600 dark:text-red-300">{error}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Lead
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete this lead? This action cannot be
                undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Lead
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  value={lead.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  value={lead.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone
                </label>
                <input
                  type="tel"
                  value={lead.phone}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company
                </label>
                <input
                  type="text"
                  value={lead.company}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Budget
                </label>
                <input
                  type="text"
                  value={lead.budget}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message
                </label>
                <textarea
                  value={lead.message}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  readOnly
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  value={lead.status}
                  onChange={(e) =>
                    handleStatusChange(e.target.value as LeadStatus)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                >
                  <option value="new">New Lead</option>
                  <option value="cold">Cold Lead</option>
                  <option value="hot">Hot Lead</option>
                  <option value="converted">Converted</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
