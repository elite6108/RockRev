import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, Save, X, ArrowRight } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ShortQuestionnaireProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onScanQRCode?: () => void;
}

export function ShortQuestionnaire({
  isOpen,
  onClose,
  userEmail,
  onScanQRCode,
}: ShortQuestionnaireProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fitToWork: '',
    takingMedications: '',
    wearingCorrectPPE: '',
    confirmed: false,
    signature: '',
    date: new Date().toISOString().split('T')[0],
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedSiteId, setScannedSiteId] = useState<string | null>(null);
  const [scannedSiteName, setScannedSiteName] = useState<string | null>(null);
  const [lastQuestionnaireId, setLastQuestionnaireId] = useState<string | null>(
    null
  );
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (showQRScanner && !scannedSiteId) {
      // Initialize QR scanner
      qrScannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
        },
        false
      );

      qrScannerRef.current.render(
        (decodedText) => {
          handleQRCodeScanned(decodedText);
        },
        (error) => {
          // Handle scan error
          console.error('QR scan error:', error);
        }
      );
    }

    // Cleanup function
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.clear();
        qrScannerRef.current = null;
      }
    };
  }, [showQRScanner, scannedSiteId]);

  if (!isOpen) return null;

  const handleYesNoChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate step 1 before proceeding
      if (
        !formData.fitToWork ||
        !formData.takingMedications ||
        !formData.wearingCorrectPPE
      ) {
        setError('Please answer all questions before proceeding.');
        return;
      }

      // Check if any answers prevent proceeding
      if (
        formData.fitToWork === 'no' ||
        formData.takingMedications === 'yes' ||
        formData.wearingCorrectPPE === 'no'
      ) {
        setError(
          'Based on your responses, you may not be fit to work. Please contact your supervisor.'
        );
        return;
      }

      setError(null);
      setCurrentStep(2);
    }
  };

  const handlePrevious = () => {
    setError(null);
    setCurrentStep(1);
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, confirmed: e.target.checked }));
  };

  // Canvas signature functions
  const startDrawing = (e: React.SyntheticEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);

    // Get canvas position
    const rect = canvas.getBoundingClientRect();

    // Handle both mouse and touch events
    const clientX =
      'touches' in e.nativeEvent
        ? (e.nativeEvent as TouchEvent).touches[0].clientX
        : (e.nativeEvent as MouseEvent).clientX;
    const clientY =
      'touches' in e.nativeEvent
        ? (e.nativeEvent as TouchEvent).touches[0].clientY
        : (e.nativeEvent as MouseEvent).clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.SyntheticEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get canvas position
    const rect = canvas.getBoundingClientRect();

    // Handle both mouse and touch events
    const clientX =
      'touches' in e.nativeEvent
        ? (e.nativeEvent as TouchEvent).touches[0].clientX
        : (e.nativeEvent as MouseEvent).clientX;
    const clientY =
      'touches' in e.nativeEvent
        ? (e.nativeEvent as TouchEvent).touches[0].clientY
        : (e.nativeEvent as MouseEvent).clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';

    ctx.lineTo(x, y);
    ctx.stroke();

    setHasSignature(true);
  };

  const endDrawing = () => {
    setIsDrawing(false);

    // Save signature as data URL
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureDataUrl = canvas.toDataURL('image/png');
    setFormData((prev) => ({ ...prev, signature: signatureDataUrl }));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setFormData((prev) => ({ ...prev, signature: '' }));
  };

  const handleQRCodeScanned = async (result: string) => {
    try {
      // Parse the URL to get the site_id
      const url = new URL(result);
      const siteId = url.searchParams.get('site_id');

      if (!siteId) {
        setError('Invalid QR code. Please scan a valid site QR code.');
        return;
      }

      // Fetch site details
      const { data: siteData, error: siteError } = await supabase
        .from('sites')
        .select('id, name')
        .eq('id', siteId)
        .single();

      if (siteError || !siteData) {
        setError('Site not found. Please scan a valid site QR code.');
        return;
      }

      setScannedSiteId(siteData.id);
      setScannedSiteName(siteData.name);

      // Create site check-in record
      if (userEmail && lastQuestionnaireId) {
        const { data: workerData, error: workerError } = await supabase
          .from('workers')
          .select('id')
          .eq('email', userEmail)
          .single();

        if (workerError) {
          console.error('Error fetching worker:', workerError);
          setError('Failed to process check-in. Please try again.');
          return;
        }

        const { error: checkInError } = await supabase
          .from('site_check_ins')
          .insert([
            {
              worker_id: workerData.id,
              site_id: siteData.id,
              questionnaire_id: lastQuestionnaireId,
              is_active: true,
            },
          ]);

        if (checkInError) {
          console.error('Error creating check-in:', checkInError);
          setError('Failed to process check-in. Please try again.');
          return;
        }

        // Update questionnaire with site info
        const { error: updateError } = await supabase
          .from('short_questionnaires')
          .update({
            site_id: siteData.id,
            site_name: siteData.name,
          })
          .eq('id', lastQuestionnaireId);

        if (updateError) {
          console.error('Error updating questionnaire:', updateError);
          setError('Failed to update questionnaire. Please try again.');
          return;
        }

        // Close the modal and show success
        onClose();
      }
    } catch (err) {
      console.error('Error processing QR code:', err);
      setError('Failed to process QR code. Please try again.');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    // Validate step 2
    if (!formData.confirmed) {
      setError('Please confirm the declaration to proceed.');
      setLoading(false);
      return;
    }

    if (!hasSignature) {
      setError('Please sign the declaration before submitting.');
      setLoading(false);
      return;
    }

    try {
      if (userEmail) {
        // First get the worker's ID
        const { data: workerData, error: workerError } = await supabase
          .from('workers')
          .select('id')
          .eq('email', userEmail)
          .single();

        if (workerError) {
          console.error('Error fetching worker:', workerError);
          setError('Failed to save your health check. Please try again.');
          setLoading(false);
          return;
        }

        // Save the questionnaire response
        const { data: questionnaireData, error: questionnaireError } =
          await supabase
            .from('short_questionnaires')
            .insert([
              {
                worker_id: workerData.id,
                email: userEmail,
                fit_to_work: formData.fitToWork === 'yes',
                taking_medications: formData.takingMedications === 'yes',
                wearing_correct_ppe: formData.wearingCorrectPPE === 'yes',
                signature: formData.signature,
                confirmed: formData.confirmed,
              },
            ])
            .select()
            .single();

        if (questionnaireError) {
          console.error('Error saving questionnaire:', questionnaireError);
          setError('Failed to save your health check. Please try again.');
          setLoading(false);
          return;
        }

        // Store the questionnaire ID for later use
        setLastQuestionnaireId(questionnaireData.id);

        // Update the worker's last questionnaire dates
        const { error: updateError } = await supabase
          .from('workers')
          .update({
            last_short_questionnaire_date: new Date().toISOString(),
            last_health_questionnaire: new Date().toISOString(),
          })
          .eq('email', userEmail);

        if (updateError) {
          console.error('Error updating worker:', updateError);
          setError('Failed to save your health check. Please try again.');
          setLoading(false);
          return;
        }
      }

      setSuccess(true);
      setShowQRScanner(true);
    } catch (err) {
      console.error('Error in health check:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
              <AlertTriangle className="h-5 w-5 mr-2" />
              Daily Pre-Site Health Check
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="h-full max-h-[500px] overflow-y-auto px-4 py-5 sm:p-6">
            {success ? (
              <div className="text-center py-8">
                {!showQRScanner ? (
                  <>
                    <AlertTriangle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                    <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                      Health Check Completed
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Your health check has been successfully submitted.
                    </p>
                    <button
                      onClick={() => setShowQRScanner(true)}
                      className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600"
                    >
                      Scan Site QR Code
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                      Scan Site QR Code
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Please scan the site QR code to complete your check-in.
                    </p>
                    {scannedSiteId ? (
                      <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                        <p className="text-green-800 dark:text-green-200">
                          Successfully checked in to: {scannedSiteName}
                        </p>
                      </div>
                    ) : (
                      <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <div id="qr-reader" className="w-full h-full"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Progress Indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Step {currentStep} of 2
                    </span>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {currentStep === 1 ? 'Fit to Work' : 'Declaration'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${(currentStep / 2) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 rounded-md mb-4">
                    <p className="text-red-600 dark:text-red-400 text-sm">
                      {error}
                    </p>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Fit to Work Assessment
                    </h4>

                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <p className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                          Are you fit to work today?
                        </p>
                        <div className="flex justify-center space-x-4">
                          <button
                            type="button"
                            onClick={() =>
                              handleYesNoChange('fitToWork', 'yes')
                            }
                            className={`flex-1 py-2 px-4 rounded-md text-center font-medium ${
                              formData.fitToWork === 'yes'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => handleYesNoChange('fitToWork', 'no')}
                            className={`flex-1 py-2 px-4 rounded-md text-center font-medium ${
                              formData.fitToWork === 'no'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <p className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                          Have you taken any drugs/medications that could impair
                          safety?
                        </p>
                        <div className="flex justify-center space-x-4">
                          <button
                            type="button"
                            onClick={() =>
                              handleYesNoChange('takingMedications', 'yes')
                            }
                            className={`flex-1 py-2 px-4 rounded-md text-center font-medium ${
                              formData.takingMedications === 'yes'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleYesNoChange('takingMedications', 'no')
                            }
                            className={`flex-1 py-2 px-4 rounded-md text-center font-medium ${
                              formData.takingMedications === 'no'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <p className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                          Are you wearing the correct PPE?
                        </p>
                        <div className="flex justify-center space-x-4">
                          <button
                            type="button"
                            onClick={() =>
                              handleYesNoChange('wearingCorrectPPE', 'yes')
                            }
                            className={`flex-1 py-2 px-4 rounded-md text-center font-medium ${
                              formData.wearingCorrectPPE === 'yes'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleYesNoChange('wearingCorrectPPE', 'no')
                            }
                            className={`flex-1 py-2 px-4 rounded-md text-center font-medium ${
                              formData.wearingCorrectPPE === 'no'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Declaration
                    </h4>

                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                        <p className="mb-2">I confirm that:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>
                            I am fit to work and have not knowingly withheld any
                            information
                          </li>
                          <li>
                            I will comply with all site safety rules and
                            procedures
                          </li>
                          <li>
                            I will report any accidents, incidents, or safety
                            concerns immediately
                          </li>
                        </ul>
                      </div>

                      <div className="flex items-center mb-4">
                        <input
                          id="confirm-declaration"
                          type="checkbox"
                          checked={formData.confirmed}
                          onChange={handleConfirmChange}
                          className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="confirm-declaration"
                          className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                        >
                          I confirm the declaration above
                        </label>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Digital Signature
                        </label>
                        <div className="border-2 border-gray-300 dark:border-gray-600 rounded-md mb-2 bg-white">
                          <canvas
                            ref={canvasRef}
                            width={450}
                            height={150}
                            className="w-full touch-none"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={endDrawing}
                            onMouseLeave={endDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={endDrawing}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={clearSignature}
                          className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                        >
                          Clear signature
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Date
                        </label>
                        <input
                          type="date"
                          value={formData.date}
                          readOnly
                          className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between">
            {!success && (
              <>
                {currentStep === 1 ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-100"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-100"
                  >
                    Back
                  </button>
                )}

                {currentStep === 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-opacity-20 border-t-white rounded-full"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Submit
                      </>
                    )}
                  </button>
                )}
              </>
            )}
            {success && !showQRScanner && (
              <button
                type="button"
                onClick={() => setShowQRScanner(true)}
                className="w-full px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600"
              >
                Scan QR Code
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
