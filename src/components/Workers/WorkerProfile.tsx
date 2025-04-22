import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import {
  User,
  Calendar,
  Phone,
  Mail,
  Camera,
  XCircle,
  Upload,
  Save,
  X,
  Lock,
} from 'lucide-react';

interface WorkerProfileProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export function WorkerProfile({
  isOpen,
  onClose,
  userEmail,
}: WorkerProfileProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    dob: '',
    national_insurance: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    photo_url: '',
  });

  // Password update state
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && userEmail) {
      fetchWorkerProfile(userEmail);
    }
  }, [isOpen, userEmail]);

  const fetchWorkerProfile = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      // Get the authenticated user first to ensure we have the metadata
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      // Get the worker details
      const { data: workerData, error: workerError } = await supabase
        .from('workers')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (workerError) throw workerError;

      if (workerData) {
        // Set form data from worker data, but prioritize the auth user full_name if available
        setFormData({
          full_name:
            authUser?.user_metadata?.full_name || workerData.full_name || '',
          email: workerData.email || email,
          phone: workerData.phone || '',
          dob: workerData.dob || '',
          national_insurance: workerData.national_insurance || '',
          emergency_contact_name: workerData.emergency_contact_name || '',
          emergency_contact_phone: workerData.emergency_contact_phone || '',
          photo_url: workerData.photo_url || '',
        });

        // Set image preview if photo exists
        if (workerData.photo_url) {
          setImagePreview(workerData.photo_url);
        }
      } else {
        // If no worker record, prioritize getting data from auth user
        if (authUser) {
          setFormData({
            ...formData,
            full_name: authUser.user_metadata?.full_name || '',
            email: authUser.email || email,
            phone: authUser.user_metadata?.phone || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching worker profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview of the selected image
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImagePreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Upload image to storage
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${formData.email.replace(
        '@',
        '_at_'
      )}_${Date.now()}.${fileExt}`;
      const filePath = `worker_photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('worker_photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL for the uploaded image
      const { data } = supabase.storage
        .from('worker_photos')
        .getPublicUrl(filePath);

      // Update form data with the new photo URL
      setFormData((prev) => ({ ...prev, photo_url: data.publicUrl }));
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setLoading(true);
    setError(null);

    try {
      // Extract filename from the photo URL
      const photoUrl = formData.photo_url;
      if (!photoUrl) return;

      const fileName = photoUrl.substring(photoUrl.lastIndexOf('/') + 1);

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('worker_photos')
        .remove([`worker_photos/${fileName}`]);

      if (deleteError) throw deleteError;

      // Update form data
      setFormData((prev) => ({ ...prev, photo_url: '' }));
      setImagePreview(null);
    } catch (error) {
      console.error('Error removing photo:', error);
      setError('Failed to remove photo');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    setUpdatingPassword(true);

    try {
      // Validate passwords
      if (passwordData.password.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        setUpdatingPassword(false);
        return;
      }

      if (passwordData.password !== passwordData.confirmPassword) {
        setPasswordError('Passwords do not match');
        setUpdatingPassword(false);
        return;
      }

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.password,
      });

      if (error) throw error;

      // Clear password fields and show success message
      setPasswordData({
        password: '',
        confirmPassword: '',
      });

      setPasswordSuccess(true);
      setTimeout(() => {
        setPasswordSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordError('Failed to update password. Please try again.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      // Check if worker record exists with this email
      const { data: existingWorker, error: checkError } = await supabase
        .from('workers')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle();

      let result;

      if (existingWorker) {
        // Update existing worker
        result = await supabase
          .from('workers')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            dob: formData.dob,
            national_insurance: formData.national_insurance,
            emergency_contact_name: formData.emergency_contact_name,
            emergency_contact_phone: formData.emergency_contact_phone,
            photo_url: formData.photo_url,
          })
          .eq('email', formData.email);
      } else {
        // Insert new worker record
        result = await supabase.from('workers').insert([
          {
            email: formData.email,
            full_name: formData.full_name,
            phone: formData.phone,
            dob: formData.dob,
            national_insurance: formData.national_insurance,
            emergency_contact_name: formData.emergency_contact_name,
            emergency_contact_phone: formData.emergency_contact_phone,
            photo_url: formData.photo_url,
          },
        ]);
      }

      if (result.error) throw result.error;

      // Also update user_metadata in auth.users if possible
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
          },
        });
      } catch (metadataError) {
        console.error('Error updating user metadata:', metadataError);
        // Don't throw, proceed even if metadata update fails
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving worker profile:', error);
      setError('Failed to save profile data');
    } finally {
      setSaving(false);
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
              <User className="h-5 w-5 mr-2" />
              Worker Profile
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
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
              </div>
            ) : (
              <>
                <form onSubmit={handleSave} className="space-y-4">
                  {/* Photo Upload Section */}
                  <div className="flex flex-col items-center mb-4">
                    <div className="relative">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Worker"
                            className="w-24 h-24 rounded-full object-cover border-2 border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <User className="h-12 w-12 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex space-x-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </button>
                      {/* Note: Taking a photo requires device camera access */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()} // Same action as upload for now
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <Camera className="h-4 w-4 mr-1" />
                        Take Photo
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
                      Profile saved successfully!
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Mail className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-gray-100 dark:bg-gray-600"
                          required
                          readOnly
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Phone className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date of Birth *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Calendar className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          name="dob"
                          value={formData.dob}
                          onChange={handleChange}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        National Insurance (Optional)
                      </label>
                      <input
                        type="text"
                        name="national_insurance"
                        value={formData.national_insurance}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Emergency Contact Name *
                      </label>
                      <input
                        type="text"
                        name="emergency_contact_name"
                        value={formData.emergency_contact_name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Emergency Contact Phone *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Phone className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          name="emergency_contact_phone"
                          value={formData.emergency_contact_phone}
                          onChange={handleChange}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </form>

                {/* Password Update Section */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center mb-4">
                    <Lock className="h-5 w-5 mr-2" />
                    Update Password
                  </h4>

                  {passwordError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4">
                      Password updated successfully!
                    </div>
                  )}

                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          name="password"
                          value={passwordData.password}
                          onChange={handlePasswordChange}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          required
                          minLength={6}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Must be at least 6 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={updatingPassword}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {updatingPassword ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Update Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-amber-500 border border-transparent rounded-md hover:bg-amber-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
