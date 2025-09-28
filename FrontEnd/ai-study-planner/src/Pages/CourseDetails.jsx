import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileText } from 'lucide-react';
import WelcomeBanner from "../components/WelcomeBanner";
import FileUploadSection from "../components/FileUploadSection";
import ActionButtons from "../components/ActionButtons";
import SuccessModal from "../components/SuccessModal";
import ActivityHistory from "../components/ActivityHistory";
import LearningCheckpoints from "../components/LearningCheckpoints";
import DirectSlideViewer from "../components/DirectSlideViewer";
import SlideViewTip from "../components/SlideViewTip";
import FileSelectorModal from "../components/FileSelectorModal";
import QuizTypeSelectorModal from "../components/QuizTypeSelectorModal";
import CourseActivities from "../components/CourseActivities";
import { useFileOperations } from "../hooks/useFileOperations";
import { useActivityHistory, ACTIVITY_TYPES } from "../hooks/useActivityHistory";
import { useStudySessionTracker } from "../hooks/useStudySessionTracker";
import { useEnhancedStudyTracker } from "../hooks/useEnhancedStudyTracker";
import '../App.css';

function CourseDetails() {
  const [courseData, setCourseData] = useState(null);
  const [showActivityHistory, setShowActivityHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'read'
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const { addActivity } = useActivityHistory();
  
  // Study session tracking
  const {
    isActive: isStudyActive,
    currentSessionTime,
    totalStudyTime,
    startSession,
    stopSession,
    trackActivity,
    formatTime
  } = useStudySessionTracker(courseId);
  // Real-time slide reading tracker to start/complete backend slide sessions
  const {
    startReadingSession,
    completeReadingSession,
    updateReadingProgress
  } = useEnhancedStudyTracker(courseId, courseData?.title || courseData?.name, null);

  const handleReadButton = async (file) => {
    setActiveTab('read');
    handleViewFile(file);
    
    // Automatically start session when read button is clicked
    if (!isStudyActive) {
      startSession();
    }
    
    await startReadingSession(file.filename, null);
    addActivity(
      ACTIVITY_TYPES.PAGE_VISIT,
      `Started reading: ${file.originalFilename || file.filename}`,
      { courseId, filename: file.filename, startTime: new Date().toISOString(), autoStarted: true }
    );
  };
  
  // Custom hooks
  const {
    selectedFile,
    uploadedFile,
    extractedText,
    loading: fileLoading,
    showSuccessModal,
    successMessage,
    handleFileSelect,
    handleFileUpload,
    generateSummary,
    generateQuiz,
    closeSuccessModal,
    // New multi-file functionality
    selectedFiles,
    uploadedFiles,
    handleFileDelete,
    handleViewFile,
    showFileSelector,
    actionType,
    showFileSelectorForAction,
    handleFileSelectionForAction,
    closeFileSelector,
    reloadFiles, // Add reloadFiles function
    debugCourseFiles, // Add debug function
    clearFileState, // Add clear state function
    // Quiz type selection functionality
    showQuizTypeSelector,
    selectedQuizType,
    showQuizTypeSelectorModal,
    closeQuizTypeSelector,
    handleQuizTypeSelect
  } = useFileOperations();

  useEffect(() => {
    const fetchCourseData = () => {
      const savedCourses = localStorage.getItem('courses');
      if (savedCourses) {
        const courses = JSON.parse(savedCourses);
        const course = courses.find(c => c.id === courseId);
        if (course) {
          setCourseData(course);
          // Store current courseId and name for navigation
          sessionStorage.setItem('currentCourseId', courseId);
          sessionStorage.setItem('currentCourseName', course.title || course.name);
          
          // Reload files for this specific course
          reloadFiles();
          
          // Track course view activity
          addActivity(
            ACTIVITY_TYPES.COURSE_VIEW,
            `Viewed course: ${course.title || course.name}`,
            {
              courseId: course.id,
              courseName: course.title || course.name
            }
          );
        } else {
          // Course not found, redirect to courses page
          navigate('/courses', { replace: true });
        }
      }
    };

    fetchCourseData();
  }, [courseId, navigate, addActivity, reloadFiles]);

  const handleFileSelectWrapper = (event) => {
    handleFileSelect(event);
  };

  // Enhanced reading interaction handler for study session tracking and time logging
  const handleReadingInteraction = (type, data) => {
    trackActivity(); // Track user activity
    if (type === 'start_reading') {
      // Automatically start session when reading begins
      if (!isStudyActive) {
        startSession();
      }
      // Start backend slide reading session only when viewer opens
      startReadingSession(data.filename, null);
      addActivity(
        ACTIVITY_TYPES.PAGE_VISIT,
        `Started reading: ${data.filename}`,
        { ...data, courseId, startTime: data.startTime, autoStarted: true }
      );
    } else if (type === 'end_reading') {
      // Automatically stop session when reading ends
      if (isStudyActive) {
        stopSession();
      }
      // Complete backend slide reading session when viewer closes/unmounts
      completeReadingSession(data.finalProgress || 100, '', 5, 3);
      addActivity(
        ACTIVITY_TYPES.PAGE_VISIT,
        `Finished reading: ${data.filename}`,
        { ...data, courseId, readingTime: data.readingTime, finalProgress: data.finalProgress, autoStopped: true }
      );
      // Optionally, send readingTime to backend for analytics
      // fetch('/api/track-reading', { method: 'POST', body: JSON.stringify({ courseId, filename: data.filename, readingTime: data.readingTime }) })
    } else if (type === 'page_turn') {
      addActivity(
        ACTIVITY_TYPES.PAGE_VISIT,
        `Read page ${data.to} of ${data.filename || uploadedFile}`,
        { ...data, courseId }
      );
    }
  };

  const handleReadingProgress = (progress, currentPage, totalPages) => {
    // Track reading progress for analytics
    if (progress === 100) {
      addActivity(
        ACTIVITY_TYPES.PAGE_VISIT,
        `Completed reading page ${currentPage}`,
        { progress, currentPage, totalPages, courseId }
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 max-w-5xl mx-auto flex flex-col pb-8">
        <div className="px-4 mt-6">
          <WelcomeBanner courseTitle={courseData?.title || courseData?.name} />
        </div>

        {/* Study Session Status Bar */}
        {(uploadedFile || uploadedFiles.length > 0) && (
          <div className="mx-4 mb-4 p-4 bg-white rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  isStudyActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {isStudyActive ? 'Study Session Active (Auto-Started)' : 'Study Session Ready'}
                  </p>
                  <p className="text-xs text-gray-600">
                    Current: {formatTime(currentSessionTime)} • Total: {formatTime(totalStudyTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-500 bg-blue-50 px-3 py-1 rounded-lg">
                  📚 Auto-tracking enabled
                </div>
                {isStudyActive && (
                  <button
                    onClick={stopSession}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Stop Session
                  </button>
                )}
              </div>
            </div>
            {isStudyActive ? (
              <div className="mt-2 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                ✅ Session automatically started when slide opened. Will pause after 5 minutes of inactivity.
              </div>
            ) : (
              <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                📖 Open a slide to automatically start timing your study session.
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mx-4 mb-4">
          <div className="bg-white rounded-xl shadow-sm border p-1 inline-flex">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📁 Upload & Manage
            </button>
            {uploadedFiles.length > 0 && (
              <button
                onClick={() => {
                  setActiveTab('read');
                  trackActivity(); // Track tab switch
                  
                  // If no file is selected but files exist, select the first one
                  if (!uploadedFile && uploadedFiles.length > 0) {
                    handleViewFile(uploadedFiles[0]);
                  }
                  
                  // Automatically start session when switching to read tab
                  if (!isStudyActive && uploadedFile) {
                    startSession();
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'read'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📖 Read & Study ({uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''})
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'upload' ? (
          <>
            {/* Show tip when no files are uploaded */}
            {uploadedFiles.length === 0 && (
              <div className="px-4">
                <SlideViewTip />
              </div>
            )}
            
            <FileUploadSection
              selectedFiles={selectedFiles}
              uploadedFiles={uploadedFiles}
              loading={fileLoading}
              onFileSelect={handleFileSelectWrapper}
              onFileUpload={handleFileUpload}
              onFileDelete={handleFileDelete}
              onViewFile={handleViewFile}
              onReadFile={handleReadButton}
            />

            <ActionButtons
              uploadedFiles={uploadedFiles}
              loading={fileLoading}
              onGenerateSummary={generateSummary}
              onGenerateQuiz={generateQuiz}
              onShowFileSelector={showFileSelectorForAction}
              onShowQuizTypeSelector={showQuizTypeSelectorModal}
            />
          </>
        ) : (
          <div className="px-4">
            {uploadedFile ? (
              <DirectSlideViewer
                uploadedFile={uploadedFile}
                filename={uploadedFiles.find(f => f.filename === uploadedFile)?.originalFilename || uploadedFile}
                onReadingProgress={handleReadingProgress}
                onInteraction={handleReadingInteraction}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Content Selected</h3>
                <p className="text-gray-600 mb-4">Select a file from the upload section to start reading.</p>
                <button 
                  onClick={() => setActiveTab('upload')}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Go to Upload Section
                </button>
              </div>
            )}
          </div>
        )}

        {/* Learning Checkpoints */}
        <div className="px-4">
          <LearningCheckpoints 
            courseId={courseId} 
            extractedText={extractedText}
            filename={uploadedFile}
          />
        </div>

        {/* Course Activities - Quiz Results and Summaries */}
        <div className="px-4 mt-6">
          <CourseActivities 
            courseId={courseId} 
            courseName={courseData?.title || courseData?.name}
          />
        </div>

        <main className="main-content">
        </main>
        
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={closeSuccessModal}
          title="Upload Successful!"
          message={successMessage}
          filename={uploadedFile}
          onViewFiles={() => {
            setActiveTab('read');
            // If files exist, select the most recent file for viewing
            if (uploadedFiles.length > 0) {
              handleViewFile(uploadedFiles[uploadedFiles.length - 1]);
            }
          }}
          showViewButton={uploadedFiles.length > 0}
        />

        <ActivityHistory
          isOpen={showActivityHistory}
          onClose={() => setShowActivityHistory(false)}
        />

        {/* Quiz Type Selector Modal */}
        <QuizTypeSelectorModal
          isOpen={showQuizTypeSelector}
          onClose={closeQuizTypeSelector}
          onSelect={handleQuizTypeSelect}
        />

        {/* File Selector Modal for Actions */}
        <FileSelectorModal
          isOpen={showFileSelector}
          onClose={closeFileSelector}
          files={uploadedFiles}
          onFileSelect={handleFileSelectionForAction}
          title={`Select File for ${actionType === 'summary' ? 'Summary' : 'Quiz'} Generation`}
          actionName={`Generate ${actionType === 'summary' ? 'Summary' : 'Quiz'}`}
        />

        {/* Floating Action Button for Activity History */}
        <button
          onClick={() => setShowActivityHistory(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-40"
          title="View Activity History"
        >
          <svg className="w-6 h-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>

        {/* Temporary Debug Button for Course Isolation Testing */}
        <button
          onClick={() => {
            console.log('🧪 Course Isolation Debug:');
            debugCourseFiles();
            console.log('Uploaded Files State:', uploadedFiles);
            console.log('Current Course Data:', courseData);
          }}
          className="fixed bottom-6 left-6 w-12 h-12 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-40"
          title="Debug Course Files"
        >
          🐛
        </button>
      </div>
    </div>
  );
};

export default CourseDetails;
