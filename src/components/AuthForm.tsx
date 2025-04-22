import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Loader2, HardHat, Building2 } from 'lucide-react';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<'staff' | 'worker'>('staff');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');

  // Apply the background color based on the selected tab
  useEffect(() => {
    const body = document.querySelector('body');
    if (body) {
      body.style.backgroundColor =
        userType === 'staff' ? 'rgb(208 217 235)' : 'rgb(235 228 208)';
    }

    // Clean up when component unmounts
    return () => {
      if (body) {
        body.style.backgroundColor = '';
      }
    };
  }, [userType]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // For login, first try to authenticate the user
        const { error: authError, data } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (authError) throw authError;

        if (!data.user) {
          throw new Error('Authentication failed. Please try again.');
        }

        // After successful authentication, check if user is of the correct type
        if (userType === 'worker') {
          // Check if user exists in workers table
          const { data: workerData, error: workerError } = await supabase
            .from('workers')
            .select('*')
            .eq('email', email)
            .single();

          if (workerError || !workerData) {
            await supabase.auth.signOut();
            throw new Error(
              'This account is not registered as a worker. Please use the Staff login.'
            );
          }
        } else {
          // For staff login, verify that the user is NOT in the workers table
          const { data: workerData } = await supabase
            .from('workers')
            .select('*')
            .eq('email', email)
            .single();

          if (workerData) {
            await supabase.auth.signOut();
            throw new Error(
              'This account is registered as a worker. Please use the Contractor Worker login.'
            );
          }
        }

        // Store user type in local storage for dashboard routing
        localStorage.setItem('userType', userType);

        // Redirect based on user type
        if (userType === 'worker') {
          window.location.href = '/workerdashboard';
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        // When signing up
        if (userType === 'worker') {
          try {
            // First create the worker record
            const workerData = {
              email,
              full_name: name,
              phone: phone,
              is_active: true,
              last_short_questionnaire_date: null,
              last_main_questionnaire_date: null,
              created_at: new Date().toISOString(),
              user_id: null,
              dob: null,
              national_insurance: null,
              emergency_contact_name: null,
              emergency_contact_phone: null,
              photo_url: null,
            };

            console.log('Attempting to create worker with data:', workerData);

            const { error: workerError, data: workerResult } = await supabase
              .from('workers')
              .insert([workerData])
              .select();

            if (workerError) {
              console.error('Worker creation failed with error:', {
                code: workerError.code,
                message: workerError.message,
                details: workerError.details,
                hint: workerError.hint,
                fullError: workerError,
              });
              throw new Error(
                `Failed to create worker record: ${workerError.message}`
              );
            }

            if (!workerResult || workerResult.length === 0) {
              throw new Error('Worker creation returned no data');
            }

            console.log('Worker created successfully:', workerResult);
          } catch (err) {
            console.error('Error in worker creation:', err);
            throw err;
          }
        }

        // Then create the auth user
        const { error: authError, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              user_type: userType,
            },
          },
        });

        if (authError) throw authError;

        // Store user type in local storage
        localStorage.setItem('userType', userType);

        // Redirect based on user type
        if (userType === 'worker' && data.user) {
          // Update worker record with user_id
          if (data.user.id) {
            await supabase
              .from('workers')
              .update({ user_id: data.user.id })
              .eq('email', email);
          }
          window.location.href = '/workerdashboard';
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Authentication error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Sign in to your account' : 'Create new account'}
          </h2>
        </div>

        {/* User Type Tabs */}
        <div className="flex rounded-md shadow-sm mb-6">
          <button
            type="button"
            onClick={() => setUserType('staff')}
            className={`relative inline-flex items-center w-1/2 px-4 py-2 rounded-l-md border ${
              userType === 'staff'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            } text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
          >
            <Building2 className="h-5 w-5 mr-2" />
            Staff
          </button>
          <button
            type="button"
            onClick={() => setUserType('worker')}
            className={`relative inline-flex items-center w-1/2 px-4 py-2 rounded-r-md border ${
              userType === 'worker'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            } text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-amber-500`}
          >
            <HardHat className="h-5 w-5 mr-2" />
            Contractor Worker
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-md text-sm">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Additional fields for worker signup */}
            {!isLogin && userType === 'worker' && (
              <>
                <div>
                  <label htmlFor="name" className="sr-only">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="company" className="sr-only">
                    Company
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    required
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="sr-only">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                userType === 'staff'
                  ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                  : 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
              }`}
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : isLogin ? (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign in
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Sign up
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className={`hover:underline text-sm font-medium ${
              userType === 'staff'
                ? 'text-indigo-600 hover:text-indigo-500'
                : 'text-amber-600 hover:text-amber-500'
            }`}
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
