import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { ArrowRight, Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { EquipmentForm } from './EquipmentForm';
import type { Equipment } from '../../../types/database';

interface HSEquipmentListProps {
  onBack: () => void;
}

export function HSEquipmentList({ onBack }: HSEquipmentListProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<string | null>(
    null
  );
  const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setEquipment(data || []);
    } catch (err) {
      console.error('Error fetching equipment:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while fetching equipment'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    setEquipmentToDelete(equipmentId);
    setShowDeleteModal(true);
  };

  const handleEditEquipment = (equipment: Equipment) => {
    setEquipmentToEdit(equipment);
    setShowEquipmentModal(true);
  };

  const confirmDelete = async () => {
    if (!equipmentToDelete) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', equipmentToDelete);

      if (error) throw error;

      await fetchEquipment();
      setShowDeleteModal(false);
      setEquipmentToDelete(null);
    } catch (err) {
      console.error('Error deleting equipment:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while deleting the equipment'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
      >
        <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
        Back to Equipment Management
      </button>
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Equipment</h2>
            <button
              onClick={() => {
                setEquipmentToEdit(null);
                setShowEquipmentModal(true);
              }}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
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
          ) : equipment.length === 0 ? (
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No equipment yet</p>
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
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Serial
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Inspection Frequency
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Service Frequency
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {equipment.map((item) => (
                    <tr key={item.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {item.serial_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {item.inspection_interval} {item.inspection_frequency}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {item.service_interval_value}{' '}
                        {item.service_interval_unit}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-4">
                          <button
                            onClick={() => handleEditEquipment(item)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-white dark:hover:text-gray-300"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEquipment(item.id)}
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

      {showEquipmentModal && (
        <EquipmentForm
          onClose={() => {
            setShowEquipmentModal(false);
            setEquipmentToEdit(null);
          }}
          onSuccess={() => {
            fetchEquipment();
            setShowEquipmentModal(false);
            setEquipmentToEdit(null);
          }}
          equipmentToEdit={equipmentToEdit}
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
              Are you sure you want to delete this equipment? This action cannot
              be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setEquipmentToDelete(null);
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
