import React, { useState, useRef, useEffect } from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import { ArrowRight, Download, Plus, Trash2, User, Edit2, Check, X, Users, Link, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Employee {
  id: string;
  name: string;
  title: string;
  children: Employee[];
  reportsTo: string[];
  user_id: string;
}

interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HSOrganisationChartProps {
  onBack: () => void;
}

export function HSOrganisationChart({ onBack }: HSOrganisationChartProps) {
  const [orgData, setOrgData] = useState<Employee>({
    id: crypto.randomUUID(),
    name: '',  // Empty name since this is just a container
    title: '', // Empty title since this is just a container
    children: [],
    reportsTo: [],
    user_id: '',
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [memberType, setMemberType] = useState<'Director' | 'Employee'>('Employee');
  const [directorNames, setDirectorNames] = useState(['', '', '']);
  const [directorPositions, setDirectorPositions] = useState(['', '', '']);
  const [employeeName, setEmployeeName] = useState('');
  const [employeePosition, setEmployeePosition] = useState('');
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newPosition, setNewPosition] = useState('Employee');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [linkingMode, setLinkingMode] = useState(false);
  const [linkingFromId, setLinkingFromId] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Map<string, Position>>(new Map());
  const [secondaryLines, setSecondaryLines] = useState<JSX.Element[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<string, { name: string; title: string }>>(new Map());
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const renderNode = (employee: Employee) => {
    const selectedEmployee = selectedId ? findEmployee(selectedId, orgData) : null;
    const isParentSelected = selectedEmployee?.children.some(child => child.id === employee.id);
    const isLinkTarget = linkingMode && linkingFromId && linkingFromId !== employee.id;
    const isDirector = !employee.reportsTo.length && employee.id !== orgData.id;
    const isManager = employee.title.toLowerCase().includes('manager');

    const renderEmployeeContent = (emp: Employee) => {
      const names = emp.name.split(' / ');
      const positions = emp.title.split(' / ');
      const isMultipleDirectors = isDirector && names.length > 1;

      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {emp.children.length > 0 ? (
              <Users className="w-5 h-5 text-blue-400 dark:text-blue-300" />
            ) : (
              <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            )}
            <div className="flex-1">
              {isMultipleDirectors ? (
                <>
                  <div className="font-semibold text-gray-800 dark:text-gray-100">
                    {names.map((name, idx) => (
                      <div key={idx} className="flex items-center">
                        {name}
                        <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">
                          {positions[idx]}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{emp.name}</p>
                  <p className={`text-sm ${
                    isDirector 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : isManager 
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400'
                  }`}>{emp.title}</p>
                </>
              )}
              {emp.reportsTo.length > 1 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Reports to:{' '}
                  {emp.reportsTo.map((managerId, index) => {
                    const manager = findEmployee(managerId, orgData);
                    if (!manager) return null;
                    return (
                      <span key={managerId} className="inline-flex items-center">
                        {index > 0 && ', '}
                        {manager.name}
                        {index > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeReportingLine(managerId, emp.id);
                            }}
                            className="ml-1 p-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-full"
                            title="Remove reporting line"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {selectedId === emp.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLinkingMode(true);
                    setLinkingFromId(emp.id);
                  }}
                  className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  title="Add reporting line"
                >
                  <Link className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing(emp);
                }}
                className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );
    };

    // Special handling for root node - make it invisible and render directors horizontally
    if (employee.id === orgData.id) {
      return (
        <TreeNode
          key={employee.id}
          label={<div style={{ display: 'none' }}></div>}
        >
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '4rem', minWidth: '100%' }}>
            {employee.children.map(child => (
              <div key={child.id} style={{ flex: '1', minWidth: 'fit-content', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <TreeNode
                  label={
                    <div 
                      data-employee-id={child.id}
                      className={`p-4 rounded-lg shadow-md transition-all cursor-pointer relative
                        ${selectedId === child.id ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400' : 
                          isParentSelected ? 'bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-500' : 
                          isLinkTarget ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-500' :
                          'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      onClick={() => setSelectedId(child.id)}
                    >
                      {editingId === child.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditChange(child.id, editName, editTitle);
                              }}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(null);
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        renderEmployeeContent(child)
                      )}
                    </div>
                  }
                >
                  {child.children.map(renderNode)}
                </TreeNode>
              </div>
            ))}
          </div>
        </TreeNode>
      );
    }

    return (
      <TreeNode
        key={employee.id}
        label={
          <div 
            data-employee-id={employee.id}
            className={`p-4 rounded-lg shadow-md transition-all cursor-pointer relative
              ${selectedId === employee.id 
                ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400' 
                : isParentSelected 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-500' 
                  : isLinkTarget 
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-500'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            onClick={() => {
              if (linkingMode && linkingFromId) {
                addReportingLine(employee.id, linkingFromId);
              } else {
                setSelectedId(employee.id);
              }
            }}
          >
            {editingId === employee.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2 py-1 border rounded"
                  onClick={(e) => e.stopPropagation()}
                />
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-2 py-1 border rounded"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditChange(employee.id, editName, editTitle);
                    }}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(null);
                    }}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              renderEmployeeContent(employee)
            )}
          </div>
        }
      >
        {employee.children.map(renderNode)}
      </TreeNode>
    );
  };

  useEffect(() => {
    clearAndInitialize();
  }, []);

  const clearAndInitialize = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Delete all existing organization chart entries for this user
      const { error: deleteError } = await supabase
        .from('organization_chart')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Delete all reporting lines
      const { error: deleteReportingError } = await supabase
        .from('reporting_lines')
        .delete()
        .eq('user_id', user.id);

      if (deleteReportingError) throw deleteReportingError;

      // Create new root node
      const { data: newRoot, error: insertError } = await supabase
        .from('organization_chart')
        .insert({
          name: '',
          title: '',
          parent_id: null,
          user_id: user.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Set initial state with empty root
      setOrgData({
        id: newRoot.id,
        name: '',
        title: '',
        children: [],
        reportsTo: [],
        user_id: user.id
      });

    } catch (err) {
      console.error('Error clearing organization chart:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while clearing the organization chart');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgChart = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Fetch organization chart data
      const { data: orgData, error: orgError } = await supabase
        .from('organization_chart')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (orgError) throw orgError;

      // Fetch reporting lines
      const { data: reportingLines, error: reportingError } = await supabase
        .from('reporting_lines')
        .select('*')
        .eq('user_id', user.id);

      if (reportingError) throw reportingError;

      // Build the organization chart structure
      const buildOrgChart = (employees: any[], parentId: string | null = null): Employee[] => {
        return employees
          .filter(emp => emp.parent_id === parentId)
          .map(emp => ({
            ...emp,
            children: buildOrgChart(employees, emp.id),
            reportsTo: reportingLines
              ?.filter(rl => rl.employee_id === emp.id)
              .map(rl => rl.manager_id) || [],
          }));
      };

      const rootNode = orgData?.find(emp => emp.parent_id === null);
      if (rootNode) {
        const rootEmployees = buildOrgChart(orgData || []);
        setOrgData({
          id: rootNode.id,
          name: '',
          title: '',
          children: rootEmployees.filter(emp => emp.id !== rootNode.id),
          reportsTo: [],
          user_id: user.id
        });
      }
    } catch (err) {
      console.error('Error fetching organization chart:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching the organization chart');
    } finally {
      setLoading(false);
    }
  };

  const findEmployee = (id: string, employee: Employee): Employee | null => {
    if (employee.id === id) return employee;
    for (const child of employee.children) {
      const found = findEmployee(id, child);
      if (found) return found;
    }
    return null;
  };

  const getAllEmployees = (employee: Employee): Employee[] => {
    const employees = [employee];
    for (const child of employee.children) {
      employees.push(...getAllEmployees(child));
    }
    return employees;
  };

  const updateNodePositions = () => {
    const newPositions = new Map<string, Position>();
    const nodes = document.querySelectorAll('[data-employee-id]');
    
    nodes.forEach((node) => {
      const id = node.getAttribute('data-employee-id');
      if (id) {
        const rect = node.getBoundingClientRect();
        const chartRect = chartRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
        newPositions.set(id, {
          x: rect.left - chartRect.left + rect.width / 2,
          y: rect.top - chartRect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
        });
      }
    });

    setNodePositions(newPositions);
  };

  useEffect(() => {
    const observer = new MutationObserver(updateNodePositions);
    if (chartRef.current) {
      observer.observe(chartRef.current, { 
        childList: true, 
        subtree: true,
        attributes: true,
      });
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    updateNodePositions();
    drawSecondaryLines();
  }, [orgData]);

  const drawSecondaryLines = () => {
    const lines: JSX.Element[] = [];
    const allEmployees = getAllEmployees(orgData);
    
    allEmployees.forEach(employee => {
      if (!employee.reportsTo) return;
      
      // Get all secondary reporting relationships (skip the first/primary one)
      const secondaryManagers = employee.reportsTo.slice(1);
      
      secondaryManagers.forEach(managerId => {
        const employeePos = nodePositions.get(employee.id);
        const managerPos = nodePositions.get(managerId);
        
        if (employeePos && managerPos) {
          // Calculate line positions
          const startX = employeePos.x;
          const startY = employeePos.y - (employeePos.height / 2); // Top of employee
          const endX = managerPos.x;
          const endY = managerPos.y + (managerPos.height / 2); // Bottom of manager
          
          // Calculate the middle point for the horizontal line
          const midY = (startY + endY) / 2;
          
          lines.push(
            <svg
              key={`${managerId}-${employee.id}`}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1
              }}
            >
              <path
                d={`M ${startX} ${startY} 
                   L ${startX} ${midY} 
                   L ${endX} ${midY} 
                   L ${endX} ${endY}`}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
              />
            </svg>
          );
        }
      });
    });
    
    setSecondaryLines(lines);
  };

  const addEmployee = async (parentId: string, name: string, position: string, isDirector: boolean) => {
    // Validate that both name and position are not empty or just whitespace
    if (!name.trim() || !position.trim()) {
      setStatusMessage({ type: 'error', message: 'Please enter both a name and position' });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setStatusMessage({ type: 'info', message: 'Saving...' });

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // For root level (parentId === orgData.id), set parent_id to null
      const actualParentId = isDirector ? null : parentId;

      console.log('Adding employee:', { name, position, isDirector, parentId: actualParentId });

      // Insert new employee
      const { data: newEmployee, error: insertError } = await supabase
        .from('organization_chart')
        .insert({
          name: name.trim(),
          title: position.trim(),
          parent_id: actualParentId,
          user_id: user.id
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting employee:', insertError);
        throw insertError;
      }

      console.log('Employee added successfully:', newEmployee);

      // Clear the form
      if (isDirector) {
        setDirectorNames(['', '', '']);
        setDirectorPositions(['', '', '']);
      } else {
        setEmployeeName('');
        setEmployeePosition('');
      }

      // Close the modal
      setShowAddModal(false);

      // Refresh the chart data
      await fetchOrgChart();

      setStatusMessage({ type: 'success', message: `${isDirector ? 'Director' : 'Employee'} added successfully` });

    } catch (err) {
      console.error('Error adding employee:', err);
      setStatusMessage({ type: 'error', message: err instanceof Error ? err.message : 'An error occurred while adding the employee' });
    } finally {
      setLoading(false);
    }
  };

  const addReportingLine = async (managerId: string, employeeId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Don't allow linking to root node
      if (managerId === orgData.id) {
        setError('Cannot create reporting line to Board of Directors');
        setLinkingMode(false);
        setLinkingFromId(null);
        return;
      }

      // Check if reporting line already exists
      const { data: existingLines, error: checkError } = await supabase
        .from('reporting_lines')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('manager_id', managerId)
        .eq('user_id', user.id);

      if (checkError) throw checkError;

      // If reporting line already exists, just return
      if (existingLines && existingLines.length > 0) {
        setLinkingMode(false);
        setLinkingFromId(null);
        return;
      }

      // Check if this would create a circular reference
      const findAllReportsTo = (employeeId: string, visited = new Set<string>()): Set<string> => {
        if (visited.has(employeeId)) return visited;
        visited.add(employeeId);
        
        const employee = findEmployee(employeeId, orgData);
        if (!employee) return visited;
        
        employee.reportsTo.forEach(managerId => {
          findAllReportsTo(managerId, visited);
        });
        
        return visited;
      };

      // If the manager reports to the employee (directly or indirectly), it would create a circle
      const managerReportsTo = findAllReportsTo(managerId);
      if (managerReportsTo.has(employeeId)) {
        setError('Cannot create circular reporting relationships');
        setLinkingMode(false);
        setLinkingFromId(null);
        return;
      }

      // Insert reporting line
      const { error: insertError } = await supabase
        .from('reporting_lines')
        .insert({
          employee_id: employeeId,
          manager_id: managerId,
          user_id: user.id
        });

      if (insertError) throw insertError;

      // Refresh chart data instead of page reload
      await fetchOrgChart();
      setLinkingMode(false);
      setLinkingFromId(null);

    } catch (err) {
      console.error('Error adding reporting line:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while adding the reporting line');
    } finally {
      setLoading(false);
    }
  };

  const removeReportingLine = async (managerId: string, employeeId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Delete reporting line
      const { error: deleteError } = await supabase
        .from('reporting_lines')
        .delete()
        .eq('employee_id', employeeId)
        .eq('manager_id', managerId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Update local state
      const updateTree = (employee: Employee): Employee => {
        if (employee.id === employeeId) {
          const newReportsTo = employee.reportsTo.filter(id => id !== managerId);
          const primaryManagerChanged = employee.reportsTo[0] === managerId;
          
          if (primaryManagerChanged && newReportsTo.length > 0) {
            const newPrimaryManager = findEmployee(newReportsTo[0], orgData);
            if (newPrimaryManager) {
              moveEmployeeToManager(employee.id, newPrimaryManager.id);
            }
          }

          return {
            ...employee,
            reportsTo: newReportsTo,
          };
        }

        return {
          ...employee,
          children: employee.children.map(updateTree),
        };
      };

      setOrgData(updateTree(orgData));

      // Refresh chart data instead of page reload
      await fetchOrgChart();

    } catch (err) {
      console.error('Error removing reporting line:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while removing the reporting line');
    } finally {
      setLoading(false);
    }
  };

  const moveEmployeeToManager = async (employeeId: string, newManagerId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Update employee's parent in database
      const { error: updateError } = await supabase
        .from('organization_chart')
        .update({ parent_id: newManagerId })
        .eq('id', employeeId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      let employeeToMove: Employee | null = null;

      const removeFromOldParent = (employee: Employee): Employee => {
        return {
          ...employee,
          children: employee.children
            .filter(child => {
              if (child.id === employeeId) {
                employeeToMove = child;
                return false;
              }
              return true;
            })
            .map(removeFromOldParent),
        };
      };

      const addToNewParent = (employee: Employee): Employee => {
        if (employee.id === newManagerId && employeeToMove) {
          return {
            ...employee,
            children: [...employee.children, employeeToMove],
          };
        }
        return {
          ...employee,
          children: employee.children.map(addToNewParent),
        };
      };

      const updatedOrg = addToNewParent(removeFromOldParent(orgData));
      setOrgData(updatedOrg);
    } catch (err) {
      console.error('Error moving employee:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while moving the employee');
    } finally {
      setLoading(false);
    }
  };

  const removeEmployee = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Check if employee exists and has valid data
      const employee = findEmployee(id, orgData);
      if (!employee) {
        setError('Employee not found');
        return;
      }

      // Check if employee has subordinates
      if (employee.children.length > 0) {
        setError('Please remove all employees under this position before deleting it.');
        return;
      }

      // Get the employee's database record to check if they're a director
      const { data: employeeRecord, error: employeeError } = await supabase
        .from('organization_chart')
        .select('parent_id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (employeeError) throw employeeError;

      // Check if this is a director (has null parent_id) and if it's the last one
      const isDirector = employeeRecord?.parent_id === null;
      
      if (isDirector) {
        const { data: directors, error: directorsError } = await supabase
          .from('organization_chart')
          .select('id')
          .eq('user_id', user.id)
          .is('parent_id', null)
          .neq('id', orgData.id); // Exclude the root node

        if (directorsError) throw directorsError;

        if (directors && directors.length <= 1) {
          setError('Cannot remove the last director. Organizations must have at least one director.');
          return;
        }
      }

      // First, delete all reporting lines where this employee is involved
      const { error: reportingError } = await supabase
        .from('reporting_lines')
        .delete()
        .or(`employee_id.eq.${id},manager_id.eq.${id}`)
        .eq('user_id', user.id);

      if (reportingError) throw reportingError;

      // Then delete the employee from database
      const { error: deleteError } = await supabase
        .from('organization_chart')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Update local state
      const updateTree = (employee: Employee): Employee => {
        return {
          ...employee,
          children: employee.children
            .filter(child => child.id !== id)
            .map(updateTree),
        };
      };

      setOrgData(updateTree(orgData));
      setSelectedId(null);
      
      // Clear any pending changes for this employee
      const newPendingChanges = new Map(pendingChanges);
      newPendingChanges.delete(id);
      setPendingChanges(newPendingChanges);

      // Refresh the chart to ensure all relationships are updated
      await fetchOrgChart();
      
    } catch (err) {
      console.error('Error removing employee:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while removing the employee');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (employee: Employee) => {
    setEditingId(employee.id);
    setEditName(employee.name);
    setEditTitle(employee.title);
  };

  const handleEditChange = (id: string, name: string, title: string) => {
    // Don't proceed if values are empty
    if (!name || !title) return;

    // Update pending changes
    const newPendingChanges = new Map(pendingChanges);
    newPendingChanges.set(id, { name, title });
    setPendingChanges(newPendingChanges);

    // Update local state immediately for instant feedback
    const updateEmployeeInTree = (employee: Employee): Employee => {
      if (employee.id === id) {
        return {
          ...employee,
          name,
          title,
          children: employee.children,
          reportsTo: employee.reportsTo,
          user_id: employee.user_id
        };
      }
      return {
        ...employee,
        children: employee.children.map(updateEmployeeInTree)
      };
    };

    setOrgData(updateEmployeeInTree(orgData));
    setEditingId(null); // Close edit mode after applying changes
  };

  const saveAllChanges = async () => {
    if (pendingChanges.size === 0) return;

    try {
      setLoading(true);
      setError(null);

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Save all pending changes
      for (const [id, changes] of pendingChanges) {
        const { error: updateError } = await supabase
          .from('organization_chart')
          .update({
            name: changes.name,
            title: changes.title,
          })
          .eq('id', id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      }

      // Clear pending changes after successful save
      setPendingChanges(new Map());
      setEditingId(null);
      setEditName('');
      setEditTitle('');

      // Force a redraw of secondary lines
      drawSecondaryLines();
    } catch (err) {
      console.error('Error saving changes:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving changes');
    } finally {
      setLoading(false);
    }
  };

  const reloadChart = async () => {
    try {
      // Clear the current state first
      setOrgData({
        id: crypto.randomUUID(),
        name: '',
        title: '',
        children: [],
        reportsTo: [],
        user_id: '',
      });
      
      // Wait for a tick to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Then fetch new data
      await fetchOrgChart();
    } catch (err) {
      console.error('Error reloading chart:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while reloading the chart');
    }
  };

  const exportToPDF = async () => {
    const chart = document.getElementById('org-chart');
    if (!chart) return;

    try {
      setLoading(true);
      setError(null);

      // Get company settings
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      const { data: companySettings, error: settingsError } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsError) throw settingsError;

      // Temporarily hide edit buttons for PDF export
      const editButtons = chart.querySelectorAll('button');
      editButtons.forEach(button => {
        button.style.display = 'none';
      });

      // Generate chart image
      const canvas = await html2canvas(chart, {
        scale: 2,
        backgroundColor: '#f3f4f6',
      });

      // Restore edit buttons
      editButtons.forEach(button => {
        button.style.display = '';
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width / 2 + 100, canvas.height / 2 + 100], // Add padding to prevent cutoff
      });

      // Add company logo if exists
      if (companySettings?.logo_url) {
        try {
          const response = await fetch(companySettings.logo_url);
          if (!response.ok) {
            throw new Error(`Failed to fetch logo: ${response.statusText}`);
          }
          const blob = await response.blob();
          const reader = new FileReader();
          
          await new Promise((resolve, reject) => {
            reader.onload = () => {
              try {
                if (reader.result) {
                  // Calculate dimensions to maintain aspect ratio with larger size
                  const maxWidth = 100; // Increased from 40
                  const maxHeight = 50; // Increased from 20
                  const aspectRatio = 300/91;
                  let width = maxWidth;
                  let height = width / aspectRatio;
                  
                  if (height > maxHeight) {
                    height = maxHeight;
                    width = height * aspectRatio;
                  }

                  pdf.addImage(
                    reader.result as string,
                    'PNG',
                    15,
                    15,
                    width,
                    height,
                    undefined,
                    'FAST'
                  );
                }
                resolve(null);
              } catch (error) {
                reject(new Error(`Failed to add logo to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`));
              }
            };
            reader.onerror = () => reject(new Error('Failed to read logo file'));
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Error loading company logo:', error);
          // Continue without logo
        }
      }

      // Add chart image below logo with padding
      pdf.addImage(imgData, 'PNG', 15, 80, canvas.width / 2 - 30, canvas.height / 2 - 30);
      pdf.save('organizational-chart.pdf');
    } catch (err) {
      console.error('Error exporting to PDF:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while exporting to PDF');
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    return (
      <Tree
        lineWidth="2px"
        lineColor="#94a3b8"
        lineBorderRadius="6px"
        label={renderNode(orgData)}
      />
    );
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setStaff(data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
      >
        <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
        Back to Health & Safety
      </button>

      {/* Status Message */}
      {statusMessage && (
        <div className={`mb-4 p-4 rounded-lg ${
          statusMessage.type === 'success' ? 'bg-green-50 text-green-800' :
          statusMessage.type === 'error' ? 'bg-red-50 text-red-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          <div className="flex items-center">
            {statusMessage.type === 'success' && <Check className="h-5 w-5 mr-2" />}
            {statusMessage.type === 'error' && <AlertTriangle className="h-5 w-5 mr-2" />}
            {statusMessage.type === 'info' && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
            <p>{statusMessage.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Organisational Chart Builder</h2>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {!orgData.children.length && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Director
            </button>
          )}
          <button
            onClick={saveAllChanges}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600"
          >
            <Check className="h-4 w-4 mr-2" />
            Save Changes
          </button>
          <button
            onClick={exportToPDF}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Export to PDF
          </button>
          <button
            onClick={clearAndInitialize}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Helper text for adding members */}
          {orgData.children.length > 0 && !selectedId && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-blue-800">
                To add more members, first click on a person in the chart to select them.
              </p>
            </div>
          )}

          {/* Add Members Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Add New Members</h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setMemberType('Employee');
                      setDirectorNames(['', '', '']);
                      setDirectorPositions(['', '', '']);
                      setEmployeeName('');
                      setEmployeePosition('');
                    }}
                    className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </button>
                </div>
                
                {!orgData.children.length ? (
                  <div className="space-y-4">
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Director {index + 1}</label>
                        <input
                          type="text"
                          value={directorNames[index]}
                          onChange={(e) => {
                            const newNames = [...directorNames];
                            newNames[index] = e.target.value;
                            setDirectorNames(newNames);
                          }}
                          placeholder="Name"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={directorPositions[index]}
                          onChange={(e) => {
                            const newPositions = [...directorPositions];
                            newPositions[index] = e.target.value;
                            setDirectorPositions(newPositions);
                          }}
                          placeholder="Position"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Member Type</label>
                      <select
                        value={memberType}
                        onChange={(e) => setMemberType(e.target.value as 'Director' | 'Employee')}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Employee">Employee</option>
                        <option value="Director">Director</option>
                      </select>
                    </div>

                    {memberType === 'Director' ? (
                      <div className="space-y-4">
                        {[0, 1, 2].map((index) => (
                          <div key={index} className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Director {index + 1}</label>
                            <input
                              type="text"
                              value={directorNames[index]}
                              onChange={(e) => {
                                const newNames = [...directorNames];
                                newNames[index] = e.target.value;
                                setDirectorNames(newNames);
                              }}
                              placeholder="Name"
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={directorPositions[index]}
                              onChange={(e) => {
                                const newPositions = [...directorPositions];
                                newPositions[index] = e.target.value;
                                setDirectorPositions(newPositions);
                              }}
                              placeholder="Position"
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                          <select
                            value={employeeName}
                            onChange={(e) => setEmployeeName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Employee</option>
                            {staff.map((staffMember) => (
                              <option key={staffMember.id} value={staffMember.name}>
                                {staffMember.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                          <input
                            type="text"
                            value={employeePosition}
                            onChange={(e) => setEmployeePosition(e.target.value)}
                            placeholder="Position"
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setMemberType('Employee');
                      setDirectorNames(['', '', '']);
                      setDirectorPositions(['', '', '']);
                      setEmployeeName('');
                      setEmployeePosition('');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (memberType === 'Director') {
                        // Handle adding directors
                        const validDirectors = directorNames
                          .map((name, i) => ({ name, position: directorPositions[i] }))
                          .filter(d => d.name.trim() && d.position.trim());
                        
                        if (validDirectors.length > 0) {
                          const combinedName = validDirectors.map(d => d.name).join(' / ');
                          const combinedPosition = validDirectors.map(d => d.position).join(' / ');
                          addEmployee(orgData.id, combinedName, combinedPosition, true);
                        }
                      } else {
                        // Handle adding employee
                        if (employeeName.trim() && employeePosition.trim()) {
                          addEmployee(selectedId || orgData.id, employeeName, employeePosition, false);
                        }
                      }
                      setShowAddModal(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Member
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedId && !linkingMode && (
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Employee Name"
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-600">Department</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="Department"
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-600">Position</label>
                  <select
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {selectedId === orgData.id ? (
                      <option value="Director">Director</option>
                    ) : (
                      <>
                        <option value="Employee">Employee</option>
                        <option value="Manager">Manager</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Team Lead">Team Lead</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    onClick={() => addEmployee(selectedId, newName, newPosition, false)}
                    className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add {selectedId === orgData.id ? 'Director' : 'Employee'}
                  </button>
                  {selectedId !== orgData.id && (
                    <button
                      onClick={() => removeEmployee(selectedId)}
                      className="flex items-center justify-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  {linkingMode && (
                    <button
                      onClick={() => {
                        setLinkingMode(false);
                        setLinkingFromId(null);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Cancel Linking
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {linkingMode && (
            <div className="bg-yellow-50 p-4 rounded-lg mt-6">
              <p className="text-yellow-800">
                Select an employee to create a new reporting line. A dotted line will show the secondary reporting relationship.
              </p>
            </div>
          )}
        </div>
        
        <div id="org-chart" ref={chartRef} className="bg-gray-100 p-8 rounded-lg overflow-auto relative">
          {secondaryLines}
          <Tree
            lineWidth="2px"
            lineColor="#94a3b8"
            lineBorderRadius="6px"
            label={renderNode(orgData)}
          />
        </div>
      </div>

      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Error</h3>
            </div>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 