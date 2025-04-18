import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { WorkerProfile } from './Workers/WorkerProfile';
import { MainQuestionnaire } from './Workers/MainQuestionnaire';
// Import ShortQuestionnaire directly with a relative path
import { ShortQuestionnaire } from './Workers/ShortQuestionnaire';
import { QRScannerModal } from './Workers/QRScannerModal.tsx';

interface WorkerDashboardProps {
  // Leave this prop for future use if needed
  selectedProjectId?: string | null;
}

export function WorkerDashboard({}: WorkerDashboardProps) {
  const [user, setUser] = useState<any>(null); // For storing user data
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Keeping the state for future use but removing the warning
  const [, setSiteCheckIns] = useState<any[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);

  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMainQuestionnaireModal, setShowMainQuestionnaireModal] =
    useState(false);
  const [showShortQuestionnaireModal, setShowShortQuestionnaireModal] =
    useState(false);
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);
  const [scannedSiteId, setScannedSiteId] = useState<string | null>(null);
  const [scannedSiteName, setScannedSiteName] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    fetchUserProfile();

    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }

    return () => clearInterval(timer);
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        setDataError('User not authenticated. Please login again.');
        return;
      }

      // Initial user data
      let userData = {
        ...user,
        full_name: '',
        company: user.user_metadata?.company || '',
        phone: user.user_metadata?.phone || '',
      };

      // Fetch worker details from workers table using email first
      try {
        const { data: workerData, error: workerError } = await supabase
          .from('workers')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (!workerError && workerData) {
          console.log('Worker data fetched:', workerData);
          console.log(
            'Last health questionnaire date:',
            workerData.last_health_questionnaire
          );

          // Merge worker data into user data
          userData = {
            ...userData,
            ...workerData,
          };
        }
      } catch (err) {
        console.error('Error fetching worker details:', err);
      }

      // If no full name from worker data, try user metadata
      if (!userData.full_name) {
        userData.full_name = user.user_metadata?.full_name || '';
      }

      // If still no full name, use email
      if (!userData.full_name) {
        userData.full_name = user.email || 'Unknown User';
      }

      // Fetch user details from users table
      try {
        const { data: userTableData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!userError && userTableData) {
          // Merge user data from users table
          userData = {
            ...userData,
            ...userTableData,
          };
        }
      } catch (err) {
        console.error('Error fetching user details:', err);
      }

      console.log(
        'Final user data:',
        userData
      );

      // Update the user state with all the data
      setUser(userData);

      // After user is loaded, fetch site check-ins
      if (user.email) {
        fetchSiteCheckIns(user.email);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setDataError('Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSiteCheckIns = async (userEmail: string) => {
    try {
      // First, try to fetch using email to accommodate missing user_id column
      const { data, error } = await supabase
        .from('site_logs')
        .select(
          `
          *,
          site:sites(id, name, address, town, county, postcode)
        `
        )
        .eq('email', userEmail)
        .order('logged_in_at', { ascending: false })
        .limit(10);

      if (!error && data && data.length > 0) {
        setSiteCheckIns(data);
      } else {
        // If no logs found or there was an error, set empty array
        setSiteCheckIns([]);

        if (error) {
          console.error('Error fetching site check-ins:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching site check-ins:', error);
      setSiteCheckIns([]);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('userType');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshUserData = async () => {
    console.log('refreshUserData called - updating dashboard');
    try {
      // Get current authenticated user
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        console.error('No authenticated user found');
        return;
      }

      console.log(
        'Fetching updated worker data for user email:',
        authUser.email
      );

      // Fetch worker data first as it contains the last_health_questionnaire
      const { data: workerData, error: workerError } = await supabase
        .from('workers')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle();

      if (workerError) {
        console.error('Error fetching worker data:', workerError);
      } else {
        console.log('Worker data fetched:', workerData);
        console.log(
          'Last health questionnaire date:',
          workerData?.last_health_questionnaire
        );
      }

      // Fetch user data for completeness
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
      }

      // Merge all data together, prioritizing worker data which has the questionnaire info
      const updatedUserData = {
        ...authUser,
        ...(userData || {}),
        ...(workerData || {}),
      };

      console.log('Setting updated user data:', updatedUserData);
      console.log(
        'Health questionnaire date:',
        updatedUserData.last_health_questionnaire
      );

      // Update user state with new data
      setUser(updatedUserData);

      // Close any open modals
      setShowMainQuestionnaireModal(false);
    } catch (error) {
      console.error('Error in refreshUserData:', error);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));

    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleScanQRCode = () => {
    setShowShortQuestionnaireModal(true);
    setIsMenuOpen(false);
  };

  const handleCompletedHealthCheck = () => {
    // After health check is completed, show QR scanner
    setShowShortQuestionnaireModal(false);
    setShowQRScannerModal(true);
  };

  const handleQRCodeScanned = async (decodedText: string) => {
    console.log('QR Code scanned:', decodedText);
    
    // Guard against empty QR codes
    if (!decodedText || decodedText.trim() === '') {
      alert('Empty or invalid QR code detected. Please try scanning again.');
      return;
    }
    
    try {
      // Extract the site ID from the QR code
      let siteId = null;
      
      // Method 1: Check if it's in the old format 'site:12345'
      const siteMatch = decodedText.match(/^site:(\d+)$/);
      if (siteMatch && siteMatch[1]) {
        siteId = siteMatch[1];
      }
      
      // Method 2: Try to extract from URL with pathname /site-checkin/{uuid}
      if (!siteId) {
        try {
          const url = new URL(decodedText);
          
          // First check pathname for /site-checkin/{uuid}
          if (url.pathname.includes('/site-checkin/')) {
            const pathParts = url.pathname.split('/');
            // Get the last path segment which should be the UUID
            const lastSegment = pathParts[pathParts.length - 1];
            
            // Verify it looks like a UUID
            if (lastSegment.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)) {
              siteId = lastSegment;
              console.log('Found site ID in URL pathname:', siteId);
            }
          }
          
          // Also check query parameters
          if (!siteId && url.searchParams.has('siteId')) {
            siteId = url.searchParams.get('siteId');
            console.log('Found site ID in URL query parameter:', siteId);
          }
        } catch (error) {
          console.log('Not a URL format, error:', error);
        }
      }
      
      // Method 3: Try to extract UUID directly from string
      if (!siteId) {
        const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
        const match = decodedText.match(uuidPattern);
        if (match) {
          siteId = match[0];
        }
      }
      
      if (siteId) {
        console.log('Extracted site ID:', siteId);
        setScannedSiteId(siteId);

        // Fetch site details
        const { data: siteData, error: siteError } = await supabase
          .from('sites')
          .select('name')
          .eq('id', siteId)
          .single();

        if (siteError) {
          console.error('Error fetching site details:', siteError);
          alert('Could not verify site. Please try again.');
          return;
        }

        if (siteData) {
          setScannedSiteName(siteData.name);
          
          // Record the check-in
          if (user?.email) {
            // Insert into the correct site_logs table with the required fields
            const { error: logError } = await supabase
              .from('site_logs')
              .insert([{
                site_id: siteId,
                full_name: user.user_metadata?.full_name || user.email || 'Unknown User',
                phone: user.user_metadata?.phone || '',
                company: user.user_metadata?.company || '',
                email: user.email,
                fit_to_work: true, // Assuming the user is fit to work when checking in
                logged_in_at: new Date().toISOString(),
                // logged_out_at remains null until they check out
              }]);

            if (logError) {
              console.error('Error recording site log:', logError);
              alert('Failed to record check-in. Please try again.');
              return;
            }
            
            // Successfully checked in
            alert(`Successfully checked in at ${siteData.name}`);
            
            // Close the scanner modal
            setShowQRScannerModal(false);
          }
        } else {
          alert('Site not found. Please try scanning a valid QR code.');
        }
      } else {
        // Before giving up, try one last thing - check if the raw QR code itself is a valid site ID
        // This handles the case where the QR code might just be the UUID itself
        const { data: rawSiteCheck, error: rawSiteError } = await supabase
          .from('sites')
          .select('name')
          .eq('id', decodedText)
          .maybeSingle();
          
        if (!rawSiteError && rawSiteCheck) {
          setScannedSiteId(decodedText);
          setScannedSiteName(rawSiteCheck.name);
          
          // Record the check-in
          if (user?.email) {
            // Insert into the correct site_logs table with the required fields
            const { error: logError } = await supabase
              .from('site_logs')
              .insert([{
                site_id: decodedText,
                full_name: user.user_metadata?.full_name || user.email || 'Unknown User',
                phone: user.user_metadata?.phone || '',
                company: user.user_metadata?.company || '',
                email: user.email,
                fit_to_work: true, // Assuming the user is fit to work when checking in
                logged_in_at: new Date().toISOString(),
                // logged_out_at remains null until they check out
              }]);

            if (logError) {
              console.error('Error recording site log:', logError);
              alert('Failed to record check-in. Please try again.');
              return;
            }
            
            // Successfully checked in
            alert(`Successfully checked in at ${rawSiteCheck.name}`);
            
            // Close the scanner modal
            setShowQRScannerModal(false);
            return;
          }
        } else {
          console.log('Raw QR code is not a valid site ID either');
          alert('Invalid QR code format. Please scan a valid site QR code.');
        }
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      alert('Failed to process QR code. Please try again.');
    }
  };

  const handleHealthQuestionnaire = () => {
    // Only open the questionnaire if it's needed or user hasn't done one yet
    if (
      user?.last_health_questionnaire === undefined ||
      user?.last_health_questionnaire === null ||
      isHealthQuestionnaireNeeded()
    ) {
      setShowMainQuestionnaireModal(true);
      setIsMenuOpen(false);
    }
  };

  const handleMyProfile = () => {
    setShowProfileModal(true);
    setIsMenuOpen(false);
  };

  // Function to check if a health questionnaire is needed
  // If a user completed one in the last 6 months, they don't need a new one
  const isHealthQuestionnaireNeeded = (): boolean => {
    // Get the last_health_questionnaire date from worker data
    const lastHealthQuestionnaire = user?.last_health_questionnaire;

    console.log(
      'Checking if health questionnaire is needed. Last date:',
      lastHealthQuestionnaire
    );

    if (!lastHealthQuestionnaire) {
      console.log('No previous health questionnaire found, one is needed');
      return true; // No questionnaire completed yet
    }

    // Convert string date to Date object
    const lastCompletionDate = new Date(lastHealthQuestionnaire);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Debug log
    console.log('Last completion:', lastCompletionDate.toISOString());
    console.log('Six months ago:', sixMonthsAgo.toISOString());
    console.log('Is questionnaire needed:', lastCompletionDate < sixMonthsAgo);

    // Return true if last completion was more than 6 months ago
    return lastCompletionDate < sixMonthsAgo;
  };

  // Add a more robust method to check if we have a valid questionnaire
  const hasValidHealthQuestionnaire = (): boolean => {
    return !!user?.last_health_questionnaire;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{dataError}</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Top Navigation Bar - Simplified for Contractor Workers */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-amber-500">
                  <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-3H2v3z"/>
                  <path d="M10 4v8h4V4h5a1 1 0 0 1 1 1v8H4V5a1 1 0 0 1 1-1h5z"/>
                  <path d="M8 18v-2"/>
                  <path d="M12 18v-2"/>
                  <path d="M16 18v-2"/>
                </svg>
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                  Worker Portal
                </span>
              </div>
            </div>
            <div className="flex items-center">
              {/* Only Day/Night Toggle and Profile Dropdown */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
              >
                {isDarkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2v2"/>
                    <path d="M12 20v2"/>
                    <path d="m4.93 4.93 1.41 1.41"/>
                    <path d="m17.66 17.66 1.41 1.41"/>
                    <path d="M2 12h2"/>
                    <path d="M20 12h2"/>
                    <path d="m6.34 17.66-1.41 1.41"/>
                    <path d="m19.07 4.93-1.41 1.41"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                  </svg>
                )}
              </button>
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="max-w-xs flex items-center text-sm rounded-full text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 focus:outline-none"
                  >
                    <span className="mr-2">
                      {user?.full_name || user?.email}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </button>
                </div>
                {isMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                    <button
                      onClick={handleMyProfile}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      My Profile
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" x2="9" y1="12" y2="12"/>
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-grow">
        {/* Welcome Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, {user?.full_name || 'Worker'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {currentTime.toLocaleDateString('en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}{' '}
            | {currentTime.toLocaleTimeString('en-GB')}
          </p>
          {user?.company && (
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Company: {user.company}
            </p>
          )}
          {user?.last_health_questionnaire ? (
            <p className="text-amber-600 dark:text-amber-400 mt-1">
              Health Questionnaire completed on{' '}
              {new Date(user.last_health_questionnaire).toLocaleDateString(
                'en-GB'
              )}
              . Next review will be 6 months time{' '}
              {new Date(
                new Date(user.last_health_questionnaire).setMonth(
                  new Date(user.last_health_questionnaire).getMonth() + 6
                )
              ).toLocaleDateString('en-GB')}
            </p>
          ) : (
            <p className="text-red-600 dark:text-red-400 mt-1">
              Health Questionnaire has not been completed. You will need to do
              this every 6 months before you scan a site QR code.
            </p>
          )}
        </div>

        {/* Worker Dashboard Widgets - Simplified for Contractor Workers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Scan QR Code Widget */}
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center justify-center ${
              !hasValidHealthQuestionnaire()
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={
              hasValidHealthQuestionnaire() ? handleScanQRCode : undefined
            }
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={`h-12 w-12 mb-4 ${
                !hasValidHealthQuestionnaire()
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-amber-500'
              }`}
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/>
              <path d="M12 17h.01"/>
            </svg>
            <h3
              className={`text-lg font-medium mb-2 ${
                !hasValidHealthQuestionnaire()
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              Scan QR Code
            </h3>
            <p
              className={`text-sm text-center ${
                !hasValidHealthQuestionnaire()
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {!hasValidHealthQuestionnaire()
                ? 'Complete Health Questionnaire first'
                : 'Scan a site QR code to check in or out'}
            </p>
          </div>

          {/* Health Questionnaire Widget */}
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center justify-center ${
              !isHealthQuestionnaireNeeded()
                ? 'opacity-70 cursor-not-allowed'
                : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={
              isHealthQuestionnaireNeeded()
                ? handleHealthQuestionnaire
                : undefined
            }
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={`h-12 w-12 mb-4 ${
                !isHealthQuestionnaireNeeded()
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-amber-500'
              }`}
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <line x1="10" y1="9" x2="8" y2="9"/>
            </svg>
            <h3
              className={`text-lg font-medium mb-2 ${
                !isHealthQuestionnaireNeeded()
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              Health Questionnaire
            </h3>
            <p
              className={`text-sm text-center ${
                !isHealthQuestionnaireNeeded()
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {!isHealthQuestionnaireNeeded()
                ? 'Already completed (valid for 6 months)'
                : 'Complete your 6-month health assessment'}
            </p>
          </div>

          {/* My Profile Widget */}
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={handleMyProfile}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="h-12 w-12 text-amber-500 mb-4"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              My Profile
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              View and update your personal information
            </p>
          </div>
        </div>
      </div>

      {/* Footer - Simplified without Modules button */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} On Point Groundworks. All rights
            reserved.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <WorkerProfile
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userEmail={user?.email}
      />

      <MainQuestionnaire
        isOpen={showMainQuestionnaireModal}
        onClose={() => {
          setShowMainQuestionnaireModal(false);
          // Force refresh of user data when modal closes
          refreshUserData();
        }}
        userEmail={user?.email}
        onSuccess={() => {
          console.log('MainQuestionnaire onSuccess triggered');
          refreshUserData();
        }}
      />

      <ShortQuestionnaire
        isOpen={showShortQuestionnaireModal}
        onClose={() => setShowShortQuestionnaireModal(false)}
        userEmail={user?.email}
        onScanQRCode={handleCompletedHealthCheck}
      />

      <QRScannerModal
        isOpen={showQRScannerModal}
        onClose={() => setShowQRScannerModal(false)}
        onCodeScanned={handleQRCodeScanned}
        scannedSiteId={scannedSiteId}
        scannedSiteName={scannedSiteName}
      />
    </div>
  );
}
