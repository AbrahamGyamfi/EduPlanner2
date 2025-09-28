import React, { useState, useEffect } from 'react';
import Navbar from '../components/PageHead';
import LoadingSpinner from '../components/LoadingSpinner';
import { API_BASE_URL } from '../config/api';
import {
  getAssignments,
  saveAssignments,
  getPriorityInfo,
  calculateAssignmentProgress,
  createAssignment,
  formatAssignmentDate
} from '../utils/assignmentsUtils';

// Reusable components
const ProgressBar = ({ progress, size = 'normal' }) => {
  const progressValue = Math.min(Math.max(progress || 0, 0), 100);
  return (
    <div className={`w-full bg-gray-200 rounded-full ${size === 'small' ? 'h-1' : 'h-2'}`}>
      <div
        className="bg-blue-600 rounded-full h-full transition-all duration-300"
        style={{ width: `${progressValue}%` }}
      />
    </div>
  );
};

const AnalyticCard = ({ title, value, children }) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    {children || <div className="text-2xl font-bold text-blue-600">{value}</div>}
  </div>
);

const AssignmentCard = ({ assignment, onStatusChange, onEdit, onDelete, onToggleCompletion }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(assignment.title);
  const [editedDescription, setEditedDescription] = useState(assignment.description);
  const [editedDueDate, setEditedDueDate] = useState(assignment.dueDate.split('T')[0]);

  const handleSave = () => {
    onEdit(assignment.id, {
      ...assignment,
      title: editedTitle,
      description: editedDescription,
      dueDate: new Date(editedDueDate).toISOString()
    });
    setIsEditing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompletionStatus = () => {
    if (assignment.status === 'completed') return true;
    if (assignment.completedAt) return true;
    return false;
  };

  const isOverdue = () => {
    return new Date(assignment.dueDate) < new Date() && assignment.status !== 'completed';
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Assignment title"
          />
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Assignment description"
            rows="3"
          />
          <input
            type="date"
            value={editedDueDate}
            onChange={(e) => setEditedDueDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow ${
      getCompletionStatus() ? 'border-l-4 border-l-green-500' : 
      isOverdue() ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-gray-300'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-start space-x-3">
            {/* Completion Checkbox */}
            <div className="flex-shrink-0 mt-1">
              <input
                type="checkbox"
                checked={getCompletionStatus()}
                onChange={() => onToggleCompletion(assignment.id, !getCompletionStatus())}
                className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded transition-all duration-200 hover:scale-110"
              />
            </div>
            
            <div className="flex-1">
              <h3 className={`text-lg font-medium ${
                getCompletionStatus() ? 'line-through text-gray-500' : 'text-gray-900'
              }`}>
                {assignment.title}
              </h3>
              <p className={`text-sm mt-1 ${
                getCompletionStatus() ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {assignment.description}
              </p>
              <div className="mt-4 flex items-center space-x-4">
                <span className={`text-sm ${
                  isOverdue() ? 'text-red-600 font-medium' : 'text-gray-500'
                }`}>
                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  {isOverdue() && ' (Overdue)'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                  {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                </span>
                {getCompletionStatus() && assignment.completedAt && (
                  <span className="text-xs text-green-600 font-medium">
                    Completed: {new Date(assignment.completedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={assignment.status}
            onChange={(e) => onStatusChange(assignment.id, e.target.value)}
            className="px-3 py-1 rounded border border-gray-200 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(assignment.id)}
            className="p-2 text-red-400 hover:text-red-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const AssignmentDetails = ({ assignment, onClose, onStatusChange, onMilestoneToggle }) => {
  if (!assignment) return null;

  const progress = calculateAssignmentProgress(assignment);
  const priorityInfo = getPriorityInfo(assignment.priority);

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl">
      <div className="h-full flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Assignment Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div
              className="inline-block px-3 py-1 rounded-full text-sm font-medium"
              style={{
                color: priorityInfo.color,
                backgroundColor: priorityInfo.bgColor
              }}
            >
              {priorityInfo.label}
            </div>

            <h3 className="text-xl font-medium text-gray-900">{assignment.title}</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <p className="mt-1 text-sm text-gray-900">{assignment.subject}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <p className="mt-1 text-sm text-gray-900">
                {formatAssignmentDate(assignment.dueDate)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <p className="mt-1 text-sm text-gray-900">{assignment.description}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Progress</label>
              <div className="mt-2">
                <ProgressBar progress={progress} />
                <div className="mt-1 text-sm text-gray-500 text-right">
                  {progress}% Complete
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={assignment.status}
                onChange={(e) => onStatusChange(assignment.id, e.target.value)}
                className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {assignment.learningOutcomes && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Learning Outcomes
                </label>
                <div className="mt-2 space-y-2">
                  {assignment.learningOutcomes.map(outcome => (
                    <div
                      key={outcome}
                      className="inline-block px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-sm mr-2"
                    >
                      {outcome}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {assignment.milestones && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Milestones</label>
                <div className="mt-2 space-y-3">
                  {assignment.milestones.map(milestone => (
                    <div key={milestone.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={milestone.completed}
                        onChange={() => onMilestoneToggle(assignment.id, milestone.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {milestone.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          Due: {formatAssignmentDate(milestone.dueDate)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {assignment.resources && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Resources</label>
                <div className="mt-2 space-y-2">
                  {assignment.resources.map(resource => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{resource.title}</div>
                      <div className="text-sm text-gray-500 capitalize">{resource.type}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t">
          <button
            onClick={() => onStatusChange(assignment.id, 'completed')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Mark as Completed
          </button>
        </div>
      </div>
    </div>
  );
};

// Create Assignment Modal
const CreateAssignmentModal = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      dueDate: new Date(dueDate).toISOString()
    });
    setTitle('');
    setDescription('');
    setDueDate('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create New Assignment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md"
              rows="3"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">{title || 'Confirm Deletion'}</h3>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            {message || `Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
  const [lastCompletedAssignment, setLastCompletedAssignment] = useState(null);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState({
    isOpen: false,
    assignmentId: null,
  });
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);

  // Calculate completion statistics
  const completionStats = {
    total: assignments.length,
    completed: assignments.filter(a => a.status === 'completed').length,
    pending: assignments.filter(a => a.status === 'pending').length,
    inProgress: assignments.filter(a => a.status === 'in-progress').length,
    overdue: assignments.filter(a => new Date(a.dueDate) < new Date() && a.status !== 'completed').length,
    completionRate: assignments.length > 0 ? Math.round((assignments.filter(a => a.status === 'completed').length / assignments.length) * 100) : 0
  };

  // Load assignments on component mount
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/assignments`);
        if (response.ok) {
          const data = await response.json();
          // Map backend assignment fields to frontend format
          const mappedAssignments = data.assignments.map(assignment => ({
            id: assignment.assignment_id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate,
            status: assignment.status,
            subject: assignment.courseName || 'General',
            courseId: assignment.courseId,
            userId: assignment.userId,
            created_at: assignment.created_at,
            completedAt: assignment.completedAt || null // Add completedAt to the frontend assignment object
          }));
          setAssignments(mappedAssignments);
        }
      } catch (error) {
        console.error('Error loading assignments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssignments();
  }, []);

  // Save assignments whenever they change
  useEffect(() => {
    if (assignments.length > 0) {
      localStorage.setItem('assignments', JSON.stringify(assignments));
      
      // Trigger custom event to notify dashboard
      const event = new CustomEvent('assignmentsUpdated', {
        detail: { assignments }
      });
      window.dispatchEvent(event);
      
      console.log('📝 Assignments updated and saved:', assignments.length, 'assignments');
    }
  }, [assignments]);

  const handleCreateAssignment = async (assignmentData) => {
    try {
      // Get user ID from localStorage (assuming it's stored after login)
      const userId = localStorage.getItem('userId') || 'default-user';
      
      const response = await fetch(`${API_BASE_URL}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: 'default-course',
          title: assignmentData.title,
          description: assignmentData.description,
          dueDate: assignmentData.dueDate,
          userId: userId,
          courseName: 'General Assignment'
        })
      });
      
      if (response.ok) {
        // Reload assignments from backend to get the latest data
        const assignmentsResponse = await fetch(`${API_BASE_URL}/assignments`);
        if (assignmentsResponse.ok) {
          const data = await assignmentsResponse.json();
          // Map backend assignment fields to frontend format (same as in loadAssignments)
          const mappedAssignments = data.assignments.map(assignment => ({
            id: assignment.assignment_id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate,
            status: assignment.status,
            subject: assignment.courseName || 'General',
            courseId: assignment.courseId,
            userId: assignment.userId,
            created_at: assignment.created_at,
            completedAt: assignment.completedAt || null // Add completedAt to the frontend assignment object
          }));
          setAssignments(mappedAssignments);
        }
      } else {
        console.error('Failed to create assignment');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  const handleEditAssignment = (id, updatedAssignment) => {
    setAssignments(prev =>
      prev.map(assignment =>
        assignment.id === id ? updatedAssignment : assignment
      )
    );
  };

  const handleDeleteAssignment = (id) => {
    setAssignmentToDelete(assignments.find(a => a.id === id));
    setDeleteConfirmationModal({
      isOpen: true,
      assignmentId: id,
    });
  };

  const handleConfirmDeleteAssignment = () => {
    if (assignmentToDelete) {
      try {
        // Call backend DELETE endpoint
        fetch(`${API_BASE_URL}/assignments/${assignmentToDelete.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        // Remove from local state only after successful backend deletion
        setAssignments(prev => prev.filter(assignment => assignment.id !== assignmentToDelete.id));
        console.log('Assignment deleted successfully');
      } catch (error) {
        console.error('Error deleting assignment:', error);
        alert('Error deleting assignment. Please try again.');
      } finally {
        setDeleteConfirmationModal({
          isOpen: false,
          assignmentId: null,
        });
        setAssignmentToDelete(null);
      }
    }
  };

  const handleToggleCompletion = (id, isCompleted) => {
    const assignment = assignments.find(a => a.id === id);
    
    setAssignments(prev =>
      prev.map(assignment =>
        assignment.id === id ? { 
          ...assignment, 
          status: isCompleted ? 'completed' : 'pending', 
          completedAt: isCompleted ? new Date().toISOString() : null 
        } : assignment
      )
    );

    // Show completion celebration
    if (isCompleted && assignment) {
      setLastCompletedAssignment(assignment);
      setShowCompletionCelebration(true);
      setTimeout(() => setShowCompletionCelebration(false), 3000);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    setAssignments(prev =>
      prev.map(assignment =>
        assignment.id === id ? { 
          ...assignment, 
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : assignment.completedAt
        } : assignment
      )
    );
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true;
    return assignment.status === filter;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* <Sidebar activePage="assignments" /> */}
      <div className="flex-1 p-8">
        <div className="mb-8">
          <Navbar pageTitle="Assignments" />
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Assignment
          </button>
        </div>

        {/* Progress Statistics */}
        {assignments.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Progress Overview</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const pendingAssignments = assignments.filter(a => a.status !== 'completed');
                    pendingAssignments.forEach(assignment => {
                      handleToggleCompletion(assignment.id, true);
                    });
                  }}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Mark All Complete
                </button>
                <button
                  onClick={() => {
                    const completedAssignments = assignments.filter(a => a.status === 'completed');
                    completedAssignments.forEach(assignment => {
                      handleToggleCompletion(assignment.id, false);
                    });
                  }}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Mark All Pending
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{completionStats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completionStats.completed}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{completionStats.inProgress}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{completionStats.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{completionStats.overdue}</div>
                <div className="text-sm text-gray-600">Overdue</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                <span className="text-sm font-medium text-gray-900">{completionStats.completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionStats.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {filteredAssignments.map(assignment => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onStatusChange={handleStatusChange}
              onEdit={handleEditAssignment}
              onDelete={handleDeleteAssignment}
              onToggleCompletion={handleToggleCompletion}
            />
          ))}

          {filteredAssignments.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">No assignments found</h3>
              <p className="text-sm text-gray-500 mt-1">
                {filter === 'all'
                  ? 'Create your first assignment to get started'
                  : 'No assignments match the selected filter'}
              </p>
            </div>
          )}
        </div>

        <CreateAssignmentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAssignment}
        />

        <DeleteConfirmationModal
          isOpen={deleteConfirmationModal.isOpen}
          onClose={() => setDeleteConfirmationModal({
            isOpen: false,
            assignmentId: null,
          })}
          onConfirm={handleConfirmDeleteAssignment}
          itemName={assignmentToDelete ? assignmentToDelete.title : ''}
        />

        {/* Completion Celebration */}
        {showCompletionCelebration && lastCompletedAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Task Completed! 🎉</h3>
                <p className="text-gray-600 mb-4">
                  "{lastCompletedAssignment.title}" has been marked as complete!
                </p>
                <div className="text-sm text-gray-500">
                  Completed on {new Date().toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => setShowCompletionCelebration(false)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Assignments; 