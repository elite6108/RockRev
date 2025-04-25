import React, { useState, useRef, useEffect } from 'react';
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase } from '../../../lib/supabase';
import jsPDF from 'jspdf';

interface CreatePolicyModalProps {
  onClose: () => void;
  onSuccess: () => void;
  policyToEdit?: {
    id: string;
    name: string;
    content: string;
  } | null;
}

export function CreatePolicyModal({ onClose, onSuccess, policyToEdit }: CreatePolicyModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: policyToEdit?.name || '',
    content: policyToEdit?.content || ''
  });
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    if (policyToEdit) {
      setFormData({
        name: policyToEdit.name,
        content: policyToEdit.content
      });
    }
  }, [policyToEdit]);

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'font': [] }],
        [{ 'align': [] }],
        ['link'],
        ['clean']
      ]
    },
    clipboard: {
      matchVisual: false
    }
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'color', 'background',
    'font',
    'align',
    'link'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (!formData.name.trim()) {
        throw new Error('Policy name is required');
      }
      if (!formData.content.trim()) {
        throw new Error('Policy content is required');
      }

      let error;
      if (policyToEdit) {
        // Update existing policy
        ({ error } = await supabase
          .from('other_policy_files')
          .update({
            display_name: formData.name,
            content: formData.content,
            type: 'created'
          })
          .eq('id', policyToEdit.id));
      } else {
        // Generate filename for new policy
        const fileName = `${formData.name.replace(/[^a-zA-Z0-9-_]/g, '-')}-${Date.now()}.pdf`;

        // Create new policy
        ({ error } = await supabase
          .from('other_policy_files')
          .insert({
            file_name: fileName,
            display_name: formData.name,
            content: formData.content,
            type: 'created',
            user_id: user.id
          }));
      }

      if (error) {
        throw error;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving policy:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{policyToEdit ? 'Edit Policy' : 'Create New Policy'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Policy Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter policy name"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Policy Content
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-md shadow-sm">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                modules={modules}
                formats={formats}
                className="h-96 dark:text-white"
                preserveWhitespace
              />
            </div>
          </div>

          {/* Add custom dark mode styles for Quill */}
          <style jsx global>{`
            .dark .ql-toolbar {
              background-color: rgb(31, 41, 55) !important;
              border-color: rgb(75, 85, 99) !important;
            }
            
            .dark .ql-container {
              background-color: rgb(17, 24, 39) !important;
              border-color: rgb(75, 85, 99) !important;
              color: white !important;
            }

            .dark .ql-stroke {
              stroke: rgb(209, 213, 219) !important;
            }

            .dark .ql-fill {
              fill: rgb(209, 213, 219) !important;
            }

            .dark .ql-picker {
              color: rgb(209, 213, 219) !important;
            }

            .dark .ql-picker-options {
              background-color: rgb(31, 41, 55) !important;
              border-color: rgb(75, 85, 99) !important;
            }

            .dark .ql-picker.ql-expanded .ql-picker-label {
              border-color: rgb(75, 85, 99) !important;
            }

            .dark .ql-picker.ql-expanded .ql-picker-options {
              border-color: rgb(75, 85, 99) !important;
            }

            .dark .ql-toolbar button:hover .ql-stroke,
            .dark .ql-toolbar button.ql-active .ql-stroke {
              stroke: rgb(99, 102, 241) !important;
            }

            .dark .ql-toolbar button:hover .ql-fill,
            .dark .ql-toolbar button.ql-active .ql-fill {
              fill: rgb(99, 102, 241) !important;
            }

            .dark .ql-toolbar .ql-picker-label:hover,
            .dark .ql-toolbar .ql-picker-item:hover,
            .dark .ql-toolbar .ql-picker-item.ql-selected {
              color: rgb(99, 102, 241) !important;
            }
          `}</style>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-4 rounded-md">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-red-600 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {policyToEdit ? 'Update Policy' : 'Save Policy'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}