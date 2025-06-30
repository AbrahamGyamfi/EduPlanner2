import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

export const useSlideOperations = (courseData, setCourseData) => {
  const [uploadedSlides, setUploadedSlides] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingSlide, setDeletingSlide] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [summary, setSummary] = useState("");
  const [quiz, setQuiz] = useState("");
  const [processing, setProcessing] = useState(false);
  const [processingType, setProcessingType] = useState("");
  const [processingSlide, setProcessingSlide] = useState("");
  const [showResultModal, setShowResultModal] = useState(false);

  const fetchAndExtractText = async (slide) => {
    // Fetch the file from backend
    const response = await fetch(`http://localhost:5000/slides/${encodeURIComponent(slide)}`);
    const blob = await response.blob();
    if (slide.toLowerCase().endsWith(".pdf")) {
      // Extract text from PDF
      const pdf = await pdfjsLib.getDocument({ data: await blob.arrayBuffer() }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(" ") + " ";
      }
      return text;
    } else if (slide.toLowerCase().endsWith(".docx")) {
      // Extract text from Word using mammoth
      const arrayBuffer = await blob.arrayBuffer();
      const { value } = await mammoth.extractRawText({ arrayBuffer });
      return value;
    }
    throw new Error("Unsupported file type");
  };

  const callBackendAPI = async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const endpoint = type === "summarize" ? "/generate-summary" : "/generate-quiz";
    const response = await fetch(`http://localhost:5000${endpoint}`, {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }
    
    const data = await response.json();
    return type === "summarize" ? data.summary : data.quiz;
  };

const handleFileUpload = async (file) => {
  setIsUploading(true);
  setUploadError(null);

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:5000/upload-slide', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData?.error || 'Failed to upload file');
    }

    const result = await response.json();
    const uploadedFileName = result?.filename;

    // Ensure courseData and courseData.slides are valid
    if (courseData && uploadedFileName) {
      const currentSlides = Array.isArray(courseData.slides) ? courseData.slides : [];

      const updatedCourse = {
        ...courseData,
        slides: [...currentSlides, uploadedFileName],
        lastUpdated: new Date().toISOString(),
      };

      // Update localStorage
      const savedCourses = JSON.parse(localStorage.getItem('courses') || '[]');
      const updatedCourses = savedCourses.map(c =>
        c.id === courseData.id ? updatedCourse : c
      );

      localStorage.setItem('courses', JSON.stringify(updatedCourses));
      setCourseData(updatedCourse);
      setUploadedSlides(file); // optional: consider using uploadedFileName
    }
  } catch (error) {
    console.error('Upload error:', error);
    setUploadError(error.message || 'Upload failed');
  } finally {
    setIsUploading(false);
  }
};


  const handleSummarize = async (slide) => {
    setProcessing(true);
    setProcessingType("summary");
    setProcessingSlide(slide);
    setShowResultModal(true);
    setSummary("");
    try {
      // Get the actual file object from the backend
      const response = await fetch(`http://localhost:5000/slides/${encodeURIComponent(slide)}`);
      const blob = await response.blob();
      const file = new File([blob], slide, { type: blob.type });
      
      const summaryResult = await callBackendAPI(file, "summarize");
      setSummary(summaryResult);
    } catch (e) {
      setSummary("Failed to summarize: " + e.message);
    }
    setProcessing(false);
  };

  const handleGenerateQuiz = async (slide) => {
    setProcessing(true);
    setProcessingType("quiz");
    setProcessingSlide(slide);
    setShowResultModal(true);
    setQuiz("");
    try {
      // Get the actual file object from the backend
      const response = await fetch(`http://localhost:5000/slides/${encodeURIComponent(slide)}`);
      const blob = await response.blob();
      const file = new File([blob], slide, { type: blob.type });
      
      const quizResult = await callBackendAPI(file, "quiz");
      setQuiz(quizResult);
    } catch (e) {
      setQuiz("Failed to generate quiz: " + e.message);
    }
    setProcessing(false);
  };

  const confirmDelete = (slideName) => {
    setDeleteError(null);
    setDeletingSlide(slideName);
    setShowDeleteConfirm(true);
  };

  const handleDeleteSlide = async () => {
    if (!deletingSlide) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      const encodedFilename = encodeURIComponent(deletingSlide);
      console.log('Attempting to delete:', encodedFilename);
      const response = await fetch(`http://localhost:5000/slides/${encodedFilename}`, {
        method: 'DELETE'
      });
      console.log('Delete response status:', response.status);

      if (response.ok) {
        console.log('Delete successful');
        const updatedCourse = {
          ...courseData,
          slides: courseData.slides.filter(slide => slide !== deletingSlide),
          lastUpdated: new Date().toISOString()
        };
        const savedCourses = JSON.parse(localStorage.getItem('courses') || '[]');
        const updatedCourses = savedCourses.map(c => 
          c.id === courseData.id ? updatedCourse : c
        );
        localStorage.setItem('courses', JSON.stringify(updatedCourses));
        setCourseData(updatedCourse);
        setShowDeleteConfirm(false);
        setDeletingSlide(null);
      } else {
        const text = await response.text();
        console.log('Delete failed with response:', text);
        throw new Error('Failed to delete slide');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setDeleteError('Failed to delete slide');
    } finally {
      setIsDeleting(false);
    }
  };

  const clearUploadError = () => {
    setUploadError(null);
  };

  const closeResultModal = () => {
    setShowResultModal(false);
  };

  const closeDeleteModal = () => {
    setShowDeleteConfirm(false);
    setDeletingSlide(null);
    setDeleteError(null);
  };

  return {
    // State
    uploadedSlides,
    loading,
    deletingSlide,
    showDeleteConfirm,
    deleteError,
    uploadError,
    isUploading,
    isDeleting,
    summary,
    quiz,
    processing,
    processingType,
    processingSlide,
    showResultModal,
    
    // Actions
    handleFileUpload,
    handleSummarize,
    handleGenerateQuiz,
    confirmDelete,
    handleDeleteSlide,
    clearUploadError,
    closeResultModal,
    closeDeleteModal,
    setLoading
  };
}; 