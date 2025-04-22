import React, { useState, useEffect, useRef } from 'react';
import { X, Save, AlertCircle, Trash2, ChevronUp, Pencil } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { HSPolicySections } from './HSPolicy/sections';
import { POLICY_TEMPLATES } from './HSPolicy/templates';
import { GENERAL_POLICY_STATEMENT_SECTIONS } from './HSPolicy/sections/GeneralPolicyStatement';
import { ORGANISATION_SECTIONS } from './HSPolicy/sections/Organisation';
import { GENERAL_POLICIES_SECTIONS } from './HSPolicy/sections/arrangements/GeneralPolicies';
import { OFFICE_ARRANGEMENTS_SECTIONS } from './HSPolicy/sections/arrangements/OfficeArrangements';
import { GENERAL_WORK_SECTIONS } from './HSPolicy/sections/arrangements/WorkplaceArrangements/GeneralWorkArrangements';
import { ASBESTOS_SECTIONS } from './HSPolicy/sections/arrangements/WorkplaceArrangements/AsbestosArrangements';
import { HEALTH_SAFETY_SECTIONS } from './HSPolicy/sections/arrangements/WorkplaceArrangements/HealthSafetyArrangements';
import { HEIGHT_WORK_SECTIONS } from './HSPolicy/sections/arrangements/WorkplaceArrangements/HeightWorkArrangements';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import type { PolicySection, PolicyContent } from '../types/policy';

interface HSPolicyEditorProps {
  onClose: () => void;
}

