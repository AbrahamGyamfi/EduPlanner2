import React, { useState, useEffect } from 'react';
import { useNavigationLoading } from '../contexts/NavigationLoadingContext';
import Navbar from '../components/PageHead';
import CourseCard from '../components/CWA/CourseCard';
import { toast } from 'react-hot-toast';
import { 
  calculateOverallProgress, 
  updateAllCoursesProgress, 
  useProgressTracking 
} from '../utils/progressTracking';


function CoursesPage() {
  const { navigateWithLoading } = useNavigationLoading();
  
  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem('courses');
    if (saved) {
      const parsedCourses = JSON.parse(saved);
      // Ensure all existing courses have a status and slides array
      const updatedCourses = parsedCourses.map(course => ({
        ...course,
        status: course.status || 'ongoing', // Set default status if not present
        slides: Array.isArray(course.slides) ? course.slides : [] // Ensure slides is always an array
      }));
      localStorage.setItem('courses', JSON.stringify(updatedCourses));
      return updatedCourses;
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState('all');
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    creditHours: '',
    category: 'Computer',
    assignments: []
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Use the custom progress tracking hook
  useProgressTracking();
  
  // Calculate overall progress
  const overallProgress = calculateOverallProgress();

  useEffect(() => {
    localStorage.setItem('courses', JSON.stringify(courses));
    // Sync courses to CWA storage for analysis
    localStorage.setItem('cwa_courses', JSON.stringify(courses));
    
    // Update progress for all courses when courses change
    updateAllCoursesProgress();
  }, [courses]);

  // Calculate stats
  const activeCourses = courses.filter(course => course.status !== 'completed').length;
  const completedCourses = courses.filter(course => course.status === 'completed').length;

  const handleAddCourse = (e) => {
    e.preventDefault();
    if (!newCourse.name || !newCourse.creditHours) {
      setFormErrors({ general: 'Please fill in all required fields.' });
      return;
    }

    const course = {
      id: crypto.randomUUID(),
      name: newCourse.name,
      creditHours: Number(newCourse.creditHours),
      category: newCourse.category,
      progress: 0,
      status: 'ongoing', // Explicitly set status as ongoing
      lastAccessed: new Date().toLocaleDateString(),
      assignments: [],
      slides: [], // Initialize slides as empty array
      difficulty: 1,
      totalModules: 1,
      completedModules: 0
    };

    setCourses(prevCourses => {
      const updatedCourses = [...prevCourses, course];
      localStorage.setItem('courses', JSON.stringify(updatedCourses));
      return updatedCourses;
    });
    
    setNewCourse({ name: '', creditHours: '', category: 'Computer', assignments: [] });
    setIsAddingCourse(false);
    setFormErrors({});
    toast.success('Course added successfully!');
  };

  const handleDeleteCourse = (courseId) => {
    setCourses(courses.filter(c => c.id !== courseId));
  };

  const handleAddAssignment = (courseId, assignment) => {
    setCourses(courses.map(course => {
      if (course.id === courseId) {
        return {
          ...course,
          assignments: [...course.assignments, { ...assignment, id: crypto.randomUUID() }]
        };
      }
      return course;
    }));
  };

  const handleDeleteAssignment = (courseId, assignmentId) => {
    setCourses(courses.map(course => {
      if (course.id === courseId) {
        return {
          ...course,
          assignments: course.assignments.filter(a => a.id !== assignmentId)
        };
      }
      return course;
    }));
  };

  const calculateCourseScore = (course) => {
    if (!course.assignments || course.assignments.length === 0) return 0;
    
    const totalWeightedScore = course.assignments.reduce((sum, assignment) => {
      const percentage = (assignment.score / assignment.maxScore) * 100;
      return sum + (percentage * (assignment.weight / 100));
    }, 0);

    return totalWeightedScore;
  };

  const handleCardClick = async (course) => {
    await navigateWithLoading(
      `/course/${encodeURIComponent(course.name)}`,
      {},
      `Loading ${course.name}...`,
      'Preparing your course materials'
    );
  };

  // Filter courses based on active tab
  const filteredCourses = activeTab === 'all' 
    ? courses 
    : activeTab === 'active' 
      ? courses.filter(course => course.status !== 'completed')
      : courses.filter(course => course.status === 'completed');

  const getCategoryColor = (category) => {
    const colors = {
      Computer: 'bg-blue-50',
      Science: 'bg-green-50',
      Mathematics: 'bg-purple-50',
      Language: 'bg-yellow-50'
    };
    return colors[category] || 'bg-gray-50';
  };

  const getCategoryTextColor = (category) => {
    const colors = {
      Computer: 'text-blue-600',
      Science: 'text-green-600',
      Mathematics: 'text-purple-600',
      Language: 'text-yellow-600'
    };
    return colors[category] || 'text-gray-600';
  };

  // Update the markCourseComplete function to properly handle status changes
  const markCourseComplete = (courseId) => {
    setCourses(prevCourses => {
      const updatedCourses = prevCourses.map(course => 
        course.id === courseId 
          ? { ...course, status: course.status === 'completed' ? 'ongoing' : 'completed' }
          : course
      );
      localStorage.setItem('courses', JSON.stringify(updatedCourses));
      return updatedCourses;
    });
  };

  // Add handleStatusChange function
  const handleStatusChange = (courseId, newStatus) => {
    setCourses(prevCourses => {
      const updatedCourses = prevCourses.map(course => 
        course.id === courseId 
          ? { ...course, status: newStatus }
          : course
      );
      localStorage.setItem('courses', JSON.stringify(updatedCourses));
      toast.success(`Course marked as ${newStatus}`);
      return updatedCourses;
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* <Sidebar activePage="courses" /> */}
      <div className="flex-1">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <Navbar pageTitle="Courses" />
          </div>

          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Overall Progress */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border dark:border-gray-700">
                <h3 className="text-gray-800 dark:text-gray-200 font-medium mb-4">Overall Progress</h3>
                <div className="flex justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        className="dark:stroke-gray-600"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#4F46E5"
                        strokeWidth="3"
                        strokeDasharray={`${overallProgress}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">{overallProgress}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Courses */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border dark:border-gray-700">
                <h3 className="text-gray-800 dark:text-gray-200 font-medium mb-4">Active Courses</h3>
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{activeCourses}</p>
                  <p className="text-gray-500 dark:text-gray-400">In Progress</p>
                </div>
              </div>

              {/* Completed */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border dark:border-gray-700">
                <h3 className="text-gray-800 dark:text-gray-200 font-medium mb-4">Completed</h3>
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{completedCourses}</p>
                  <p className="text-gray-500 dark:text-gray-400">Courses</p>
                </div>
              </div>
            </div>

            {/* Course Categories and Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-3">
                  <button 
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                      activeTab === 'all' 
                        ? 'bg-indigo-600 text-white dark:bg-indigo-500' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setActiveTab('all')}
                  >
                    All Courses ({courses.length})
                  </button>
                  <button 
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                      activeTab === 'active' 
                        ? 'bg-indigo-600 text-white dark:bg-indigo-500' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setActiveTab('active')}
                  >
                    Ongoing ({courses.filter(course => course.status !== 'completed').length})
                  </button>
                  <button 
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                      activeTab === 'completed' 
                        ? 'bg-indigo-600 text-white dark:bg-indigo-500' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setActiveTab('completed')}
                  >
                    Completed ({courses.filter(course => course.status === 'completed').length})
                  </button>
                </div>

                {/* Course Status Legend */}
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span>Ongoing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    <span>Completed</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddingCourse(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Course
                </button>
              </div>
            </div>

            
            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course, index) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    index={index}
                    onDeleteCourse={handleDeleteCourse}
                    onDeleteAssignment={handleDeleteAssignment}
                    onAddAssignment={handleAddAssignment}
                    onStatusChange={handleStatusChange}
                    calculateCourseScore={calculateCourseScore}
                    formErrors={formErrors}
                    onClick={() => handleCardClick(course)}
                  />
                ))
              ) : (
                <div className="col-span-full">
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {activeTab === 'all' 
                        ? 'No courses found' 
                        : activeTab === 'active'
                          ? 'No ongoing courses'
                          : 'No completed courses'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activeTab === 'all'
                        ? 'Add your first course to get started'
                        : activeTab === 'active'
                          ? 'Mark some courses as ongoing to see them here'
                          : 'Complete some courses to see them here'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Course Modal */}
      {isAddingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full border dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">Add New Course</h3>
                <button 
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setIsAddingCourse(false)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleAddCourse} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Credit Hours
                  </label>
                  <input
                    type="number"
                    value={newCourse.creditHours}
                    onChange={(e) => setNewCourse({ ...newCourse, creditHours: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                    required
                    min="1"
                    max="6"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCourse.category}
                    onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  >
                    <option value="Computer">Computer</option>
                    <option value="Science">Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Language">Language</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingCourse(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                  >
                    Add Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoursesPage;