import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useLocation, useRoutes } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';

import { Dashboard } from './components/Dashboard';
import { WorkerDashboard } from './components/WorkerDashboard';
import { AuthForm } from './components/AuthForm';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'staff' | 'worker' | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);


  useEffect(() => {
    // Check if URL contains password reset parameters
    const checkForPasswordReset = () => {
      const hash = window.location.hash;
      if (hash && (hash.includes('type=recovery') || hash.includes('error_code=otp_expired'))) {
        window.location.href = '/reset-password';
      }
    };
    
    // Call the check immediately
    checkForPasswordReset();
    
    // Check current session and determine user type
    const checkUserSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setUser(null);
          setUserType(null);
          localStorage.removeItem('userType');
          setLoading(false);
          return;
        }
        
        setUser(session.user);
        
        // First, check local storage for a definitive user type that was set during login
        const storedUserType = localStorage.getItem('userType') as 'staff' | 'worker' | null;
        
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

    // Fetch all projects
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();

    // Also add an event listener for hash changes (for reset password links)
    const handleHashChange = () => {
      checkForPasswordReset();
    };
    
    window.addEventListener('hashchange', handleHashChange);

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
        const storedUserType = localStorage.getItem('userType') as 'staff' | 'worker' | null;
        
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
            console.error('Error checking worker status on auth change:', error);
            setUserType('staff');
            localStorage.setItem('userType', 'staff');
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  // Show loading screen while checking user status
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const routes: RouteObject[] = [
    {
      path: '/',
      element: user ? (
        userType === 'worker' ? (
          <WorkerDashboard selectedProjectId={null} />
        ) : (
          <Dashboard selectedProjectId={null} />
        )
      ) : (
        <Navigate to="/login" state={{ from: location }} replace />
      )
    },
    ...(projects?.map((project) => ({
      path: `/project/${project.id}`,
      element: user ? (
        userType === 'worker' ? (
          <WorkerDashboard selectedProjectId={project.id} />
        ) : (
          <Dashboard selectedProjectId={project.id} />
        )
      ) : (
        <Navigate to="/login" state={{ from: location }} replace />
      )
    })) || []),
    {
      path: '/login',
      element: !user ? (
        <AuthForm onForgotPassword={() => navigate('/forgot-password')} />
      ) : (
        <Navigate to="/" replace />
      )
    },
    {
      path: '/forgot-password',
      element: <ForgotPassword onBackToLogin={() => navigate('/login')} />
    },
    {
      path: '/reset-password',
      element: <ResetPassword onBackToLogin={() => navigate('/login')} />
    },
    {
      path: '*',
      element: <Navigate to="/" replace />
    }
  ];

  const element = useRoutes(routes);
  return element;
}

export default App;