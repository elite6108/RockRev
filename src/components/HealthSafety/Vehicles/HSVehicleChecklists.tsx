import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  ArrowRight,
  FileCheck,
  AlertTriangle,
  Plus,
  FileText,
  Loader2,
  Edit,
  Trash2,
} from 'lucide-react';
import VehicleChecklistForm from './VehicleChecklistForm';
import { generateVehicleChecklistPDF } from '../../../utils/vehicleChecklistPDFGenerator';
import type { Vehicle, VehicleChecklist } from '../../../types/database';

interface HSVehicleChecklistsProps {
  onBack: () => void;
}

export const HSVehicleChecklists: React.FC<HSVehicleChecklistsProps> = ({
  onBack,
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [checklists, setChecklists] = useState<VehicleChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedChecklist, setSelectedChecklist] =
    useState<VehicleChecklist | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [vehiclesResponse, checklistsResponse] = await Promise.all([
        supabase
          .from('vehicles')
          .select('*')
          .order('registration', { ascending: true }),
        supabase
          .from('vehicle_checklists')
          .select('*')
          .order('check_date', { ascending: false }),
      ]);

      if (vehiclesResponse.error) throw vehiclesResponse.error;
      if (checklistsResponse.error) throw checklistsResponse.error;

      setVehicles(vehiclesResponse.data || []);
      setChecklists(checklistsResponse.data || []);
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

  const getLastCheckInfo = (vehicleId: string) => {
    const vehicleChecklists = checklists.filter(
      (c) => c.vehicle_id === vehicleId
    );
    if (vehicleChecklists.length === 0) return { date: null, frequency: null };

    const lastChecklist = vehicleChecklists[0];
    const lastCheckDate = new Date(lastChecklist.check_date);
    const today = new Date();
    let isOverdue = false;

    switch (lastChecklist.frequency) {
      case 'daily':
        isOverdue =
          today.getTime() - lastCheckDate.getTime() > 24 * 60 * 60 * 1000;
        break;
      case 'weekly':
        isOverdue =
          today.getTime() - lastCheckDate.getTime() > 7 * 24 * 60 * 60 * 1000;
        break;
      case 'monthly':
        isOverdue =
          today.getTime() - lastCheckDate.getTime() > 30 * 24 * 60 * 60 * 1000;
        break;
    }

    return {
      date: lastCheckDate.toLocaleDateString(),
      frequency: lastChecklist.frequency,
      isOverdue,
    };
  };

  const handleNewChecklist = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedChecklist(null);
    setShowChecklistModal(true);
  };

  const handleEditChecklist = (
    vehicle: Vehicle,
    checklist: VehicleChecklist
  ) => {
    setSelectedVehicle(vehicle);
    setSelectedChecklist(checklist);
    setShowChecklistModal(true);
  };

  const handleViewPDF = async (checklist: VehicleChecklist) => {
    setGeneratingPDF(true);
    setPdfError(null);

    try {
      // Get vehicle details
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', checklist.vehicle_id)
        .single();

      if (vehicleError)
        throw new Error(
          `Failed to load vehicle details: ${vehicleError.message}`
        );
      if (!vehicle) throw new Error('Vehicle not found');

      // Generate PDF
      const pdfDataUrl = await generateVehicleChecklistPDF({
        checklist,
        vehicle,
      });

      // Convert base64 data URL to Blob
      const base64Data = pdfDataUrl.split(',')[1];
      const binaryData = atob(base64Data);
      const array = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        array[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([array], { type: 'application/pdf' });

      // Create and open Object URL
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');

      // Clean up the Object URL after the window is loaded
      if (newWindow) {
        newWindow.addEventListener('load', () => {
          URL.revokeObjectURL(url);
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setPdfError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while generating the PDF'
      );
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
      >
        <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
        Back to Vehicle Management
      </button>
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6 ">
            <h2 className="text-xl font-semibold text-gray-900">
              Vehicle Checklists
            </h2>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-4 rounded-md">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {pdfError && (
            <div className="mb-4 p-4 text-sm text-red-600 bg-red-50 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error generating PDF</p>
                <p>{pdfError}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No vehicles available</p>
            </div>
          ) : (
            <div className="space-y-8">
              {vehicles.map((vehicle) => {
                const vehicleChecklists = checklists.filter(
                  (c) => c.vehicle_id === vehicle.id
                );
                const checkInfo = getLastCheckInfo(vehicle.id);
                const textColorClass = checkInfo.isOverdue
                  ? 'text-red-600'
                  : 'text-gray-500';

                return (
                  <div key={vehicle.id} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 break-words mb-2">
                          {vehicle.registration} - {vehicle.make}{' '}
                          {vehicle.model}
                        </h3>
                        <p className={`text-sm ${textColorClass}`}>
                          Last Check: {checkInfo.date || 'Not checked yet'}
                          {checkInfo.frequency && ` (${checkInfo.frequency})`}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          onClick={() => handleNewChecklist(vehicle)}
                          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          New Checklist
                        </button>
                      </div>
                    </div>

                    {vehicleChecklists.length > 0 && (
                      <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Date
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Driver
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Mileage
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Status
                              </th>
                              <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {vehicleChecklists.map((checklist) => (
                              <tr key={checklist.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(
                                    checklist.check_date
                                  ).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {checklist.driver_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {checklist.mileage}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      checklist.status === 'pass'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {checklist.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex justify-end space-x-4">
                                    <button
                                      onClick={() => handleViewPDF(checklist)}
                                      disabled={generatingPDF}
                                      className="text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-white"
                                      title="Download PDF"
                                    >
                                      {generatingPDF ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <FileText className="h-4 w-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleEditChecklist(vehicle, checklist)
                                      }
                                      className="text-indigo-600 hover:text-indigo-900 dark:text-white dark:hover:text-gray-300"
                                      title="Edit Checklist"
                                    >
                                      <Edit className="h-4 w-4" />
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
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showChecklistModal && selectedVehicle && (
        <VehicleChecklistForm
          vehicle={selectedVehicle}
          checklistToEdit={selectedChecklist}
          onClose={() => {
            setShowChecklistModal(false);
            setSelectedVehicle(null);
            setSelectedChecklist(null);
          }}
          onSuccess={() => {
            fetchData();
            setShowChecklistModal(false);
            setSelectedVehicle(null);
            setSelectedChecklist(null);
          }}
        />
      )}
    </>
  );
};
