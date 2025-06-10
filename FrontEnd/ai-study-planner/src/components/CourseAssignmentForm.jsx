import React from 'react';
import FormInput from './FormInput';
import { PlusCircle } from 'lucide-react';

const CourseAssignmentForm = ({ courseId, onAddAssignment }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    onAddAssignment(courseId, {
      name: formData.get('name'),
      weight: parseFloat(formData.get('weight')),
      score: parseFloat(formData.get('score')),
      maxScore: parseFloat(formData.get('maxScore')),
      id: crypto.randomUUID()
    });
    
    e.target.reset();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="font-medium text-gray-700">Add Assignment</h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FormInput
          label="Assignment Name"
          id={`name-${courseId}`}
          name="name"
          placeholder="Midterm Exam"
          required={true}
        />
        
        <FormInput
          label="Weight (%)"
          type="number"
          id={`weight-${courseId}`}
          name="weight"
          placeholder="30"
          required={true}
        />
        
        <FormInput
          label="Score"
          type="number"
          id={`score-${courseId}`}
          name="score"
          placeholder="85"
          required={true}
        />
        
        <FormInput
          label="Max Score"
          type="number"
          id={`maxScore-${courseId}`}
          name="maxScore"
          placeholder="100"
          required={true}
        />
      </div>
      
      <button 
        type="submit"
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <PlusCircle className="w-4 h-4 mr-2" />
        Add Assignment
      </button>
    </form>
  );
};

export default CourseAssignmentForm;
