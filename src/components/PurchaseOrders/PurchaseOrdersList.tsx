import React, { useState, useEffect } from 'react';
import { supabase } from '../../../src/lib/supabase';
import {
  Plus,
  Trash2,
  AlertTriangle,
  ChevronLeft,
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
      order.supplier?.name?.toLowerCase().includes(query)
    );
  });

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatOrderNumber = (orderNumber: string) => {
    const parts = orderNumber.split('-');
    if (parts.length === 3) {
      return orderNumber;
    } else if (parts.length === 2) {
      const numericPart = parts[1].split('-')[1];
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
      const { data: companySettings, error: companyError } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (companyError) throw new Error(`Failed to load company settings: ${companyError.message}`);
      if (!companySettings) throw new Error('Company settings not found. Please set up your company details first.');

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('name')
        .eq('id', order.project_id)
        .single();

      if (projectError) throw new Error(`Failed to load project details: ${projectError.message}`);
      if (!project) throw new Error('Project not found');

      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', order.supplier_id)
        .single();

      if (supplierError) throw new Error(`Failed to load supplier details: ${supplierError.message}`);
      if (!supplier) throw new Error('Supplier not found');

      const supplierAddress = [
        supplier.address_line1,
        supplier.address_line2,
        supplier.town,
        supplier.county,
        supplier.post_code,
      ].filter(Boolean).join(', ');

      const pdfDataUrl = await generatePurchaseOrderPDF({
        order,
        companySettings,
        supplierName: supplier.name,
        supplierAddress,
        projectName: project.name,
      });

      const base64Data = pdfDataUrl.split(',')[1];
      const binaryData = atob(base64Data);
      const array = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        array[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([array], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');

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
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-white mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Purchase Orders</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Purchase Orders Management</h2>
        <button
          onClick={() => {
            setOrderToEdit(null);
            setShowPurchaseOrderModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Purchase Order
        </button>
      </div>

      {/* Search Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by order number, project or supplier name..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      {pdfError && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{pdfError}</p>
        </div>
      )}

      {/* Purchase Orders Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                    Order Number
                  </th>
                  <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                    Project
                  </th>
                  <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                    Supplier
                  </th>
                  <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                    Created Date
                  </th>
                  <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                    Created By
                  </th>
                  <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                    Amount
                  </th>
                  <th className="sticky top-0 px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No purchase orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatOrderNumber(order.order_number)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {order.project?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {order.supplier?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {order.created_by_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        £{formatNumber(order.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-4">
                          <button
                            onClick={() => handleViewPDF(order)}
                            disabled={generatingPDF}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
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
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Edit Order"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete Order"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Purchase Order Form Modal */}
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full m-4">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
              Confirm Deletion
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Are you sure you want to delete this purchase order? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setOrderToDelete(null);
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
