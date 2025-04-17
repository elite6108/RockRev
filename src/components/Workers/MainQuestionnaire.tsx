import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  Save,
  X,
} from 'lucide-react';

interface MainQuestionnaireProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onSuccess?: () => void;
}

type FormStep = 'medicalDeclaration' | 'occupationalHistory' | 'declaration';

interface FormData {
  // Medical Declaration
  epilepsy: boolean;
  blackouts: boolean;
  diabetes: boolean;
  eyesight: boolean;
  colorBlindness: boolean;
  hearingImpairment: boolean;
  physicalDisability: boolean;
  arthritis: boolean;
  backProblems: boolean;
  hernia: boolean;
  hypertension: boolean;
  heartDisease: boolean;
  respiratoryDisease: boolean;
  medicalDetails: string;
  prescribedMedications: string;

  // Occupational Health History
  hazardousMaterialExposure: boolean;
  hazardousMaterialDetails: string;
  workRelatedHealthProblems: boolean;
  workRelatedHealthDetails: string;
  workRestrictions: boolean;
  workRestrictionsDetails: string;

  // Declaration
  fullName: string;
  digitalSignature: string;
  submissionDate: string;
  confirmationChecked: boolean;
}

export function MainQuestionnaire({
  isOpen,
  onClose,
  userEmail,
  onSuccess,
}: MainQuestionnaireProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] =
    useState<FormStep>('medicalDeclaration');
  const [workerName, setWorkerName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    // Medical Declaration
    epilepsy: false,
    blackouts: false,
    diabetes: false,
    eyesight: false,
    colorBlindness: false,
    hearingImpairment: false,
    physicalDisability: false,
    arthritis: false,
    backProblems: false,
    hernia: false,
    hypertension: false,
    heartDisease: false,
    respiratoryDisease: false,
    medicalDetails: '',
    prescribedMedications: '',

    // Occupational Health History
    hazardousMaterialExposure: false,
    hazardousMaterialDetails: '',
    workRelatedHealthProblems: false,
    workRelatedHealthDetails: '',
    workRestrictions: false,
    workRestrictionsDetails: '',

    // Declaration
    fullName: '',
    digitalSignature: '',
    submissionDate: new Date().toISOString().split('T')[0],
    confirmationChecked: false,
  });

  useEffect(() => {
    if (userEmail) {
      fetchWorkerName();
    }
  }, [userEmail]);

  const fetchWorkerName = async () => {
    try {
      const { data, error } = await supabase
        .from('workers')
        .select('full_name')
        .eq('email', userEmail)
        .single();

      if (error) throw error;
      if (data) {
        setWorkerName(data.full_name);
        setFormData((prev) => ({ ...prev, fullName: data.full_name }));
      }
    } catch (err) {
      console.error('Error fetching worker name:', err);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setLastX(x);
    setLastY(y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    setLastX(x);
    setLastY(y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signature = canvas.toDataURL();
    setFormData((prev) => ({ ...prev, digitalSignature: signature }));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFormData((prev) => ({ ...prev, digitalSignature: '' }));
  };

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const nextStep = () => {
    if (currentStep === 'medicalDeclaration') {
      setCurrentStep('occupationalHistory');
    } else if (currentStep === 'occupationalHistory') {
      setCurrentStep('declaration');
    }
  };

  const prevStep = () => {
    if (currentStep === 'occupationalHistory') {
      setCurrentStep('medicalDeclaration');
    } else if (currentStep === 'declaration') {
      setCurrentStep('occupationalHistory');
    }
  };

  const validateCurrentStep = (): string | null => {
    if (currentStep === 'declaration') {
      if (!formData.fullName.trim()) {
        return 'Please enter your full name';
      }
      if (!formData.digitalSignature.trim()) {
        return 'Please provide your digital signature';
      }
      if (!formData.confirmationChecked) {
        return 'Please confirm that the information provided is accurate';
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the current user's ID
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const currentDate = new Date().toISOString();
      console.log('Submitting health questionnaire with date:', currentDate);

      // Insert the health questionnaire
      const { error: supabaseError } = await supabase
        .from('health_questionnaires')
        .insert({
          user_id: user.id,
          user_email: userEmail,
          submission_date: currentDate,
          questionnaire_type: '6-month',
          // Medical Declaration
          epilepsy: formData.epilepsy,
          blackouts: formData.blackouts,
          diabetes: formData.diabetes,
          eyesight: formData.eyesight,
          color_blindness: formData.colorBlindness,
          hearing_impairment: formData.hearingImpairment,
          physical_disability: formData.physicalDisability,
          arthritis: formData.arthritis,
          back_problems: formData.backProblems,
          hernia: formData.hernia,
          hypertension: formData.hypertension,
          heart_disease: formData.heartDisease,
          respiratory_disease: formData.respiratoryDisease,
          medical_details: formData.medicalDetails,
          prescribed_medications: formData.prescribedMedications,
          // Occupational Health History
          hazardous_material_exposure: formData.hazardousMaterialExposure,
          hazardous_material_details: formData.hazardousMaterialDetails,
          work_related_health_problems: formData.workRelatedHealthProblems,
          work_related_health_details: formData.workRelatedHealthDetails,
          work_restrictions: formData.workRestrictions,
          work_restrictions_details: formData.workRestrictionsDetails,
          // Declaration
          full_name: formData.fullName,
          digital_signature: formData.digitalSignature,
          confirmation_checked: formData.confirmationChecked,
        });

      if (supabaseError) throw supabaseError;

      // Directly update the worker table as well (this is a backup in case the trigger fails)
      if (userEmail) {
        console.log('Directly updating worker table for email:', userEmail);
        const { error: workerUpdateError } = await supabase
          .from('workers')
          .update({ last_health_questionnaire: currentDate })
          .eq('email', userEmail);

        if (workerUpdateError) {
          console.error('Error updating worker table:', workerUpdateError);
          // Continue anyway since the trigger should still work
        }
      }

      setSuccess(true);

      // Call onSuccess to update parent component IMMEDIATELY
      if (onSuccess) {
        console.log('Calling onSuccess to update parent component');
        onSuccess();
      }

      // Close the modal after success
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1000); // Shorter delay for better UX
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderMedicalDeclaration = () => (
    <div className="space-y-4">
      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
        Medical Declaration
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Please indicate if you have ever suffered from any of the following
        conditions:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() =>
            handleChange({
              target: {
                name: 'epilepsy',
                type: 'checkbox',
                checked: !formData.epilepsy,
              },
            } as any)
          }
          className={`w-full flex items-start p-4 rounded-lg text-left transition-colors
            ${
              formData.epilepsy
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200'
            } 
            border-2 text-gray-700 dark:text-gray-900 hover:bg-gray-50`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
              ${
                formData.epilepsy
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}
            >
              {formData.epilepsy && (
                <svg
                  className="w-3 h-3 text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 6L4.5 9L10.5 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">
              Epilepsy or other fits, blackouts
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            handleChange({
              target: {
                name: 'blackouts',
                type: 'checkbox',
                checked: !formData.blackouts,
              },
            } as any)
          }
          className={`w-full flex items-start p-4 rounded-lg text-left transition-colors
            ${
              formData.blackouts
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200'
            } 
            border-2 text-gray-700 dark:text-gray-900 hover:bg-gray-50`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
              ${
                formData.blackouts
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}
            >
              {formData.blackouts && (
                <svg
                  className="w-3 h-3 text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 6L4.5 9L10.5 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">
              Dizziness, blackouts or fainting episodes
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            handleChange({
              target: {
                name: 'diabetes',
                type: 'checkbox',
                checked: !formData.diabetes,
              },
            } as any)
          }
          className={`w-full flex items-start p-4 rounded-lg text-left transition-colors
            ${
              formData.diabetes
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200'
            } 
            border-2 text-gray-700 dark:text-gray-900 hover:bg-gray-50`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
              ${
                formData.diabetes
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}
            >
              {formData.diabetes && (
                <svg
                  className="w-3 h-3 text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 6L4.5 9L10.5 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">Diabetes</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            handleChange({
              target: {
                name: 'eyesight',
                type: 'checkbox',
                checked: !formData.eyesight,
              },
            } as any)
          }
          className={`w-full flex items-start p-4 rounded-lg text-left transition-colors
            ${
              formData.eyesight
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200'
            } 
            border-2 text-gray-700 dark:text-gray-900 hover:bg-gray-50`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
              ${
                formData.eyesight
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}
            >
              {formData.eyesight && (
                <svg
                  className="w-3 h-3 text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 6L4.5 9L10.5 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">
              Impaired eyesight (not corrected by glasses)
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            handleChange({
              target: {
                name: 'colorBlindness',
                type: 'checkbox',
                checked: !formData.colorBlindness,
              },
            } as any)
          }
          className={`w-full flex items-start p-4 rounded-lg text-left transition-colors
            ${
              formData.colorBlindness
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200'
            } 
            border-2 text-gray-700 dark:text-gray-900 hover:bg-gray-50`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
              ${
                formData.colorBlindness
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}
            >
              {formData.colorBlindness && (
                <svg
                  className="w-3 h-3 text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 6L4.5 9L10.5 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">Color blindness</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            handleChange({
              target: {
                name: 'hearingImpairment',
                type: 'checkbox',
                checked: !formData.hearingImpairment,
              },
            } as any)
          }
          className={`w-full flex items-start p-4 rounded-lg text-left transition-colors
            ${
              formData.hearingImpairment
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200'
            } 
            border-2 text-gray-700 dark:text-gray-900 hover:bg-gray-50`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
              ${
                formData.hearingImpairment
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}
            >
              {formData.hearingImpairment && (
                <svg
                  className="w-3 h-3 text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 6L4.5 9L10.5 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">Hearing impairment</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            handleChange({
              target: {
                name: 'physicalDisability',
                type: 'checkbox',
                checked: !formData.physicalDisability,
              },
            } as any)
          }
          className={`w-full flex items-start p-4 rounded-lg text-left transition-colors
            ${
              formData.physicalDisability
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200'
            } 
            border-2 text-gray-700 dark:text-gray-900 hover:bg-gray-50`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
              ${
                formData.physicalDisability
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}
            >
              {formData.physicalDisability && (
                <svg
                  className="w-3 h-3 text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 6L4.5 9L10.5 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">
              Physical disability or impaired mobility
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            handleChange({
              target: {
                name: 'arthritis',
                type: 'checkbox',
                checked: !formData.arthritis,
              },
            } as any)
          }
          className={`w-full flex items-start p-4 rounded-lg text-left transition-colors
            ${
              formData.arthritis
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200'
            } 
            border-2 text-gray-700 dark:text-gray-900 hover:bg-gray-50`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
              ${
                formData.arthritis
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}
            >
              {formData.arthritis && (
                <svg
                  className="w-3 h-3 text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 6L4.5 9L10.5 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">
              Arthritis or other joint problems
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            handleChange({
              target: {
                name: 'backProblems',
                type: 'checkbox',
                checked: !formData.backProblems,
              },
            } as any)
          }
          className={`w-full flex items-start p-4 rounded-lg text-left transition-colors
            ${
              formData.backProblems
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200'
            } 
            border-2 text-gray-700 dark:text-gray-900 hover:bg-gray-50`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
              ${
                formData.backProblems
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}
            >
              {formData.backProblems && (
                <svg
                  className="w-3 h-3 text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 6L4.5 9L10.5 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">
              Back problems or back pain
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            handleChange({
              target: {
                name: 'hernia',
                type: 'checkbox',
                checked: !formData.hernia,
              },
            } as any)
          }
          className={`w-full flex items-start p-4 rounded-lg text-left transition-colors
            ${
              formData.hernia
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200'
            } 
            border-2 text-gray-700 dark:text-gray-900 hover:bg-gray-50`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
              ${
                formData.hernia
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}
            >
              {formData.hernia && (
                <svg
                  className="w-3 h-3 text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 6L4.5 9L10.5 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">Hernia or rupture</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            handleChange({
              target: {
                name: 'hypertension',
                type: 'checkbox',
                checked: !formData.hypertension,
              },
            } as any)
          }
          className={`w-full flex items-start p-4 rounded-lg text-left transition-colors
            ${
              formData.hypertension
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200'
            } 
            border-2 text-gray-700 dark:text-gray-900 hover:bg-gray-50`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
              ${
                formData.hypertension
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}
            >
              {formData.hypertension && (
                <svg
                  className="w-3 h-3 text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 6L4.5 9L10.5 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">
              Hypertension (high blood pressure)
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            handleChange({
              target: {
                name: 'heartDisease',
                type: 'checkbox',
                checked: !formData.heartDisease,
              },
            } as any)
          }
          className={`w-full flex items-start p-4 rounded-lg text-left transition-colors
            ${
              formData.heartDisease
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200'
            } 
            border-2 text-gray-700 dark:text-gray-900 hover:bg-gray-50`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
              ${
                formData.heartDisease
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}
            >
              {formData.heartDisease && (
                <svg
                  className="w-3 h-3 text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 6L4.5 9L10.5 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">Heart disease</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            handleChange({
              target: {
                name: 'respiratoryDisease',
                type: 'checkbox',
                checked: !formData.respiratoryDisease,
              },
            } as any)
          }
          className={`w-full flex items-start p-4 rounded-lg text-left transition-colors
            ${
              formData.respiratoryDisease
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200'
            } 
            border-2 text-gray-700 dark:text-gray-900 hover:bg-gray-50`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
              ${
                formData.respiratoryDisease
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}
            >
              {formData.respiratoryDisease && (
                <svg
                  className="w-3 h-3 text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 6L4.5 9L10.5 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">
              Respiratory disease including asthma
            </span>
          </div>
        </button>
      </div>

      <div className="mt-6">
        <label
          htmlFor="medicalDetails"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          If you've ticked any of the above, please provide details:
        </label>
        <textarea
          id="medicalDetails"
          name="medicalDetails"
          rows={3}
          value={formData.medicalDetails}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="prescribedMedications"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Are you currently taking any prescribed medications? If yes, please
          list them:
        </label>
        <textarea
          id="prescribedMedications"
          name="prescribedMedications"
          rows={3}
          value={formData.prescribedMedications}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
    </div>
  );

  const renderOccupationalHistory = () => (
    <div className="space-y-4">
      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
        Occupational Health History
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Please provide information about your occupational health history:
      </p>

      <div className="space-y-6">
        <button
          type="button"
          onClick={() =>
            handleChange({
              target: {
                name: 'hazardousMaterialExposure',
                type: 'checkbox',
                checked: !formData.hazardousMaterialExposure,
              },
            } as any)
          }
          className={`w-full flex items-start p-4 rounded-lg text-left transition-colors
            ${
              formData.hazardousMaterialExposure
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200'
            } 
            border-2 text-gray-700 dark:text-gray-900 hover:bg-gray-50`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
              ${
                formData.hazardousMaterialExposure
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}
            >
              {formData.hazardousMaterialExposure && (
                <svg
                  className="w-3 h-3 text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 6L4.5 9L10.5 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">
              Have you ever been exposed to hazardous materials or processes
              (e.g., asbestos, chemicals, loud noise)?
            </span>
          </div>
        </button>

        {formData.hazardousMaterialExposure && (
          <div className="ml-6">
            <label
              htmlFor="hazardousMaterialDetails"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Please provide details:
            </label>
            <textarea
              id="hazardousMaterialDetails"
              name="hazardousMaterialDetails"
              rows={2}
              value={formData.hazardousMaterialDetails}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        )}

        <button
          type="button"
          onClick={() =>
            handleChange({
              target: {
                name: 'workRelatedHealthProblems',
                type: 'checkbox',
                checked: !formData.workRelatedHealthProblems,
              },
            } as any)
          }
          className={`w-full flex items-start p-4 rounded-lg text-left transition-colors
            ${
              formData.workRelatedHealthProblems
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200'
            } 
            border-2 text-gray-700 dark:text-gray-900 hover:bg-gray-50`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
              ${
                formData.workRelatedHealthProblems
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}
            >
              {formData.workRelatedHealthProblems && (
                <svg
                  className="w-3 h-3 text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 6L4.5 9L10.5 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">
              Have you ever had any health problems that you believe were caused
              or made worse by work?
            </span>
          </div>
        </button>

        {formData.workRelatedHealthProblems && (
          <div className="ml-6">
            <label
              htmlFor="workRelatedHealthDetails"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Please provide details:
            </label>
            <textarea
              id="workRelatedHealthDetails"
              name="workRelatedHealthDetails"
              rows={2}
              value={formData.workRelatedHealthDetails}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        )}

        <button
          type="button"
          onClick={() =>
            handleChange({
              target: {
                name: 'workRestrictions',
                type: 'checkbox',
                checked: !formData.workRestrictions,
              },
            } as any)
          }
          className={`w-full flex items-start p-4 rounded-lg text-left transition-colors
            ${
              formData.workRestrictions
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200'
            } 
            border-2 text-gray-700 dark:text-gray-900 hover:bg-gray-50`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
              ${
                formData.workRestrictions
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}
            >
              {formData.workRestrictions && (
                <svg
                  className="w-3 h-3 text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 6L4.5 9L10.5 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">
              Do you have any health conditions or physical limitations that
              might affect your ability to perform certain types of work?
            </span>
          </div>
        </button>

        {formData.workRestrictions && (
          <div className="ml-6">
            <label
              htmlFor="workRestrictionsDetails"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Please provide details:
            </label>
            <textarea
              id="workRestrictionsDetails"
              name="workRestrictionsDetails"
              rows={2}
              value={formData.workRestrictionsDetails}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderDeclaration = () => (
    <div className="space-y-4">
      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
        Declaration & Consent
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Please read and complete the declaration below:
      </p>

      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md text-sm text-gray-700 dark:text-gray-300">
        <p>
          I declare that the information provided in this questionnaire is true
          and complete to the best of my knowledge and belief. I understand
          that:
        </p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>
            Any false statement or deliberate omission may disqualify me from
            employment or result in dismissal.
          </li>
          <li>
            We may use the information provided to comply with its legal
            obligations.
          </li>
          <li>
            It is my responsibility to inform my employer of any changes to my
            health that might affect my ability to work safely.
          </li>
        </ul>
      </div>

      <div className="mt-4">
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Full Name *
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={workerName}
          readOnly
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Digital Signature *
        </label>
        <div className="border border-gray-300 rounded-md p-2">
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="border border-gray-200 rounded bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
        <button
          type="button"
          onClick={clearSignature}
          className="mt-2 text-sm text-red-600 hover:text-red-700"
        >
          Clear Signature
        </button>
      </div>

      <div className="mt-4">
        <label
          htmlFor="submissionDate"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Date
        </label>
        <input
          type="date"
          id="submissionDate"
          name="submissionDate"
          value={formData.submissionDate}
          readOnly
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <button
        type="button"
        onClick={() =>
          handleChange({
            target: {
              name: 'confirmationChecked',
              type: 'checkbox',
              checked: !formData.confirmationChecked,
            },
          } as any)
        }
        className={`w-full flex items-start p-4 rounded-lg text-left transition-colors mt-4
          ${
            formData.confirmationChecked
              ? 'bg-blue-50 border-blue-200'
              : 'bg-white border-gray-200'
          } 
          border-2 text-gray-700 dark:text-gray-900 hover:bg-gray-50`}
      >
        <div className="flex items-center space-x-3">
          <div
            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1
            ${
              formData.confirmationChecked
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300'
            }`}
          >
            {formData.confirmationChecked && (
              <svg
                className="w-3 h-3 text-white"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.5 6L4.5 9L10.5 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <span className="text-sm font-medium">
            I confirm that the information I have provided is accurate and
            complete to the best of my knowledge. *
          </span>
        </div>
      </button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'medicalDeclaration':
        return renderMedicalDeclaration();
      case 'occupationalHistory':
        return renderOccupationalHistory();
      case 'declaration':
        return renderDeclaration();
      default:
        return null;
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
          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 px-4 py-3 shrink-0">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <ClipboardCheck className="h-5 w-5 mr-2" />
              6-Month Health Questionnaire
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="h-full max-h-[500px] overflow-y-auto px-4 py-5 sm:p-6 pr-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentStep === 'medicalDeclaration'
                      ? 'bg-indigo-600'
                      : 'bg-gray-300'
                  }`}
                ></span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentStep === 'occupationalHistory'
                      ? 'bg-indigo-600'
                      : 'bg-gray-300'
                  }`}
                ></span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentStep === 'declaration'
                      ? 'bg-indigo-600'
                      : 'bg-gray-300'
                  }`}
                ></span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Step{' '}
                {currentStep === 'medicalDeclaration'
                  ? '1'
                  : currentStep === 'occupationalHistory'
                  ? '2'
                  : '3'}{' '}
                of 3
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              {renderCurrentStep()}

              {error && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {success && (
                <div className="mt-4 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Questionnaire submitted successfully!
                  </p>
                </div>
              )}
            </form>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-center shrink-0">
            <div>
              {currentStep !== 'medicalDeclaration' && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-100"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>
              )}
            </div>

            <div>
              {currentStep !== 'declaration' ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center bg-indigo-600 px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center bg-indigo-600 px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                  {loading ? 'Submitting...' : 'Submit'}
                  <Save className="h-4 w-4 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
