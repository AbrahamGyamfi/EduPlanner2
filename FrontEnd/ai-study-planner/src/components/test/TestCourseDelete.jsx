import React, { useState } from 'react';
import DeleteCourseModal from '../modals/DeleteCourseModal';

const TestCourseDelete = () => {
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const testCourse = {
    id: 'test-123',
    name: 'Test Course',
    creditHours: 3,
    slides: []
  };

  const handleDeleteClick = (e) => {
    console.log('Delete button clicked');
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    setShowModal(true);
    
    return false;
  };

  const confirmDelete = async () => {
    console.log('Confirmed delete');
    setIsDeleting(true);
    
    // Simulate deletion
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsDeleting(false);
    setShowModal(false);
    alert('Course deleted successfully!');
  };

  const closeModal = () => {
    if (!isDeleting) {
      setShowModal(false);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Course Deletion Test</h2>
      
      <div className="bg-white rounded-lg shadow p-4 max-w-md">
        <h3 className="font-semibold">{testCourse.name}</h3>
        <p className="text-gray-600">{testCourse.creditHours} Credit Hours</p>
        
        <button
          onClick={handleDeleteClick}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Delete Course
        </button>
      </div>

      {/* Delete Course Modal */}
      <DeleteCourseModal
        isOpen={showModal}
        course={testCourse}
        onClose={closeModal}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default TestCourseDelete;
