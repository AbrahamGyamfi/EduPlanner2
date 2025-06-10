import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';

export default function CourseForm({ onSubmit }) {
  const [name, setName] = useState('');
  const [creditHours, setCreditHours] = useState(3);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      id: crypto.randomUUID(),
      name,
      creditHours,
      assignments: []
    });
    setName('');
    setCreditHours(3);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900">Add New Course</h3>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Course Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label htmlFor="creditHours" className="block text-sm font-medium text-gray-700">
          Credit Hours
        </label>
        <input
          type="number"
          id="creditHours"
          value={creditHours}
          onChange={(e) => setCreditHours(Number(e.target.value))}
          min={1}
          max={6}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <button
        type="submit"
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <PlusCircle className="w-4 h-4 mr-2" />
        Add Course
      </button>
    </form>
  );
}