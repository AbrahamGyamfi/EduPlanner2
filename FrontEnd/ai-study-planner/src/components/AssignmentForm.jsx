import React, { useState } from 'react';

export default function AssignmentForm({ courseId, onSubmit }) {
  const [assignment, setAssignment] = useState({
    name: '',
    weight: 0,
    score: 0,
    maxScore: 100,
    dueDate: '',
    completed: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(courseId, {
      id: crypto.randomUUID(),
      ...assignment,
      dueDate: assignment.dueDate || null
    });
    setAssignment({
      name: '',
      weight: 0,
      score: 0,
      maxScore: 100,
      dueDate: '',
      completed: false
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900">Add Assignment</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Assignment Name
          </label>
          <input
            type="text"
            id="name"
            value={assignment.name}
            onChange={(e) => setAssignment({ ...assignment, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
            Due Date
          </label>
          <input
            type="date"
            id="dueDate"
            value={assignment.dueDate}
            onChange={(e) => setAssignment({ ...assignment, dueDate: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
            Weight (%)
          </label>
          <input
            type="number"
            id="weight"
            value={assignment.weight}
            onChange={(e) => setAssignment({ ...assignment, weight: Number(e.target.value) })}
            min={0}
            max={100}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="score" className="block text-sm font-medium text-gray-700">
            Score
          </label>
          <input
            type="number"
            id="score"
            value={assignment.score}
            onChange={(e) => setAssignment({ ...assignment, score: Number(e.target.value) })}
            min={0}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="maxScore" className="block text-sm font-medium text-gray-700">
            Maximum Score
          </label>
          <input
            type="number"
            id="maxScore"
            value={assignment.maxScore}
            onChange={(e) => setAssignment({ ...assignment, maxScore: Number(e.target.value) })}
            min={1}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={assignment.completed}
              onChange={(e) => setAssignment({ ...assignment, completed: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-4 w-4"
            />
            <span className="ml-2 text-sm text-gray-700">Mark as completed</span>
          </label>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Assignment
        </button>
      </div>
    </form>
  );
}