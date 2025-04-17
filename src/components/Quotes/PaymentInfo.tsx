import React, { useState, useEffect } from 'react';
import { ArrowRight, AlertCircle, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PaymentInfoProps {
  onBack: () => void;
}

interface PaymentInfoData {
  bank_name: string;
  account_number: string;
  sort_code: string;
  terms: string;
}

export function PaymentInfo({ onBack }: PaymentInfoProps) {
  const [formData, setFormData] = useState<PaymentInfoData>({
    bank_name: '',
    account_number: '',
    sort_code: '',
    terms: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchPaymentTerms();
  }, []);

  const fetchPaymentTerms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_terms')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setFormData({
          bank_name: data.bank_name,
          account_number: data.account_number,
          sort_code: data.sort_code,
          terms: data.terms,
        });
      }
    } catch (err) {
      console.error('Error fetching payment terms:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while fetching payment terms'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields
      if (!formData.bank_name.trim()) throw new Error('Bank name is required');
      if (!formData.account_number.trim())
        throw new Error('Account number is required');
      if (!formData.sort_code.trim()) throw new Error('Sort code is required');
      if (!formData.terms.trim()) throw new Error('Payment terms are required');

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if terms already exist
      const { data: existingTerms, error: queryError } = await supabase
        .from('payment_terms')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (queryError) throw queryError;

      let error;
      if (existingTerms?.id) {
        // Update existing terms
        ({ error } = await supabase
          .from('payment_terms')
          .update({ ...formData, user_id: user.id })
          .eq('id', existingTerms.id));
      } else {
        // Create new terms
        ({ error } = await supabase
          .from('payment_terms')
          .insert([{ ...formData, user_id: user.id }]));
      }

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving payment terms:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError(err.message as string);
      } else {
        setError('An unexpected error occurred while saving payment terms');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
      >
        <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
        Back to Dashboard
      </button>
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Payment Info
            </h2>
            <button
              onClick={handleSubmit}
              disabled={saving || loading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-4 rounded-md">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 text-sm text-green-600 bg-green-50 p-4 rounded-md">
              Payment info saved successfully!
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Bank Details Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Bank Details
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="bank_name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Bank Name
                    </label>
                    <input
                      type="text"
                      id="bank_name"
                      name="bank_name"
                      required
                      value={formData.bank_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="account_number"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Account Number
                    </label>
                    <input
                      type="text"
                      id="account_number"
                      name="account_number"
                      required
                      value={formData.account_number}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sort_code"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Sort Code
                    </label>
                    <input
                      type="text"
                      id="sort_code"
                      name="sort_code"
                      required
                      value={formData.sort_code}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Terms Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Payment Terms
                </h3>
                <div>
                  <label
                    htmlFor="terms"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Enter your payment terms below
                  </label>
                  <textarea
                    id="terms"
                    name="terms"
                    rows={10}
                    required
                    value={formData.terms}
                    onChange={handleChange}
                    placeholder="Enter your payment terms here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                  />
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
