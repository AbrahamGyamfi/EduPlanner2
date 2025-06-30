import { useState } from 'react';
import axios from 'axios';
import { useActivityHistory, ACTIVITY_TYPES } from './useActivityHistory';

const API_BASE_URL = 'http://localhost:5000';

export const useFileOperations = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [summary, setSummary] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  const { addActivity } = useActivityHistory();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    // Reset previous states when new file is selected
    setUploadedFile(null);
    setSummary('');
    setQuiz(null);
    setExtractedText('');
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadedFile(response.data.filename);
      setExtractedText(response.data.extracted_text);
      setSuccessMessage(response.data.message || 'File uploaded successfully!');
      setShowSuccessModal(true);
      
      // Track activity
      addActivity(
        ACTIVITY_TYPES.FILE_UPLOAD,
        `Uploaded file: ${selectedFile.name}`,
        {
          filename: response.data.filename,
          fileSize: selectedFile.size,
          fileType: selectedFile.type
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading file: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!uploadedFile) {
      alert('Please upload a file first');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/generate-summary`, {
        filename: uploadedFile,
      });

      setSummary(response.data.summary);
      setShowSummaryModal(true);
      
      // Track activity
      addActivity(
        ACTIVITY_TYPES.SUMMARY_GENERATE,
        'Generated document summary',
        {
          filename: uploadedFile,
          summaryLength: response.data.summary.length
        }
      );
    } catch (error) {
      console.error('Summary generation error:', error);
      alert('Error generating summary: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    if (!uploadedFile) {
      alert('Please upload a file first');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/generate-quiz`, {
        filename: uploadedFile,
      });

      setQuiz(response.data.quiz);
      
      // Track activity
      addActivity(
        ACTIVITY_TYPES.QUIZ_GENERATE,
        'Generated interactive quiz',
        {
          filename: uploadedFile,
          questionCount: response.data.quiz.questions.length
        }
      );
    } catch (error) {
      console.error('Quiz generation error:', error);
      alert('Error generating quiz: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage('');
  };

  const closeSummaryModal = () => {
    setShowSummaryModal(false);
  };

  return {
    selectedFile,
    uploadedFile,
    extractedText,
    summary,
    quiz,
    loading,
    showSuccessModal,
    successMessage,
    showSummaryModal,
    handleFileSelect,
    handleFileUpload,
    generateSummary,
    generateQuiz,
    closeSuccessModal,
    closeSummaryModal,
  };
};
