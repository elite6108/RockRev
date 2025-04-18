import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeScanned: (decodedText: string) => void;
  scannedSiteId: string | null;
  scannedSiteName: string;
}

export function QRScannerModal({
  isOpen,
  onClose,
  onCodeScanned,
  scannedSiteId,
  scannedSiteName,
}: QRScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const qrReaderRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Initialize QR scanner when component mounts
    if (isOpen && !scannedSiteId && !qrReaderRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const qrReader = document.getElementById('qr-reader');
        if (qrReader) {
          try {
            qrReaderRef.current = new Html5Qrcode('qr-reader');
            startScanner();
          } catch (err) {
            console.error('Error initializing QR scanner:', err);
            setError('Could not initialize camera. Please check permissions.');
          }
        }
      }, 300);
    }

    // Cleanup function
    return () => {
      stopScanner();
    };
  }, [isOpen, scannedSiteId]);

  const startScanner = async () => {
    if (!qrReaderRef.current) return;

    const qrScanner = qrReaderRef.current;
    setScanning(true);
    
    try {
      await qrScanner.start(
        { facingMode: 'environment' }, // Use rear camera if available
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
        },
        (decodedText) => {
          // QR code detected
          console.log('QR code detected:', decodedText);
          onCodeScanned(decodedText);
          stopScanner();
        },
        (_errorMessage) => {
          // Ignore in-progress scanning errors to prevent alert spam
          console.log('QR scanning in progress...');
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Could not access camera. Please check permissions.');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (qrReaderRef.current && scanning) {
      try {
        await qrReaderRef.current.stop();
        qrReaderRef.current = null;
        setScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 px-4 py-3">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              Scan Site QR Code
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <svg 
                className="h-5 w-5" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="h-full px-4 py-5 sm:p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900 rounded-md">
                <p className="text-red-800 dark:text-red-100">{error}</p>
              </div>
            )}

            {scannedSiteId ? (
              <div className="text-center py-4">
                <svg 
                  className="h-16 w-16 mx-auto text-green-500 mb-4" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  Site Check-In Successful
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You have checked in at: <span className="font-medium">{scannedSiteName}</span>
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-4">
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    Position the QR code within the scanner
                  </p>
                </div>
                <div 
                  id="qr-reader" 
                  className="mx-auto"
                  style={{ width: '100%', maxWidth: '500px', height: '300px', border: '1px solid #ccc' }}
                ></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Please allow camera access when prompted
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
