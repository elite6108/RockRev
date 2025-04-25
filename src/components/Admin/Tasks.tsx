import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  X,
  AlertTriangle,
  FileText,
  Eye,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

interface TasksProps {
  onBack: () => void;
}

interface Board {
  id: number;
  name: string;
  description: string | null;
  border_color: string | null;
  sort_order: number;
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  status:
    | 'to_schedule'
    | 'booked_in'
    | 'over_due'
    | 'in_progress'
    | 'purchased'
    | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  project_id: string | null;
  board_id: number;
  notes: string | null;
  tags: string[];
  staff_ids: number[];
  due_date: string | null;
  cost: number | null;
  created_at: string;
  updated_at: string;
  category:
    | 'Quote'
    | 'Repair'
    | 'Aftersales'
    | 'Complaints'
    | 'Remedials'
    | 'Finance'
    | 'Insurance'
    | 'Tax'
    | 'Banking'
    | null;
}

interface Project {
  id: string;
  name: string;
}

interface StaffMember {
  id: number;
  name: string;
  position: string;
}

interface TaskAttachment {
  id: number;
  task_id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  display_name: string;
}

interface Message {
  id: number;
  task_id: number;
  user_id: string;
  user_name: string;
  message: string;
  created_at: string;
}

interface TaskFormData {
  title: string;
  description: string;
  status: Task['status'];
  priority: Task['priority'];
  project_id: string | null;
  board_id: number | null;
  notes: string;
  tags: string[];
  staff_ids: number[];
  attachments: File[];
  existing_attachments: TaskAttachment[];
  due_date: string;
  cost: number | null;
  category: Task['category'];
}

