import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { X, AlertCircle } from 'lucide-react';

interface StaffMember {
  id: number;
  name: string;
  position: string;
  email: string;
  phone: string;
  ni_number: string;
  start_date: string;
}

interface DriverFormProps {
  onClose: () => void;
  onSuccess: () => void;
  availableStaff: StaffMember[];
  selectedStaff: StaffMember | null;
}

export function DriverForm({ onClose, onSuccess, availableStaff, selectedStaff }: DriverFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    staff_id: selectedStaff?.id || '',
    licence_number: '',
    licence_expiry: ''
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (!formData.staff_id) throw new Error('Please select a staff member');
      if (!formData.licence_number) throw new Error('Please enter a licence number');
      if (!formData.licence_expiry) throw new Error('Please enter a licence expiry date');

      // Find the selected staff member to get their name
      const selectedStaffMember = availableStaff.find(staff => staff.id === Number(formData.staff_id));
      if (!selectedStaffMember) throw new Error('Selected staff member not found');

      // Create new driver record
      const { error } = await supabase
        .from('drivers')
        .insert([{
          staff_id: formData.staff_id,
          user_id: user.id,
          licence_number: formData.licence_number,
          licence_expiry: formData.licence_expiry,
          full_name: selectedStaffMember.name // Include the staff member's name
        }]);

      if (error) throw error;
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving driver:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            Add Driver Licence Information
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="staff_id" className="block text-sm font-medium text-gray-700 mb-1">
              Staff Member
            </label>
            <select
              id="staff_id"
              name="staff_id"
              required
              value={formData.staff_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={!!selectedStaff}
            >
              <option value="">Select a staff member</option>
              {availableStaff.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="licence_number" className="block text-sm font-medium text-gray-700 mb-1">
              Licence Number
            </label>
            <input
              type="text"
              id="licence_number"
              name="licence_number"
              required
              value={formData.licence_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="licence_expiry" className="block text-sm font-medium text-gray-700 mb-1">
              Licence Expiry Date
            </label>
            <input
              type="date"
              id="licence_expiry"
              name="licence_expiry"
              required
              value={formData.licence_expiry}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-4 rounded-md">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-[#374151] dark:text-white dark:hover:bg-[#DC2626] rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Add Licence Info'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 