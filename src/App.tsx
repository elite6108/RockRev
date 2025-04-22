import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { WorkerDashboard } from './components/WorkerDashboard';
import { WorkersRiskAssessments } from './components/Workers/WorkersRiskAssessments';
import { AuthForm } from './components/AuthForm';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'staff' | 'worker' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session and determine user type
    const checkUserSession = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setUser(null);
          setUserType(null);
          localStorage.removeItem('userType');
          setLoading(false);
          return;
        }

        setUser(session.user);

        // First, check local storage for a definitive user type that was set during login
        const storedUserType = localStorage.getItem('userType') as
          | 'staff'
          | 'worker'
          | null;

        if (storedUserType) {
          // If we have stored user type from login verification, use that
          setUserType(storedUserType);
          setLoading(false);
          return;
        }

        // Otherwise, try to determine type by checking the workers table
        try {
          // Try to fetch worker by email rather than user_id as fallback
          const { data: workerData, error: workerError } = await supabase
            .from('workers')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle();

          if (!workerError && workerData) {
            // User found in workers table - they are a worker
            setUserType('worker');
            localStorage.setItem('userType', 'worker');
          } else {
            // Default to staff if not in workers table
            setUserType('staff');
            localStorage.setItem('userType', 'staff');
          }
        } catch (error) {
          console.error('Error checking worker status:', error);
          // Default to staff if there's an error checking worker status
          setUserType('staff');
          localStorage.setItem('userType', 'staff');
        }
      } catch (error) {
        console.error('Session check error:', error);
        // Handle general session check errors
        setUser(null);
        setUserType(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (!session?.user) {
          setUser(null);
          setUserType(null);
          localStorage.removeItem('userType');
          return;
        }

        setUser(session.user);

        // Use the stored user type if available (from login verification)
        const storedUserType = localStorage.getItem('userType') as
          | 'staff'
          | 'worker'
          | null;

        if (storedUserType) {
          setUserType(storedUserType);
          return;
        }

        // If no stored type or on sign in event, re-check status
        if (event === 'SIGNED_IN' || !storedUserType) {
          try {
            const { data: workerData, error: workerError } = await supabase
              .from('workers')
              .select('*')
              .eq('email', session.user.email)
              .maybeSingle();

            if (!workerError && workerData) {
              setUserType('worker');
              localStorage.setItem('userType', 'worker');
            } else {
              setUserType('staff');
              localStorage.setItem('userType', 'staff');
            }
          } catch (error) {
            console.error(
              'Error checking worker status on auth change:',
              error
            );
            setUserType('staff');
            localStorage.setItem('userType', 'staff');
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading screen while checking user status
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {!user ? (
          <Route path="*" element={<AuthForm />} />
        ) : userType === 'worker' ? (
          <>
            <Route path="/" element={<WorkerDashboard />} />
            <Route
              path="/workers/risk-assessments"
              element={<WorkersRiskAssessments />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <Route path="*" element={<Dashboard />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