// Add getSignedFileUrl function after fetchStaff
const getSignedFileUrl = async (fileName: string): Promise<string | null> => {
  if (!fileName) return null;
  
  try {
    const { data } = await supabase.storage
      .from('task-attachments')
      .createSignedUrl(fileName, 3600); // 1 hour expiry
    
    return data?.signedUrl || null;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};

export function Tasks({ onBack }: TasksProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [expandedBoards, setExpandedBoards] = useState<Set<number>>(new Set());
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Form data states
  const [boardFormData, setBoardFormData] = useState({
    name: '',
    description: '',
    border_color: '#FF0000',
  });

  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    status: 'to_schedule' as Task['status'],
    priority: 'low' as Task['priority'],
    project_id: null as string | null,
    board_id: null as number | null,
    notes: '',
    tags: [] as string[],
    staff_ids: [] as number[],
    attachments: [] as File[],
    existing_attachments: [] as TaskAttachment[],
    due_date: '',
    cost: null as number | null,
    category: null as Task['category'],
  });

  // Add new state for active tab
  const [activeTab, setActiveTab] = useState<
    'info' | 'notes' | 'attachments' | 'chat'
  >('info');

  // Add new state for delete task modal
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);

  // Add new state for view mode
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Add new state for board tabs
  const [activeBoardTabs, setActiveBoardTabs] = useState<
    Record<number, 'open' | 'completed'>
  >({});

  // Add new state for messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Add search filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Add search filter function
  const filterTasks = (tasks: Task[]) => {
    if (!searchQuery) return tasks;

    const query = searchQuery.toLowerCase();
    return tasks.filter((task) => {
      const board = boards.find((b) => b.id === task.board_id);
      const matchesBoard = board && board.name.toLowerCase().includes(query);
      const matchesTask =
        task.title.toLowerCase().includes(query) ||
        task.tags.some((tag) => tag.toLowerCase().includes(query));

      return matchesBoard || matchesTask;
    });
  };

  // Add function to check if board should be shown
  const shouldShowBoard = (board: Board) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      board.name.toLowerCase().includes(query) ||
      tasks.some(
        (task) =>
          task.board_id === board.id &&
          (task.title.toLowerCase().includes(query) ||
            task.tags.some((tag) => tag.toLowerCase().includes(query)))
      )
    );
  };

  useEffect(() => {
    fetchBoards();
    fetchTasks();
    fetchProjects();
    fetchStaff();
  }, []);

  // Add useEffect for auth state
  useEffect(() => {
    // Get initial auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch functions
  const fetchBoards = async () => {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching boards:', error);
      return;
    }

    setBoards(data || []);
  };

  // Modify the fetchTasks function to get signed URLs for attachments
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select(
        `
          *,
        attachments:task_attachments(*)
        `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return;
    }

    // Process tasks to generate signed URLs for attachments
    if (data && data.length > 0) {
      const tasksWithSignedUrls = await Promise.all(
        data.map(async (task) => {
          if (task.attachments && task.attachments.length > 0) {
            const attachmentsWithSignedUrls = await Promise.all(
              task.attachments.map(async (attachment: TaskAttachment) => {
                const signedUrl = await getSignedFileUrl(attachment.file_name);
                return {
                  ...attachment,
                  file_url: signedUrl || attachment.file_url
                };
              })
            );
            return { ...task, attachments: attachmentsWithSignedUrls };
          }
          return task;
        })
      );
      setTasks(tasksWithSignedUrls);
    } else {
      setTasks([]);
    }
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching projects:', error);
      return;
    }

    setProjects(data || []);
  };

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, position')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching staff:', error);
      return;
    }

    setStaff(data || []);
  };

  // Add useEffect to fetch messages
  useEffect(() => {
    if (editingTask && activeTab === 'chat') {
      const fetchMessages = async () => {
        try {
          // Fetch messages with user names already included
          const { data: messagesData, error: messagesError } = await supabase
            .from('task_messages')
            .select('*')
            .eq('task_id', editingTask.id)
            .order('created_at', { ascending: true });

          if (messagesError) throw messagesError;

          setMessages(messagesData || []);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };

      fetchMessages();

      // Subscribe to new messages
      const subscription = supabase
        .channel(`task_messages:${editingTask.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'task_messages',
            filter: `task_id=eq.${editingTask.id}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setMessages((prev: Message[]) => [
                ...prev,
                payload.new as Message,
              ]);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [editingTask?.id, activeTab]);

  // Board management functions
  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('boards').insert([
        {
          name: boardFormData.name,
          description: boardFormData.description,
          border_color: boardFormData.border_color,
          sort_order: boards.length,
        },
      ]);

      if (error) throw error;

      setShowBoardModal(false);
      setBoardFormData({ name: '', description: '', border_color: '#FF0000' });
      fetchBoards();
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  const handleEditBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBoard) return;

    try {
      const { error } = await supabase
        .from('boards')
        .update({
          name: boardFormData.name,
          description: boardFormData.description,
          border_color: boardFormData.border_color,
        })
        .eq('id', editingBoard.id);

      if (error) throw error;

      setShowBoardModal(false);
      setEditingBoard(null);
      setBoardFormData({ name: '', description: '', border_color: '#FF0000' });
      fetchBoards();
    } catch (error) {
      console.error('Error updating board:', error);
    }
  };

  const handleDeleteBoard = async () => {
    if (!boardToDelete) return;

    try {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', boardToDelete.id);

      if (error) throw error;

      setShowDeleteModal(false);
      setBoardToDelete(null);
      fetchBoards();
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };

  const toggleBoardExpansion = (boardId: number) => {
    setExpandedBoards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(boardId)) {
        newSet.delete(boardId);
      } else {
        newSet.add(boardId);
      }
      return newSet;
    });
  };

  // Modify handleSubmit function - replace the file upload section
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Handle file uploads first
      const uploadedFiles = await Promise.all(
        taskFormData.attachments.map(async (file: File) => {
          const fileName = `${Date.now()}-${file.name}`;
          const { data, error: uploadError } = await supabase.storage
            .from('task-attachments')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // Generate a signed URL for immediate UI display
          const signedUrl = await getSignedFileUrl(fileName);

          return {
            file_name: fileName,
            file_url: signedUrl || '', // For immediate display only
            file_type: file.type,
            display_name: file.name,
          };
        })
      );

      const taskData = {
        title: taskFormData.title,
        description: taskFormData.description,
        status: taskFormData.status,
        priority: taskFormData.priority,
        project_id: taskFormData.project_id,
        board_id: taskFormData.board_id,
        notes: taskFormData.notes,
        tags: taskFormData.tags,
        staff_ids: taskFormData.staff_ids,
        due_date: taskFormData.due_date || null,
        cost: taskFormData.cost,
        category: taskFormData.category,
      };

      if (editingTask) {
        // Update existing task
        const { error: taskError } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', editingTask.id);

        if (taskError) throw taskError;

        // Delete removed attachments
        const removedAttachments =
          editingTask.attachments?.filter(
            (oldAttachment) =>
              !taskFormData.existing_attachments.some(
                (newAttachment) => newAttachment.id === oldAttachment.id
              )
          ) || [];

        if (removedAttachments.length > 0) {
          // First delete files from storage
          for (const attachment of removedAttachments) {
            // Delete file from storage
            const { error: storageError } = await supabase.storage
              .from('task-attachments')
              .remove([attachment.file_name]);
            
            if (storageError) {
              console.error('Error deleting file from storage:', storageError);
              // Continue with other deletions even if one fails
            }
          }

          // Then delete attachment records from database
          const { error: deleteError } = await supabase
            .from('task_attachments')
            .delete()
            .in(
              'id',
              removedAttachments.map((a) => a.id)
            );

          if (deleteError) throw deleteError;
        }

        // Add new attachments
        if (uploadedFiles.length > 0) {
          const { error: attachmentError } = await supabase
            .from('task_attachments')
            .insert(
              uploadedFiles.map((file) => ({
                task_id: editingTask.id,
                file_name: file.file_name,
                file_type: file.file_type,
                display_name: file.display_name,
                // Don't store the signed URL in the database
                file_url: '', 
              }))
            );

          if (attachmentError) throw attachmentError;
        }
      } else {
        // Create new task
        const { data: newTask, error: taskError } = await supabase
          .from('tasks')
          .insert([taskData])
          .select()
          .single();

        if (taskError) throw taskError;

        // Add attachments to new task
        if (uploadedFiles.length > 0) {
          const { error: attachmentError } = await supabase
            .from('task_attachments')
            .insert(
              uploadedFiles.map((file) => ({
                task_id: newTask.id,
                file_name: file.file_name,
                file_type: file.file_type,
                display_name: file.display_name,
                // Don't store the signed URL in the database
                file_url: '',
              }))
            );

          if (attachmentError) throw attachmentError;
        }
      }

      setShowTaskModal(false);
      setEditingTask(null);
      setTaskFormData({
        title: '',
        description: '',
        status: 'to_schedule',
        priority: 'low',
        project_id: null,
        board_id: null,
        notes: '',
        tags: [],
        staff_ids: [],
        attachments: [],
        existing_attachments: [],
        due_date: '',
        cost: null,
        category: null,
      });
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  // Modify the handleDeleteTask function to also delete files from storage
  const handleDeleteTask = async () => {
    if (!editingTask) return;

    try {
      // Delete task attachments from storage first
      if (editingTask.attachments?.length) {
        // Delete files from storage
        for (const attachment of editingTask.attachments) {
          const { error: storageError } = await supabase.storage
            .from('task-attachments')
            .remove([attachment.file_name]);
          
          if (storageError) {
            console.error('Error deleting file from storage:', storageError);
            // Continue with other deletions even if one fails
          }
        }

        // Delete attachment records from database
        const { error: attachmentError } = await supabase
          .from('task_attachments')
          .delete()
          .eq('task_id', editingTask.id);

        if (attachmentError) throw attachmentError;
      }

      // Delete the task
      const { error: taskError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', editingTask.id);

      if (taskError) throw taskError;

      setShowDeleteTaskModal(false);
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Add new function to set active board tab
  const setActiveBoardTab = (boardId: number, tab: 'open' | 'completed') => {
    setActiveBoardTabs((prev) => ({ ...prev, [boardId]: tab }));
  };

  // Update handleSendMessage to store the user's display name
  const handleSendMessage = async () => {
    if (!user || !editingTask || !newMessage.trim()) return;

    try {
      // Get the user's display name from metadata
      const displayName =
        user.user_metadata?.display_name ||
        user.email?.split('@')[0] ||
        'Unknown User';

      // Insert the message with the user's display name
      const { data: messageData, error: messageError } = await supabase
        .from('task_messages')
        .insert({
          task_id: editingTask.id,
          user_id: user.id,
          user_name: displayName,
          message: newMessage.trim(),
        })
        .select()
        .single();

      if (messageError) {
        console.error('Error inserting message:', messageError);
        return;
      }

      // Add the message to the state
      if (messageData) {
        setMessages((prev: Message[]) => [...prev, messageData]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 dark:text-white dark:hover:text-gray-200"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Task Management</h2>
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-white">
              View:
            </span>
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-blue-600 dark:hover:text-white'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 text-sm font-medium rounded-r-md ${
                  viewMode === 'kanban'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-blue-600 dark:hover:text-white'
                }`}
              >
                Kanban
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingBoard(null);
              setBoardFormData({
                name: '',
                description: '',
                border_color: '#FF0000',
              });
              setShowBoardModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Board
          </button>
        </div>
      </div>

      {/* Task Statistics Widgets */}
      <div className="mb-6 space-y-4">
        {/* First row: Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400 w-6 h-6">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <path d="M9 14l2 2 4-4"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Open Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tasks.filter(task => task.status !== 'completed').length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400 w-6 h-6">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="M12 8v4l3 3"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tasks.filter(task => task.status === 'completed').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400 w-6 h-6">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Second row: Status breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">To Schedule</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tasks.filter(task => task.status === 'to_schedule').length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 dark:text-purple-400 w-6 h-6">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Booked In</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tasks.filter(task => task.status === 'booked_in').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600 dark:text-yellow-400 w-6 h-6">
                  <path d="M5 22h14"></path>
                  <path d="M5 2h14"></path>
                  <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path>
                  <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tasks.filter(task => task.status === 'in_progress').length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400 w-6 h-6">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.84 6.71 2.26"></path>
                  <path d="M21 3v9h-9"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tasks.filter(task => 
                    task.status === 'over_due' || 
                    (task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed')
                  ).length}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400 w-6 h-6">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {viewMode === 'list' ? (
          <div className="space-y-4 fullw">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search tasks by title, tags, or board name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            {boards.filter(shouldShowBoard).map((board) => (
              <div
                key={board.id}
                className="border rounded-lg overflow-hidden"
                style={{ borderColor: board.border_color || '#E5E7EB' }}
              >
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleBoardExpansion(board.id)}
                      className="mr-2 text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-gray-200"
                    >
                      {expandedBoards.has(board.id) ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {board.name}
                    </h3>
                    {board.description && (
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-200">
                        {board.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingBoard(board);
                        setBoardFormData({
                          name: board.name,
                          description: board.description || '',
                          border_color: board.border_color || '#FF0000',
                        });
                        setShowBoardModal(true);
                      }}
                      className="text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setBoardToDelete(board);
                        setShowDeleteModal(true);
                      }}
                      className="text-red-600 hover:text-red-900 dark:text-white dark:hover:text-gray-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandedBoards.has(board.id) && (
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex space-x-4">
                        <button
                          onClick={() => {
                            setEditingTask(null);
                            setTaskFormData({
                              ...taskFormData,
                              board_id: board.id,
                            });
                            setShowTaskModal(true);
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Task
                        </button>
                      </div>
                    </div>

                    {/* Board Tabs */}
                    <div className="mb-6">
                      <nav className="-mb-px flex space-x-2">
                        <button
                          onClick={() => setActiveBoardTab(board.id, 'open')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeBoardTabs[board.id] === 'open'
                              ? 'bg-indigo-600 text-white dark:bg-blue-600 dark:text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#171E29] dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                          }`}
                        >
                          Open Tasks
                        </button>
                        <button
                          onClick={() =>
                            setActiveBoardTab(board.id, 'completed')
                          }
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeBoardTabs[board.id] === 'completed'
                              ? 'bg-indigo-600 text-white dark:bg-blue-600 dark:text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#171E29] dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                          }`}
                        >
                          Completed Tasks
                        </button>
                      </nav>
                    </div>

                    <div className="overflow-x-auto relative">
                      <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead>
                              <tr>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Task
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Status
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Priority
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Due Date
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Assigned To
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Notes
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-gray-700">
                              {tasks
                                .filter((task) => {
                                  if (task.board_id !== board.id) return false;
                                  if (activeBoardTabs[board.id] === 'completed') {
                                    return task.status === 'completed';
                                  } else {
                                    const isOverdue =
                                      task.due_date &&
                                      new Date(task.due_date) < new Date();
                                    return (
                                      [
                                        'to_schedule',
                                        'booked_in',
                                        'in_progress',
                                        'purchased',
                                        'over_due',
                                      ].includes(task.status) || isOverdue
                                    );
                                  }
                                })
                                .filter((task) => filterTasks([task]).length > 0)
                                .sort((a, b) => {
                                  const priorityOrder = {
                                    critical: 0,
                                    high: 1,
                                    medium: 2,
                                    low: 3,
                                  };
                                  return (
                                    priorityOrder[a.priority] -
                                    priorityOrder[b.priority]
                                  );
                                })
                                .map((task) => (
                                  <tr
                                    key={task.id}
                                    className={
                                      task.due_date &&
                                      new Date(task.due_date) < new Date()
                                        ? 'bg-pink-50 dark:bg-pink-900/20'
                                        : ''
                                    }
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {task.title}
                                      </div>
                                      {task.description && (
                                        <div className="text-sm text-gray-500 dark:text-gray-200">
                                          {task.description}
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                        ${
                                          task.status === 'completed'
                                            ? 'bg-green-100 text-green-800'
                                            : task.status === 'in_progress'
                                            ? 'bg-blue-100 text-blue-800'
                                            : task.status === 'over_due'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                        }`}
                                      >
                                        {task.status
                                          .replace(/_/g, ' ')
                                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                        ${
                                          task.priority === 'critical'
                                            ? 'bg-red-100 text-red-800'
                                            : task.priority === 'high'
                                            ? 'bg-orange-100 text-orange-800'
                                            : task.priority === 'medium'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-green-100 text-green-800 dark:bg-gray-700 dark:text-gray-200'
                                        }`}
                                      >
                                        {task.priority.charAt(0).toUpperCase() +
                                          task.priority.slice(1)}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div
                                        className={`text-sm ${
                                          task.due_date &&
                                          new Date(task.due_date) < new Date()
                                            ? 'text-red-600'
                                            : 'text-gray-900 dark:text-red-400'
                                        }`}
                                      >
                                        {task.due_date
                                          ? new Date(
                                              task.due_date
                                            ).toLocaleDateString()
                                          : '-'}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex flex-wrap gap-1">
                                        {task.staff_ids.map((staffId) => {
                                          const member = staff.find(
                                            (s) => s.id === staffId
                                          );
                                          return (
                                            member && (
                                              <span
                                                key={staffId}
                                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                              >
                                                {member.name}
                                              </span>
                                            )
                                          );
                                        })}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-500 dark:text-gray-200">
                                        {task.notes}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      <div className="flex justify-end space-x-2">
                                        <button
                                          onClick={() => {
                                            setEditingTask(task);
                                            setTaskFormData({
                                              title: task.title,
                                              description: task.description || '',
                                              status: task.status,
                                              priority: task.priority,
                                              project_id: task.project_id,
                                              board_id: task.board_id,
                                              notes: task.notes || '',
                                              tags: task.tags,
                                              staff_ids: task.staff_ids,
                                              attachments: [],
                                              existing_attachments:
                                                task.attachments || [],
                                              due_date: task.due_date || '',
                                              cost: task.cost,
                                              category: task.category,
                                            });
                                            setShowTaskModal(true);
                                          }}
                                          className="text-indigo-600 hover:text-indigo-900 dark:text-white dark:hover:text-gray-200"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingTask(task);
                                            setShowDeleteTaskModal(true);
                                          }}
                                          className="text-red-600 hover:text-red-900 dark:text-white dark:hover:text-gray-200"
                                        >
                                          <Trash2 className="w-4 h-4" />
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
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto max-w-full">
            <div className="flex space-x-4 p-4 min-w-max lesspadd">
              {[
                'to_schedule',
                'booked_in',
                'in_progress',
                'over_due',
                'purchased',
                'completed',
              ].map((status) => (
                <div key={status} className="flex-shrink-0 w-80">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">
                      {status
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </h3>
                    <div className="space-y-3">
                      {tasks
                        .filter((task) => task.status === status)
                        .sort((a, b) => {
                          const priorityOrder = {
                            critical: 0,
                            high: 1,
                            medium: 2,
                            low: 3,
                          };
                          return (
                            priorityOrder[a.priority] -
                            priorityOrder[b.priority]
                          );
                        })
                        .map((task) => (
                          <div
                            key={task.id}
                            className={`bg-white dark:bg-gray-700 rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow duration-200 ${
                              task.due_date &&
                              new Date(task.due_date) < new Date()
                                ? 'bg-pink-50 dark:bg-pink-900/20'
                                : ''
                            }`}
                            onClick={() => {
                              setEditingTask(task);
                              setTaskFormData({
                                title: task.title,
                                description: task.description || '',
                                status: task.status,
                                priority: task.priority,
                                project_id: task.project_id,
                                board_id: task.board_id,
                                notes: task.notes || '',
                                tags: task.tags,
                                staff_ids: task.staff_ids,
                                attachments: [],
                                existing_attachments: task.attachments || [],
                                due_date: task.due_date || '',
                                cost: task.cost,
                                category: task.category,
                              });
                              setShowTaskModal(true);
                            }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {task.title}
                                </h4>
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1
                                  ${
                                    task.priority === 'critical'
                                      ? 'bg-red-100 text-red-800'
                                      : task.priority === 'high'
                                      ? 'bg-orange-100 text-orange-800'
                                      : task.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800 dark:bg-gray-700 dark:text-gray-200'
                                  }`}
                                >
                                  {task.priority.charAt(0).toUpperCase() +
                                    task.priority.slice(1)}
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTask(task);
                                    setShowDeleteTaskModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-900 dark:text-white dark:hover:text-gray-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-500 mb-2 line-clamp-2 dark:text-gray-200">
                                {task.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1 mb-2">
                              {task.staff_ids.map((staffId) => {
                                const member = staff.find(
                                  (s) => s.id === staffId
                                );
                                return (
                                  member && (
                                    <span
                                      key={staffId}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                    >
                                      {member.name}
                                    </span>
                                  )
                                );
                              })}
                            </div>
                            {task.due_date && (
                              <div
                                className={`text-xs ${
                                  new Date(task.due_date) < new Date()
                                    ? 'text-red-600'
                                    : 'text-gray-500 dark:text-red-400'
                                }`}
                              >
                                Due:{' '}
                                {new Date(task.due_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                      <button
                        onClick={() => {
                          setEditingTask(null);
                          setTaskFormData({
                            ...taskFormData,
                            status: status as Task['status'],
                          });
                          setShowTaskModal(true);
                        }}
                        className="w-full mt-2 flex items-center justify-center px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-500 hover:text-indigo-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-blue-600 dark:hover:text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Board Modal */}
      {showBoardModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingBoard ? 'Edit Board' : 'Add Board'}
              </h3>
              <button
                onClick={() => {
                  setShowBoardModal(false);
                  setEditingBoard(null);
                }}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x h-6 w-6">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
            <form onSubmit={editingBoard ? handleEditBoard : handleCreateBoard}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={boardFormData.name}
                    onChange={(e) =>
                      setBoardFormData({
                        ...boardFormData,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-[#29303b] dark:border-gray-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={boardFormData.description}
                    onChange={(e) =>
                      setBoardFormData({
                        ...boardFormData,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-[#29303b] dark:border-gray-600"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Border Color
                  </label>
                  <input
                    type="color"
                    value={boardFormData.border_color}
                    onChange={(e) =>
                      setBoardFormData({
                        ...boardFormData,
                        border_color: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowBoardModal(false);
                    setEditingBoard(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-red-600 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  {editingBoard ? 'Save Changes' : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && boardToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Delete Board
              </h3>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "{boardToDelete.name}"? This will
              also delete all tasks in this board.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBoardToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-blue-600 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBoard}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 dark:bg-gray-800 dark:text-white dark:hover:bg-blue-600 dark:hover:text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingTask ? 'Edit Task' : 'Add Task'}
              </h3>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setEditingTask(null);
                }}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6">
              <nav className="-mb-px flex space-x-2">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'info'
                      ? 'bg-indigo-600 text-white dark:bg-blue-600 dark:text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#171E29] dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                  }`}
                >
                  Info
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'notes'
                      ? 'bg-indigo-600 text-white dark:bg-blue-600 dark:text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#171E29] dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                  }`}
                >
                  Notes
                </button>
                <button
                  onClick={() => setActiveTab('attachments')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'attachments'
                      ? 'bg-indigo-600 text-white dark:bg-blue-600 dark:text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#171E29] dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                  }`}
                >
                  Attachments
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'chat'
                      ? 'bg-indigo-600 text-white dark:bg-blue-600 dark:text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#171E29] dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                  }`}
                >
                  Chat
                </button>
              </nav>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Tab Content */}
              <div className="max-h-[500px] overflow-y-auto pr-4">
                {/* Info Tab */}
                {activeTab === 'info' && (
                  <div className="grid grid-cols-2 gap-4 singlerow">
                    <div className="fullw">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Board
                      </label>
                      <select
                        value={taskFormData.board_id || ''}
                        onChange={(e) =>
                          setTaskFormData({
                            ...taskFormData,
                            board_id: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-[#29303b] dark:border-gray-600"
                        required
                      >
                        <option value="">Select a board</option>
                        {boards.map((board) => (
                          <option key={board.id} value={board.id}>
                            {board.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="fullw">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={taskFormData.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as Task['status'];
                          setTaskFormData({
                            ...taskFormData,
                            status: newStatus,
                            due_date:
                              newStatus === 'over_due'
                                ? null
                                : taskFormData.due_date,
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-[#29303b] dark:border-gray-600"
                        required
                      >
                        <option value="to_schedule">To Schedule</option>
                        <option value="booked_in">Booked In</option>
                        <option value="in_progress">In Progress</option>
                        <option value="purchased">Purchased</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div className="fullw">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={taskFormData.title}
                        onChange={(e) =>
                          setTaskFormData({
                            ...taskFormData,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-[#29303b] dark:border-gray-600"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 singlerow">
                      <div className="fullw">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Priority
                        </label>
                        <select
                          value={taskFormData.priority}
                          onChange={(e) =>
                            setTaskFormData({
                              ...taskFormData,
                              priority: e.target.value as Task['priority'],
                            })
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md dark:bg-[#29303b] dark:border-gray-600"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      <div className="fullw">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          value={taskFormData.category || ''}
                          onChange={(e) =>
                            setTaskFormData({
                              ...taskFormData,
                              category: e.target.value as Task['category'],
                            })
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md dark:bg-[#29303b] dark:border-gray-600"
                        >
                          <option value="">Select a category</option>
                          <option value="Quote">Quote</option>
                          <option value="Repair">Repair</option>
                          <option value="Aftersales">Aftersales</option>
                          <option value="Complaints">Complaints</option>
                          <option value="Remedials">Remedials</option>
                          <option value="Finance">Finance</option>
                          <option value="Insurance">Insurance</option>
                          <option value="Tax">Tax</option>
                          <option value="Banking">Banking</option>
                        </select>
                      </div>
                    </div>

                    <div className="fullw">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={taskFormData.due_date}
                        onChange={(e) => {
                          const newDueDate = e.target.value;
                          const isOverdue =
                            newDueDate && new Date(newDueDate) < new Date();
                          const wasOverdue =
                            taskFormData.due_date &&
                            new Date(taskFormData.due_date) < new Date();

                          setTaskFormData({
                            ...taskFormData,
                            due_date: newDueDate,
                            status: isOverdue
                              ? 'over_due'
                              : wasOverdue && !isOverdue
                              ? 'in_progress'
                              : taskFormData.status,
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-[#29303b] dark:border-gray-600"
                      />
                    </div>

                    <div className="fullw">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project
                      </label>
                      <select
                        value={taskFormData.project_id || ''}
                        onChange={(e) =>
                          setTaskFormData({
                            ...taskFormData,
                            project_id: e.target.value || null,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-[#29303b] dark:border-gray-600"
                      >
                        <option value="">Select a project</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="fullw">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assigned Staff
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 dark:bg-[#29303b] dark:border-gray-600">
                        {staff.map((member) => (
                          <label
                            key={member.id}
                            className="relative flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer group"
                          >
                            <div className="flex items-center h-5">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={taskFormData.staff_ids.includes(
                                    member.id
                                  )}
                                  onChange={(e) => {
                                    const newStaffIds = e.target.checked
                                      ? [...taskFormData.staff_ids, member.id]
                                      : taskFormData.staff_ids.filter(
                                          (id) => id !== member.id
                                        );
                                    setTaskFormData({
                                      ...taskFormData,
                                      staff_ids: newStaffIds,
                                    });
                                  }}
                                  className="peer appearance-none h-5 w-5 border border-gray-300 rounded-md transition-all duration-200 ease-in-out cursor-pointer checked:border-indigo-600 checked:bg-indigo-600 hover:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                                />
                                <svg
                                  className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-white peer-checked:opacity-100 opacity-0 transition-opacity duration-200"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M13.3334 4L6.00008 11.3333L2.66675 8"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                              <div className="ml-3 flex items-center">
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                                  {member.name}
                                </span>
                                <span className="ml-2 text-xs text-gray-500">
                                  {member.position}
                                </span>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="fullw">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cost
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={taskFormData.cost || ''}
                        onChange={(e) =>
                          setTaskFormData({
                            ...taskFormData,
                            cost: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-[#29303b] dark:border-gray-600"
                        placeholder="Enter cost..."
                      />
                    </div>

                    <div className="col-span-2 fullw">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {taskFormData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => {
                                const newTags = [...taskFormData.tags];
                                newTags.splice(index, 1);
                                setTaskFormData({
                                  ...taskFormData,
                                  tags: newTags,
                                });
                              }}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a tag"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md dark:bg-[#29303b] dark:border-gray-600"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.target as HTMLInputElement;
                              const value = input.value.trim();
                              if (value && !taskFormData.tags.includes(value)) {
                                setTaskFormData({
                                  ...taskFormData,
                                  tags: [...taskFormData.tags, value],
                                });
                                input.value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes Tab */}
                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={taskFormData.description}
                        onChange={(e) =>
                          setTaskFormData({
                            ...taskFormData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-[#29303b] dark:border-gray-600"
                        rows={6}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={taskFormData.notes}
                        onChange={(e) =>
                          setTaskFormData({
                            ...taskFormData,
                            notes: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-[#29303b] dark:border-gray-600"
                        rows={6}
                      />
                    </div>
                  </div>
                )}

                {/* Attachments Tab */}
                {activeTab === 'attachments' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attachments
                      </label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setTaskFormData({
                              ...taskFormData,
                              attachments: [
                                ...taskFormData.attachments,
                                ...files,
                              ],
                            });
                          }}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-medium
                            file:bg-indigo-50 file:text-indigo-700
                            hover:file:bg-indigo-100"
                        />
                        <div className="grid grid-cols-2 gap-4 singlerow">
                          {taskFormData.existing_attachments.map(
                            (attachment, index) => (
                              <div
                                key={attachment.id}
                                className="flex items-start space-x-3 p-3 border rounded-md"
                              >
                                <div className="w-16 h-16 flex-shrink-0">
                                  {attachment.file_type.startsWith('image/') ? (
                                    <img
                                      src={attachment.file_url}
                                      alt={attachment.display_name}
                                      className="w-full h-full object-cover rounded-md"
                                      onError={(e) => {
                                        const target =
                                          e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.parentElement?.classList.add(
                                          'bg-gray-100'
                                        );
                                        target.parentElement?.classList.add(
                                          'flex'
                                        );
                                        target.parentElement?.classList.add(
                                          'items-center'
                                        );
                                        target.parentElement?.classList.add(
                                          'justify-center'
                                        );
                                        const icon =
                                          document.createElement('div');
                                        icon.innerHTML =
                                          '<svg class="w-8 h-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>';
                                        target.parentElement?.appendChild(icon);
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                                      <FileText className="w-8 h-8 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {attachment.display_name}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        window.open(
                                          attachment.file_url,
                                          '_blank'
                                        )
                                      }
                                      className="text-indigo-600 hover:text-indigo-900 dark:text-white dark:hover:text-gray-200"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newAttachments = [
                                          ...taskFormData.existing_attachments,
                                        ];
                                        newAttachments.splice(index, 1);
                                        setTaskFormData({
                                          ...taskFormData,
                                          existing_attachments: newAttachments,
                                        });
                                      }}
                                      className="text-red-600 hover:text-red-900 dark:text-white dark:hover:text-gray-200"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          )}

                          {taskFormData.attachments.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-start space-x-3 p-3 border rounded-md"
                            >
                              <div className="w-16 h-16 flex-shrink-0">
                                {file.type.startsWith('image/') ? (
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="w-full h-full object-cover rounded-md"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                                    <FileText className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {file.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      window.open(
                                        URL.createObjectURL(file),
                                        '_blank'
                                      )
                                    }
                                    className="text-indigo-600 hover:text-indigo-900 dark:text-white dark:hover:text-gray-200"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newAttachments = [
                                        ...taskFormData.attachments,
                                      ];
                                      newAttachments.splice(index, 1);
                                      setTaskFormData({
                                        ...taskFormData,
                                        attachments: newAttachments,
                                      });
                                    }}
                                    className="text-red-600 hover:text-red-900 dark:text-white dark:hover:text-gray-200"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat Tab */}
                {activeTab === 'chat' && (
                  <div className="space-y-4">
                    <div className="h-96 flex flex-col">
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-md">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.user_id === user?.id
                                ? 'justify-end'
                                : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                message.user_id === user?.id
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white border border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700'
                              }`}
                            >
                              <div className="text-xs mb-1">
                                {message.user_name} •{' '}
                                {new Date(
                                  message.created_at
                                ).toLocaleTimeString()}
                              </div>
                              <div className="text-sm">{message.message}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (user) {
                                handleSendMessage();
                              }
                            }
                          }}
                          placeholder={
                            user
                              ? 'Type a message...'
                              : 'Please log in to send messages'
                          }
                          disabled={!user}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-[#29303b] dark:border-gray-600 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={handleSendMessage}
                          disabled={!user || !newMessage.trim()}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:bg-gray-800 dark:text-white dark:hover:bg-blue-600 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowTaskModal(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-red-600 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Task Modal */}
      {showDeleteTaskModal && editingTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Delete Task
              </h3>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "{editingTask.title}"? This action
              cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteTaskModal(false);
                  setEditingTask(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-blue-600 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 dark:bg-gray-800 dark:text-white dark:hover:bg-blue-600 dark:hover:text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
