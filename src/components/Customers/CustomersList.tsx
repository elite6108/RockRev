import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Edit,
  FileText,
  Search,
} from 'lucide-react';
import { CustomerForm } from './CustomerForm';
import { QuotesList } from '../Quotes/QuotesList';
import type { Customer, Quote } from '../../types/database';

interface CustomersListProps {
  customers: Customer[];
  onCustomerChange: () => void;
  onBack: () => void;
}

export function CustomersList({
  customers,
  onCustomerChange,
  onBack,
}: CustomersListProps) {
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [customerQuotes, setCustomerQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    return (
      customer.company_name?.toLowerCase().includes(query) ||
      false ||
      customer.customer_name.toLowerCase().includes(query)
    );
  });

  const handleDeleteCustomer = async (customerId: string) => {
    setCustomerToDelete(customerId);
    setShowDeleteModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setCustomerToEdit(customer);
    setShowCustomerModal(true);
  };

  const handleCustomerClick = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLoadingQuotes(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(
          `
          *,
          customer:customers(customer_name, company_name)
        `
        )
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerQuotes(data || []);
    } catch (err) {
      console.error('Error fetching customer quotes:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while fetching quotes'
      );
    } finally {
      setLoadingQuotes(false);
    }
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerToDelete);

      if (error) throw error;
      onCustomerChange();
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while deleting the customer'
      );
    } finally {
      setLoading(false);
    }
  };

  if (selectedCustomer) {
    const customerName = selectedCustomer.company_name
      ? `${selectedCustomer.company_name} (${selectedCustomer.customer_name})`
      : selectedCustomer.customer_name;

    return (
      <div>
        {loadingQuotes ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <QuotesList
            quotes={customerQuotes}
            onQuoteChange={() => handleCustomerClick(selectedCustomer)}
            onBack={() => setSelectedCustomer(null)}
            hideBackToDashboard={true}
            customerName={customerName}
          />
        )}
      </div>
    );
  }

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
              Customers
            </h2>
            <button
              onClick={() => {
                setCustomerToEdit(null);
                setShowCustomerModal(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </button>
          </div>

          {/* Search Box */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by company or customer name..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
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
          ) : customers.length === 0 ? (
            <div className="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">
                No customers yet
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
                          Company Name
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                        >
                          Customer Name
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                        >
                          Contact
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                        >
                          Address
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
                      {filteredCustomers.map((customer) => (
                        <tr
                          key={customer.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-200 sm:pl-6">
                            {customer.company_name ? (
                              <button
                                onClick={() => handleCustomerClick(customer)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-yellow-400 dark:hover:text-yellow-300 hover:underline focus:outline-none"
                              >
                                {customer.company_name}
                              </button>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">
                                -
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {customer.customer_name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            <div>{customer.email}</div>
                            <div>{customer.phone}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            <div>{customer.address_line1}</div>
                            {customer.address_line2 && (
                              <div>{customer.address_line2}</div>
                            )}
                            <div>
                              {customer.town}, {customer.county}
                            </div>
                            {customer.post_code}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end space-x-4">
                              <button
                                onClick={() => handleEditCustomer(customer)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-white dark:hover:text-gray-300 inline-flex items-center"
                              >
                                <Edit className="h-4 w-4 mr-1 text-indigo-600 dark:text-white" />
                                <span className="dark:text-white">Edit</span>
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteCustomer(customer.id)
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
                      {filteredCustomers.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-8 text-center text-sm text-gray-500"
                          >
                            No customers found matching your search
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

        {showCustomerModal && (
          <CustomerForm
            onClose={() => {
              setShowCustomerModal(false);
              setCustomerToEdit(null);
            }}
            onSuccess={() => {
              onCustomerChange();
              setShowCustomerModal(false);
              setCustomerToEdit(null);
            }}
            customerToEdit={customerToEdit}
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
                Are you sure you want to delete this customer? This action
                cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setCustomerToDelete(null);
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
