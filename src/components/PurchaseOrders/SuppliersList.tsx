import React, { useState } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { Plus, Trash2, AlertTriangle, ArrowRight, Edit, X } from 'lucide-react';
import { SupplierForm } from './SupplierForm';
import { PurchaseOrderForm } from './PurchaseOrderForm';
import type { Supplier } from '../../../src/types/database';

interface SuppliersListProps {
  suppliers: Supplier[];
  onSupplierChange: () => void;
  onBack: () => void;
}

export function SuppliersList({
  suppliers,
  onSupplierChange,
  onBack,
}: SuppliersListProps) {
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedSupplierOrders, setSelectedSupplierOrders] = useState<any[]>(
    []
  );
  const [selectedSupplierName, setSelectedSupplierName] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const handleDeleteSupplier = async (supplierId: string) => {
    setSupplierToDelete(supplierId);
    setShowDeleteModal(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSupplierToEdit(supplier);
    setShowSupplierModal(true);
  };

  const handleSupplierClick = async (supplier: Supplier) => {
    setLoadingOrders(true);
    setSelectedSupplierName(supplier.name);
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(
          `
          *,
          project:projects(name),
          supplier:suppliers(*)
        `
        )
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSelectedSupplierOrders(data || []);
      setShowOrdersModal(true);
    } catch (err) {
      console.error('Error fetching supplier orders:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while fetching orders'
      );
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOrderClick = (order: any) => {
    setShowOrdersModal(false);
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierToDelete);

      if (error) throw error;
      onSupplierChange();
      setShowDeleteModal(false);
      setSupplierToDelete(null);
    } catch (err) {
      console.error('Error deleting supplier:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while deleting the supplier'
      );
    } finally {
      setLoading(false);
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
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Suppliers
            </h2>
            <button
              onClick={() => {
                setSupplierToEdit(null);
                setShowSupplierModal(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">
                No suppliers yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-opacity-10 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6"
                        >
                          Supplier Name
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                        >
                          Address
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                        >
                          Town
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                        >
                          Post Code
                        </th>
                        <th
                          scope="col"
                          className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                        >
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                      {suppliers.map((supplier) => (
                        <tr key={supplier.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-200 sm:pl-6">
                            <button
                              onClick={() => handleSupplierClick(supplier)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                            >
                              {supplier.name}
                            </button>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {supplier.address_line1}
                            {supplier.address_line2 && <br />}
                            {supplier.address_line2}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {supplier.town}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {supplier.post_code}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end space-x-4">
                              <button
                                onClick={() => handleEditSupplier(supplier)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-white dark:hover:text-gray-300 inline-flex items-center"
                              >
                                <Edit className="h-4 w-4 mr-1 text-indigo-600 dark:text-white" />
                                <span className="dark:text-white">Edit</span>
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteSupplier(supplier.id)
                                }
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 inline-flex items-center"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                <span className="dark:text-red-400">
                                  Delete
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {showSupplierModal && (
          <SupplierForm
            onClose={() => {
              setShowSupplierModal(false);
              setSupplierToEdit(null);
            }}
            onSuccess={() => {
              onSupplierChange();
              setShowSupplierModal(false);
              setSupplierToEdit(null);
            }}
            supplierToEdit={supplierToEdit}
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
                Are you sure you want to delete this supplier? This action
                cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSupplierToDelete(null);
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

        {/* Purchase Orders Modal */}
        {showOrdersModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full m-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Purchase Orders for {selectedSupplierName}
                </h3>
                <button
                  onClick={() => setShowOrdersModal(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {loadingOrders ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : selectedSupplierOrders.length === 0 ? (
                <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    No purchase orders found for this supplier
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
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
                          Created Date
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Amount
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {selectedSupplierOrders.map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => handleOrderClick(order)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                            {order.order_number}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {order.project?.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            £{formatNumber(order.amount)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : order.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {order.status.charAt(0).toUpperCase() +
                                order.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Purchase Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <PurchaseOrderForm
            onClose={() => {
              setShowOrderDetails(false);
              setSelectedOrder(null);
            }}
            onSuccess={() => {
              handleSupplierClick(selectedOrder.supplier);
              setShowOrderDetails(false);
              setSelectedOrder(null);
            }}
            orderToEdit={selectedOrder}
            viewOnly={true}
          />
        )}
      </div>
    </>
  );
}
