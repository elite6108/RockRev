import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { ChevronLeft, FileCheck, AlertTriangle, Plus, FileText, Loader2, Edit, Search } from 'lucide-react';
import { EquipmentChecklistForm } from './EquipmentChecklistForm';
import { generateEquipmentChecklistPDF } from '../../../utils/equipmentChecklistPDFGenerator';
import type { Equipment, EquipmentChecklist } from '../../../types/database';

interface HSEquipmentChecklistsProps {
  onBack: () => void;
}

export function HSEquipmentChecklists({ onBack }: HSEquipmentChecklistsProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [checklists, setChecklists] = useState<EquipmentChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<EquipmentChecklist | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [equipmentResponse, checklistsResponse] = await Promise.all([
        supabase
          .from('equipment')
          .select('*')
          .order('name', { ascending: true }),
        supabase
          .from('equipment_checklists')
          .select('*')
          .order('check_date', { ascending: false })
      ]);

      if (equipmentResponse.error) throw equipmentResponse.error;
      if (checklistsResponse.error) throw checklistsResponse.error;

      setEquipment(equipmentResponse.data || []);
      setChecklists(checklistsResponse.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const getLastCheckInfo = (equipmentId: string) => {
    const equipmentChecklists = checklists.filter(c => c.equipment_id === equipmentId);
    if (equipmentChecklists.length === 0) return { date: null, frequency: null };
    
    const lastChecklist = equipmentChecklists[0];
    const lastCheckDate = new Date(lastChecklist.check_date);
    const today = new Date();
    let isOverdue = false;

    switch (lastChecklist.frequency) {
      case 'daily':
        isOverdue = (today.getTime() - lastCheckDate.getTime()) > 24 * 60 * 60 * 1000;
        break;
      case 'weekly':
        isOverdue = (today.getTime() - lastCheckDate.getTime()) > 7 * 24 * 60 * 60 * 1000;
        break;
      case 'monthly':
        isOverdue = (today.getTime() - lastCheckDate.getTime()) > 30 * 24 * 60 * 60 * 1000;
        break;
    }

    return {
      date: lastCheckDate.toLocaleDateString(),
      frequency: lastChecklist.frequency,
      isOverdue
    };
  };

  const handleNewChecklist = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setSelectedChecklist(null);
    setShowChecklistModal(true);
  };

  const handleEditChecklist = (equipment: Equipment, checklist: EquipmentChecklist) => {
    setSelectedEquipment(equipment);
    setSelectedChecklist(checklist);
    setShowChecklistModal(true);
  };

  const handleViewPDF = async (checklist: EquipmentChecklist) => {
    setGeneratingPDF(true);
    setPdfError(null);

    try {
      // Get equipment details
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', checklist.equipment_id)
        .single();

      if (equipmentError) throw new Error(`Failed to load equipment details: ${equipmentError.message}`);
      if (!equipment) throw new Error('Equipment not found');

      // Generate PDF
      const pdfDataUrl = await generateEquipmentChecklistPDF({
        checklist,
        equipment
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
      setPdfError(error instanceof Error ? error.message : 'An unexpected error occurred while generating the PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Add filtered equipment
  const filteredEquipment = equipment.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.serial_number.toLowerCase().includes(searchQuery.toLowerCase())
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
          Back to Equipment Management
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Equipment Checklists</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Equipment Checklists</h2>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {pdfError && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error generating PDF</p>
            <p>{pdfError}</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by equipment name or serial number..."
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
        ) : equipment.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-gray-500 dark:text-gray-400">No equipment available</p>
          </div>
        ) : (
          <div className="space-y-6 p-6">
            {filteredEquipment.map((item) => {
              const equipmentChecklists = checklists.filter(c => c.equipment_id === item.id);
              const checkInfo = getLastCheckInfo(item.id);
              const textColorClass = checkInfo.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400';

              return (
                <div key={item.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white break-words">
                        {item.name} - {item.serial_number}
                      </h3>
                      <p className={`text-sm ${textColorClass}`}>
                        Last Check: {checkInfo.date || 'Not checked yet'}
                        {checkInfo.frequency && ` (${checkInfo.frequency})`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleNewChecklist(item)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Checklist
                    </button>
                  </div>

                  {equipmentChecklists.length > 0 && (
                    <div className="mt-4">
                      <div className="overflow-hidden rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700">
                              <th scope="col" className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider first:rounded-tl-lg">
                                Date
                              </th>
                              <th scope="col" className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Frequency
                              </th>
                              <th scope="col" className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Created By
                              </th>
                              <th scope="col" className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Status
                              </th>
                              <th scope="col" className="py-3 px-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider last:rounded-tr-lg">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {equipmentChecklists.map((checklist, index) => (
                              <tr key={checklist.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                <td className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400 first:rounded-bl-lg">
                                  {new Date(checklist.check_date).toLocaleDateString()}
                                </td>
                                <td className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">
                                  {checklist.frequency.charAt(0).toUpperCase() + checklist.frequency.slice(1)}
                                </td>
                                <td className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">
                                  {checklist.created_by_name}
                                </td>
                                <td className="py-2 px-3 text-sm">
                                  <span className={checklist.status === 'pass' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                    {checklist.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right text-sm font-medium last:rounded-br-lg">
                                  <div className="flex justify-end space-x-3">
                                    <button
                                      onClick={() => handleViewPDF(checklist)}
                                      disabled={generatingPDF}
                                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                    >
                                      {generatingPDF ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <FileText className="h-4 w-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleEditChecklist(item, checklist)}
                                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Checklist Form Modal */}
      {showChecklistModal && (
        <EquipmentChecklistForm
          equipment={selectedEquipment!}
          checklistToEdit={selectedChecklist}
          onClose={() => {
            setShowChecklistModal(false);
            setSelectedEquipment(null);
            setSelectedChecklist(null);
          }}
          onSuccess={() => {
            fetchData();
            setShowChecklistModal(false);
            setSelectedEquipment(null);
            setSelectedChecklist(null);
          }}
        />
      )}
    </div>
  );
}