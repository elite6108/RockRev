import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

interface WorkerCheckInProps {
  onBack?: () => void;
}

export function WorkerCheckIn({ onBack }: WorkerCheckInProps) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize the scanner when component mounts
    if (scannerContainerRef.current) {
      scannerRef.current = new Html5Qrcode('scanner');
      startScanner();
    }

    // Clean up the scanner when component unmounts
    return () => {
      if (scannerRef.current && scanning) {
        scannerRef.current.stop().catch(error => {
          console.error('Error stopping scanner:', error);
        });
      }
    };
  }, []);

  // Handle QR code scan result
  useEffect(() => {
    if (scanResult) {
      console.log('Processing scan result:', scanResult);
      
      // Try to extract a site ID from the QR code data
      let siteId = null;
      
      // Method 1: Try to parse as URL (checking both query params and path)
      try {
        const url = new URL(scanResult);
        
        // First check if it's in the query params
        siteId = url.searchParams.get('siteId');
        
        // If not found in query params, check if it's in the path like /site-checkin/{siteId}
        if (!siteId && url.pathname.includes('/site-checkin/')) {
          const pathParts = url.pathname.split('/');
          // Get the last path segment which should be the UUID
          const lastSegment = pathParts[pathParts.length - 1];
          
          // Verify it looks like a UUID
          if (lastSegment.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)) {
            siteId = lastSegment;
          }
        }
        
        console.log('Extracted siteId from URL:', siteId);
      } catch (error) {
        console.log('Not a URL format, trying alternative parsing methods');
      }
      
      // Method 2: Try to extract UUID directly from string
      if (!siteId) {
        // Look for a UUID pattern in the string
        const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
        const match = scanResult.match(uuidPattern);
        if (match) {
          siteId = match[0];
          console.log('Extracted UUID directly from scan data:', siteId);
        }
      }
      
      // Method 3: Try to parse as JSON
      if (!siteId) {
        try {
          const data = JSON.parse(scanResult);
          siteId = data.siteId || data.site_id || data.id;
          console.log('Extracted siteId from JSON data:', siteId);
        } catch (error) {
          console.log('Not a JSON format');
        }
      }
      
      // If we found a siteId through any method, proceed
      if (siteId) {
        processSiteCheckIn(siteId);
      } else {
        console.error('Could not extract site ID from QR code');
        setScanError('Invalid QR code. Site ID not found in any expected format.');
      }
    }
  }, [scanResult]);

  const startScanner = () => {
    if (!scannerRef.current) return;
    
    setScanning(true);
    setScanError(null);
    setScanResult(null);

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      }
    };

    scannerRef.current.start(
      { facingMode: 'environment' },
      config,
      (decodedText: string) => {
        // Success callback
        setScanning(false);
        setScanResult(decodedText);
        
        // Stop scanner after successful scan
        if (scannerRef.current) {
          scannerRef.current.stop().catch(err => {
            console.error('Error stopping scanner:', err);
          });
        }
      },
      (errorMessage: string) => {
        // Error callback - we don't set error for normal scanning errors
        console.log(errorMessage);
      }
    ).catch((err: any) => {
      // Set error for startup/permission errors
      setScanError(`Error starting scanner: ${err.message || 'Unable to access camera'}`);
      setScanning(false);
    });
  };

  const processSiteCheckIn = async (siteId: string) => {
    setCheckingIn(true);
    setCheckInError(null);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (!user) {
        // Redirect to login if user is not authenticated
        // Store the site ID to complete check-in after login
        localStorage.setItem('pendingSiteCheckIn', siteId);
        navigate('/login?redirectTo=worker/check-in');
        return;
      }
      
      // Get site details
      const { data: siteData, error: siteError } = await supabase
        .from('sites')
        .select('name')
        .eq('id', siteId)
        .single();
      
      if (siteError) throw siteError;
      
      if (!siteData) {
        throw new Error('Site not found');
      }
      
      setSiteName(siteData.name);
      
      // Check if user is already checked in to this site
      const { data: existingCheckIn, error: checkError } = await supabase
        .from('site_check_ins')
        .select('id, logged_in_at, logged_out_at')
        .eq('site_id', siteId)
        .eq('worker_id', user.id)
        .is('logged_out_at', null)
        .order('logged_in_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existingCheckIn) {
        // User is already checked in, so check them out
        const { error: checkOutError } = await supabase
          .from('site_check_ins')
          .update({ logged_out_at: new Date().toISOString() })
          .eq('id', existingCheckIn.id);
        
        if (checkOutError) throw checkOutError;
        
        setCheckInSuccess(true);
        setCheckInError(null);
        // Wait 2 seconds before redirecting to dashboard
        setTimeout(() => {
          navigate('/worker/dashboard');
        }, 2000);
      } else {
        // User is not checked in, so check them in
        const { error: checkInError } = await supabase
          .from('site_check_ins')
          .insert({
            site_id: siteId,
            worker_id: user.id,
            logged_in_at: new Date().toISOString()
          });
        
        if (checkInError) throw checkInError;
        
        setCheckInSuccess(true);
        // Wait 2 seconds before redirecting to site page
        setTimeout(() => {
          navigate(`/worker/site/${siteId}`);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error during site check-in:', error);
      setCheckInError(error.message || 'Failed to check in. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setScanError(null);
    setCheckInSuccess(false);
    setCheckInError(null);
    setSiteName(null);
    startScanner();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-shrink-0 bg-white shadow dark:bg-gray-800 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Site Check-In</h1>
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 p-4 flex flex-col items-center justify-start mt-8">
        {/* Scanning UI */}
        {!scanResult && !checkInSuccess && (
          <>
            <div className="max-w-md w-full bg-white shadow-md rounded-lg overflow-hidden dark:bg-gray-800 mb-6">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Scan Site QR Code
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Position the QR code within the scanner to check in or out.
                </p>
              </div>
              
              <div 
                id="scanner" 
                ref={scannerContainerRef}
                className="w-full h-64 bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
              >
                {scanError && (
                  <div className="text-center p-4">
                    <Icon icon="lucide:alert-circle" className="h-10 w-10 text-red-500 mx-auto mb-2" />
                    <p className="text-red-500">{scanError}</p>
                    <button
                      onClick={handleReset}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Try Again
                    </button>
                  </div>
                )}
                
                {scanning && !scanError && (
                  <div className="text-center p-4">
                    <Icon icon="lucide:loader-2" className="h-10 w-10 text-indigo-500 mx-auto mb-2 animate-spin" />
                    <p className="text-gray-600 dark:text-gray-300">Scanning...</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
              <p>Make sure the QR code is well-lit and clearly visible.</p>
              <p className="mt-2">Having trouble? Ask your site manager for assistance.</p>
            </div>
          </>
        )}
        
        {/* Processing Check-in UI */}
        {scanResult && !checkInSuccess && !checkInError && checkingIn && (
          <div className="max-w-md w-full bg-white shadow-md rounded-lg overflow-hidden dark:bg-gray-800 p-6 text-center">
            <Icon icon="lucide:loader-2" className="h-12 w-12 text-indigo-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Processing Check-in
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Please wait while we process your check-in...
            </p>
          </div>
        )}
        
        {/* Check-in Error UI */}
        {checkInError && (
          <div className="max-w-md w-full bg-white shadow-md rounded-lg overflow-hidden dark:bg-gray-800 p-6 text-center">
            <Icon icon="lucide:alert-circle" className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Check-in Failed
            </h2>
            <p className="text-red-500 mb-4">
              {checkInError}
            </p>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        )}
        
        {/* Check-in Success UI */}
        {checkInSuccess && (
          <div className="max-w-md w-full bg-white shadow-md rounded-lg overflow-hidden dark:bg-gray-800 p-6 text-center">
            <Icon icon="lucide:check-circle" className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Check-in Successful
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-1">
              {siteName && `You've been checked in at ${siteName}.`}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting you to the site page...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
