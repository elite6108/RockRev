import React, { useState, useEffect } from 'react';
import { supabase } from '../../../src/lib/supabase';
import {
  Plus,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Edit,
  FileText,
  Loader2,
  Search,
} from 'lucide-react';
import { PurchaseOrderForm } from './PurchaseOrderForm';
import { generatePurchaseOrderPDF } from '../../../src/utils/pdfGenerator';
import type { PurchaseOrder } from '../../../src/types/database';

interface PurchaseOrdersListProps {
  orders: PurchaseOrder[];
  onOrderChange: () => void;
  onBack: () => void;
}

export function PurchaseOrdersList({
  orders,
  onOrderChange,
  onBack,
}: PurchaseOrdersListProps) {
  const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<PurchaseOrder | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyPrefix, setCompanyPrefix] = useState('');

  useEffect(() => {
    fetchCompanySettings();
  }, []);

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
    }
  };

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(query) ||
      order.project?.name?.toLowerCase().includes(query) ||
      false ||
      order.supplier?.name?.toLowerCase().includes(query) ||
      false
    );
  });

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatOrderNumber = (orderNumber: string) => {
    // Split the order number into parts
    const parts = orderNumber.split('-');
    if (parts.length === 3) {
      // If it's already in the correct format (PREFIX-PO-00001), return as is
      return orderNumber;
    } else if (parts.length === 2) {
      // If it's in the old format (OPG-PO-000001), update with current prefix
      const numericPart = parts[1].split('-')[1]; // Get the numeric part after "PO-"
      // Pad the numeric part to 5 digits
      const paddedNumber = numericPart.padStart(5, '0');
      return `${companyPrefix}-PO-${paddedNumber}`;
    }
    return orderNumber;
  };

  const handleDeleteOrder = async (orderId: string) => {
    setOrderToDelete(orderId);
    setShowDeleteModal(true);
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    setOrderToEdit(order);
    setShowPurchaseOrderModal(true);
  };

  const handleViewPDF = async (order: PurchaseOrder) => {
    setGeneratingPDF(true);
    setPdfError(null);

    try {
      // Fetch company settings
      const { data: companySettings, error: companyError } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (companyError)
        throw new Error(
          `Failed to load company settings: ${companyError.message}`
        );
      if (!companySettings)
        throw new Error(
          'Company settings not found. Please set up your company details first.'
        );

      // Fetch project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('name')
        .eq('id', order.project_id)
        .single();

      if (projectError)
        throw new Error(
          `Failed to load project details: ${projectError.message}`
        );
      if (!project) throw new Error('Project not found');

      // Fetch supplier details
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', order.supplier_id)
        .single();

      if (supplierError)
        throw new Error(
          `Failed to load supplier details: ${supplierError.message}`
        );
      if (!supplier) throw new Error('Supplier not found');

      // Format supplier address
      const supplierAddress = [
        supplier.address_line1,
        supplier.address_line2,
        supplier.town,
        supplier.county,
        supplier.post_code,
      ]
        .filter(Boolean)
        .join(', ');

      // Generate PDF
      const pdfDataUrl = await generatePurchaseOrderPDF({
        order,
        companySettings,
        supplierName: supplier.name,
        supplierAddress,
        projectName: project.name,
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

  const confirmDelete = async () => {
    if (!orderToDelete) return;

    try {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', orderToDelete);

      if (error) throw error;

      onOrderChange();
      setShowDeleteModal(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  return (
    <>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
      >
        <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
        Back to Dashboard
      </button>
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Purchase Orders
            </h2>
            <button
              onClick={() => {
                setOrderToEdit(null);
                setShowPurchaseOrderModal(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Purchase Order
            </button>
          </div>

          {/* Search Box */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order number, project or supplier name..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {pdfError && (
            <div className="mb-4 p-4 text-sm text-red-600 bg-red-50 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error generating PDF</p>
                <p>{pdfError}</p>
              </div>
            </div>
          )}

          <div className="mt-4">
            {orders.length === 0 ? (
              <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No purchase orders yet</p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                          >
                            Order Number
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Project
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Supplier
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Created Date
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Created By
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Amount
                          </th>
                          <th
                            scope="col"
                            className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                          >
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              {formatOrderNumber(order.order_number)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {order.project?.name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {order.supplier?.name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {order.created_by_name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              £{formatNumber(order.amount)}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <div className="flex justify-end space-x-4">
                                <button
                                  onClick={() => handleViewPDF(order)}
                                  disabled={generatingPDF}
                                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 inline-flex items-center disabled:opacity-50"
                                  title="Download PDF"
                                >
                                  {generatingPDF ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <FileText className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleEditOrder(order)}
                                  className="text-indigo-600 hover:text-indigo-900 dark:text-white dark:hover:text-gray-300 inline-flex items-center"
                                  title="Edit Order"
                                >
                                  <Edit className="h-4 w-4 text-indigo-600 dark:text-white" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 inline-flex items-center"
                                  title="Delete Order"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredOrders.length === 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-3 py-8 text-center text-sm text-gray-500"
                            >
                              No purchase orders found matching your search
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showPurchaseOrderModal && (
          <PurchaseOrderForm
            onClose={() => {
              setShowPurchaseOrderModal(false);
              setOrderToEdit(null);
            }}
            onSuccess={() => {
              onOrderChange();
              setShowPurchaseOrderModal(false);
              setOrderToEdit(null);
            }}
            orderToEdit={orderToEdit}
          />
        )}

        {/* Delete Confirmation Modal */}
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
                Are you sure you want to delete this purchase order? This action
                cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setOrderToDelete(null);
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
      </div>
    </>
  );
}
