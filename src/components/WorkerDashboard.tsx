import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  LogOut,
  HardHat,
  AlertTriangle,
  FileText,
  User,
  Moon,
  Sun,
} from 'lucide-react';
import { WorkerProfile } from './Workers/WorkerProfile';
import { MainQuestionnaire } from './Workers/MainQuestionnaire';
import { ShortQuestionnaire } from './Workers/ShortQuestionnaire';

interface WorkerDashboardProps {
  selectedProjectId: string | null;
}

export function WorkerDashboard({ selectedProjectId }: WorkerDashboardProps) {
  const [user, setUser] = useState<any>(null); // For storing user data
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [siteCheckIns, setSiteCheckIns] = useState<any[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);

  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMainQuestionnaireModal, setShowMainQuestionnaireModal] =
    useState(false);
  const [showShortQuestionnaireModal, setShowShortQuestionnaireModal] =
    useState(false);

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
        userData.full_name = user.email;
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
        'Final user data with last_health_questionnaire:',
        userData.last_health_questionnaire
      );

      // Update the user state with all the data
      setUser(userData);

      // After user is loaded, fetch site check-ins
      fetchSiteCheckIns(user.email);
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
                <HardHat className="h-8 w-8 text-amber-500" />
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
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
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
                    <User className="h-8 w-8" />
                  </button>
                </div>
                {isMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                    <button
                      onClick={handleMyProfile}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    >
                      <User className="h-4 w-4 mr-2" />
                      My Profile
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
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
            <AlertTriangle
              className={`h-12 w-12 mb-4 ${
                !hasValidHealthQuestionnaire()
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-amber-500'
              }`}
            />
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
            <FileText
              className={`h-12 w-12 mb-4 ${
                !isHealthQuestionnaireNeeded()
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-amber-500'
              }`}
            />
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
            <User className="h-12 w-12 text-amber-500 mb-4" />
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
        onScanQRCode={() => (window.location.href = '/check-in')}
      />
    </div>
  );
}
