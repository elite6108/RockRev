import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { X, AlertCircle, Plus, Trash2, Camera, Loader2 } from 'lucide-react';
import type {
  Vehicle,
  ChecklistItem,
  VehicleChecklist,
} from '../../../types/database';

interface VehicleChecklistFormProps {
  vehicle: Vehicle;
  checklistToEdit?: VehicleChecklist | null;
  onClose: () => void;
  onSuccess: () => void;
}

const OUTSIDE_CHECKLIST_ITEMS = [
  'Engine Oil',
  'Coolant Level',
  'Washer Fluid Level',
  'Washer & Wipers',
  'Lights (Front, Side, Rear)',
  'Horn',
  'Tyre Tread & Sidewalls',
  'Type Pressure',
  'Bodywork',
  'Glass (Windows)',
  'Mirrors',
];

const INSIDE_CHECKLIST_ITEMS = [
  'Seatbelt',
  'First Aid & Eye Wash',
  'Brakes',
  'Indicator',
  'Clean & Tidy',
];

export default function VehicleChecklistForm({
  vehicle,
  checklistToEdit,
  onClose,
  onSuccess,
}: VehicleChecklistFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [notes, setNotes] = useState('');
  const [createdByName, setCreatedByName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [mileage, setMileage] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>(
    'daily'
  );
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
                  .from('vehicle-checklist-images')
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
        setDriverName(checklistToEdit.driver_name);
        setMileage(checklistToEdit.mileage);
        setFrequency(checklistToEdit.frequency);
      };
      
      loadChecklistWithSignedUrls();
    }
    fetchUserFullName();
  }, [checklistToEdit]);

  const fetchUserFullName = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setCreatedByName(user.user_metadata.full_name);
      }
    } catch (err) {
      console.error('Error fetching user full name:', err);
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        status: 'pass',
        notes: '',
        image_url: ''
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemChange = (
    id: string,
    field: keyof ChecklistItem,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          // For name field, check if already selected
          if (field === 'name' && value) {
            const isItemAlreadySelected = prev.some(
              (otherItem) => otherItem.id !== id && otherItem.name === value
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
      })
    );
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
      const filePath = `${vehicle.id}/${fileName}`;

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('vehicle-checklist-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Generate a signed URL with 1 hour expiry
      const { data } = await supabase.storage
        .from('vehicle-checklist-images')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Validate form
      if (!createdByName) throw new Error('Please enter your name');
      if (!driverName) throw new Error('Please enter the driver name');
      if (!mileage) throw new Error('Please enter the mileage');
      if (items.some((item) => !item.name))
        throw new Error('All items must have a name');

      const status = items.some((item) => item.status === 'fail')
        ? 'fail'
        : 'pass';

      // No need to process items since we're already storing file paths
      let error;
      if (checklistToEdit) {
        // Update existing checklist
        ({ error } = await supabase
          .from('vehicle_checklists')
          .update({
            items,
            notes: notes || null,
            created_by_name: createdByName,
            driver_name: driverName,
            mileage,
            frequency,
            status,
          })
          .eq('id', checklistToEdit.id));
      } else {
        // Create new checklist
        ({ error } = await supabase.from('vehicle_checklists').insert([
          {
            vehicle_id: vehicle.id,
            user_id: user.id,
            items,
            notes: notes || null,
            created_by_name: createdByName,
            driver_name: driverName,
            mileage,
            frequency,
            status,
          },
        ]));
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
    const selectedItems = new Set(
      items.map((item) => item.name).filter(Boolean)
    );
    const outsideItems = OUTSIDE_CHECKLIST_ITEMS.filter(
      (item) => !selectedItems.has(item)
    );
    const insideItems = INSIDE_CHECKLIST_ITEMS.filter(
      (item) => !selectedItems.has(item)
    );
    return { outsideItems, insideItems };
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-start sm:items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-auto my-4 sm:my-8 max-h-[90vh] sm:max-h-[800px] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 p-4 sm:p-8 border-b">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <h2 className="text-2xl font-bold text-center sm:text-left">
              {checklistToEdit
                ? 'Edit Vehicle Checklist'
                : 'New Vehicle Checklist'}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle
                </label>
                <input
                  type="text"
                  value={`${vehicle.make} ${vehicle.model} (${vehicle.registration})`}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="created_by_name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="created_by_name"
                  required
                  value={createdByName}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="driver_name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Driver Name
                </label>
                <input
                  type="text"
                  id="driver_name"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="mileage"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mileage
                </label>
                <input
                  type="text"
                  id="mileage"
                  required
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="frequency"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Frequency
                </label>
                <select
                  id="frequency"
                  required
                  value={frequency}
                  onChange={(e) =>
                    setFrequency(
                      e.target.value as 'daily' | 'weekly' | 'monthly'
                    )
                  }
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

              <div className="max-h-[300px] overflow-y-auto border rounded-lg">
                <div className="space-y-4 p-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start bg-gray-50 p-4 rounded-lg"
                    >
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Item Name
                        </label>
                        <select
                          value={item.name}
                          onChange={(e) =>
                            handleItemChange(item.id, 'name', e.target.value)
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        >
                          <option value="">Select an item</option>
                          <optgroup label="Outside Checks">
                            {getAvailableItems().outsideItems.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Inside Checks">
                            {getAvailableItems().insideItems.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </optgroup>
                          {item.name &&
                            !getAvailableItems().outsideItems.includes(
                              item.name
                            ) &&
                            !getAvailableItems().insideItems.includes(
                              item.name
                            ) && <option value={item.name}>{item.name}</option>}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleItemChange(item.id, 'status', e.target.value)
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="pass">Pass</option>
                          <option value="fail">Fail</option>
                        </select>
                      </div>

                      <div className="sm:col-span-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Notes
                            </label>
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) =>
                                handleItemChange(item.id, 'notes', e.target.value)
                              }
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

                      <div className="flex justify-end sm:col-span-1 sm:items-end mt-2 sm:mt-0">
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
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-[#374151] dark:text-white dark:hover:bg-[#DC2626] rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? 'Saving...'
                  : checklistToEdit
                  ? 'Save Changes'
                  : 'Save Checklist'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
