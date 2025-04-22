import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { DriverForm } from './DriverForm';

interface StaffMember {
  id: number;
  name: string;
  position: string;
  email: string;
  phone: string;
  ni_number: string;
  start_date: string;
}

interface Driver {
  id: string;
  staff_id: number;
  licence_number: string;
  licence_expiry: string;
  user_id: string;
}

interface DriversListProps {
  onBack: () => void;
}

export function DriversList({ onBack }: DriversListProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both drivers and staff
      const [driversResponse, staffResponse] = await Promise.all([
        supabase
          .from('drivers')
          .select('*')
          .order('licence_number', { ascending: true }),
        supabase.from('staff').select('*').order('name', { ascending: true }),
      ]);

      if (driversResponse.error) throw driversResponse.error;
      if (staffResponse.error) throw staffResponse.error;

      setDrivers(driversResponse.data || []);
      setStaff(staffResponse.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while fetching data'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    setDriverToDelete(driverId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!driverToDelete) return;

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverToDelete);

      if (error) throw error;

      await fetchData();
      setShowDeleteModal(false);
      setDriverToDelete(null);
    } catch (err) {
      console.error('Error deleting driver:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while deleting the driver'
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter out staff members who are already drivers
  const availableStaff = staff.filter(
    (staffMember) =>
      !drivers.some((driver) => driver.staff_id === staffMember.id)
  );

  // Add filtered drivers
  const filteredDrivers = drivers.filter((driver) =>
    driver.staff?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.licence_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-white mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Vehicle Management
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Drivers</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Drivers Management</h2>
        {availableStaff.length > 0 && (
          <button
            onClick={() => {
              setSelectedStaff(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Licence Info
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name or licence number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        ) : drivers.length === 0 ? (
          <div className="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No drivers yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    Licence Number
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    Licence Expiry
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filteredDrivers.map((driver) => {
                  const staffMember = staff.find(
                    (s) => s.id === driver.staff_id
                  );
                  return (
                    <tr key={driver.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white">
                        {staffMember?.name || 'Unknown Staff Member'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {driver.licence_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {driver.licence_expiry
                          ? new Date(
                              driver.licence_expiry
                            ).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-4">
                          <button
                            onClick={() => {
                              setSelectedStaff(staffMember || null);
                              setShowAddModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDriver(driver.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Driver Form Modal */}
      {showAddModal && (
        <DriverForm
          availableStaff={availableStaff}
          selectedStaff={selectedStaff}
          onClose={() => {
            setShowAddModal(false);
            setSelectedStaff(null);
          }}
          onSuccess={() => {
            fetchData();
            setShowAddModal(false);
            setSelectedStaff(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full m-4">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
              Confirm Deletion
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Are you sure you want to delete this driver? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDriverToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 dark:hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
