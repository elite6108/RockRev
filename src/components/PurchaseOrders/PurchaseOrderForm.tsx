import React, { useState, useEffect } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { X, Plus, Trash2 } from 'lucide-react';
import type {
  Project,
  Supplier,
  PurchaseOrderItem,
  PurchaseOrder,
} from '../../../src/types/database';

interface PurchaseOrderFormProps {
  onClose: () => void;
  onSuccess: () => void;
  orderToEdit?: PurchaseOrder | null;
}

const PER_OPTIONS = ['Days', 'Weeks', 'Litres', 'Each'] as const;

export function PurchaseOrderForm({
  onClose,
  onSuccess,
  orderToEdit,
}: PurchaseOrderFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [createdByName, setCreatedByName] = useState('');
  const [includeVat, setIncludeVat] = useState(false);
  const [companyPrefix, setCompanyPrefix] = useState('');
  const [formData, setFormData] = useState({
    project_id: '',
    supplier_id: '',
    delivery_to: '',
    notes: '',
    items: [] as PurchaseOrderItem[],
  });

  useEffect(() => {
    fetchData();
    fetchUserProfile();
    fetchCompanySettings();

    if (orderToEdit) {
      setFormData({
        project_id: orderToEdit.project_id,
        supplier_id: orderToEdit.supplier_id,
        delivery_to: orderToEdit.delivery_to || '',
        notes: orderToEdit.notes || '',
        items: orderToEdit.items || [],
      });
      setIncludeVat(orderToEdit.amount > calculateSubtotal());
    }
  }, [orderToEdit]);

  const fetchData = async () => {
    try {
      const [projectsResponse, suppliersResponse] = await Promise.all([
        supabase
          .from('projects')
          .select('*')
          .order('name', { ascending: true }),
        supabase
          .from('suppliers')
          .select('*')
          .order('name', { ascending: true }),
      ]);

      if (projectsResponse.error) throw projectsResponse.error;
      if (suppliersResponse.error) throw suppliersResponse.error;

      setProjects(projectsResponse.data || []);
      setSuppliers(suppliersResponse.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while fetching data'
      );
    }
  };

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata?.display_name) {
        setCreatedByName(user.user_metadata.display_name);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('prefix')
        .limit(1)
        .single();

      if (error) throw error;
      if (data?.prefix) {
        setCompanyPrefix(data.prefix);
      }
    } catch (err) {
      console.error('Error fetching company settings:', err);
      setError(
        'Failed to load company settings. Please try refreshing the page.'
      );
    }
  };

  const generateOrderNumber = async () => {
    try {
      // Get the current company prefix
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('prefix')
        .limit(1)
        .single();

      if (settingsError)
        throw new Error(
          `Failed to load company settings: ${settingsError.message}`
        );
      if (!settings?.prefix)
        throw new Error(
          'Company prefix not found. Please set up your company details first.'
        );

      // Get the latest order number
      const { data: latestOrders, error } = await supabase
        .from('purchase_orders')
        .select('order_number')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      // Start from 1 if no orders exist
      let nextNumber = 1;

      if (latestOrders && latestOrders.length > 0) {
        // Extract just the numeric part from the latest order number
        const parts = latestOrders[0].order_number.split('-');
        const numericPart = parts[parts.length - 1]; // Get the last part which should be the number
        if (numericPart) {
          nextNumber = parseInt(numericPart) + 1;
        }
      }

      // Format the number with leading zeros (5 digits)
      const formattedNumber = nextNumber.toString().padStart(5, '0');

      // Use the company prefix from settings
      return `${settings.prefix}-PO-${formattedNumber}`;
    } catch (err) {
      console.error('Error generating order number:', err);
      throw new Error('Failed to generate order number');
    }
  };

  const addItem = () => {
    const newItem: PurchaseOrderItem = {
      id: crypto.randomUUID(),
      qty: 0,
      description: '',
      units: 0,
      per_unit: 'Each',
      price: 0,
      per_price: 'Each',
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const updateItem = (
    id: string,
    field: keyof PurchaseOrderItem,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + item.qty * item.price;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return includeVat ? subtotal * 1.2 : subtotal;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatOrderNumber = (orderNumber: string) => {
    // The order number is already in the format PREFIX-PO-000001
    return orderNumber;
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

      // Clean up items before sending to the database
      const cleanItems = formData.items.map(({ id, ...item }) => item);

      const orderData = {
        project_id: formData.project_id,
        supplier_id: formData.supplier_id,
        delivery_to: formData.delivery_to || null,
        notes: formData.notes || null,
        created_by_name: createdByName,
        order_date: new Date().toISOString().split('T')[0],
        items: cleanItems,
        amount: calculateTotal(),
        user_id: user.id,
        status: 'pending',
        urgency: 'low',
      };

      let error;

      if (orderToEdit) {
        // Update existing order
        ({ error } = await supabase
          .from('purchase_orders')
          .update(orderData)
          .eq('id', orderToEdit.id));
      } else {
        // Create new order - order number will be generated by database trigger
        ({ error } = await supabase
          .from('purchase_orders')
          .insert([orderData]));
      }

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(
          `Database error: ${error.message}${
            error.details ? ` - ${error.details}` : ''
          }`
        );
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Form submission error:', err);
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-start sm:items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl p-6 sm:p-8 max-w-4xl w-full my-4 sm:my-8 mx-4 max-h-[90vh] sm:max-h-[800px] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 pb-6 mb-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {orderToEdit ? 'Edit Purchase Order' : 'New Purchase Order'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Created By
              </label>
              <input
                type="text"
                value={createdByName}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Date
              </label>
              <input
                type="date"
                value={new Date().toISOString().split('T')[0]}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="project"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Project
              </label>
              <select
                id="project"
                required
                value={formData.project_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    project_id: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="supplier"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Supplier
              </label>
              <select
                id="supplier"
                required
                value={formData.supplier_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    supplier_id: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="delivery_to"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Delivery To
              </label>
              <input
                type="text"
                id="delivery_to"
                value={formData.delivery_to}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    delivery_to: e.target.value,
                  }))
                }
                placeholder="Enter delivery address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-4">
                {formData.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:grid sm:grid-cols-12 gap-4 items-start bg-gray-50 p-4 rounded-lg relative"
                  >
                    <div className="w-full sm:col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1"
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(item.id, 'qty', parseInt(e.target.value))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="w-full sm:col-span-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) =>
                          updateItem(item.id, 'description', e.target.value)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="w-full sm:col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Units
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1"
                        value={item.units}
                        onChange={(e) =>
                          updateItem(item.id, 'units', parseInt(e.target.value))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="w-full sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Per Unit
                      </label>
                      <select
                        value={item.per_unit}
                        onChange={(e) =>
                          updateItem(item.id, 'per_unit', e.target.value)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {PER_OPTIONS.map((option) => (
                          <option
                            key={`${item.id}-per-unit-${option}`}
                            value={option}
                          >
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Price (£)
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            'price',
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="w-full sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Per
                      </label>
                      <select
                        value={item.per_price}
                        onChange={(e) =>
                          updateItem(item.id, 'per_price', e.target.value)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {PER_OPTIONS.map((option) => (
                          <option
                            key={`${item.id}-per-price-${option}`}
                            value={option}
                          >
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {formData.items.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No items added yet
                </div>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Notes
            </label>
            <textarea
              id="notes"
              rows={4}
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Enter any additional notes or instructions"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 border-t gap-6">
            <div className="space-y-4 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIncludeVat(!includeVat)}
                  className={`w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    includeVat
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {includeVat ? 'VAT Included (20%)' : 'Add 20% VAT'}
                </button>
              </div>
              <div className="text-lg font-medium space-y-1">
                <div className="text-gray-600">
                  Subtotal: £{formatNumber(calculateSubtotal())}
                </div>
                {includeVat && (
                  <div className="text-gray-600">
                    VAT (20%): £{formatNumber(calculateSubtotal() * 0.2)}
                  </div>
                )}
                <div className="text-gray-900 font-bold">
                  Total: £{formatNumber(calculateTotal())}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-red-600 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || formData.items.length === 0}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? 'Saving...'
                  : orderToEdit
                  ? 'Update Order'
                  : 'Create Order'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
