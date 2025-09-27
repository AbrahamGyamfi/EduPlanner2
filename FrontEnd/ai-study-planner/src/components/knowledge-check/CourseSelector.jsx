import React, { useState, useEffect } from 'react';
import { BookOpen, Search, ArrowRight, Users, Clock } from 'lucide-react';

const CourseSelector = ({ onCourseSelect, currentCourse }) => {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCourses, setFilteredCourses] = useState([]);

  useEffect(() => {
    // Load courses from localStorage
    const savedCourses = localStorage.getItem('courses');
    if (savedCourses) {
      const courseList = JSON.parse(savedCourses);
      setCourses(courseList);
      setFilteredCourses(courseList);
    }
  }, []);

  useEffect(() => {
    // Filter courses based on search term
    if (searchTerm) {
      const filtered = courses.filter(course =>
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses(courses);
    }
  }, [searchTerm, courses]);

  const handleCourseSelect = (course) => {
    // Store in session storage
    sessionStorage.setItem('currentCourseId', course.id);
    sessionStorage.setItem('currentCourseName', course.title || course.name);
    
    // Emit custom event to notify other components
    window.dispatchEvent(new CustomEvent('courseChanged'));
    
    // Call the callback
    onCourseSelect({
      id: course.id,
      name: course.title || course.name,
      description: course.description
    });
  };

  const getCourseColor = (index) => {
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-purple-500 to-pink-600',
      'from-green-500 to-emerald-600',
      'from-orange-500 to-red-600',
      'from-teal-500 to-cyan-600',
      'from-indigo-500 to-purple-600'
    ];
    return colors[index % colors.length];
  };

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Courses Found</h2>
        <p className="text-gray-600 mb-6">
          You need to create some courses first to use the Knowledge Check feature.
        </p>
        <button
          onClick={() => window.location.href = '/courses'}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg"
        >
          Go to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Select a Course</h2>
        <p className="text-gray-600">
          Choose which course you'd like to test your knowledge in
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
      </div>

      {/* Current Course Indicator */}
      {currentCourse?.id && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-800 font-medium">Currently Selected</p>
              <p className="text-blue-600 text-sm">{currentCourse.name}</p>
            </div>
            <div className="text-blue-500">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Course Grid */}
      <div className="grid gap-4 max-h-96 overflow-y-auto">
        {filteredCourses.map((course, index) => (
          <div
            key={course.id}
            onClick={() => handleCourseSelect(course)}
            className={`p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg transform hover:scale-[1.02] ${
              currentCourse?.id === course.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getCourseColor(index)} flex items-center justify-center mr-4 flex-shrink-0`}>
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 mb-1 truncate">
                    {course.title || course.name}
                  </h3>
                  {course.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {course.description}
                    </p>
                  )}
                  <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                    {course.assignments && (
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {course.assignments.length} assignments
                      </div>
                    )}
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'Recently added'}
                    </div>
                  </div>
                </div>
              </div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                currentCourse?.id === course.id
                  ? 'bg-blue-500'
                  : 'bg-gray-200 group-hover:bg-blue-500'
              }`}>
                <ArrowRight className={`w-4 h-4 ${
                  currentCourse?.id === course.id ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No courses found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default CourseSelector;
