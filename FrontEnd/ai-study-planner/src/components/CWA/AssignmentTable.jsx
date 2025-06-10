import React from 'react';

const AssignmentTable = ({ assignments, courseId, onDelete }) => {
  return (
    <div className="mt-4 border rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {assignments.map(assignment => (
            <tr key={assignment.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{assignment.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.weight}%</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {assignment.score}/{assignment.maxScore} ({((assignment.score / assignment.maxScore) * 100).toFixed(1)}%)
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onDelete(courseId, assignment.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssignmentTable;
