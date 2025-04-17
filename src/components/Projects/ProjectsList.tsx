import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, AlertTriangle, ArrowRight, Edit } from 'lucide-react';
import { ProjectForm } from './ProjectForm';
import { PurchaseOrdersList } from '../PurchaseOrders/PurchaseOrdersList';
import type { Project, PurchaseOrder } from '../../types/database';

interface ProjectsListProps {
  projects: Project[];
  onProjectChange: () => void;
  onBack: () => void;
}

export function ProjectsList({
  projects,
  onProjectChange,
  onBack,
}: ProjectsListProps) {
  const navigate = useNavigate();
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectOrders, setProjectOrders] = useState<PurchaseOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const handleDeleteProject = async (projectId: string) => {
    setProjectToDelete(projectId);
    setShowDeleteModal(true);
  };

  const handleEditProject = (project: Project) => {
    setProjectToEdit(project);
    setShowProjectModal(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete);

      if (error) throw error;
      onProjectChange();
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while deleting the project'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    // Navigate to the project-specific URL
    navigate(`/project/${project.id}`);
  };

  if (selectedProject) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Project Details: {selectedProject.name}
        </h2>

        {/* Purchase Orders Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Purchase Orders
          </h3>
          {loadingOrders ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <PurchaseOrdersList
              orders={projectOrders}
              onOrderChange={() => handleProjectClick(selectedProject)}
              onBack={() => setSelectedProject(null)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
      >
        <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
        Back to Dashboard
      </button>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Projects
            </h2>
            <button
              onClick={() => {
                setProjectToEdit(null);
                setShowProjectModal(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">
                No projects yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-opacity-10 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6"
                        >
                          Project Name
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                        >
                          Created
                        </th>
                        <th
                          scope="col"
                          className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                        >
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                      {projects.map((project) => (
                        <tr
                          key={project.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-200 sm:pl-6">
                            <button
                              onClick={() => handleProjectClick(project)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-yellow-400 dark:hover:text-yellow-300 hover:underline focus:outline-none"
                            >
                              {project.name}
                            </button>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {new Date(project.created_at).toLocaleDateString()}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end space-x-4">
                              <button
                                onClick={() => handleEditProject(project)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-white dark:hover:text-gray-300 inline-flex items-center"
                              >
                                <Edit className="h-4 w-4 mr-1 text-indigo-600 dark:text-white" />
                                <span className="dark:text-white">Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteProject(project.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 inline-flex items-center"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                <span className="dark:text-red-400">
                                  Delete
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {showProjectModal && (
          <ProjectForm
            onClose={() => {
              setShowProjectModal(false);
              setProjectToEdit(null);
            }}
            onSuccess={() => {
              onProjectChange();
              setShowProjectModal(false);
              setProjectToEdit(null);
            }}
            projectToEdit={projectToEdit}
          />
        )}

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
                Are you sure you want to delete this project? This action cannot
                be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProjectToDelete(null);
                  }}
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
      </div>
    </>
  );
}