export function HSPolicyEditor({ onClose }: HSPolicyEditorProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [policyContent, setPolicyContent] = useState<PolicyContent>({ 
    sections: [],
    sectionOrder: []
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [policyToEdit, setPolicyToEdit] = useState<any>(null);
  const [editableSections, setEditableSections] = useState<Set<string>>(new Set());
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const editorsRef = useRef<{ [key: string]: ReactQuill | null }>({});

  useEffect(() => {
    fetchPolicyContent();
  }, []);

  const registerEditor = React.useCallback((sectionId: string, editor: ReactQuill | null) => {
    editorsRef.current[sectionId] = editor;
  }, []);

  const getEditorContent = (sectionId: string): string => {
    const editor = editorsRef.current[sectionId];
    if (editor) {
      return editor.getEditor().root.innerHTML;
    }
    return '';
  };

  const getAllSectionTitles = () => {
    return [
      ...GENERAL_POLICY_STATEMENT_SECTIONS.sections,
      ...ORGANISATION_SECTIONS.sections,
      ...GENERAL_POLICIES_SECTIONS.sections,
      ...OFFICE_ARRANGEMENTS_SECTIONS.sections,
      ...GENERAL_WORK_SECTIONS.sections,
      ...ASBESTOS_SECTIONS.sections,
      ...HEALTH_SAFETY_SECTIONS.sections,
      ...HEIGHT_WORK_SECTIONS.sections
    ];
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    setError(null);

    try {
      // Get the latest content from all editors
      const updatedSections = policyContent.sections.map(section => {
        return {
          ...section,
          content: getEditorContent(section.id) || section.content
        };
      });

      const updatedPolicyContent = {
        sections: updatedSections,
        sectionOrder: getAllSectionTitles()
      };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (updatedSections.length === 0) {
        throw new Error('No sections to save');
      }

      let error;
      if (policyToEdit) {
        // Update existing policy
        ({ error } = await supabase
          .from('hs_policy_files')
          .update({
            content: JSON.stringify(updatedPolicyContent),
            type: 'created'
          })
          .eq('id', policyToEdit.id));
      } else {
        // Create new policy
        const fileName = `policy-${Date.now()}.pdf`;
        const displayName = 'Health & Safety Policy';
        ({ error } = await supabase
          .from('hs_policy_files')
          .insert({
            file_name: fileName,
            display_name: displayName,
            content: JSON.stringify(updatedPolicyContent),
            type: 'created',
            user_id: user.id
          }));
      }

      if (error) throw error;

      // Update local state with saved content
      setPolicyContent(updatedPolicyContent);
      // Clear all editable sections after successful save
      setEditableSections(new Set());
      // Close the modal after successful save
      onClose();
    } catch (err) {
      console.error('Error saving all sections:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving all sections');
    } finally {
      setSavingAll(false);
    }
  };

  const fetchPolicyContent = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get the policy ID from the URL if it exists
      const urlParams = new URLSearchParams(window.location.search);
      const policyId = urlParams.get('id');

      if (policyId) {
        const { data: policy, error } = await supabase
          .from('hs_policy_files')
          .select('*, policy_number')
          .eq('id', policyId)
          .single();

        if (error) throw error;
        if (policy) {
          setPolicyToEdit(policy);
          const content = JSON.parse(policy.content);
          setPolicyContent({
            ...content,
            sectionOrder: content.sections.map((s: any) => s.title)
          });
        }
      }
    } catch (err) {
      console.error('Error fetching policy content:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching policy content');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = (sectionId: string) => {
    setPolicyContent(prev => {
      return {
        sections: prev.sections.filter(s => s.id !== sectionId),
      };
    });
  };

  const handleSectionSelect = (section: string) => {
    setSelectedSection(section);
    
    const existingSection = policyContent.sections.find(s => s.title === section);
    
    if (!existingSection) {
      // Get all section titles from the left menu
      const allSections = getAllSectionTitles();

      // Find the index of the current section in the full list
      const sectionIndex = allSections.indexOf(section);

      const newSection = {
        id: crypto.randomUUID(),
        title: section,
        content: POLICY_TEMPLATES[section] || '',
        order: sectionIndex
      };

      setPolicyContent(prev => ({
        ...prev,
        sections: [...prev.sections, newSection],
        sectionOrder: allSections
      }));
      // Make new section editable by default
      setEditableSections(prev => new Set([...prev, newSection.id]));
    } else {
      // Scroll to existing section
      const sectionElement = document.getElementById(`section-${existingSection.id}`);
      if (sectionElement && editorRef) {
        editorRef.current?.scrollTo({
          top: sectionElement.offsetTop - 20,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleContentChange = (content: string) => {
    if (!selectedSection) return;

    const sectionIndex = policyContent.sections.findIndex(s => s.title === selectedSection);
    if (sectionIndex === -1) return;

    console.log('Updating section content:', content);

    setPolicyContent(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.title === selectedSection
          ? { ...section, content }
          : section
      )
    }));
  };

  const makeEditable = (sectionId: string) => {
    setEditableSections(prev => new Set([...prev, sectionId]));
  };

  const handleSaveSection = async (sectionId: string) => {
    setSavingSection(sectionId);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Ensure the section exists in the state
      const section = policyContent.sections.find(s => s.id === sectionId);
      if (!section) throw new Error('Section not found');

      console.log('Section being saved:', section);

      if (policyToEdit) {
        console.log('Updating existing policy:', policyToEdit.id);

        // Save the entire policyContent state
        const { error } = await supabase
          .from('hs_policy_files')
          .update({
            content: JSON.stringify(policyContent),
            type: 'created'
          })
          .eq('id', policyToEdit.id);

        if (error) throw error;
        console.log('Policy updated successfully');
      } else {
        // Create new policy
        const fileName = `policy-${Date.now()}.pdf`;
        const displayName = 'Health & Safety Policy';
        console.log('Creating new policy');

        const { error } = await supabase
          .from('hs_policy_files')
          .insert({
            file_name: fileName,
            display_name: displayName,
            content: JSON.stringify(policyContent),
            type: 'created',
            user_id: user.id
          });

        if (error) throw error;
        console.log('New policy created successfully');
      }

      // Remove section from editable state AFTER successful save
      setEditableSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(sectionId);
        return newSet;
      });
      console.log('Section removed from editable state');
    } catch (err) {
      console.error('Error saving section:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the section');
    } finally {
      setSavingSection(null);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean']
    ]
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-4xl w-full m-4">
        <div className="flex justify-between items-center mb-6 gap-4">
          <div className="flex-1">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{policyToEdit ? 'Edit Policy' : 'Create New Policy'}</h2>
              {policyToEdit && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  HSPOL-{String(policyToEdit.policy_number).padStart(2, '0')}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleSaveAll}
              disabled={savingAll || policyContent.sections.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Save className="h-4 w-4 mr-2" />
              {savingAll ? 'Saving...' : 'Save All'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-red-600 dark:hover:text-white"
            >

              Cancel
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:space-x-6 h-[calc(100vh-12rem)]">
          {/* Left Column - Structure */}
          <div className="w-full lg:w-1/3 max-h-[200px] lg:max-h-none overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 pb-6 lg:pb-0 lg:pr-6 mb-6 lg:mb-0">
            <HSPolicySections 
              onSectionSelect={handleSectionSelect} 
              selectedSection={selectedSection} 
              policyContent={policyContent}
            />
          </div>
          {/* Right Column - Content */}
          <div 
            className="w-full lg:w-2/3 overflow-y-auto"
            ref={editorRef}
          >
            <div className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              {policyContent.sections.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">Select a section from the left to begin editing</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {policyContent.sections
                    .sort((a, b) => {
                      const allSections = getAllSectionTitles();
                      const aIndex = allSections.indexOf(a.title);
                      const bIndex = allSections.indexOf(b.title);
                      return aIndex - bIndex;
                    })
                    .map(section => (
                      <div 
                        key={section.id}
                        id={`section-${section.id}`}
                        className="space-y-4"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {section.title}
                          </h3>
                          <div className="flex items-center">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDeleteSection(section.id)}
                                className="inline-flex items-center px-2 py-1 border border-transparent text-sm font-medium rounded-md text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 focus:outline-none"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="dark:border-gray-600 rounded-md">
                          <ReactQuill
                            theme="snow"
                            value={section.content || ''}
                            ref={el => registerEditor(section.id, el)}
                            onChange={(content) => handleContentChange(content)}
                            modules={modules}
                            className="h-64 dark:text-white"
                          />
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Floating scroll to top button */}
        {editorRef.current && editorRef.current.scrollTop > 200 && (
          <button
            onClick={() => editorRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 p-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ChevronUp className="h-6 w-6" />
          </button>
        )}

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
      </div>
    </div>
  );
}