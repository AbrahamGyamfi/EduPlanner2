import React, { useState, useEffect, useRef } from 'react';
import { Eye, BookOpen, ZoomIn, ZoomOut, RotateCcw, Download, Maximize2, Minimize2, Search, BookmarkPlus, HighlighterIcon, FileText, BarChart3, Copy, Timer } from 'lucide-react';
import { useEnhancedStudyTracker } from '../hooks/useEnhancedStudyTracker';

const SlideViewer = ({ 
  extractedText, 
  filename, 
  onReadingProgress, 
  onInteraction 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [viewMode, setViewMode] = useState('formatted'); // 'formatted', 'raw', or 'info'
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const [showControls, setShowControls] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  
  const viewerRef = useRef(null);
  const contentRef = useRef(null);

  // Process text for better reading experience while preserving full content
  const processedContent = React.useMemo(() => {
    if (!extractedText) return { paragraphs: [], totalWords: 0, fullText: '' };
    
    // Preserve the full original text
    const fullText = extractedText;
    
    // Split into paragraphs for better formatting but keep all content
    const paragraphs = extractedText
      .split(/\n+/) // Split on any number of newlines
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map((paragraph, index) => {
        // Don't split long paragraphs - preserve original structure
        // Just categorize based on length for styling
        const isLikelyHeading = (
          paragraph.length < 100 && 
          !paragraph.includes('.') && 
          paragraph.split(' ').length <= 10
        ) || paragraph.match(/^(Chapter|Section|Part|Introduction|Conclusion|Summary)/i);
        
        return {
          id: index.toString(),
          text: paragraph,
          type: isLikelyHeading ? 'heading' : 'paragraph'
        };
      });
    
    const totalWords = fullText.split(/\s+/).length;
    
    return { paragraphs, totalWords, fullText };
  }, [extractedText]);

  // Scroll and interaction tracking
  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;
    
    const handleScroll = () => {
      const scrollTop = contentEl.scrollTop;
      const scrollHeight = contentEl.scrollHeight - contentEl.clientHeight;
      const progress = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 100;
      setReadingProgress(progress);
      
      if (onReadingProgress) {
        onReadingProgress(progress, 1, 1); // Paged mode is deprecated
      }
      if (onInteraction) {
        onInteraction('scroll', { progress });
      }
    };

    contentEl.addEventListener('scroll', handleScroll);
    return () => contentEl.removeEventListener('scroll', handleScroll);
  }, [onReadingProgress, onInteraction]);

  // Reading time and interaction tracking
  useEffect(() => {
    const startTime = Date.now();
    if (onInteraction) {
      onInteraction('start_reading', { 
        filename, 
        startTime,
        autoStart: true // Flag to indicate automatic session start
      });
    }

    return () => {
      const endTime = Date.now();
      const readingTime = endTime - startTime;
      if (onInteraction) {
        onInteraction('end_reading', { 
          filename, 
          readingTime, 
          finalProgress: readingProgress,
          autoStop: true // Flag to indicate automatic session stop
        });
      }
    };
    // Remove readingProgress from dependency array to prevent infinite loop
  }, [filename, onInteraction]);

  // Search functionality
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    const regex = new RegExp(searchTerm, 'gi');
    const results = [];
    processedContent.paragraphs.forEach((p, index) => {
      if (p.text.match(regex)) {
        results.push({ paragraphId: p.id, index });
      }
    });

    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
    
    if (results.length > 0) {
      scrollToResult(results[0].paragraphId);
    }
  };

  const scrollToResult = (paragraphId) => {
    const element = document.getElementById(`paragraph-${paragraphId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const nextSearchResult = () => {
    if (searchResults.length > 0) {
      const nextIndex = (currentSearchIndex + 1) % searchResults.length;
      setCurrentSearchIndex(nextIndex);
      scrollToResult(searchResults[nextIndex].paragraphId);
    }
  };

  const prevSearchResult = () => {
    if (searchResults.length > 0) {
      const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
      setCurrentSearchIndex(prevIndex);
      scrollToResult(searchResults[prevIndex].paragraphId);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resetView = () => {
    setFontSize(16);
    setLineHeight(1.6);
    setSearchTerm('');
    setSearchResults([]);
  };
  
  const copyFullText = () => {
    navigator.clipboard.writeText(processedContent.fullText);
    alert('Full text copied to clipboard!');
  };
  
  const downloadText = () => {
    const blob = new Blob([processedContent.fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!extractedText) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Content to Display</h3>
        <p className="text-gray-600">Upload a file to start reading and studying.</p>
      </div>
    );
  }

  return (
    <div 
      ref={viewerRef}
      className={`slide-viewer-container bg-gray-100 rounded-2xl shadow-xl overflow-hidden relative ${
        isFullscreen ? 'fixed inset-0 z-50' : 'mt-6'
      }`}
      style={{ height: isFullscreen ? '100vh' : '600px' }}
    >
      {/* View Mode Tabs */}
      <div className="absolute top-4 left-4 z-40 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setViewMode('formatted')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'formatted' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-blue-50'
            }`}
            title="Formatted view"
          >
            <Eye className="w-4 h-4 inline mr-1" /> Formatted
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'raw' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-blue-50'
            }`}
            title="Raw text view"
          >
            <FileText className="w-4 h-4 inline mr-1" /> Raw
          </button>
          <button
            onClick={() => setViewMode('info')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'info' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-blue-50'
            }`}
            title="Document information"
          >
            <BarChart3 className="w-4 h-4 inline mr-1" /> Info
          </button>
        </div>
      </div>

      {/* Floating Toolbar */}
      {showControls && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-2 flex items-center space-x-2 border">
          <button 
            onClick={() => setFontSize(s => Math.max(12, s - 1))} 
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Decrease font size"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setFontSize(s => Math.min(24, s + 1))} 
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Increase font size"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            onClick={resetView} 
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Reset view"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button 
            onClick={copyFullText} 
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Copy full text"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button 
            onClick={downloadText} 
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Download text"
          >
            <Download className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300" />
          <button 
            onClick={toggleFullscreen} 
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Content Area */}
      <div
        ref={contentRef}
        className="content-area overflow-y-auto h-full px-8 py-6 md:px-12 md:py-8 lg:px-16 lg:py-10 text-gray-800 bg-white"
        onMouseUp={(e) => setSelectedText(window.getSelection().toString())}
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Formatted View */}
        {viewMode === 'formatted' && (
          <div 
            className="prose max-w-3xl mx-auto transition-all duration-300"
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
          >
            <h1 className="text-3xl font-bold mb-4 border-b pb-2">{filename}</h1>
            {processedContent.paragraphs.map(p => (
              <p 
                key={p.id}
                id={`paragraph-${p.id}`}
                className={`${p.type === 'heading' ? 'text-xl font-semibold mt-6 mb-2' : 'mb-4'} text-justify`}
              >
                {p.text}
              </p>
            ))}
          </div>
        )}

        {/* Raw Text View */}
        {viewMode === 'raw' && (
          <div 
            className="max-w-full mx-auto transition-all duration-300"
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
          >
            <h1 className="text-2xl font-bold mb-4 border-b pb-2">{filename} - Raw Text</h1>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <p className="text-sm text-gray-600 mb-2">Complete unprocessed text content:</p>
              <pre 
                className="whitespace-pre-wrap font-mono text-sm text-gray-800 bg-white p-4 rounded border max-h-96 overflow-y-auto"
                style={{ fontSize: `${Math.max(12, fontSize - 2)}px` }}
              >
                {processedContent.fullText}
              </pre>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Actions</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={copyFullText}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy All Text</span>
                </button>
                <button 
                  onClick={downloadText}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download as TXT</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Document Info View */}
        {viewMode === 'info' && (
          <div className="max-w-4xl mx-auto transition-all duration-300">
            <h1 className="text-2xl font-bold mb-6 border-b pb-2">{filename} - Document Information</h1>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Statistics */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl border">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                  Content Statistics
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Total Words:</span>
                    <span className="font-semibold">{processedContent.totalWords.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Total Characters:</span>
                    <span className="font-semibold">{processedContent.fullText.length.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Paragraphs:</span>
                    <span className="font-semibold">{processedContent.paragraphs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Estimated Reading Time:</span>
                    <span className="font-semibold">{Math.ceil(processedContent.totalWords / 200)} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Average Words per Paragraph:</span>
                    <span className="font-semibold">{Math.round(processedContent.totalWords / processedContent.paragraphs.length)}</span>
                  </div>
                </div>
              </div>

              {/* Content Preview */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl border">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-green-600" />
                  Content Preview
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">First 200 characters:</span>
                    <div className="mt-1 p-3 bg-white rounded border text-sm italic">
                      {processedContent.fullText.substring(0, 200)}...
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Detected Headings:</span>
                    <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                      {processedContent.paragraphs
                        .filter(p => p.type === 'heading')
                        .slice(0, 5)
                        .map(heading => (
                          <div key={heading.id} className="text-sm bg-white p-2 rounded border">
                            {heading.text.substring(0, 60)}...
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Document Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setViewMode('formatted')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Formatted</span>
                </button>
                <button 
                  onClick={() => setViewMode('raw')}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Raw Text</span>
                </button>
                <button 
                  onClick={copyFullText}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy All</span>
                </button>
                <button 
                  onClick={downloadText}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reading Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-transparent">
        <div 
          className="h-full bg-blue-600 transition-all duration-200"
          style={{ width: `${readingProgress}%` }}
        />
      </div>
      
      {/* Search UI */}
      <div className="absolute top-4 right-4 z-40">
        <form onSubmit={handleSearch} className="flex items-center bg-white rounded-lg shadow-md">
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search document..."
            className="px-3 py-2 w-48 rounded-l-lg border-0 focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="p-2 hover:bg-gray-100"><Search className="w-5 h-5" /></button>
          {searchResults.length > 0 && (
            <div className="flex items-center space-x-1 pl-2">
              <span className="text-sm text-gray-600">{currentSearchIndex + 1}/{searchResults.length}</span>
              <button onClick={prevSearchResult} className="p-1 hover:bg-gray-200 rounded-full">‹</button>
              <button onClick={nextSearchResult} className="p-1 hover:bg-gray-200 rounded-full">›</button>
            </div>
          )}
        </form>
      </div>
      
      {/* Text Selection Toolbar */}
      {selectedText && (
        <div 
          className="fixed z-50 bg-gray-800 text-white rounded-lg shadow-lg p-2 flex items-center space-x-2"
          style={{ 
            top: '50%', // Position needs to be calculated based on selection
            left: '50%' 
          }}
        >
          <button onClick={() => alert('Highlighting: ' + selectedText)} className="flex items-center space-x-1 hover:bg-gray-700 p-1 rounded">
            <HighlighterIcon className="w-4 h-4" />
            <span>Highlight</span>
          </button>
          <button onClick={() => alert('Bookmarking: ' + selectedText)} className="flex items-center space-x-1 hover:bg-gray-700 p-1 rounded">
            <BookmarkPlus className="w-4 h-4" />
            <span>Bookmark</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SlideViewer;
