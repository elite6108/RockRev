import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  Edit,
  FileText,
  Loader2,
  PoundSterling,
  Search,
  AlertCircle,
} from 'lucide-react';
import { QuoteForm } from './QuoteForm';
import { generateQuotePDF } from '../../utils/quotePDFGenerator';
import type { Quote } from '../../types/database';

interface QuotesListProps {
  quotes: Quote[];
  onQuoteChange: () => void;
  onBack: () => void;
  hideBackToDashboard?: boolean;
  customerName?: string;
}

export function QuotesList({
  quotes,
  onQuoteChange,
  onBack,
  hideBackToDashboard = false,
  customerName,
}: QuotesListProps) {
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [quoteToEdit, setQuoteToEdit] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pdfError, setPdfError] = useState<string | null>(null);

  const filterQuotes = (quotes: Quote[]) => {
    const query = searchQuery.toLowerCase();
    return quotes.filter(
      (quote) =>
        quote.quote_number.toLowerCase().includes(query) ||
        quote.customer?.company_name?.toLowerCase().includes(query) ||
        false ||
        quote.customer?.customer_name.toLowerCase().includes(query)
    );
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleDeleteQuote = async (quoteId: string) => {
    setQuoteToDelete(quoteId);
    setShowDeleteModal(true);
  };

  const handleEditQuote = (quote: Quote) => {
    setQuoteToEdit(quote);
    setShowQuoteModal(true);
  };

  const handleViewPDF = async (quote: Quote) => {
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
        .eq('id', quote.project_id)
        .single();

      if (projectError)
        throw new Error(
          `Failed to load project details: ${projectError.message}`
        );
      if (!project) throw new Error('Project not found');

      // Fetch customer details
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', quote.customer_id)
        .single();

      if (customerError)
        throw new Error(
          `Failed to load customer details: ${customerError.message}`
        );
      if (!customer) throw new Error('Customer not found');

      // Format customer address
      const customerAddress = [
        customer.address_line1,
        customer.address_line2,
        customer.town,
        customer.county,
        customer.post_code,
      ]
        .filter(Boolean)
        .join(', ');

      // Format customer name
      const customerName = customer.company_name
        ? `${customer.company_name} (${customer.customer_name})`
        : customer.customer_name;

      // Generate PDF
      const pdfDataUrl = await generateQuotePDF({
        quote,
        companySettings,
        customerName,
        customerAddress,
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
    if (!quoteToDelete) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteToDelete);

      if (error) throw error;
      onQuoteChange();
      setShowDeleteModal(false);
      setQuoteToDelete(null);
    } catch (err) {
      console.error('Error deleting quote:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while deleting the quote'
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (quotes: Quote[]) => {
    return quotes.reduce((sum, quote) => sum + quote.amount, 0);
  };

  const newQuotes = filterQuotes(
    quotes.filter((quote) => quote.status === 'new')
  );
  const acceptedQuotes = filterQuotes(
    quotes.filter((quote) => quote.status === 'accepted')
  );
  const rejectedQuotes = filterQuotes(
    quotes.filter((quote) => quote.status === 'rejected')
  );

  const TotalValueWidget = ({
    value,
    label,
  }: {
    value: number;
    label: string;
  }) => {
    // Determine background color based on label
    const getBgColor = () => {
      if (label.includes('Rejected'))
        return 'bg-[#ffe6e8] dark:bg-[rgb(109,0,0)]';
      if (label.includes('Accepted') || label.includes('New'))
        return 'bg-[#e6ffea] dark:bg-[rgb(0,109,0)]';
      return 'bg-white';
    };

    // Determine text color based on label
    const getTextColor = () => {
      if (label.includes('Rejected')) return 'text-gray-500 dark:text-white';
      if (label.includes('Accepted') || label.includes('New'))
        return 'text-gray-500 dark:text-white';
      return 'text-gray-500';
    };

    // Determine icon color based on label
    const getIconColor = () => {
      if (label.includes('Rejected')) return 'text-gray-400 dark:text-white';
      if (label.includes('Accepted') || label.includes('New'))
        return 'text-gray-400 dark:text-white';
      return 'text-gray-400';
    };

    return (
      <div
        className={`${getBgColor()} p-4 rounded-lg shadow mb-4 border border-gray-200 dark:border-gray-700`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <PoundSterling className={`h-6 w-6 ${getIconColor()}`} />
            <div className="ml-3">
              <p className={`text-sm font-medium ${getTextColor()}`}>{label}</p>
              <p className={`text-lg font-semibold ${getTextColor()}`}>
                £{formatNumber(value)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const QuoteTable = ({
    quotes,
    title,
  }: {
    quotes: Quote[];
    title: string;
  }) => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <TotalValueWidget
        value={calculateTotal(quotes)}
        label={`Total ${title} Value`}
      />
      {quotes.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
          No quotes in this category
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6"
                    >
                      Quote Number
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Quote Date
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Customer
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
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
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {quotes.map((quote) => (
                    <tr key={quote.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                        {quote.quote_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {new Date(quote.quote_date).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {quote.customer?.company_name ? (
                          <>
                            <div>{quote.customer.company_name}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {quote.customer.customer_name}
                            </div>
                          </>
                        ) : (
                          quote.customer?.customer_name
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                        £{formatNumber(quote.amount)}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex justify-end space-x-4">
                          <button
                            onClick={() => handleViewPDF(quote)}
                            disabled={generatingPDF}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 inline-flex items-center disabled:opacity-50"
                            title="Download PDF"
                          >
                            {generatingPDF ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEditQuote(quote)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-white dark:hover:text-gray-300 inline-flex items-center"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteQuote(quote.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 inline-flex items-center"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
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
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-white mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {hideBackToDashboard ? 'Back to Customers' : 'Back to Dashboard'}
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Quotes</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Quotes</h2>
          {customerName && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              for {customerName}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setQuoteToEdit(null);
            setShowQuoteModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Quote
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
          placeholder="Search by quote number, company or customer name..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white sm:text-sm"
        />
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {pdfError && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error generating PDF</p>
            <p>{pdfError}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <QuoteTable quotes={newQuotes} title="New Quotes" />
          <QuoteTable quotes={acceptedQuotes} title="Accepted Quotes" />
          <QuoteTable quotes={rejectedQuotes} title="Rejected Quotes" />
        </div>
      </div>

      {/* Quote Form Modal */}
      {showQuoteModal && (
        <QuoteForm
          onClose={() => {
            setShowQuoteModal(false);
            setQuoteToEdit(null);
          }}
          onSuccess={() => {
            onQuoteChange();
            setShowQuoteModal(false);
            setQuoteToEdit(null);
          }}
          quoteToEdit={quoteToEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full m-4">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
              Confirm Deletion
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Are you sure you want to delete this quote? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setQuoteToDelete(null);
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
