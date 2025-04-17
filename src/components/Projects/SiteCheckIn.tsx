import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { SiteHealthCheck } from '../Workers/SiteHealthCheck';

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

export function SiteCheckIn() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company: '',
    email: '',
    fit_to_work: true
  });
  const [isCheckingIn, setIsCheckingIn] = useState(true);
  const [existingLog, setExistingLog] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showHealthCheck, setShowHealthCheck] = useState(false);
  const [healthCheckCompleted, setHealthCheckCompleted] = useState(false);

  useEffect(() => {
    if (siteId) {
      fetchSiteDetails();
      checkExistingLog();
    }
  }, [siteId]);

  const fetchSiteDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('id', siteId)
        .single();

      if (error) throw error;
      setSite(data);
    } catch (error) {
      console.error('Error fetching site details:', error);
      setError('Failed to load site details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingLog = async () => {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) return;
      
      // Check if user has an active log (checked in but not checked out)
      const { data, error } = await supabase
        .from('site_logs')
        .select('*')
        .eq('site_id', siteId)
        .eq('email', session.user.email)
        .is('logged_out_at', null)
        .order('logged_in_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is the error code when no rows are returned
        throw error;
      }

      if (data) {
        // User has an active log, they should check out
        setExistingLog(data);
        setIsCheckingIn(false);
        
        // Pre-fill form with existing data
        setFormData({
          full_name: data.full_name,
          phone: data.phone,
          company: data.company,
          email: data.email,
          fit_to_work: data.fit_to_work
        });
      } else {
        // No active log, user should check in
        // Pre-fill email if user is logged in
        if (session?.user?.email) {
          setFormData(prev => ({
            ...prev,
            email: session.user.email || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error checking existing log:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleHealthCheckClose = () => {
    setShowHealthCheck(false);
  };

  const handleHealthCheckComplete = () => {
    setHealthCheckCompleted(true);
    setShowHealthCheck(false);
    // Automatically submit the form after health check is completed
    handleFormSubmit();
  };

  // Separate function to handle the actual form submission
  const handleFormSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (isCheckingIn) {
        // Check in - use RPC function to bypass RLS
        const { error } = await supabase.rpc('create_site_log_with_health_check', {
          p_site_id: siteId,
          p_full_name: formData.full_name,
          p_phone: formData.phone,
          p_company: formData.company,
          p_email: formData.email,
          p_fit_to_work: formData.fit_to_work,
          p_health_check_completed: healthCheckCompleted
        });

        if (error) {
          console.error('Error creating site log:', error);
          // Fallback to direct insert if RPC fails (might still fail due to RLS)
          const { error: insertError } = await supabase
            .from('site_logs')
            .insert([
              {
                site_id: siteId,
                full_name: formData.full_name,
                phone: formData.phone,
                company: formData.company,
                email: formData.email,
                fit_to_work: formData.fit_to_work,
                logged_in_at: new Date().toISOString(),
                // If user is logged in, associate with their user ID
                ...(session?.user?.id ? { user_id: session.user.id } : {}),
                health_check_completed: healthCheckCompleted
              }
            ]);

          if (insertError) throw insertError;
        }
        
        setSuccess(`Successfully checked in to ${site?.name}`);
      } else {
        // Check out - use RPC function to bypass RLS
        const { error } = await supabase.rpc('update_site_log_checkout', {
          p_log_id: existingLog.id
        });

        if (error) {
          console.error('Error updating site log:', error);
          // Fallback to direct update if RPC fails
          const { error: updateError } = await supabase
            .from('site_logs')
            .update({ 
              logged_out_at: new Date().toISOString(),
              // If user is logged in, associate with their user ID
              ...(session?.user?.id ? { user_id: session.user.id } : {})
            })
            .eq('id', existingLog.id);

          if (updateError) throw updateError;
        }
        
        setSuccess(`Successfully checked out from ${site?.name}`);
        setExistingLog(null);
        setIsCheckingIn(true);
        setHealthCheckCompleted(false);
      }
    } catch (error: any) {
      console.error('Error during check-in/out:', error);
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If checking in and health check not completed, show health check modal
    if (isCheckingIn && !healthCheckCompleted) {
      setShowHealthCheck(true);
      return;
    }
    
    handleFormSubmit();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Site Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">The site you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      {/* Health Check Modal */}
      <SiteHealthCheck 
        isOpen={showHealthCheck}
        onClose={handleHealthCheckClose}
        userEmail={formData.email}
        onComplete={handleHealthCheckComplete}
      />
      
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            ← Back to Dashboard
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isCheckingIn ? 'Check In to Site' : 'Check Out from Site'}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {site.name} - {site.address}, {site.town}, {site.postcode}
            </p>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 text-green-700 dark:text-green-400">
              {success}
              <div className="mt-2">
                <button
                  onClick={() => navigate('/')}
                  className="text-sm font-medium text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  disabled={!isCheckingIn || !!success}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-70"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  disabled={!isCheckingIn || !!success}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-70"
                />
              </div>
              
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  required
                  disabled={!isCheckingIn || !!success}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-70"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={!isCheckingIn || !!success}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-70"
                />
              </div>
              
              {isCheckingIn && (
                <div className="sm:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="fit_to_work"
                      name="fit_to_work"
                      checked={formData.fit_to_work}
                      onChange={handleInputChange}
                      disabled={!!success}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="fit_to_work" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      I confirm that I am fit to work and not under the influence of alcohol or drugs
                    </label>
                  </div>
                </div>
              )}
            </div>
            
            {!success && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    isCheckingIn 
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                      : 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70`}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : isCheckingIn ? (
                    'Check In'
                  ) : (
                    'Check Out'
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
