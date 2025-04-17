import React, { useState } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { X, AlertCircle } from 'lucide-react';
import type { Supplier } from '../../../src/types/database';

interface SupplierFormProps {
  onClose: () => void;
  onSuccess: () => void;
  supplierToEdit?: Supplier | null;
}

export function SupplierForm({
  onClose,
  onSuccess,
  supplierToEdit,
}: SupplierFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: supplierToEdit?.name || '',
    address_line1: supplierToEdit?.address_line1 || '',
    address_line2: supplierToEdit?.address_line2 || '',
    town: supplierToEdit?.town || '',
    county: supplierToEdit?.county || '',
    post_code: supplierToEdit?.post_code || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let error;
      if (supplierToEdit) {
        // Update existing supplier
        ({ error } = await supabase
          .from('suppliers')
          .update({
            ...formData,
            address_line2: formData.address_line2 || null,
          })
          .eq('id', supplierToEdit.id));
      } else {
        // Create new supplier
        ({ error } = await supabase.from('suppliers').insert([
          {
            ...formData,
            user_id: user.id,
            address_line2: formData.address_line2 || null,
          },
        ]));
      }

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving supplier:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 overflow-y-auto h-full w-full flex items-start sm:items-center justify-center p-4">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full my-4 sm:my-8 max-h-[90vh] sm:max-h-[800px] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {supplierToEdit ? 'Edit Supplier' : 'New Supplier'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Supplier Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
              placeholder="Enter supplier name"
            />
          </div>

          <div>
            <label
              htmlFor="address_line1"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Address Line 1
            </label>
            <input
              type="text"
              id="address_line1"
              name="address_line1"
              required
              value={formData.address_line1}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
              placeholder="Enter address line 1"
            />
          </div>

          <div>
            <label
              htmlFor="address_line2"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Address Line 2
            </label>
            <input
              type="text"
              id="address_line2"
              name="address_line2"
              value={formData.address_line2}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
              placeholder="Enter address line 2 (optional)"
            />
          </div>

          <div>
            <label
              htmlFor="town"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Town
            </label>
            <input
              type="text"
              id="town"
              name="town"
              required
              value={formData.town}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
              placeholder="Enter town"
            />
          </div>

          <div>
            <label
              htmlFor="county"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              County
            </label>
            <input
              type="text"
              id="county"
              name="county"
              required
              value={formData.county}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
              placeholder="Enter county"
            />
          </div>

          <div>
            <label
              htmlFor="post_code"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Post Code
            </label>
            <input
              type="text"
              id="post_code"
              name="post_code"
              required
              value={formData.post_code}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
              placeholder="Enter post code"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-red-600 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Saving...'
                : supplierToEdit
                ? 'Save Changes'
                : 'Create Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
