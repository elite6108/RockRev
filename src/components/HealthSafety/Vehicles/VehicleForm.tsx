import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { X, AlertCircle } from 'lucide-react';
import type { Vehicle } from '../../../types/database';

interface StaffMember {
  id: number;
  name: string;
  position: string;
  email: string;
  phone: string;
  ni_number: string;
  start_date: string;
}

interface VehicleFormProps {
  onClose: () => void;
  onSuccess: () => void;
  vehicleToEdit?: Vehicle | null;
}

const UK_VEHICLE_BRANDS = [
  'Aston Martin',
  'Audi',
  'Bentley',
  'BMW',
  'Citroen',
  'Dacia',
  'Fiat',
  'Ford',
  'Honda',
  'Hyundai',
  'Jaguar',
  'Kia',
  'Land Rover',
  'Lexus',
  'Mazda',
  'Mercedes-Benz',
  'Mini',
  'Mitsubishi',
  'Nissan',
  'Peugeot',
  'Porsche',
  'Renault',
  'Seat',
  'Skoda',
  'Suzuki',
  'Tesla',
  'Toyota',
  'Vauxhall',
  'Volkswagen',
  'Volvo'
];

const SERVICE_INTERVAL_UNITS = [
  'Miles',
  'Hours',
  'Days',
  'Weeks',
  'Months',
  'Years'
];

export function VehicleForm({ onClose, onSuccess, vehicleToEdit }: VehicleFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [formData, setFormData] = useState({
    vin: vehicleToEdit?.vin || '',
    registration: vehicleToEdit?.registration || '',
    make: vehicleToEdit?.make || '',
    model: vehicleToEdit?.model || '',
    driver_id: vehicleToEdit?.driver_id || '',
    driver: '',
    mot_date: vehicleToEdit?.mot_date || '',
    tax_date: vehicleToEdit?.tax_date || '',
    service_date: vehicleToEdit?.service_date || '',
    insurance_date: vehicleToEdit?.insurance_date || '',
    breakdown_date: vehicleToEdit?.breakdown_date || '',
    has_congestion: vehicleToEdit?.has_congestion || false,
    has_dartford: vehicleToEdit?.has_dartford || false,
    has_clean_air: vehicleToEdit?.has_clean_air || false,
    service_interval_value: vehicleToEdit?.service_interval_value || '',
    service_interval_unit: vehicleToEdit?.service_interval_unit || 'Miles',
    notes: vehicleToEdit?.notes || ''
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setStaff(data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching staff');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (name === 'driver_id' && value) {
      const selectedStaff = staff.find(s => s.id === Number(value));
      setFormData(prev => ({
        ...prev,
        [name]: value,
        driver: selectedStaff?.name || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (formData.driver_id) {
        const selectedStaff = staff.find(s => s.id === Number(formData.driver_id));
        if (!selectedStaff) throw new Error('Selected staff member not found');
        formData.driver = selectedStaff.name;
      }

      let error;
      if (vehicleToEdit) {
        ({ error } = await supabase
          .from('vehicles')
          .update({
            ...formData,
            vin: formData.vin || null,
            driver_id: formData.driver_id || null,
            driver: formData.driver || null,
            mot_date: formData.mot_date || null,
            tax_date: formData.tax_date || null,
            service_date: formData.service_date || null,
            insurance_date: formData.insurance_date || null,
            breakdown_date: formData.breakdown_date || null,
            service_interval_value: formData.service_interval_value || null,
            notes: formData.notes || null
          })
          .eq('id', vehicleToEdit.id));
      } else {
        ({ error } = await supabase
          .from('vehicles')
          .insert([{
            ...formData,
            user_id: user.id,
            vin: formData.vin || null,
            driver_id: formData.driver_id || null,
            driver: formData.driver || null,
            mot_date: formData.mot_date || null,
            tax_date: formData.tax_date || null,
            service_date: formData.service_date || null,
            insurance_date: formData.insurance_date || null,
            breakdown_date: formData.breakdown_date || null,
            service_interval_value: formData.service_interval_value || null,
            notes: formData.notes || null
          }]));
      }

      if (error) throw error;
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving vehicle:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto my-8 sm:my-4 max-h-[90vh] sm:max-h-[800px] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 p-4 sm:p-8 border-b">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <h2 className="text-2xl font-bold text-center sm:text-left">
              {vehicleToEdit ? 'Edit Vehicle' : 'New Vehicle'}
            </h2>
            <button
              onClick={onClose}
              className="w-full sm:w-auto text-gray-400 hover:text-gray-500 focus:outline-none flex justify-center items-center"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-2">
                  VIN (Optional)
                </label>
                <input
                  type="text"
                  id="vin"
                  name="vin"
                  value={formData.vin}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="registration" className="block text-sm font-medium text-gray-700 mb-2">
                  Registration
                </label>
                <input
                  type="text"
                  id="registration"
                  name="registration"
                  required
                  value={formData.registration}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-2">
                  Make
                </label>
                <select
                  id="make"
                  name="make"
                  required
                  value={formData.make}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a make</option>
                  {UK_VEHICLE_BRANDS.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  required
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="driver_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Driver
                </label>
                <select
                  id="driver_id"
                  name="driver_id"
                  value={formData.driver_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a driver</option>
                  {staff.map(staffMember => (
                    <option key={staffMember.id} value={staffMember.id}>
                      {staffMember.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="mot_date" className="block text-sm font-medium text-gray-700 mb-2">
                  MOT Due Date
                </label>
                <input
                  type="date"
                  id="mot_date"
                  name="mot_date"
                  value={formData.mot_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="tax_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Due Date
                </label>
                <input
                  type="date"
                  id="tax_date"
                  name="tax_date"
                  value={formData.tax_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="service_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Service Due Date
                </label>
                <input
                  type="date"
                  id="service_date"
                  name="service_date"
                  value={formData.service_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="insurance_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Due Date
                </label>
                <input
                  type="date"
                  id="insurance_date"
                  name="insurance_date"
                  value={formData.insurance_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="breakdown_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Breakdown Cover Due Date
                </label>
                <input
                  type="date"
                  id="breakdown_date"
                  name="breakdown_date"
                  value={formData.breakdown_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="service_interval_value" className="block text-sm font-medium text-gray-700 mb-2">
                  Service Interval
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    id="service_interval_value"
                    name="service_interval_value"
                    value={formData.service_interval_value}
                    onChange={handleChange}
                    className="w-2/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <select
                    id="service_interval_unit"
                    name="service_interval_unit"
                    value={formData.service_interval_unit}
                    onChange={handleChange}
                    className="w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {SERVICE_INTERVAL_UNITS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  id="has_congestion"
                  name="has_congestion"
                  checked={formData.has_congestion}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="has_congestion" className="text-sm font-medium text-gray-700">
                  Has Congestion Charge
                </label>
              </div>

              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  id="has_dartford"
                  name="has_dartford"
                  checked={formData.has_dartford}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="has_dartford" className="text-sm font-medium text-gray-700">
                  Has Dartford Crossing
                </label>
              </div>

              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  id="has_clean_air"
                  name="has_clean_air"
                  checked={formData.has_clean_air}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="has_clean_air" className="text-sm font-medium text-gray-700">
                  Has Clean Air Zone
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
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

            <div className="flex justify-end space-x-4">
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
                {loading ? 'Saving...' : vehicleToEdit ? 'Save Changes' : 'Add Vehicle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}