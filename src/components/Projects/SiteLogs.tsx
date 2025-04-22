import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft } from 'lucide-react';

interface SiteLogsProps {
  siteId: string;
  onBack: () => void;
}

interface SiteLog {
  id: string;
  full_name: string;
  phone: string;
  company: string;
  email: string;
  fit_to_work: boolean;
  logged_in_at: string;
  logged_out_at?: string;
}

interface Site {
  id: string;
  name: string;
  address: string;
  town: string;
  county: string;
  postcode: string;
  site_manager: string;
  phone: string;
  what3words?: string;
}

export function SiteLogs({ siteId, onBack }: SiteLogsProps) {
  const [site, setSite] = useState<Site | null>(null);
  const [logs, setLogs] = useState<SiteLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (siteId) {
      fetchSiteAndLogs();
    }
  }, [siteId]);

  const fetchSiteAndLogs = async () => {
    try {
      setLoading(true);
      // Fetch site details
      const { data: siteData, error: siteError } = await supabase
        .from('sites')
        .select('*')
        .eq('id', siteId)
        .single();

      if (siteError) throw siteError;
      setSite(siteData);

      // Fetch site logs
      const { data: logsData, error: logsError } = await supabase
        .from('site_logs')
        .select('*')
        .eq('site_id', siteId)
        .order('logged_in_at', { ascending: false });

      if (logsError) throw logsError;
      setLogs(logsData || []);
    } catch (error) {
      console.error('Error fetching site and logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Site Not Found</h2>
          <button
            onClick={onBack}
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Return to Sites
          </button>
        </div>
      </div>
    );
  }

  return (
    <main>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-white mb-6">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Sites
              </button>
              <span>/</span>
              <span className="text-gray-900 dark:text-white font-medium">{site.name} Logs</span>
            </div>

            {/* Site Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</h3>
                <p className="mt-1 text-base text-gray-900 dark:text-white">
                  {site.address}, {site.town}, {site.county}, {site.postcode}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Site Manager</h3>
                <p className="mt-1 text-base text-gray-900 dark:text-white">{site.site_manager}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact</h3>
                <p className="mt-1 text-base text-gray-900 dark:text-white">{site.phone}</p>
              </div>
              {site.what3words && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">What3Words</h3>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">{site.what3words}</p>
                </div>
              )}
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Logged In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Logged Out
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                          No logs found for this site
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {log.full_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {log.company}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            <div>{log.phone}</div>
                            <div className="text-xs">{log.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              log.fit_to_work
                                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                            }`}>
                              {log.fit_to_work ? 'Fit to Work' : 'Not Fit to Work'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {new Date(log.logged_in_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {log.logged_out_at ? new Date(log.logged_out_at).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 