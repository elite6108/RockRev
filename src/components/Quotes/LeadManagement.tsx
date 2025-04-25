import React, { useState, useEffect } from 'react';
import { LeadCard } from './LeadCard';
import { LeadForm } from './LeadForm';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, Plus, AlertTriangle } from 'lucide-react';

export type LeadStatus = 'new' | 'cold' | 'hot' | 'converted';

const columnColors = {
  new: 'bg-blue-100 dark:bg-[rgb(13,50,99)]',
  cold: 'bg-gray-100 dark:bg-gray-800',
  hot: 'bg-red-100 dark:bg-[rgb(137,3,3)]',
  converted: 'bg-green-100 dark:bg-[rgb(4,97,36)]',
};

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  message: string;
  budget: string;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

interface LeadManagementProps {
  onBack: () => void;
}

export function LeadManagement({ onBack }: LeadManagementProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const columns = {
    new: leads.filter(lead => lead.status === 'new'),
    cold: leads.filter(lead => lead.status === 'cold'),
    hot: leads.filter(lead => lead.status === 'hot'),
    converted: leads.filter(lead => lead.status === 'converted'),
  };

  const groupLeadsByMonth = (leads: Lead[]) => {
    const groups: { [key: string]: Lead[] } = {};
    leads.forEach(lead => {
      const date = new Date(lead.created_at);
      const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(lead);
    });
    return groups;
  };

  const handleDeleteLead = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleStatusChange = async (id: string, newStatus: LeadStatus) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
          Back to Quotes
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Lead Management</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Lead Management</h2>
        <button
          onClick={() => setShowLeadForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Lead
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            {Object.entries(columns).map(([status, items]) => (
              <div key={status} className="flex flex-col h-full">
                <div className={`p-4 rounded-t-lg ${columnColors[status as LeadStatus]}`}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {status} Leads ({items.length})
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Total Budget: £{items.reduce((sum, lead) => sum + (parseFloat(lead.budget) || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg space-y-4">
                  {Object.entries(groupLeadsByMonth(items)).map(([monthYear, monthLeads]) => (
                    <div key={monthYear} className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{monthYear}</h4>
                      {monthLeads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          onDelete={() => handleDeleteLead(lead.id)}
                          onUpdate={(newStatus) => handleStatusChange(lead.id, newStatus)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lead Form Modal */}
      {showLeadForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full m-4 max-h-[500px] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add New Lead</h3>
              <button
                onClick={() => setShowLeadForm(false)}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
            <LeadForm
              onClose={() => setShowLeadForm(false)}
              onSuccess={() => {
                setShowLeadForm(false);
                fetchLeads();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}