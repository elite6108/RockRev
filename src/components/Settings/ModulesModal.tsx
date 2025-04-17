import React, { useState } from 'react';
import { X } from 'lucide-react';

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

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Modules</h2>
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
                onChange={(e) => setPassword(e.target.value)}
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
                    modules.purchaseOrders ? 'translate-x-5' : 'translate-x-0'
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
                  onModuleChange('healthAndSafety', !modules.healthAndSafety)
                }
                className={`${
                  modules.healthAndSafety
                    ? 'bg-indigo-600'
                    : 'bg-gray-200 dark:bg-gray-600'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    modules.healthAndSafety ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-200 shadow ring-0 transition duration-200 ease-in-out`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
