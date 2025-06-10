import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import Navbar from '../components/PageHead';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  getAssignments,
  saveAssignments,
  ensureWeeklyAssignments,
  updateAssignmentStatus,
  groupAssignmentsByDate,
  generateCalendarDates,
  formatAssignmentDate,
  sortAssignments,
  getPriorityInfo,
  filterAssignments,
  generateAssignmentWithGemini,
  calculateAssignmentProgress,
  generateAssignmentAnalytics
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

const AssignmentCard = ({ assignment, onStatusChange, onEdit, onDelete }) => {
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
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">
            {assignment.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {assignment.description}
          </p>
          <div className="mt-4 flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Due: {new Date(assignment.dueDate).toLocaleDateString()}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
              {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
            </span>
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

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');

  // Load assignments on component mount
  useEffect(() => {
    const loadAssignments = () => {
      try {
        const savedAssignments = localStorage.getItem('assignments');
        if (savedAssignments) {
          setAssignments(JSON.parse(savedAssignments));
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
    localStorage.setItem('assignments', JSON.stringify(assignments));
  }, [assignments]);

  const handleCreateAssignment = (assignmentData) => {
    const newAssignment = {
      id: Date.now().toString(),
      ...assignmentData,
      status: 'pending'
    };
    setAssignments(prev => [...prev, newAssignment]);
  };

  const handleStatusChange = (id, newStatus) => {
    setAssignments(prev =>
      prev.map(assignment =>
        assignment.id === id ? { ...assignment, status: newStatus } : assignment
      )
    );
  };

  const handleEditAssignment = (id, updatedAssignment) => {
    setAssignments(prev =>
      prev.map(assignment =>
        assignment.id === id ? updatedAssignment : assignment
      )
    );
  };

  const handleDeleteAssignment = (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      setAssignments(prev => prev.filter(assignment => assignment.id !== id));
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true;
    return assignment.status === filter;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar activePage="assignments" />
        <div className="flex-1 flex items-center justify-center">
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activePage="assignments" />
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

        <div className="space-y-4">
          {filteredAssignments.map(assignment => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onStatusChange={handleStatusChange}
              onEdit={handleEditAssignment}
              onDelete={handleDeleteAssignment}
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
      </div>
    </div>
  );
}

export default Assignments; 