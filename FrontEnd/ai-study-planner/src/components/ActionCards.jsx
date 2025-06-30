import React, { useState, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

const ActionCards = ({ courseData, hasSlides, onSummarize, onGenerateQuiz, onGenerateFlashcards }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [summaryContent, setSummaryContent] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [quizContent, setQuizContent] = useState("");
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Check if there are uploaded slides
  const hasUploadedSlides = courseData?.slides && courseData.slides.length > 0;

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

  const handleSummaryClick = async () => {
    if (!hasUploadedSlides) return;
    setLoadingSummary(true);
    setShowSummary(true);
    setSummaryContent("");
    
    try {
      // Use the first uploaded slide for summary
      const firstSlide = courseData.slides[0];
      // Get the actual file object from the backend
      const response = await fetch(`http://localhost:5000/slides/${encodeURIComponent(firstSlide)}`);
      const blob = await response.blob();
      const file = new File([blob], firstSlide, { type: blob.type });
      
      const summaryResult = await callBackendAPI(file, "summarize");
      setSummaryContent(summaryResult);
    } catch (e) {
      setSummaryContent("Failed to generate summary: " + e.message);
    }
    setLoadingSummary(false);
  };

  const handleQuizClick = async () => {
    if (!hasUploadedSlides) return;
    setLoadingQuiz(true);
    setShowQuizModal(true);
    setQuizContent("");
    
    try {
      // Use the first uploaded slide for quiz
      const firstSlide = courseData.slides[0];
      // Get the actual file object from the backend
      const response = await fetch(`http://localhost:5000/slides/${encodeURIComponent(firstSlide)}`);
      const blob = await response.blob();
      const file = new File([blob], firstSlide, { type: blob.type });
      
      const quizResult = await callBackendAPI(file, "quiz");
      setQuizContent(quizResult);
    } catch (e) {
      setQuizContent("Failed to generate quiz: " + e.message);
    }
    setLoadingQuiz(false);
  };

  const handleResourcesClick = async () => {
    if (!hasUploadedSlides) return;
    setLoadingResources(true);
    setShowResourcesModal(true);
    setResources([]);
    
    try {
      // Generate resources based on slide names
      const slideNames = courseData.slides.map(slide => slide.split('.')[0]);
      const resources = slideNames.map(name => ({
        title: `${name} - Wikipedia`,
        description: `Learn more about ${name} on Wikipedia`,
        type: "Reference",
        url: `https://en.wikipedia.org/wiki/${name.replace(' ', '_')}`
      }));
      setResources(resources);
    } catch (e) {
      setResources([]);
    }
    setLoadingResources(false);
  };

  // Debug log to see the value
  console.log("ActionCards hasSlides:", hasSlides);
  
  // Fix: Remove the useEffect with undefined uploadedSlides reference
  useEffect(() => {
    console.log("Current slide state:", {
      courseDataSlides: courseData?.slides,
      hasSlides: hasSlides
    });
  }, [courseData?.slides, hasSlides]);

  return (
    <>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col h-full">
            <h3 className="font-bold text-lg mb-2 text-indigo-700">Summary</h3>
            <p className="text-gray-600 mb-4 flex-grow">Generate a concise summary of your slide content</p>
            <button 
              onClick={handleSummaryClick}
              disabled={!hasSlides}
              className={`${hasSlides 
                ? 'bg-indigo-600 hover:bg-indigo-700' 
                : 'bg-gray-300 cursor-not-allowed'} 
                text-white py-2 px-4 rounded-lg transition-colors`}
            >
              {hasSlides ? 'Generate Summary' : 'Upload slides first'}
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col h-full">
            <h3 className="font-bold text-lg mb-2 text-indigo-700">Quiz</h3>
            <p className="text-gray-600 mb-4 flex-grow">Create questions to test your knowledge</p>
            <button 
              onClick={handleQuizClick}
              disabled={!hasSlides}
              className={`${hasSlides 
                ? 'bg-indigo-600 hover:bg-indigo-700' 
                : 'bg-gray-300 cursor-not-allowed'} 
                text-white py-2 px-4 rounded-lg transition-colors`}
            >
              {hasSlides ? 'Generate Quiz' : 'Upload slides first'}
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col h-full">
            <h3 className="font-bold text-lg mb-2 text-indigo-700">Flashcards</h3>
            <p className="text-gray-600 mb-4 flex-grow">Create flashcards to enhance your memory</p>
            <button 
              onClick={onGenerateFlashcards}
              disabled={!hasSlides || !onGenerateFlashcards}
              className={`${hasSlides && onGenerateFlashcards
                ? 'bg-indigo-600 hover:bg-indigo-700' 
                : 'bg-gray-300 cursor-not-allowed'} 
                text-white py-2 px-4 rounded-lg transition-colors`}
            >
              {!hasSlides ? 'Upload slides first' : 'Coming Soon'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg max-w-xl w-full p-10 flex flex-col items-center relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowSummary(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-2 text-center">Summary</h2>
            <p className="text-gray-500 mb-8 text-center max-w-md">
              Summary of your uploaded slides: <span className="font-semibold text-indigo-700">{courseData?.slides?.[0]}</span>
            </p>
            <div className="w-full bg-gray-100 rounded-lg p-4 mb-4 text-gray-800 text-left whitespace-pre-wrap min-h-[100px]">
              {loadingSummary ? "Generating summary..." : summaryContent}
            </div>
            <button
              className="text-gray-500 hover:text-indigo-700 text-base mt-4"
              onClick={() => setShowSummary(false)}
            >
              &larr; Back to Course
            </button>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg max-w-xl w-full p-10 flex flex-col items-center relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowQuizModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-2 text-center">Quiz Generation</h2>
            <p className="text-gray-500 mb-8 text-center max-w-md">
              Generate quizzes based on your uploaded slides: <span className="font-semibold text-indigo-700">{courseData?.slides?.[0]}</span>
            </p>
            <div className="w-full bg-gray-100 rounded-lg p-4 mb-4 text-gray-800 text-left whitespace-pre-wrap min-h-[100px]">
              {loadingQuiz ? "Generating quiz..." : quizContent}
            </div>
            <button
              className="text-gray-500 hover:text-indigo-700 text-base mt-4"
              onClick={() => setShowQuizModal(false)}
            >
              &larr; Back to Course
            </button>
          </div>
        </div>
      )}

      {/* Resources Modal */}
      {showResourcesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg max-w-xl w-full p-10 flex flex-col items-center relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowResourcesModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-2 text-center">Related Resources</h2>
            <p className="text-gray-500 mb-8 text-center max-w-md">
              Suggested resources based on your slides: <span className="font-semibold text-indigo-700">{courseData?.slides?.[0]}</span>
            </p>
            <div className="w-full space-y-4">
              {resources.length > 0 ? (
                resources.map((resource, index) => (
                  <div key={index} className="bg-gray-100 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">{resource.title}</h3>
                    <p className="text-gray-600 mb-2">{resource.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{resource.type}</span>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        View Resource &rarr;
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-600">
                  {loadingResources ? "Finding resources..." : "No related resources found."}
                </div>
              )}
            </div>
            <button
              className="text-gray-500 hover:text-indigo-700 text-base mt-6"
              onClick={() => setShowResourcesModal(false)}
            >
              &larr; Back to Course
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ActionCards;