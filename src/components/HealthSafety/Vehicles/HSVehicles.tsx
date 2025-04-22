import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Car,
  Users,
  Bell,
  AlertCircle,
  ClipboardCheck,
  Search,
  ChevronDown,
} from 'lucide-react';
import { VehicleForm } from './VehicleForm';
import { DriversList } from './DriversList';
import { HSVehicleChecklists } from './HSVehicleChecklists';
import type { Vehicle, Driver } from '../../../types/database';

interface HSVehiclesProps {
  onBack: () => void;
}

interface Reminder {
  type: 'vehicle' | 'driver';
  title: string;
  date: Date;
  description: string;
  severity: 'warning' | 'danger';
}

interface DriverWithStaff extends Driver {
  staff: {
    name: string;
  };
}

const getDateStatus = (date: string | null) => {
  if (!date) return { text: '-', color: 'text-gray-500' };

  const expiryDate = new Date(date);
  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      text: new Date(date).toLocaleDateString(),
      color: 'text-red-600',
    };
  } else if (diffDays <= 30) {
    return {
      text: new Date(date).toLocaleDateString(),
      color: 'text-orange-500',
    };
  }
  return {
    text: new Date(date).toLocaleDateString(),
    color: 'text-gray-500',
  };
};

export function HSVehicles({ onBack }: HSVehiclesProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<DriverWithStaff[]>([]);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVehicleList, setShowVehicleList] = useState(false);
  const [showDriversList, setShowDriversList] = useState(false);
  const [showChecklists, setShowChecklists] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRemindersExpanded, setIsRemindersExpanded] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Update reminders whenever vehicles or drivers change
    setReminders(getReminders());
  }, [vehicles, drivers]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [vehiclesResponse, driversResponse] = await Promise.all([
        supabase
          .from('vehicles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('drivers')
          .select(
            `
            *,
            staff (
              name
            )
          `
          )
          .order('staff(name)', { ascending: true }),
      ]);

      if (vehiclesResponse.error) throw vehiclesResponse.error;
      if (driversResponse.error) throw driversResponse.error;

      setVehicles(vehiclesResponse.data || []);
      setDrivers(driversResponse.data || []);
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

  const getReminders = (): Reminder[] => {
    const today = new Date();
    const reminders: Reminder[] = [];

    // Vehicle reminders
    vehicles.forEach((vehicle) => {
      const dates = [
        { name: 'MOT', date: vehicle.mot_date },
        { name: 'Tax', date: vehicle.tax_date },
        { name: 'Service', date: vehicle.service_date },
        { name: 'Insurance', date: vehicle.insurance_date },
        { name: 'Breakdown Cover', date: vehicle.breakdown_date },
        { name: 'Congestion Charge', date: vehicle.congestion_date },
        { name: 'Dartford Crossing', date: vehicle.dartford_date },
        { name: 'Clean Air Zone', date: vehicle.clean_air_date },
      ];

      dates.forEach(({ name, date }) => {
        if (date) {
          const expiryDate = new Date(date);
          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 30 || diffDays < 0) {
            reminders.push({
              type: 'vehicle',
              title: `${vehicle.make} ${vehicle.model} (${vehicle.registration})`,
              date: expiryDate,
              description:
                diffDays < 0
                  ? `${name} expired - ${expiryDate.toLocaleDateString()}`
                  : `${name} expires in ${diffDays} days`,
              severity: diffDays <= 7 ? 'danger' : 'warning',
            });
          }
        }
      });
    });

    // Driver reminders
    drivers.forEach((driver) => {
      if (!driver.licence_expiry) return;

      const expiryDate = new Date(driver.licence_expiry);
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30 || diffDays < 0) {
        reminders.push({
          type: 'driver',
          title: driver.staff?.name || 'Unknown Driver',
          date: expiryDate,
          description:
            diffDays < 0
              ? `Licence expired - ${expiryDate.toLocaleDateString()}`
              : `Licence expires in ${diffDays} days`,
          severity: diffDays <= 7 ? 'danger' : 'warning',
        });
      }
    });

    // Sort reminders by date
    return reminders.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    setVehicleToDelete(vehicleId);
    setShowDeleteModal(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setVehicleToEdit(vehicle);
    setShowVehicleModal(true);
  };

  const confirmDelete = async () => {
    if (!vehicleToDelete) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleToDelete);

      if (error) throw error;

      await fetchData();
      setShowDeleteModal(false);
      setVehicleToDelete(null);
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while deleting the vehicle'
      );
    } finally {
      setLoading(false);
    }
  };

  // Add filtered vehicles
  const filteredVehicles = vehicles.filter((vehicle) =>
    vehicle.registration.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showDriversList) {
    return (
      <DriversList
        onBack={() => {
          setShowDriversList(false);
          fetchData();
        }}
      />
    );
  }

  if (showChecklists) {
    return (
      <HSVehicleChecklists
        onBack={() => {
          setShowChecklists(false);
          fetchData();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-white mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Health & Safety
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Vehicle Management</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Vehicle Management</h2>
        <button
          onClick={() => {
            setVehicleToEdit(null);
            setShowVehicleModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setShowDriversList(true)}
          className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <div className="flex items-center">
            <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Drivers</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage driver licenses and information
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setShowChecklists(true)}
          className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <div className="flex items-center">
            <ClipboardCheck className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Checklists</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                View and manage vehicle checklists
              </p>
            </div>
          </div>
        </button>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6">
          <div className="flex items-center">
            <Bell className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Reminders</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {reminders.length} Active {reminders.length === 1 ? 'Reminder' : 'Reminders'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reminders Section */}
      {reminders.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <button
              onClick={() => setIsRemindersExpanded(!isRemindersExpanded)}
              className="flex items-center justify-between w-full"
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Upcoming Reminders
              </h3>
              <ChevronDown 
                className={`h-5 w-5 text-gray-500 dark:text-gray-400 transform transition-transform duration-200 ${
                  isRemindersExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isRemindersExpanded && (
              <div className="mt-4 space-y-4">
                {reminders.map((reminder, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      reminder.severity === 'danger'
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : 'bg-orange-50 dark:bg-orange-900/20'
                    }`}
                  >
                    <div>
                      <p
                        className={`font-medium ${
                          reminder.severity === 'danger'
                            ? 'text-red-800 dark:text-red-200'
                            : 'text-orange-800 dark:text-orange-200'
                        }`}
                      >
                        {reminder.title}
                      </p>
                      <p
                        className={`text-sm ${
                          reminder.severity === 'danger'
                            ? 'text-red-600 dark:text-red-300'
                            : 'text-orange-600 dark:text-orange-300'
                        }`}
                      >
                        {reminder.description}
                      </p>
                    </div>
                    {reminder.severity === 'danger' ? (
                      <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                    ) : (
                      <Bell className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by registration..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-gray-500 dark:text-gray-400">No vehicles available</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th scope="col" className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider first:rounded-tl-lg">
                    REG
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    MAKE
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    MODEL
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    DRIVER
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    MOT
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    TAX
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    LAST SERVICE
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    INSURANCE
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    BREAKDOWN
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    CONGESTION
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    DARTFORD
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    CLEAN AIR
                  </th>
                  <th scope="col" className="py-3 px-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider last:rounded-tr-lg">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredVehicles.map((vehicle, index) => {
                  const motStatus = getDateStatus(vehicle.mot_date);
                  const taxStatus = getDateStatus(vehicle.tax_date);
                  const serviceStatus = getDateStatus(vehicle.service_date);
                  const insuranceStatus = getDateStatus(vehicle.insurance_date);
                  const breakdownStatus = getDateStatus(vehicle.breakdown_date);

                  return (
                    <tr key={vehicle.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                      <td className="py-2 px-3 text-sm text-gray-900 dark:text-white first:rounded-bl-lg">
                        {vehicle.registration}
                      </td>
                      <td className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">
                        {vehicle.make}
                      </td>
                      <td className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">
                        {vehicle.model}
                      </td>
                      <td className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">
                        {vehicle.driver}
                      </td>
                      <td className="py-2 px-3 text-sm">
                        <span className={motStatus.color}>{motStatus.text}</span>
                      </td>
                      <td className="py-2 px-3 text-sm">
                        <span className={taxStatus.color}>{taxStatus.text}</span>
                      </td>
                      <td className="py-2 px-3 text-sm">
                        <span className={serviceStatus.color}>{serviceStatus.text}</span>
                      </td>
                      <td className="py-2 px-3 text-sm">
                        <span className={insuranceStatus.color}>{insuranceStatus.text}</span>
                      </td>
                      <td className="py-2 px-3 text-sm">
                        <span className={breakdownStatus.color}>{breakdownStatus.text}</span>
                      </td>
                      <td className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">
                        {vehicle.has_congestion ? '✔️' : '❌'}
                      </td>
                      <td className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">
                        {vehicle.has_dartford ? '✔️' : '❌'}
                      </td>
                      <td className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">
                        {vehicle.has_clean_air ? '✔️' : '❌'}
                      </td>
                      <td className="py-2 px-3 text-right text-sm font-medium last:rounded-br-lg">
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => handleEditVehicle(vehicle)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVehicle(vehicle.id)}
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

      {/* Vehicle Form Modal */}
      {showVehicleModal && (
        <VehicleForm
          onClose={() => {
            setShowVehicleModal(false);
            setVehicleToEdit(null);
          }}
          onSuccess={() => {
            fetchData();
            setShowVehicleModal(false);
            setVehicleToEdit(null);
          }}
          vehicleToEdit={vehicleToEdit}
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
              Are you sure you want to delete this vehicle? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setVehicleToDelete(null);
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
