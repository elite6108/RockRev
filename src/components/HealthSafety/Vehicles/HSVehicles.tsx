import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  ArrowRight,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Car,
  Users,
  Bell,
  AlertCircle,
  ClipboardCheck,
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

  if (showVehicleList) {
    return (
      <>
        <button
          onClick={() => setShowVehicleList(false)}
          className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
          Back to Vehicle Management
        </button>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Vehicles</h2>
              <button
                onClick={() => {
                  setVehicleToEdit(null);
                  setShowVehicleModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
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
            ) : vehicles.length === 0 ? (
              <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No vehicles yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900"
                      >
                        REG
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        MAKE
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        MODEL
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        DRIVER
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        MOT
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        TAX
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        LAST SERVICE
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        INSURANCE
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        BREAKDOWN
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        CONGESTION
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        DARTFORD
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        CLEAN AIR
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                          {vehicle.registration}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {vehicle.make}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {vehicle.model}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {vehicle.driver}
                        </td>
                        <td
                          className={`whitespace-nowrap px-3 py-4 text-sm ${
                            getDateStatus(vehicle.mot_date).color
                          }`}
                        >
                          {getDateStatus(vehicle.mot_date).text}
                        </td>
                        <td
                          className={`whitespace-nowrap px-3 py-4 text-sm ${
                            getDateStatus(vehicle.tax_date).color
                          }`}
                        >
                          {getDateStatus(vehicle.tax_date).text}
                        </td>
                        <td
                          className={`whitespace-nowrap px-3 py-4 text-sm ${
                            getDateStatus(vehicle.service_date).color
                          }`}
                        >
                          {getDateStatus(vehicle.service_date).text}
                        </td>
                        <td
                          className={`whitespace-nowrap px-3 py-4 text-sm ${
                            getDateStatus(vehicle.insurance_date).color
                          }`}
                        >
                          {getDateStatus(vehicle.insurance_date).text}
                        </td>
                        <td
                          className={`whitespace-nowrap px-3 py-4 text-sm ${
                            getDateStatus(vehicle.breakdown_date).color
                          }`}
                        >
                          {getDateStatus(vehicle.breakdown_date).text}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {vehicle.has_congestion ? '✔️' : '❌'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {vehicle.has_dartford ? '✔️' : '❌'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {vehicle.has_clean_air ? '✔️' : '❌'}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                          <div className="flex justify-end space-x-4">
                            <button
                              onClick={() => handleEditVehicle(vehicle)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-white dark:hover:text-gray-300"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteVehicle(vehicle.id)}
                              className="text-red-600 hover:text-red-900"
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

        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm w-full m-4">
              <div className="flex items-center justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Confirm Deletion
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Are you sure you want to delete this vehicle? This action cannot
                be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setVehicleToDelete(null);
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

  return (
    <>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
      >
        <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
        Back to Dashboard
      </button>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => setShowVehicleList(true)}
            className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Car className="h-6 w-6 text-gray-400" />
                  <div className="ml-5">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Vehicles
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {vehicles.length}
                      </dd>
                    </dl>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowDriversList(true)}
            className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-6 w-6 text-gray-400" />
                  <div className="ml-5">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Drivers
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {drivers.length}
                      </dd>
                    </dl>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowChecklists(true)}
            className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ClipboardCheck className="h-6 w-6 text-gray-400" />
                  <div className="ml-5">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Checklists
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        View
                      </dd>
                    </dl>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </button>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <Bell className="h-6 w-6 text-gray-400" />
                <div className="ml-5">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Reminders
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {reminders.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {reminders.length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Upcoming Reminders
              </h3>
              <div className="space-y-4">
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
            </div>
          </div>
        )}
      </div>

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

      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm w-full m-4">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
              Confirm Deletion
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to delete this vehicle? This action cannot
              be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setVehicleToDelete(null);
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
