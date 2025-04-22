import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ModulesModalProps {
  onClose: () => void;
  modules: {
    admin: boolean;
    customersAndProjects: boolean;
    purchaseOrders: boolean;
    quotes: boolean;
    healthAndSafety: boolean;
  };
  onModuleChange: (
    module: keyof ModulesModalProps['modules'],
    value: boolean
  ) => void;
}

const ADMIN_PASSWORD = 'Greystone20#';

export function ModulesModal({
  onClose,
  modules,
  onModuleChange,
}: ModulesModalProps) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'modules' | 'domains'>('modules');
  const [domains, setDomains] = useState<{ id: string; domain_name: string }[]>(
    []
  );
  const [newDomain, setNewDomain] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDomains();
    }
  }, [isAuthenticated]);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      console.error('Error fetching domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('domains')
        .insert([{ domain_name: newDomain }])
        .select();

      if (error) throw error;

      if (data) {
        setDomains([...data, ...domains]);
        setNewDomain('');
      }
    } catch (error) {
      console.error('Error adding domain:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDomain = (domain: { id: string; domain_name: string }) => {
    setDomainToDelete(domain.domain_name);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteDomain = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('domains')
        .delete()
        .eq('domain_name', domainToDelete);

      if (error) throw error;

      setDomains(domains.filter((d) => d.domain_name !== domainToDelete));
    } catch (error) {
      console.error('Error deleting domain:', error);
    } finally {
      setShowDeleteConfirm(false);
      setDomainToDelete('');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {!isAuthenticated ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Enter Admin Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter password to modify modules"
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Authenticate
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('modules')}
                  className={`${
                    activeTab === 'modules'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Modules
                </button>
                <button
                  onClick={() => setActiveTab('domains')}
                  className={`${
                    activeTab === 'domains'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Domains
                </button>
              </nav>
            </div>

            {/* Modules Tab */}
            {activeTab === 'modules' && (
              <div className="space-y-6">
                {/* Admin Module */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Admin
                      </span>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        Staff, Tasks, Calendar, and Sub Contractors
                      </p>
                    </div>
                  </label>
                  <button
                    onClick={() => onModuleChange('admin', !modules.admin)}
                    className={`${
                      modules.admin
                        ? 'bg-indigo-600'
                        : 'bg-gray-200 dark:bg-gray-600'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        modules.admin ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-200 shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>

                {/* Customers & Projects Module */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Customers & Projects
                      </span>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        Customer and project management
                      </p>
                    </div>
                  </label>
                  <button
                    onClick={() =>
                      onModuleChange(
                        'customersAndProjects',
                        !modules.customersAndProjects
                      )
                    }
                    className={`${
                      modules.customersAndProjects
                        ? 'bg-indigo-600'
                        : 'bg-gray-200 dark:bg-gray-600'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        modules.customersAndProjects
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-200 shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>

                {/* Purchase Orders Module */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Purchase Orders
                      </span>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        Order and supplier management
                      </p>
                    </div>
                  </label>
                  <button
                    onClick={() =>
                      onModuleChange('purchaseOrders', !modules.purchaseOrders)
                    }
                    className={`${
                      modules.purchaseOrders
                        ? 'bg-indigo-600'
                        : 'bg-gray-200 dark:bg-gray-600'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        modules.purchaseOrders
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-200 shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>

                {/* Quotes Module */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Quotes
                      </span>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        Quote management and terms
                      </p>
                    </div>
                  </label>
                  <button
                    onClick={() => onModuleChange('quotes', !modules.quotes)}
                    className={`${
                      modules.quotes
                        ? 'bg-indigo-600'
                        : 'bg-gray-200 dark:bg-gray-600'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        modules.quotes ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-200 shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>

                {/* Health & Safety Module */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Health & Safety
                      </span>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        Policies, RAMS, and safety features
                      </p>
                    </div>
                  </label>
                  <button
                    onClick={() =>
                      onModuleChange(
                        'healthAndSafety',
                        !modules.healthAndSafety
                      )
                    }
                    className={`${
                      modules.healthAndSafety
                        ? 'bg-indigo-600'
                        : 'bg-gray-200 dark:bg-gray-600'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        modules.healthAndSafety
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-200 shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Domains Tab */}
            {activeTab === 'domains' && (
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewDomain(e.target.value)
                    }
                    placeholder="Enter domain name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAddDomain}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                <div className="border rounded-md">
                  <div
                    className="overflow-y-auto"
                    style={{ maxHeight: '400px' }}
                  >
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Domain Name
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {domains.map((domain) => (
                          <tr key={domain.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {domain.domain_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleDeleteDomain(domain)}
                                disabled={loading}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
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
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirm Delete
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete the domain "{domainToDelete}"?
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteDomain}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
