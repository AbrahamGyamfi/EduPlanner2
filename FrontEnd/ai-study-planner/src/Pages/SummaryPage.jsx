import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SummarySection from '../components/SummarySection';
import Toast from '../components/Toast';
import { useActivityHistory, ACTIVITY_TYPES } from '../hooks/useActivityHistory';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

function SummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { summary, filename, courseId, fileId } = location.state || {};
  const { addActivity } = useActivityHistory();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isAlreadySaved, setIsAlreadySaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  // Toast notification state
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success'
  });
  
  // Check if this summary is already saved
  useEffect(() => {
    const checkIfSaved = () => {
      const userId = localStorage.getItem('userId') || 'default-user';
      // You could check with backend or check localStorage for saved summaries
      // For now, we'll assume it's not saved initially
      setIsAlreadySaved(false);
    };
    
    if (summary) {
      checkIfSaved();
    }
  }, [summary]);

  const handleGoBack = () => {
    if (courseId) {
      navigate(`/coursedetails/${courseId}`);
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  const handleClose = () => {
    navigate('/courses'); // Go to courses page
  };
  
  const showToast = (message, type = 'success') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };
  
  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };
  
  const handleCopy = () => {
    showToast('Summary copied to clipboard!', 'success');
  };
  
  const handleSaveSummary = async () => {
    if (!summary || !courseId || isAlreadySaved || isSaving) {
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const userId = localStorage.getItem('userId') || 'default-user';
      
      const saveData = {
        user_id: userId,
        summary: summary,
        course_id: courseId,
        course_name: filename || 'Document Summary',
        file_id: fileId
      };
      
      const response = await axios.post(`${API_BASE_URL}/save-summary`, saveData);
      
      if (response.data.status === 'success') {
        // Add to activity history for local tracking
        addActivity(
          ACTIVITY_TYPES.SUMMARY_GENERATE,
          `Saved summary for ${filename || 'document'}`,
          {
            summaryId: response.data.summary_id,
            courseId: courseId,
            fileId: fileId,
            summaryLength: summary.length,
            summaryContent: summary.substring(0, 500) + '...' // Truncate for storage
          }
        );
        
        setIsAlreadySaved(true);
        
        // Show success toast notification
        showToast('Summary saved successfully! It will appear in your activities.', 'success');
      }
    } catch (error) {
      console.error('Error saving summary:', error);
      setSaveError(error.response?.data?.error || error.message || 'Error saving summary');
      showToast('Failed to save summary: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 max-w-5xl mx-auto flex flex-col pb-8">
        {/* Header with navigation */}
        <div className="px-4 mt-6 mb-4">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleGoBack}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Upload
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Summary for {filename}</h1>
                  <p className="text-sm text-gray-600">Generated document summary</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            </div>
          </div>
        </div>
        <SummarySection 
          summary={summary} 
          onSave={handleSaveSummary}
          onCopy={handleCopy}
          isSaving={isSaving}
          isAlreadySaved={isAlreadySaved}
        />
      </div>
      
      {/* Toast Notification */}
      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={4000}
      />
    </div>
  );
}

export default SummaryPage;
