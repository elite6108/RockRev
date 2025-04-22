import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Trash2,
  Edit,
  Plus,
  FileText,
  ClipboardList,
  AlertCircle,
  Bell,
  Check,
  ChevronLeft,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { generateContractorPDF } from '../../utils/contractorPDFGenerator';

interface SubcontractorsProps {
  onBack: () => void;
}

interface Reminder {
  type: 'insurance';
  title: string;
  date: Date;
  description: string;
  severity: 'warning' | 'danger';
}

interface InsuranceDetails {
  insurer: string;
  policy_no: string;
  renewal_date: string;
  limit_of_indemnity: string;
}

interface Subcontractor {
  id: string;
  company_name: string;
  services_provided: string;
  address: string;
  phone: string;
  email: string;
  swms: boolean;
  insurance_exp_date: string;
  review_date: string;
  created_at?: string;
  updated_at?: string;
  employers_liability: InsuranceDetails;
  public_liability: InsuranceDetails;
  professional_negligence: InsuranceDetails;
  contractors_all_risk: InsuranceDetails;
  custom_insurance_types?: Record<string, InsuranceDetails>;
  nature_of_business: string;
  swms_url?: string;
  health_safety_policy_url?: string;
  additional_files_urls?: string[];
  review?: ReviewFormData;
}

interface SubcontractorFormData
  extends Omit<Subcontractor, 'id' | 'created_at' | 'updated_at'> {
  nature_of_business: string;
  employers_liability: InsuranceDetails;
  public_liability: InsuranceDetails;
  professional_negligence: InsuranceDetails;
  contractors_all_risk: InsuranceDetails;
  has_swms: boolean;
  swms_file?: File | null;
  swms_url?: string;
  has_health_safety_policy: boolean;
  health_safety_policy_file?: File | null;
  health_safety_policy_url?: string;
  additional_files: File[];
  additional_files_urls: string[];
}

interface SatisfactionRating {
  rating:
    | 'totally_dissatisfied'
    | 'mostly_dissatisfied'
    | 'neither'
    | 'mostly_satisfied'
    | 'totally_satisfied';
  comments: string;
}

interface ReviewFormData {
  date: string;
  requirements_scope: string;
  requirements: string;
  review_date: string;
  agreed_timeframe: string;
  total_time_taken: string;
  actual_timeframe: string;

  // Satisfaction ratings
  quality_rating: SatisfactionRating;
  timeliness_rating: SatisfactionRating;
  communication_rating: SatisfactionRating;
  understanding_rating: SatisfactionRating;
  cooperativeness_rating: SatisfactionRating;
  overall_satisfaction_rating: SatisfactionRating;

  // Yes/No questions
  authority_to_work: boolean;
  relevant_permits: boolean;
  risk_assessments: boolean;
  documents_legible: boolean;
  time_limit_clear: boolean;
  control_measures: boolean;
  work_in_line: boolean;
  right_people: boolean;
  emergency_knowledge: boolean;
  ppe_condition: boolean;
  tools_condition: boolean;
  housekeeping_standards: boolean;
}

