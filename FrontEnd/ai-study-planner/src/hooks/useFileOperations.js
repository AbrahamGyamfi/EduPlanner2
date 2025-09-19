import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useActivityHistory, ACTIVITY_TYPES } from './useActivityHistory';
import { updateCourseProgress, PROGRESS_ACTIVITIES } from '../utils/progressTracking';

const API_BASE_URL = 'http://localhost:5000';

export const useFileOperations = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null); // For backward compatibility
  const [uploadedFile, setUploadedFile] = useState(null); // For backward compatibility
  const [extractedText, setExtractedText] = useState('');
  const [summary, setSummary] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [selectedFileForAction, setSelectedFileForAction] = useState(null);
  const [actionType, setActionType] = useState(''); // 'summary' or 'quiz'
  const [showQuizTypeSelector, setShowQuizTypeSelector] = useState(false);
  const [selectedQuizType, setSelectedQuizType] = useState('mcq'); // 'mcq' or 'theory'
  
  const navigate = useNavigate();
  const { addActivity } = useActivityHistory();
  
  // Initialize uploaded files on mount and when course changes
  useEffect(() => {
    loadUploadedFiles();
  }, []); // Initial load

  // Reload files when course ID changes
  useEffect(() => {
    const handleStorageChange = () => {
      loadUploadedFiles();
    };

    // Listen for sessionStorage changes (when course ID changes)
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when sessionStorage is updated within the same page
    const handleSessionStorageChange = () => {
      loadUploadedFiles();
    };
    
    window.addEventListener('sessionStorageChange', handleSessionStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sessionStorageChange', handleSessionStorageChange);
    };
  }, []);

  // Load uploaded files from localStorage on mount
  const loadUploadedFiles = () => {
    const courseId = sessionStorage.getItem('currentCourseId');
    console.log('📁 Loading files for course:', courseId);
    
    if (courseId) {
      const savedFiles = localStorage.getItem(`uploaded_files_${courseId}`);
      console.log('📁 Found saved files:', savedFiles ? 'Yes' : 'No');
      
      if (savedFiles) {
        const files = JSON.parse(savedFiles);
        console.log('📁 Loading', files.length, 'files for course', courseId);
        setUploadedFiles(files);
        // Set the most recent file for backward compatibility
        if (files.length > 0) {
          const mostRecent = files[files.length - 1];
          setUploadedFile(mostRecent.filename);
          setExtractedText(mostRecent.extractedText);
        } else {
          // No files for this course, clear the state
          setUploadedFile(null);
          setExtractedText('');
        }
      } else {
        // No saved files for this course, clear all file-related state
        console.log('📁 No files found for course', courseId, '- clearing state');
        setUploadedFiles([]);
        setUploadedFile(null);
        setExtractedText('');
      }
    } else {
      // No course ID, clear all state
      console.log('📁 No course ID - clearing all state');
      setUploadedFiles([]);
      setUploadedFile(null);
      setExtractedText('');
    }
  };

  // Save uploaded files to localStorage
  const saveUploadedFiles = (files) => {
    const courseId = sessionStorage.getItem('currentCourseId');
    if (courseId) {
      try {
        console.log('💾 Saving', files.length, 'files for course', courseId);
        localStorage.setItem(`uploaded_files_${courseId}`, JSON.stringify(files));
        console.log('✅ Files saved successfully');
      } catch (error) {
        console.error('❌ Error saving files:', error);
        alert('Error saving files to storage. Your files may not persist between sessions.');
      }
    } else {
      console.warn('⚠️ No course ID available for saving files');
    }
  };

  // Public method to reload files (useful when course changes)
  const reloadFiles = () => {
    loadUploadedFiles();
  };

  // Debug function to check current course isolation
  const debugCourseFiles = () => {
    const courseId = sessionStorage.getItem('currentCourseId');
    console.log('🔍 Course Files Debug Info:');
    console.log('Current Course ID:', courseId);
    console.log('Uploaded Files Count:', uploadedFiles.length);
    console.log('Uploaded Files:', uploadedFiles);
    console.log('Current File:', uploadedFile);
    console.log('LocalStorage Key:', `uploaded_files_${courseId}`);
    console.log('LocalStorage Value:', localStorage.getItem(`uploaded_files_${courseId}`));
    
    // List all course file keys in localStorage
    const allKeys = Object.keys(localStorage).filter(key => key.startsWith('uploaded_files_'));
    console.log('All Course File Keys in Storage:', allKeys);
    
    return {
      courseId,
      uploadedFilesCount: uploadedFiles.length,
      currentFile: uploadedFile,
      allCourseKeys: allKeys
    };
  };

  // Force clear all file state (useful for debugging)
  const clearFileState = () => {
    setUploadedFiles([]);
    setUploadedFile(null);
    setExtractedText('');
    setSelectedFiles([]);
    setSelectedFile(null);
    setSummary('');
    setQuiz(null);
    console.log('🧹 File state cleared');
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 1) {
      // Single file selection (backward compatibility)
      setSelectedFile(files[0]);
      setSelectedFiles([files[0]]);
    } else {
      // Multiple file selection
      setSelectedFiles(files);
      setSelectedFile(files[0]); // Set first file for compatibility
    }
  };

  const handleMultipleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files first');
      return;
    }

    setLoading(true);
    const uploadResults = [];
    const errors = [];
    
    try {
      // Upload files one by one
      for (const file of selectedFiles) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          const newFileData = {
            filename: response.data.filename,
            originalFilename: file.name,
            fileSize: file.size,
            fileType: file.type,
            extractedText: response.data.extracted_text,
            uploadDate: new Date().toISOString()
          };
          
          uploadResults.push(newFileData);
          
          // Track activity
          addActivity(
            ACTIVITY_TYPES.FILE_UPLOAD,
            `Uploaded file: ${file.name}`,
            {
              filename: response.data.filename,
              originalFilename: file.name,
              fileSize: file.size,
              fileType: file.type,
              courseId: sessionStorage.getItem('currentCourseId')
            }
          );
        } catch (fileError) {
          console.error(`Error uploading ${file.name}:`, fileError);
          errors.push(`${file.name}: ${fileError.response?.data?.error || fileError.message}`);
        }
      }
      
      // Update uploaded files list
      const updatedFiles = [...uploadedFiles, ...uploadResults];
      setUploadedFiles(updatedFiles);
      saveUploadedFiles(updatedFiles);
      
      // Set for backward compatibility (use the last uploaded file)
      if (uploadResults.length > 0) {
        const lastUpload = uploadResults[uploadResults.length - 1];
        setUploadedFile(lastUpload.filename);
        setExtractedText(lastUpload.extractedText);
      }
      
      // Clear selected files
      setSelectedFiles([]);
      setSelectedFile(null);
      
      // Show success/error messages
      if (uploadResults.length > 0) {
        setSuccessMessage(`Successfully uploaded ${uploadResults.length} file(s)`);
        setShowSuccessModal(true);
        
        // Update course progress for slide uploads
        const courseId = sessionStorage.getItem('currentCourseId');
        if (courseId) {
          updateCourseProgress(courseId, PROGRESS_ACTIVITIES.SLIDE_UPLOADED, {
            lastUploadedFile: uploadResults[uploadResults.length - 1].originalFilename,
            totalFilesUploaded: updatedFiles.length
          });
        }
      }
      
      if (errors.length > 0) {
        alert(`Some files failed to upload:\n${errors.join('\n')}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error during upload process: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a file
  const handleFileDelete = (filename) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      const updatedFiles = uploadedFiles.filter(file => file.filename !== filename);
      setUploadedFiles(updatedFiles);
      saveUploadedFiles(updatedFiles);
      
      // Track activity
      addActivity(
        ACTIVITY_TYPES.FILE_UPLOAD,
        `Deleted file: ${filename}`,
        {
          filename,
          action: 'delete',
          courseId: sessionStorage.getItem('currentCourseId')
        }
      );
      
      // Update current file if it was deleted
      if (uploadedFile === filename) {
        if (updatedFiles.length > 0) {
          const newCurrent = updatedFiles[updatedFiles.length - 1];
          setUploadedFile(newCurrent.filename);
          setExtractedText(newCurrent.extractedText);
        } else {
          setUploadedFile(null);
          setExtractedText('');
        }
      }
    }
  };
  
  // View a specific file
  const handleViewFile = (file) => {
    setUploadedFile(file.filename);
    setExtractedText(file.extractedText);
    
    // Track activity
    addActivity(
      ACTIVITY_TYPES.PAGE_VISIT,
      `Viewed file: ${file.originalFilename || file.filename}`,
      {
        filename: file.filename,
        originalFilename: file.originalFilename,
        courseId: sessionStorage.getItem('currentCourseId')
      }
    );
  };
  
  // Show file selector modal for actions
  const showFileSelectorForAction = (action) => {
    if (action === '' || !action) {
      // Close modal
      setShowFileSelector(false);
      setActionType('');
    } else {
      // Open modal
      setActionType(action);
      setShowFileSelector(true);
    }
  };
  
  // Close file selector modal
  const closeFileSelector = () => {
    setShowFileSelector(false);
    setActionType('');
  };
  
  // Handle file selection for actions
  const handleFileSelectionForAction = (file) => {
    setSelectedFileForAction(file);
    setShowFileSelector(false);
    
    if (actionType === 'summary') {
      generateSummaryForFile(file);
    } else if (actionType === 'quiz') {
      generateQuizForFile(file);
    }
  };
  
  // Generate summary for specific file
  const generateSummaryForFile = async (file) => {
    if (!file) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/generate-summary`, {
        filename: file.filename,
      });

      setSummary(response.data.summary);
      
      // Navigate to summary page with data
      navigate('/summary', {
        state: {
          summary: response.data.summary,
          filename: file.filename,
          courseId: sessionStorage.getItem('currentCourseId')
        }
      });
      
      // Track activity with full summary data for reference
      addActivity(
        ACTIVITY_TYPES.SUMMARY_GENERATE,
        `Generated summary for ${file.originalFilename || file.filename}`,
        {
          filename: file.filename,
          originalFilename: file.originalFilename,
          summaryLength: response.data.summary.length,
          summaryContent: response.data.summary,
          fileType: file.fileType || file.filename.split('.').pop(),
          courseId: sessionStorage.getItem('currentCourseId'),
          canReuse: true
        }
      );
    } catch (error) {
      console.error('Summary generation error:', error);
      alert('Error generating summary: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Show quiz type selector modal
  const showQuizTypeSelectorModal = () => {
    setShowQuizTypeSelector(true);
  };
  
  // Close quiz type selector modal
  const closeQuizTypeSelector = () => {
    setShowQuizTypeSelector(false);
  };
  
  // Handle quiz type selection
  const handleQuizTypeSelect = (quizType) => {
    setSelectedQuizType(quizType);
    setShowQuizTypeSelector(false);
    
    // Check if we need to show file selector or generate directly
    if (uploadedFiles.length === 1) {
      generateQuizForFile(uploadedFiles[0], quizType);
    } else {
      // Show file selector for quiz generation
      setActionType('quiz');
      setShowFileSelector(true);
    }
  };
  
  // Generate quiz for specific file with quiz type
  const generateQuizForFile = async (file, quizType = selectedQuizType) => {
    if (!file) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/generate-quiz`, {
        filename: file.filename,
        quiz_type: quizType
      });

      setQuiz(response.data.quiz);
      
      // Navigate to quiz page with data
      navigate('/quiz', {
        state: {
          quiz: response.data.quiz,
          filename: file.filename,
          quizType: quizType,
          courseId: sessionStorage.getItem('currentCourseId')
        }
      });
      
      // Track activity with full quiz data for reference
      addActivity(
        ACTIVITY_TYPES.QUIZ_GENERATE,
        `Generated ${quizType.toUpperCase()} quiz for ${file.originalFilename || file.filename}`,
        {
          filename: file.filename,
          originalFilename: file.originalFilename,
          quizType: quizType,
          questionCount: response.data.quiz.questions.length,
          quizContent: response.data.quiz,
          fileType: file.fileType || file.filename.split('.').pop(),
          courseId: sessionStorage.getItem('currentCourseId'),
          canReuse: true
        }
      );
    } catch (error) {
      console.error('Quiz generation error:', error);
      alert('Error generating quiz: ' + (error.response?.data?.error || error.message));
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
      
      // Navigate to summary page with data
      navigate('/summary', {
        state: {
          summary: response.data.summary,
          filename: uploadedFile,
          courseId: sessionStorage.getItem('currentCourseId') // Store courseId for navigation
        }
      });
      
      // Track activity with full summary data for reference
      addActivity(
        ACTIVITY_TYPES.SUMMARY_GENERATE,
        `Generated summary for ${uploadedFile}`,
        {
          filename: uploadedFile,
          summaryLength: response.data.summary.length,
          summaryContent: response.data.summary,
          fileType: uploadedFile.split('.').pop(),
          courseId: sessionStorage.getItem('currentCourseId'),
          canReuse: true
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
      
      // Navigate to quiz page with data
      navigate('/quiz', {
        state: {
          quiz: response.data.quiz,
          filename: uploadedFile,
          courseId: sessionStorage.getItem('currentCourseId') // Store courseId for navigation
        }
      });
      
      // Track activity with full quiz data for reference
      addActivity(
        ACTIVITY_TYPES.QUIZ_GENERATE,
        `Generated quiz for ${uploadedFile}`,
        {
          filename: uploadedFile,
          questionCount: response.data.quiz.questions.length,
          quizContent: response.data.quiz,
          fileType: uploadedFile.split('.').pop(),
          courseId: sessionStorage.getItem('currentCourseId'),
          canReuse: true
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

  return {
    // Backward compatibility
    selectedFile,
    uploadedFile,
    extractedText,
    summary,
    quiz,
    loading,
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
    showFileSelector,
    selectedFileForAction,
    actionType,
    showFileSelectorForAction,
    handleFileSelectionForAction,
    generateSummaryForFile,
    generateQuizForFile,
    loadUploadedFiles,
    reloadFiles, // Add this function for manual reload
    debugCourseFiles, // Add debug function
    clearFileState, // Add clear state function
    // File management functions
    handleFileDelete,
    handleViewFile,
    closeFileSelector,
    // Quiz type selection functionality
    showQuizTypeSelector,
    selectedQuizType,
    showQuizTypeSelectorModal,
    closeQuizTypeSelector,
    handleQuizTypeSelect
  };
};
