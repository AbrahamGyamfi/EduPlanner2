import React, { useState } from "react";

const ActionCards = ({ uploadedSlides }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [summaryContent, setSummaryContent] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [quizContent, setQuizContent] = useState("");
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  const handleSummaryClick = async () => {
    if (!uploadedSlides) return;
    setLoadingSummary(true);
    const formData = new FormData();
    formData.append("file", uploadedSlides);
    try {
      const response = await fetch("http://localhost:5000/generate-summary", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      setSummaryContent(data.summary || "No summary generated.");
    } catch (e) {
      setSummaryContent("Failed to generate summary.");
    }
    setShowSummary(true);
    setLoadingSummary(false);
  };

  const handleQuizClick = async () => {
    if (!uploadedSlides) return;
    setLoadingQuiz(true);
    const formData = new FormData();
    formData.append("file", uploadedSlides);
    try {
      const response = await fetch("http://localhost:5000/generate-quiz", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      setQuizContent(data.quiz || "No quiz generated.");
    } catch (e) {
      setQuizContent("Failed to generate quiz.");
    }
    setShowQuizModal(true);
    setLoadingQuiz(false);
  };

  const handleResourcesClick = async () => {
    if (!uploadedSlides) return;
    setLoadingResources(true);
    const formData = new FormData();
    formData.append("file", uploadedSlides);
    try {
      const response = await fetch("http://localhost:5000/suggest-resources", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      setResources(data.resources || []);
    } catch (e) {
      setResources([]);
    }
    setShowResourcesModal(true);
    setLoadingResources(false);
  };

  return (
    <>
      <div className="flex flex-wrap gap-8 mt-6 justify-center">
        <button
          onClick={handleSummaryClick}
          className={`flex-1 min-w-[260px] max-w-[340px] bg-white rounded-2xl shadow-md p-8 text-center border-2 border-gray-200 cursor-pointer transition hover:shadow-lg hover:border-indigo-600 hover:-translate-y-0.5 focus:outline-none ${!uploadedSlides ? 'opacity-50 cursor-not-allowed' : ''}`}
          type="button"
          disabled={!uploadedSlides || loadingSummary}
        >
          <div className="text-4xl text-indigo-600 mb-4">📝</div>
          <div className="font-bold text-xl mb-2">Summary</div>
          <div className="text-gray-593 text-base">{uploadedSlides ? 'Get a concise summary of your uploaded slides.' : 'Upload slides to enable summary.'}</div>
        </button>
        <button
          onClick={handleQuizClick}
          className={`flex-1 min-w-[260px] max-w-[340px] bg-white rounded-2xl shadow-md p-8 text-center border-2 border-gray-200 cursor-pointer transition hover:shadow-lg hover:border-indigo-600 hover:-translate-y-0.5 focus:outline-none ${!uploadedSlides ? 'opacity-50 cursor-not-allowed' : ''}`}
          type="button"
          disabled={!uploadedSlides || loadingQuiz}
        >
          <div className="text-4xl text-indigo-600 mb-4">🧩</div>
          <div className="font-bold text-xl mb-2">Quiz Generation</div>
          <div className="text-gray-600 text-base">{uploadedSlides ? 'Generate quizzes from your uploaded slides.' : 'Upload slides to enable quiz generation.'}</div>
        </button>
        <button
          onClick={handleResourcesClick}
          className={`flex-1 min-w-[260px] max-w-[340px] bg-white rounded-2xl shadow-md p-8 text-center border-2 border-gray-200 cursor-pointer transition hover:shadow-lg hover:border-indigo-600 hover:-translate-y-0.5 focus:outline-none ${!uploadedSlides ? 'opacity-50 cursor-not-allowed' : ''}`}
          type="button"
          disabled={!uploadedSlides || loadingResources}
        >
          <div className="text-4xl text-indigo-600 mb-4">📚</div>
          <div className="font-bold text-xl mb-2">Related Resources</div>
          <div className="text-gray-600 text-base">{uploadedSlides ? 'Find related study materials and resources.' : 'Upload slides to find resources.'}</div>
        </button>
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
              Summary of your uploaded slides: <span className="font-semibold text-indigo-700">{uploadedSlides?.name}</span>
            </p>
            <div className="w-full bg-gray-100 rounded-lg p-4 mb-4 text-gray-800 text-left whitespace-pre-wrap min-h-[100px]">
              {summaryContent}
            </div>
            {loadingSummary && <div className="text-indigo-700 font-semibold mb-2">Generating summary...</div>}
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
              Generate quizzes based on your uploaded slides: <span className="font-semibold text-indigo-700">{uploadedSlides?.name}</span>
            </p>
            <div className="w-full bg-gray-100 rounded-lg p-4 mb-4 text-gray-800 text-left whitespace-pre-wrap min-h-[100px]">
              {quizContent}
            </div>
            {loadingQuiz && <div className="text-indigo-700 font-semibold mb-2">Generating quiz...</div>}
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
              Suggested resources based on your slides: <span className="font-semibold text-indigo-700">{uploadedSlides?.name}</span>
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

      {/* Loading Overlay */}
      {(loadingQuiz || loadingSummary || loadingResources) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <div className="text-lg text-indigo-700 font-semibold">
              {loadingQuiz && "Generating quiz..."}
              {loadingSummary && "Generating summary..."}
              {loadingResources && "Finding resources..."}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ActionCards;