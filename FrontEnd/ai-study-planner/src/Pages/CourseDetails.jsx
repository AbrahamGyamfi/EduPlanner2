import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import WelcomeBanner from "../components/WelcomeBanner";
import FileUploadSection from "../components/FileUploadSection";
import ActionButtons from "../components/ActionButtons";
import SummaryModal from "../components/SummaryModal";
import QuizSection from "../components/QuizSection";
import QuizResults from "../components/QuizResults";
import SuccessModal from "../components/SuccessModal";
import ActivityHistory from "../components/ActivityHistory";
import { useFileOperations } from "../hooks/useFileOperations";
import { useQuizState } from "../hooks/useQuizState";
import { useActivityHistory, ACTIVITY_TYPES } from "../hooks/useActivityHistory";
import '../App.css';

function CourseDetails() {
  const [courseData, setCourseData] = useState(null);
  const [showActivityHistory, setShowActivityHistory] = useState(false);
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const { addActivity } = useActivityHistory();
  
  // Custom hooks
  const {
    selectedFile,
    uploadedFile,
    extractedText,
    summary,
    quiz,
    loading: fileLoading,
    showSuccessModal,
    successMessage,
    showSummaryModal,
    handleFileSelect,
    handleFileUpload,
    generateSummary,
    generateQuiz,
    closeSuccessModal,
    closeSummaryModal,
  } = useFileOperations();

  const {
    currentQuestionIndex,
    userAnswers,
    showResults,
    handleQuizAnswer,
    resetQuiz,
    resetQuizState,
  } = useQuizState();

  useEffect(() => {
    const fetchCourseData = () => {
      const savedCourses = localStorage.getItem('courses');
      if (savedCourses) {
        const courses = JSON.parse(savedCourses);
        const course = courses.find(c => c.id === courseId);
        if (course) {
          setCourseData(course);
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
  }, [courseId, navigate, addActivity]);

  const handleQuizAnswerWrapper = (selectedOption) => {
    handleQuizAnswer(selectedOption, quiz.questions.length, quiz);
  };

  const handleFileSelectWrapper = (event) => {
    handleFileSelect(event);
    resetQuizState(); // Reset quiz state when new file is selected
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 max-w-5xl mx-auto flex flex-col pb-8">
        <div className="px-4 mt-6">
          <WelcomeBanner courseTitle={courseData?.title || courseData?.name} />
        </div>

        <FileUploadSection
          selectedFile={selectedFile}
          uploadedFile={uploadedFile}
          extractedText={extractedText}
          loading={fileLoading}
          onFileSelect={handleFileSelectWrapper}
          onFileUpload={handleFileUpload}
        />

        <ActionButtons
          uploadedFile={uploadedFile}
          loading={fileLoading}
          onGenerateSummary={generateSummary}
          onGenerateQuiz={generateQuiz}
        />

        {quiz && !showResults && (
          <QuizSection
            quiz={quiz}
            currentQuestionIndex={currentQuestionIndex}
            onAnswerSelect={handleQuizAnswerWrapper}
          />
        )}

        {showResults && quiz && (
          <QuizResults
            quiz={quiz}
            userAnswers={userAnswers}
            onReset={resetQuiz}
          />
        )}

        <main className="main-content">
        </main>
        
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={closeSuccessModal}
          title="Upload Successful!"
          message={successMessage}
          filename={uploadedFile}
        />

        <SummaryModal
          isOpen={showSummaryModal}
          onClose={closeSummaryModal}
          summary={summary}
          filename={uploadedFile}
        />

        <ActivityHistory
          isOpen={showActivityHistory}
          onClose={() => setShowActivityHistory(false)}
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
      </div>
    </div>
  );
};

export default CourseDetails;
