import React, { useState, useEffect } from 'react';
import { ChevronLeft, AlertCircle, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface QuoteTermsProps {
  onBack: () => void;
}

export function QuoteTerms({ onBack }: QuoteTermsProps) {
  const [terms, setTerms] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quote_terms')
        .select('terms')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setTerms(data.terms);
      }
    } catch (err) {
      console.error('Error fetching quote terms:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while fetching quote terms'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if terms already exist
      const { data: existingTerms, error: queryError } = await supabase
        .from('quote_terms')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (queryError) throw queryError;

      let error;
      if (existingTerms?.id) {
        // Update existing terms
        ({ error } = await supabase
          .from('quote_terms')
          .update({ terms, user_id: user.id })
          .eq('id', existingTerms.id));
      } else {
        // Create new terms
        ({ error } = await supabase
          .from('quote_terms')
          .insert([{ terms, user_id: user.id }]));
      }

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving quote terms:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while saving quote terms'
      );
    } finally {
      setSaving(false);
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
        <span className="text-gray-900 dark:text-white font-medium">Quote Terms</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Quote Terms</h2>
        <button
          onClick={handleSubmit}
          disabled={saving || loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Terms'}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
          <p>Quote terms saved successfully!</p>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="terms"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Enter your quote terms below
                </label>
                <textarea
                  id="terms"
                  rows={15}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Enter your quote terms here..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
