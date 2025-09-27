import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const FileServerTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const testEndpoints = [
    {
      name: 'Backend Health Check',
      url: 'http://localhost:5000/',
      method: 'GET'
    },
    {
      name: 'File List Endpoint',
      url: 'http://localhost:5000/files?user_id=test',
      method: 'GET'
    }
  ];

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    for (const test of testEndpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(test.url, {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const duration = Date.now() - startTime;
        const data = await response.text();
        
        setTestResults(prev => [...prev, {
          ...test,
          status: response.ok ? 'success' : 'error',
          statusCode: response.status,
          duration: duration,
          response: data.substring(0, 200) + (data.length > 200 ? '...' : ''),
          error: null
        }]);
      } catch (error) {
        setTestResults(prev => [...prev, {
          ...test,
          status: 'error',
          statusCode: 'N/A',
          duration: 0,
          response: '',
          error: error.message
        }]);
      }
    }
    
    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 m-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">File Server Connectivity Test</h2>
        <button
          onClick={runTests}
          disabled={isRunning}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            isRunning 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          <Play className="w-4 h-4" />
          <span>{isRunning ? 'Running Tests...' : 'Run Tests'}</span>
        </button>
      </div>

      {isRunning && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="animate-pulse text-blue-600">Running connectivity tests...</div>
        </div>
      )}

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700">Test Results:</h3>
          {testResults.map((result, index) => (
            <div key={index} className={`p-4 rounded-lg border ${
              result.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(result.status)}
                  <span className="font-medium">{result.name}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {result.duration}ms | Status: {result.statusCode}
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">
                <strong>URL:</strong> {result.url}
              </div>
              {result.error && (
                <div className="text-sm text-red-600 mb-1">
                  <strong>Error:</strong> {result.error}
                </div>
              )}
              {result.response && (
                <div className="text-sm text-gray-600">
                  <strong>Response:</strong> {result.response}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileServerTest;
