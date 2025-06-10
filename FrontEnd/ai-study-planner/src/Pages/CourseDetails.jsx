import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar";
import CourseHeader from "../components/CourseHeader";
import CourseProgressBar from "../components/CourseProgressBar";
import WelcomeBanner from "../components/WelcomeBanner";
import ActionCards from "../components/ActionCards";

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [uploadedSlides, setUploadedSlides] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchCourseData = () => {
      setLoading(true);
      const savedCourses = localStorage.getItem('courses');
      if (savedCourses) {
        const courses = JSON.parse(savedCourses);
        const course = courses.find(c => c.id === courseId);
        if (course) {
          setCourseData(course);
        } else {
          // Course not found, redirect to courses page
          navigate('/courses', { replace: true });
        }
      }
      setLoading(false);
    };

    fetchCourseData();
  }, [courseId, navigate]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedSlides(file);
      
      // Update course data with new slide
      if (courseData) {
        const updatedCourse = {
          ...courseData,
          slides: [...(courseData.slides || []), file.name],
          lastUpdated: new Date().toISOString()
        };
        
        // Update in localStorage
        const savedCourses = JSON.parse(localStorage.getItem('courses') || '[]');
        const updatedCourses = savedCourses.map(c => 
          c.id === courseData.id ? updatedCourse : c
        );
        localStorage.setItem('courses', JSON.stringify(updatedCourses));
        setCourseData(updatedCourse);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 max-w-5xl mx-auto flex flex-col pb-8 px-4">
          <div className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg mt-8"></div>
            <div className="h-8 bg-gray-200 rounded-lg mt-4"></div>
            <div className="h-40 bg-gray-200 rounded-lg mt-6"></div>
            <div className="h-64 bg-gray-200 rounded-lg mt-6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 max-w-5xl mx-auto flex flex-col pb-8">
        <div className="pt-8 px-4">
          {/* <CourseProgressBar 
            progress={courseData?.progress || 0}
            modules={courseData?.modules || []}
            resources={courseData?.resources}
            quizzes={courseData?.quizzes}
          /> */}
        </div>
        <div className="px-4 mt-6">
          <WelcomeBanner courseTitle={courseData?.title || courseData?.name} />
        </div>
        <div className="px-4 mt-6">
          {/* Slides Upload Section */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-bold mb-2 text-indigo-700">Course Materials</h2>
              <p className="text-gray-600 mb-4 text-center">Upload your course slides (PDF or images) to enable summary and quiz generation features.</p>
              
              {/* Uploaded Files List */}
              {courseData?.slides?.length > 0 && (
                <div className="w-full mb-4 bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h3>
                  <ul className="space-y-2">
                    {courseData.slides.map((slide, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {slide}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg text-base shadow transition mb-2"
                onClick={handleUploadClick}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
                </svg>
                Upload File
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,image/*"
              />
              {uploadedSlides && (
                <div className="mt-2 text-green-600 font-medium flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Uploaded: {uploadedSlides.name}
                </div>
              )}
            </div>
          </div>
          <ActionCards uploadedSlides={uploadedSlides} courseData={courseData} />
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
