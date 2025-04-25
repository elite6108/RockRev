import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { X, AlertCircle, Plus, Trash2, Camera, Upload, Loader2, Image } from 'lucide-react';
import type { Equipment, ChecklistItem, EquipmentChecklist } from '../../../types/database';

interface EquipmentChecklistFormProps {
  equipment: Equipment;
  checklistToEdit?: EquipmentChecklist | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CHECKLIST_ITEMS = [
  'Visual Inspection',
  'Functionality Test',
  'Safety Features',
  'Calibration Check',
  'Power Supply',
  'Connections/Cables',
  'Display/Controls',
  'Cleanliness',
  'Damage Assessment',
  'Storage Condition'
];

export function EquipmentChecklistForm({ equipment, checklistToEdit, onClose, onSuccess }: EquipmentChecklistFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [notes, setNotes] = useState('');
  const [createdByName, setCreatedByName] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  useEffect(() => {
    if (checklistToEdit) {
      // When editing, we need to generate signed URLs for all images
      const loadChecklistWithSignedUrls = async () => {
        const itemsWithSignedUrls = await Promise.all(
          checklistToEdit.items.map(async (item) => {
            if (item.image_url) {
              try {
                // Generate a signed URL with 1 hour expiry
                const { data } = await supabase.storage
                  .from('equipment-checklist-images')
                  .createSignedUrl(item.image_url, 60 * 60); // 1 hour expiry
                
                if (data?.signedUrl) {
                  return {
                    ...item,
                    signed_url: data.signedUrl // Store signed URL separately
                  };
                }
              } catch (error) {
                console.error('Error generating signed URL:', error);
              }
            }
            return item;
          })
        );
        
        setItems(itemsWithSignedUrls);
        setNotes(checklistToEdit.notes || '');
        setCreatedByName(checklistToEdit.created_by_name);
        setFrequency(checklistToEdit.frequency);
      };
      
      loadChecklistWithSignedUrls();
    }
  }, [checklistToEdit]);

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        status: 'pass',
        notes: '',
        image_url: ''
      }
    ]);
  };

  const handleImageUpload = async (itemId: string, file: File) => {
    try {
      setUploadingImage(itemId);
      setError(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('Image size must be less than 5MB');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const fileName = `${itemId}-${Date.now()}.${fileExt}`;
      const filePath = `${equipment.id}/${fileName}`;

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('equipment-checklist-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Generate a signed URL with 1 hour expiry
      const { data } = await supabase.storage
        .from('equipment-checklist-images')
        .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

      if (!data?.signedUrl) throw new Error("Failed to generate signed URL");
      
      // Update the item with both the file path and signed URL
      setItems(prev => prev.map(item =>
        item.id === itemId
          ? { 
              ...item, 
              image_url: filePath,
              signed_url: data.signedUrl
            }
          : item
      ));
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof ChecklistItem, value: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        // For name field, check if already selected
        if (field === 'name' && value) {
          const isItemAlreadySelected = prev.some(otherItem => 
            otherItem.id !== id && otherItem.name === value
          );

          if (isItemAlreadySelected) {
            setError('This item has already been selected');
            return item;
          }
          setError(null);
        }

        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Validate form
      if (!createdByName) throw new Error('Please enter your name');
      if (items.some(item => !item.name)) throw new Error('All items must have a name');

      const status = items.some(item => item.status === 'fail') ? 'fail' : 'pass';

      // Process items to store only file paths, not signed URLs
      const processedItems = items.map(item => {
        if (item.image_url) {
          // Extract the file path from the signed URL
          const path = item.image_url.split('/').pop();
          return {
            ...item,
            // Store just the filename/path, not the full signed URL
            image_url: path || ''
          };
        }
        return item;
      });

      let error;
      if (checklistToEdit) {
        // Update existing checklist
        ({ error } = await supabase
          .from('equipment_checklists')
          .update({
            items: processedItems,
            notes: notes || null,
            created_by_name: createdByName,
            frequency,
            status
          })
          .eq('id', checklistToEdit.id));
      } else {
        // Create new checklist
        ({ error } = await supabase
          .from('equipment_checklists')
          .insert([{
            equipment_id: equipment.id,
            user_id: user.id,
            items: processedItems,
            notes: notes || null,
            created_by_name: createdByName,
            frequency,
            status
          }]));
      }

      if (error) throw error;
      
      onSuccess();
    } catch (err) {
      console.error('Error saving checklist:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Get available items (not yet selected)
  const getAvailableItems = () => {
    const selectedItems = new Set(items.map(item => item.name).filter(Boolean));
    return CHECKLIST_ITEMS.filter(item => !selectedItems.has(item));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-auto my-8 sm:my-4 max-h-[90vh] sm:max-h-[800px] overflow-y-auto">
        <div className="p-4 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {checklistToEdit ? 'Edit Equipment Checklist' : 'New Equipment Checklist'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment
                </label>
                <input
                  type="text"
                  value={`${equipment.name} (${equipment.serial_number})`}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label htmlFor="created_by_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="created_by_name"
                  required
                  value={createdByName}
                  onChange={(e) => setCreatedByName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <select
                  id="frequency"
                  required
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Checklist Items</h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </button>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg p-4">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start bg-gray-50 p-4 rounded-lg">
                    <div className="col-span-1 sm:col-span-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Item Name
                      </label>
                      <select
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value="">Select an item</option>
                        {getAvailableItems().map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                        {item.name && !getAvailableItems().includes(item.name) && (
                          <option value={item.name}>{item.name}</option>
                        )}
                      </select>
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={item.status}
                        onChange={(e) => handleItemChange(item.id, 'status', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                      </select>
                    </div>

                    <div className="col-span-1 sm:col-span-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Notes
                          </label>
                          <input
                            type="text"
                            value={item.notes || ''}
                            onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Image
                          </label>
                          <div className="flex items-center space-x-2">
                            {item.image_url ? (
                              <div className="relative group">
                                <img
                                  src={item.signed_url || ''}
                                  alt="Checklist item"
                                  className="h-[150px] w-[150px] object-cover rounded cursor-pointer"
                                  onClick={() => window.open(item.signed_url, '_blank')}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                                  <button
                                    type="button"
                                    onClick={() => handleItemChange(item.id, 'image_url', '')}
                                    className="text-white hover:text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <label
                                  htmlFor={`image-upload-${item.id}`}
                                  className="cursor-pointer inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                                >
                                  {uploadingImage === item.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Camera className="h-4 w-4" />
                                  )}
                                </label>
                                <input
                                  id={`image-upload-${item.id}`}
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleImageUpload(item.id, file);
                                    }
                                  }}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 sm:col-span-1 flex sm:items-end justify-end sm:justify-start pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="inline-flex items-center px-2 py-1 text-sm text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                    Click "Add Item" to start your checklist
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any additional notes"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-red-600 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : checklistToEdit ? 'Save Changes' : 'Save Checklist'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}