export function Subcontractors({ onBack }: SubcontractorsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedContractorId, setSelectedContractorId] = useState<
    string | null
  >(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedContractorForReview, setSelectedContractorForReview] =
    useState<Subcontractor | null>(null);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingContractor, setEditingContractor] =
    useState<SubcontractorFormData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [formData, setFormData] = useState<SubcontractorFormData>({
    company_name: '',
    services_provided: '',
    address: '',
    phone: '',
    email: '',
    nature_of_business: '',
    swms: false,
    insurance_exp_date: '',
    review_date: '',
    employers_liability: {
      insurer: '',
      policy_no: '',
      renewal_date: '',
      limit_of_indemnity: '',
    },
    public_liability: {
      insurer: '',
      policy_no: '',
      renewal_date: '',
      limit_of_indemnity: '',
    },
    professional_negligence: {
      insurer: '',
      policy_no: '',
      renewal_date: '',
      limit_of_indemnity: '',
    },
    contractors_all_risk: {
      insurer: '',
      policy_no: '',
      renewal_date: '',
      limit_of_indemnity: '',
    },
    has_swms: false,
    has_health_safety_policy: false,
    additional_files: [],
    additional_files_urls: [],
  });
  const [customInsuranceTypes, setCustomInsuranceTypes] = useState<string[]>(
    []
  );
  const [reviewFormData, setReviewFormData] = useState<ReviewFormData>({
    date: new Date().toISOString().split('T')[0],
    requirements_scope: '',
    requirements: '',
    review_date: new Date().toISOString().split('T')[0],
    agreed_timeframe: '',
    total_time_taken: '',
    actual_timeframe: '',
    quality_rating: { rating: 'neither', comments: '' },
    timeliness_rating: { rating: 'neither', comments: '' },
    communication_rating: { rating: 'neither', comments: '' },
    understanding_rating: { rating: 'neither', comments: '' },
    cooperativeness_rating: { rating: 'neither', comments: '' },
    overall_satisfaction_rating: { rating: 'neither', comments: '' },
    authority_to_work: false,
    relevant_permits: false,
    risk_assessments: false,
    documents_legible: false,
    time_limit_clear: false,
    control_measures: false,
    work_in_line: false,
    right_people: false,
    emergency_knowledge: false,
    ppe_condition: false,
    tools_condition: false,
    housekeeping_standards: false,
  });
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch contractors on component mount
  useEffect(() => {
    fetchContractors();
    fetchCompanySettings();
  }, []);

  useEffect(() => {
    // Update reminders whenever subcontractors change
    setReminders(getReminders());
  }, [subcontractors]);

  const getReminders = (): Reminder[] => {
    const today = new Date();
    const reminders: Reminder[] = [];

    subcontractors.forEach((contractor) => {
      // Check main insurance expiry date
      if (contractor.insurance_exp_date) {
        const expiryDate = new Date(contractor.insurance_exp_date);
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 30 || diffDays < 0) {
          reminders.push({
            type: 'insurance',
            title: contractor.company_name,
            date: expiryDate,
            description:
              diffDays < 0
                ? `Insurance expired - ${expiryDate.toLocaleDateString()}`
                : `Insurance expires in ${diffDays} days`,
            severity: diffDays <= 0 ? 'danger' : 'warning',
          });
        }
      }

      // Check all insurance types
      const insuranceTypes = [
        { name: 'Employers Liability', data: contractor.employers_liability },
        { name: 'Public Liability', data: contractor.public_liability },
        {
          name: 'Professional Negligence',
          data: contractor.professional_negligence,
        },
        { name: 'Contractors All Risk', data: contractor.contractors_all_risk },
      ];

      // Add custom insurance types
      if (contractor.custom_insurance_types) {
        Object.entries(contractor.custom_insurance_types).forEach(
          ([key, value]) => {
            insuranceTypes.push({
              name: key
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' '),
              data: value,
            });
          }
        );
      }

      insuranceTypes.forEach(({ name, data }) => {
        if (data?.renewal_date) {
          const expiryDate = new Date(data.renewal_date);
          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 30 || diffDays < 0) {
            reminders.push({
              type: 'insurance',
              title: `${contractor.company_name} - ${name}`,
              date: expiryDate,
              description:
                diffDays < 0
                  ? `${name} expired - ${expiryDate.toLocaleDateString()}`
                  : `${name} expires in ${diffDays} days`,
              severity: diffDays <= 0 ? 'danger' : 'warning',
            });
          }
        }
      });
    });

    // Sort reminders by date
    return reminders.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const fetchContractors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('subcontractors').select('*');

      if (error) throw error;

      // Fetch reviews for each contractor
      const contractorsWithReviews = await Promise.all(
        data.map(async (contractor) => {
          const { data: reviewData, error: reviewError } = await supabase
            .from('contractor_reviews')
            .select('*')
            .eq('contractor_id', contractor.id)
            .order('review_date', { ascending: false })
            .limit(1);

          if (reviewError) {
            console.error('Error fetching review:', reviewError);
            return {
              ...contractor,
              review: null,
            };
          }

          return {
            ...contractor,
            review: reviewData && reviewData.length > 0 ? reviewData[0] : null,
          };
        })
      );

      setSubcontractors(contractorsWithReviews);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching contractors:', err);
      setError('Failed to fetch contractors');
      setLoading(false);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (error) throw error;
      setCompanySettings(data);
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  const getDateStatus = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    if (date < today) {
      return 'expired';
    } else if (date <= thirtyDaysFromNow) {
      return 'due_soon';
    }
    return 'ok';
  };

  const getStatusLabel = (status: string, type: 'insurance' | 'review') => {
    switch (status) {
      case 'expired':
        return type === 'insurance' ? 'Expired' : 'Review Now';
      case 'due_soon':
        return 'Due Soon';
      default:
        return '';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'expired':
        return 'text-red-600';
      case 'due_soon':
        return 'text-orange-500';
      default:
        return 'text-gray-900';
    }
  };

  const filteredContractors = subcontractors.filter(
    (contractor) =>
      contractor.company_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      contractor.services_provided
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setSelectedContractorId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedContractorId) return;

    try {
      const { error } = await supabase
        .from('subcontractors')
        .delete()
        .eq('id', selectedContractorId);

      if (error) throw error;

      setSubcontractors((prev) =>
        prev.filter((c) => c.id !== selectedContractorId)
      );
      setShowDeleteModal(false);
      setSelectedContractorId(null);
    } catch (err) {
      console.error('Error deleting contractor:', err);
      setError('Failed to delete contractor');
    }
  };

  const handleEdit = (contractor: Subcontractor) => {
    // Initialize formData with the contractor's values
    setFormData({
      company_name: contractor.company_name,
      services_provided: contractor.services_provided,
      address: contractor.address,
      phone: contractor.phone,
      email: contractor.email,
      nature_of_business: contractor.nature_of_business || '',
      swms: contractor.swms,
      insurance_exp_date: contractor.insurance_exp_date,
      review_date: contractor.review_date,
      employers_liability: contractor.employers_liability,
      public_liability: contractor.public_liability,
      professional_negligence: contractor.professional_negligence,
      contractors_all_risk: contractor.contractors_all_risk,
      has_swms: contractor.swms,
      has_health_safety_policy: !!contractor.health_safety_policy_url,
      additional_files: [],
      additional_files_urls: contractor.additional_files_urls || [],
      swms_url: contractor.swms_url,
      health_safety_policy_url: contractor.health_safety_policy_url,
    });

    // Set editing contractor for reference during update
    setEditingContractor(contractor);
    setShowFormModal(true);
  };

  const handleAdd = () => {
    setEditingContractor(null);
    setShowFormModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInsuranceChange = (
    type: keyof SubcontractorFormData,
    field: keyof InsuranceDetails,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const handleFileUpload = async (
    file: File,
    type: 'swms' | 'health_safety' | 'additional'
  ) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('subcontractor-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('subcontractor-files').getPublicUrl(fileName);

      if (type === 'swms') {
        setFormData((prev) => ({ ...prev, swms_url: publicUrl }));
      } else if (type === 'health_safety') {
        setFormData((prev) => ({
          ...prev,
          health_safety_policy_url: publicUrl,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          additional_files_urls: [...prev.additional_files_urls, publicUrl],
        }));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleFormSubmit = async (formData: SubcontractorFormData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const {
        additional_files,
        swms_file,
        health_safety_policy_file,
        ...cleanFormData
      } = formData;

      // Set default expiry date if not provided
      const defaultExpiryDate = new Date();
      defaultExpiryDate.setFullYear(defaultExpiryDate.getFullYear() + 1);

      // Set review date to 12 months from now
      const reviewDate = new Date();
      reviewDate.setFullYear(reviewDate.getFullYear() + 1);

      const dataToSend = {
        ...cleanFormData,
        user_id: user.id,
        insurance_exp_date:
          cleanFormData.insurance_exp_date ||
          defaultExpiryDate.toISOString().split('T')[0],
        review_date: reviewDate.toISOString().split('T')[0],
      };

      if (editingContractor) {
        // Update existing contractor
        const { error } = await supabase
          .from('subcontractors')
          .update(dataToSend)
          .eq('id', editingContractor.id);

        if (error) throw error;

        // Update local state
        setSubcontractors(
          subcontractors.map((c) =>
            c.id === editingContractor.id ? { ...c, ...dataToSend } : c
          )
        );
      } else {
        // Add new contractor
        const { data, error } = await supabase
          .from('subcontractors')
          .insert([dataToSend])
          .select();

        if (error) throw error;
        if (data) {
          setSubcontractors([...subcontractors, data[0]]);
        }
      }

      setShowFormModal(false);
      setEditingContractor(null);
    } catch (error) {
      console.error('Error saving contractor:', error);
      setError(
        'Failed to save contractor: ' + (error as any)?.message ||
          'Unknown error'
      );
    }
  };

  const handleReview = (contractor: Subcontractor) => {
    setSelectedContractorForReview(contractor);
    // Initialize review form data with existing review data if it exists
    if (contractor.review) {
      setReviewFormData({
        ...contractor.review,
        // Ensure review_date matches the date
        review_date: contractor.review.date,
        // Set actual_timeframe to be the same as total_time_taken (or empty string if not present)
        actual_timeframe: contractor.review.total_time_taken || '',
      });
    } else {
      // Initialize with default values if no review exists
      const today = new Date().toISOString().split('T')[0];
      setReviewFormData({
        date: today,
        requirements_scope: '',
        requirements: '',
        review_date: today,
        agreed_timeframe: '',
        total_time_taken: '',
        actual_timeframe: '',
        quality_rating: { rating: 'neither', comments: '' },
        timeliness_rating: { rating: 'neither', comments: '' },
        communication_rating: { rating: 'neither', comments: '' },
        understanding_rating: { rating: 'neither', comments: '' },
        cooperativeness_rating: { rating: 'neither', comments: '' },
        overall_satisfaction_rating: { rating: 'neither', comments: '' },
        authority_to_work: false,
        relevant_permits: false,
        risk_assessments: false,
        documents_legible: false,
        time_limit_clear: false,
        control_measures: false,
        work_in_line: false,
        right_people: false,
        emergency_knowledge: false,
        ppe_condition: false,
        tools_condition: false,
        housekeeping_standards: false,
      });
    }
    setShowReviewModal(true);
  };

  const handleReviewChange = (field: keyof ReviewFormData, value: any) => {
    setReviewFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSatisfactionChange = (
    field: keyof ReviewFormData,
    rating: string,
    comments?: string
  ) => {
    setReviewFormData((prev) => ({
      ...prev,
      [field]: {
        rating: rating as SatisfactionRating['rating'],
        comments: comments ?? prev[field].comments,
      },
    }));
  };

  const handleRequirementsChange = (value: string) => {
    setReviewFormData((prev) => ({
      ...prev,
      requirements_scope: value,
      requirements: value || 'No specific requirements provided',
    }));
  };

  const handleDateChange = (value: string) => {
    setReviewFormData((prev) => ({
      ...prev,
      date: value,
      review_date: value,
    }));
  };

  const handleGeneratePDF = async (contractor: Subcontractor) => {
    try {
      // Generate PDF
      const pdfDataUrl = await generateContractorPDF({
        contractor,
        companySettings,
      });

      // Convert base64 data URL to Blob
      const base64Data = pdfDataUrl.split(',')[1];
      const binaryData = atob(base64Data);
      const array = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        array[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([array], { type: 'application/pdf' });

      // Create and open Object URL in a new tab
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');

      // Clean up the Object URL after the window is loaded
      if (newWindow) {
        newWindow.addEventListener('load', () => {
          URL.revokeObjectURL(url);
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF');
    }
  };

  // Add review to database
  const submitReview = async () => {
    if (!selectedContractorForReview) return;

    try {
      setSubmittingReview(true);

      // Create an object that ensures no required fields are null
      const reviewDataToSubmit = {
        ...reviewFormData,
        // If requirements_scope is empty, use a default value to avoid null constraint
        requirements:
          reviewFormData.requirements_scope ||
          'No specific requirements provided',
        // Make sure review_date is properly set to avoid not-null constraint
        review_date: reviewFormData.date,
        // Use total_time_taken for the actual_timeframe field in the database
        actual_timeframe: reviewFormData.total_time_taken || 'Not specified',
        // Set satisfaction_rating as a string value from the overall rating
        satisfaction_rating:
          reviewFormData.overall_satisfaction_rating?.rating || 'neither',
        contractor_id: selectedContractorForReview.id,
      };

      // Insert into contractor_reviews table
      const { error: reviewError } = await supabase
        .from('contractor_reviews')
        .insert([reviewDataToSubmit]);

      if (reviewError) throw reviewError;

      // Update the review date in the subcontractors table
      const { error: updateError } = await supabase
        .from('subcontractors')
        .update({ review_date: reviewFormData.date })
        .eq('id', selectedContractorForReview.id);

      if (updateError) throw updateError;

      // Update local state
      setSubcontractors((prev) =>
        prev.map((c) =>
          c.id === selectedContractorForReview.id
            ? { ...c, review_date: reviewFormData.date, review: reviewFormData }
            : c
        )
      );

      setShowReviewModal(false);
      setSelectedContractorForReview(null);
      setSubmittingReview(false);
    } catch (error: any) {
      console.error('Error saving review:', error);
      setSubmittingReview(false);
      setSubmitError(`Failed to save review: ${error.message}`);
    }
  };

  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            <h4 className="text-lg font-medium sticky top-0 bg-white py-2">
              Company Info
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company Name{' '}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Services Provided{' '}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  name="services_provided"
                  value={formData.services_provided}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address{' '}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone{' '}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  pattern="^\+?44[0-9]{10}$"
                  placeholder="+44"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email{' '}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nature of Business{' '}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  name="nature_of_business"
                  value={formData.nature_of_business}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 max-h-[500px] overflow-y-auto">
            <div className="sticky top-0 bg-white py-2 z-10">
              <h4 className="text-lg font-medium">Insurance</h4>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Insurance Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="insurance_exp_date"
                  value={formData.insurance_exp_date}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <button
                onClick={() => {
                  const newType = `custom_insurance_${
                    customInsuranceTypes.length + 1
                  }`;
                  setCustomInsuranceTypes([...customInsuranceTypes, newType]);
                  setFormData((prev) => ({
                    ...prev,
                    [newType]: {
                      insurer: '',
                      policy_no: '',
                      renewal_date: '',
                      limit_of_indemnity: '',
                    },
                  }));
                }}
                className="mt-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Add New Insurance Type
              </button>
            </div>
            {[
              'employers_liability',
              'public_liability',
              'professional_negligence',
              'contractors_all_risk',
              ...customInsuranceTypes,
            ].map((insurance) => (
              <div key={insurance} className="border p-4 rounded-md">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-md font-medium">
                    {insurance.startsWith('custom_insurance_')
                      ? `Custom Insurance ${insurance.split('_').pop()}`
                      : insurance
                          .split('_')
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(' ')}
                  </h5>
                  {insurance.startsWith('custom_insurance_') && (
                    <button
                      onClick={() => {
                        setCustomInsuranceTypes(
                          customInsuranceTypes.filter(
                            (type) => type !== insurance
                          )
                        );
                        setFormData((prev) => {
                          const newData = { ...prev };
                          delete newData[insurance];
                          return newData;
                        });
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Insurer{' '}
                      <span className="text-gray-400 text-xs">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData[insurance]?.insurer || ''}
                      onChange={(e) =>
                        handleInsuranceChange(
                          insurance as keyof SubcontractorFormData,
                          'insurer',
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Policy Number{' '}
                      <span className="text-gray-400 text-xs">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData[insurance]?.policy_no || ''}
                      onChange={(e) =>
                        handleInsuranceChange(
                          insurance as keyof SubcontractorFormData,
                          'policy_no',
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Renewal Date{' '}
                      <span className="text-gray-400 text-xs">(optional)</span>
                    </label>
                    <input
                      type="date"
                      value={formData[insurance]?.renewal_date || ''}
                      onChange={(e) =>
                        handleInsuranceChange(
                          insurance as keyof SubcontractorFormData,
                          'renewal_date',
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Limit of Indemnity{' '}
                      <span className="text-gray-400 text-xs">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData[insurance]?.limit_of_indemnity || ''}
                      onChange={(e) =>
                        handleInsuranceChange(
                          insurance as keyof SubcontractorFormData,
                          'limit_of_indemnity',
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 max-h-[500px] overflow-y-auto">
            <h4 className="text-lg font-medium sticky top-0 bg-white py-2">
              HS
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Has the contractor submitted a SWMS?{' '}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="has_swms"
                      checked={formData.has_swms}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, has_swms: true }))
                      }
                      className="form-radio"
                    />
                    <span className="ml-2">Yes</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="has_swms"
                      checked={!formData.has_swms}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, has_swms: false }))
                      }
                      className="form-radio"
                    />
                    <span className="ml-2">No</span>
                  </label>
                </div>
                {formData.has_swms && (
                  <div className="mt-4">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleFileUpload(e.target.files[0], 'swms')
                      }
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {formData.swms_url && (
                      <a
                        href={formData.swms_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        View SWMS
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Health & Safety Policy?{' '}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="has_health_safety_policy"
                      checked={formData.has_health_safety_policy}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          has_health_safety_policy: true,
                        }))
                      }
                      className="form-radio"
                    />
                    <span className="ml-2">Yes</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="has_health_safety_policy"
                      checked={!formData.has_health_safety_policy}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          has_health_safety_policy: false,
                        }))
                      }
                      className="form-radio"
                    />
                    <span className="ml-2">No</span>
                  </label>
                </div>
                {formData.has_health_safety_policy && (
                  <div className="mt-4">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleFileUpload(e.target.files[0], 'health_safety')
                      }
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {formData.health_safety_policy_url && (
                      <a
                        href={formData.health_safety_policy_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        View Health & Safety Policy
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 max-h-[500px] overflow-y-auto">
            <h4 className="text-lg font-medium sticky top-0 bg-white py-2">
              Upload Documents
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Documents{' '}
                <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    Array.from(e.target.files).forEach((file) =>
                      handleFileUpload(file, 'additional')
                    );
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {formData.additional_files_urls.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.additional_files_urls.map((url, index) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      View Additional File {index + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-white mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Subcontractors</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Subcontractors Management</h2>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Subcontractor
        </button>
      </div>

      {/* Search Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, phone or NI number..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      {/* Reminders Section */}
      {reminders.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Reminders
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {reminders.map((reminder, index) => (
              <div
                key={index}
                className={`p-4 ${
                  reminder.severity === 'danger'
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : 'bg-yellow-50 dark:bg-yellow-900/20'
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {reminder.title}
                    </h4>
                    <p
                      className={`text-sm ${
                        reminder.severity === 'danger'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`}
                    >
                      {reminder.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          Loading...
        </div>
      ) : error ? (
        <div className="text-center text-red-600 dark:text-red-400 py-4">
          {error}
        </div>
      ) : subcontractors.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          No contractors found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                  Name
                </th>
                <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                  Email
                </th>
                <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                  Phone
                </th>
                <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                  Address
                </th>
                <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                  NI Number
                </th>
                <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                  Start Date
                </th>
                <th className="sticky top-0 px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredContractors.map((contractor) => (
                <tr key={contractor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {contractor.company_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {contractor.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {contractor.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {contractor.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {/* Assuming the NI number is not available in the provided data */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {/* Assuming the start date is not available in the provided data */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => handleEdit(contractor)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="Edit Subcontractor"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(contractor.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete Subcontractor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full m-4">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
              Confirm Deletion
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Are you sure you want to delete {selectedContractorId}? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 dark:hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showFormModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full m-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingContractor ? 'Edit' : 'Add'} Sub Contractor
            </h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  name="company_name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  name="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  name="phone"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={handleInputChange}
                  name="address"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Insurance Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.insurance_exp_date}
                  onChange={handleInputChange}
                  name="insurance_exp_date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nature of Business
                </label>
                <input
                  type="text"
                  value={formData.nature_of_business}
                  onChange={handleInputChange}
                  name="nature_of_business"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SWMS
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="swms"
                      checked={formData.swms}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, swms: true }))
                      }
                      className="form-radio"
                    />
                    <span className="ml-2">Yes</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="swms"
                      checked={!formData.swms}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, swms: false }))
                      }
                      className="form-radio"
                    />
                    <span className="ml-2">No</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Health & Safety Policy
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="has_health_safety_policy"
                      checked={formData.has_health_safety_policy}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          has_health_safety_policy: true,
                        }))
                      }
                      className="form-radio"
                    />
                    <span className="ml-2">Yes</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="has_health_safety_policy"
                      checked={!formData.has_health_safety_policy}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          has_health_safety_policy: false,
                        }))
                      }
                      className="form-radio"
                    />
                    <span className="ml-2">No</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowFormModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {editingContractor ? 'Save Changes' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReviewModal && selectedContractorForReview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Review for {selectedContractorForReview.company_name}
              </h3>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSubmitError(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>×
              </button>
            </div>

            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {submitError}
              </div>
            )}

            <div className="space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Date and Text Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    value={reviewFormData.date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Details of your requirements and scope of contract
                  </label>
                  <textarea
                    value={reviewFormData.requirements_scope}
                    onChange={(e) => handleRequirementsChange(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    What was the agreed timeframe for completion of the project?
                  </label>
                  <input
                    type="text"
                    value={reviewFormData.agreed_timeframe}
                    onChange={(e) =>
                      handleReviewChange('agreed_timeframe', e.target.value)
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    What was the total time taken to complete the project?
                  </label>
                  <input
                    type="text"
                    value={reviewFormData.total_time_taken}
                    onChange={(e) =>
                      handleReviewChange('total_time_taken', e.target.value)
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>

              {/* Satisfaction Ratings Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Criteria
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                        Totally dissatisfied
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                        Mostly dissatisfied
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                        Neither
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                        Mostly satisfied
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                        Totally satisfied
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[
                      {
                        key: 'quality_rating',
                        label: 'Overall quality of delivered project',
                      },
                      {
                        key: 'timeliness_rating',
                        label: 'Timeliness of project delivery',
                      },
                      {
                        key: 'communication_rating',
                        label: 'Communication throughout the project',
                      },
                      {
                        key: 'understanding_rating',
                        label: 'Contractors understanding of your needs',
                      },
                      {
                        key: 'cooperativeness_rating',
                        label:
                          'Cooperativeness of the Contractor in dealing with any issues or complaints',
                      },
                      {
                        key: 'overall_satisfaction_rating',
                        label: 'Overall satisfaction with the contractor',
                      },
                    ].map(({ key, label }) => (
                      <tr key={key}>
                        <td className="px-4 py-2 text-sm">{label}</td>
                        {[
                          'totally_dissatisfied',
                          'mostly_dissatisfied',
                          'neither',
                          'mostly_satisfied',
                          'totally_satisfied',
                        ].map((rating) => (
                          <td key={rating} className="px-4 py-2 text-center">
                            <button
                              onClick={() =>
                                handleSatisfactionChange(
                                  key as keyof ReviewFormData,
                                  rating
                                )
                              }
                              className={`
                                px-3 py-1 rounded-full text-xs font-medium transition-colors
                                ${
                                  reviewFormData[key as keyof ReviewFormData]
                                    .rating === rating
                                    ? rating.includes('dissatisfied')
                                      ? 'bg-red-100 text-red-800 border-2 border-red-500'
                                      : rating === 'neither'
                                      ? 'bg-gray-100 text-gray-800 border-2 border-gray-500'
                                      : 'bg-green-100 text-green-800 border-2 border-green-500'
                                    : 'bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-gray-400'
                                }
                            `}
                            >
                              •
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Safety and Compliance Checklist */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">
                  Safety and Compliance Checklist
                </h4>
                {[
                  {
                    key: 'authority_to_work',
                    label:
                      'Is an authority to work document in place and on the job?',
                  },
                  {
                    key: 'relevant_permits',
                    label: 'Are relevant permits in place?',
                  },
                  {
                    key: 'risk_assessments',
                    label:
                      'Are necessary risk assessments available and on the job?',
                  },
                  {
                    key: 'documents_legible',
                    label:
                      'Are the authority to work, associated documents legible?',
                  },
                  {
                    key: 'time_limit_clear',
                    label:
                      'Is the operational time limit of the authority to work and permits clear?',
                  },
                  {
                    key: 'control_measures',
                    label:
                      "Are control measures in place as stated within the RAM's?",
                  },
                  {
                    key: 'work_in_line',
                    label:
                      'Is the work carried out in line with the authority to work?',
                  },
                  {
                    key: 'right_people',
                    label: 'Are the right people carrying out the task?',
                  },
                  {
                    key: 'emergency_knowledge',
                    label:
                      'Do people know what to do in the event of emergency? (ASK)',
                  },
                  {
                    key: 'ppe_condition',
                    label:
                      'Is the personal protective equipment (PPE) in use and in good order',
                  },
                  {
                    key: 'tools_condition',
                    label:
                      'Are tools and equipment suitable and in good condition?',
                  },
                  {
                    key: 'housekeeping_standards',
                    label: 'Are housekeeping standards satisfactory?',
                  },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-4">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() =>
                          handleReviewChange(key as keyof ReviewFormData, true)
                        }
                        className={`
                          px-4 py-2 rounded-md text-sm font-medium transition-colors
                          ${
                            reviewFormData[key as keyof ReviewFormData] === true
                              ? 'bg-green-100 text-green-800 border-2 border-green-500'
                              : 'bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-green-300'
                          }
                        `}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() =>
                          handleReviewChange(key as keyof ReviewFormData, false)
                        }
                        className={`
                          px-4 py-2 rounded-md text-sm font-medium transition-colors
                          ${
                            reviewFormData[key as keyof ReviewFormData] ===
                            false
                              ? 'bg-red-100 text-red-800 border-2 border-red-500'
                              : 'bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-red-300'
                          }
                        `}
                      >
                        No
                      </button>
                    </div>
                    <span className="text-sm text-gray-700">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSubmitError(null);
                }}
                className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={submittingReview}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
              >
                {submittingReview ? 'Saving...' : 'Save Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
