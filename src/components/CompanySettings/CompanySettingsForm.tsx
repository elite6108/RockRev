import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Upload, Loader2, AlertCircle } from 'lucide-react';
import type { CompanySettings } from '../../types/database';

interface CompanySettingsFormProps {
  onClose: () => void;
}

export function CompanySettingsForm({ onClose }: CompanySettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<Partial<CompanySettings>>({
    name: '',
    address_line1: '',
    address_line2: '',
    town: '',
    county: '',
    post_code: '',
    email: '',
    phone: '',
    logo_url: null,
    vat_number: '',
    company_number: '',
    prefix: ''
  });

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setFormData(data);
      }
    } catch (err) {
      console.error('Error fetching company settings:', err);
      setError('Failed to load company settings. Please try refreshing the page.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setError(null);

    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          'Invalid file type. Please upload a JPG, PNG, or GIF image.'
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error(
          'File is too large. Maximum size allowed is 5MB.'
        );
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to upload a logo.');
      }

      // Delete existing logo if there is one
      if (formData.logo_url) {
        const existingPath = formData.logo_url.split('/').pop();
        if (existingPath) {
          const { error: deleteError } = await supabase.storage
            .from('company-logos')
            .remove([existingPath]);

          if (deleteError) {
            console.error('Error deleting existing logo:', deleteError);
            // Continue with upload even if delete fails
          }
        }
      }

      // Upload new logo with a generic name
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const fileName = `company-logo-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        if (uploadError.message.includes('duplicate')) {
          throw new Error('A file with this name already exists. Please try again.');
        } else if (uploadError.message.includes('permission')) {
          throw new Error('You do not have permission to upload files.');
        } else {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
      }

      if (!data) {
        throw new Error('Upload failed: No data received from server.');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      setFormData(prev => ({
        ...prev,
        logo_url: publicUrl
      }));
    } catch (err) {
      console.error('Logo upload error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while uploading the logo.');
    } finally {
      setUploadingLogo(false);
      // Reset the file input
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to save company settings.');
      }

      // Check if company settings already exist
      const { data: existingSettings, error: queryError } = await supabase
        .from('company_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (queryError) throw queryError;

      let error;
      if (existingSettings?.id) {
        // Update existing settings
        ({ error } = await supabase
          .from('company_settings')
          .update({
            ...formData,
            user_id: user.id
          })
          .eq('id', existingSettings.id));
      } else {
        // Create new settings
        ({ error } = await supabase
          .from('company_settings')
          .insert([{
            ...formData,
            user_id: user.id
          }]));
      }

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Save settings error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while saving settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl p-8 w-full m-4 max-w-2xl sm:max-h-[600px] max-h-[450px] overflow-y-auto sm:w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Company Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload Section */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Logo
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
              {formData.logo_url && (
                <div className="flex-shrink-0 h-24 w-24 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={formData.logo_url}
                    alt="Company logo"
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/150?text=Logo';
                    }}
                  />
                </div>
              )}
              <div className="flex-1">
                <label
                  htmlFor="logo-upload"
                  className={`
                    relative cursor-pointer bg-white rounded-md font-medium 
                    text-indigo-600 hover:text-indigo-500 focus-within:outline-none 
                    focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500
                    ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm rounded-md hover:bg-gray-50">
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 mr-2" />
                        {formData.logo_url ? 'Change Logo' : 'Upload Logo'}
                      </>
                    )}
                  </div>
                  <input
                    id="logo-upload"
                    name="logo"
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    disabled={uploadingLogo}
                    onChange={handleLogoUpload}
                    className="sr-only"
                  />
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Accepted formats: JPG, PNG, GIF (max 5MB)
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="w-full">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="w-full">
              <label htmlFor="prefix" className="block text-sm font-medium text-gray-700 mb-2">
                Prefix
              </label>
              <input
                type="text"
                id="prefix"
                name="prefix"
                required
                value={formData.prefix || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="settings-prefix"
              />
              <p className="mt-1 text-xs text-gray-500">
                This prefix will be used as a reference in other areas of the application
              </p>
            </div>

            <div className="w-full">
              <label htmlFor="vat_number" className="block text-sm font-medium text-gray-700 mb-2">
                VAT Number
              </label>
              <input
                type="text"
                id="vat_number"
                name="vat_number"
                value={formData.vat_number || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="GB123456789"
              />
            </div>

            <div className="w-full">
              <label htmlFor="company_number" className="block text-sm font-medium text-gray-700 mb-2">
                Company Number
              </label>
              <input
                type="text"
                id="company_number"
                name="company_number"
                value={formData.company_number || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="12345678"
              />
            </div>

            <div className="w-full">
              <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 1
              </label>
              <input
                type="text"
                id="address_line1"
                name="address_line1"
                required
                value={formData.address_line1 || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="w-full">
              <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                id="address_line2"
                name="address_line2"
                value={formData.address_line2 || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="w-full">
              <label htmlFor="town" className="block text-sm font-medium text-gray-700 mb-2">
                Town
              </label>
              <input
                type="text"
                id="town"
                name="town"
                required
                value={formData.town || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="w-full">
              <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-2">
                County
              </label>
              <input
                type="text"
                id="county"
                name="county"
                required
                value={formData.county || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="w-full">
              <label htmlFor="post_code" className="block text-sm font-medium text-gray-700 mb-2">
                Post Code
              </label>
              <input
                type="text"
                id="post_code"
                name="post_code"
                required
                value={formData.post_code || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="w-full">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="w-full">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-4 rounded-md">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600 bg-green-50 p-4 rounded-md">
              Company settings updated successfully!
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-red-600 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingLogo}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}