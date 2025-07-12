/**
 * Enhanced CWA Analysis Page
 * 
 * This page integrates the Advanced CWA Analyzer with the existing UI,
 * providing comprehensive academic performance analysis and recommendations.
 */

import React, { useState, useEffect } from 'react';
import { useCWAData } from '../hooks/useCWAData';
import { useBehaviorTracking } from '../hooks/useBehaviorTracking';
import useAdvancedCWAAnalysis from '../hooks/useAdvancedCWAAnalysis';
import TabNavigation from '../components/CWA/TabNavigation';
import ProfileTab from '../components/CWA/ProfileTab';
import CoursesTab from '../components/CWA/CoursesTab';
import AnalysisTab from '../components/CWA/AnalysisTab';
import AdvancedCWAResults from '../components/CWA/AdvancedCWAResults';
import CWASummaryWidget from '../components/CWA/CWASummaryWidget';
import BehaviorInsightsPanel from '../components/CWA/BehaviorInsightsPanel';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Zap
} from 'lucide-react';

const EnhancedCWAAnalysisPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showAdvancedResults, setShowAdvancedResults] = useState(false);
  
  // Existing CWA data hooks
  const cwaData = useCWAData();
  const behaviorData = useBehaviorTracking();
  
  // Advanced analysis hook
  const advancedAnalysis = useAdvancedCWAAnalysis();

  const {
    courses,
    studentProfile,
    analysis,
    isAnalyzing,
    formErrors,
    handleAddCourse,
    handleProfileSubmit,
    addAssignment,
    handleDeleteCourse,
    handleDeleteAssignment,
    handleAnalyzePerformance,
    calculateCourseScore,
  } = cwaData;

  const {
    isAnalyzing: isAdvancedAnalyzing,
    analysisResults: advancedResults,
    error: advancedError,
    performAnalysis: runAdvancedAnalysis,
    getQuickSummary,
    hasResults: hasAdvancedResults,
    needsAnalysis,
    analysisStatus
  } = advancedAnalysis;

  // Check if we should show advanced features
  const shouldShowAdvanced = studentProfile && courses.length > 0;
  const canRunAdvancedAnalysis = studentProfile && courses.length >= 1;

  // Auto-switch to advanced results when available
  useEffect(() => {
    if (hasAdvancedResults && !showAdvancedResults && shouldShowAdvanced) {
      setShowAdvancedResults(true);
    }
  }, [hasAdvancedResults, showAdvancedResults, shouldShowAdvanced]);

  const handleBasicAnalyze = () => {
    handleAnalyzePerformance(behaviorData.metrics);
  };

  const handleAdvancedAnalyze = async () => {
    if (canRunAdvancedAnalysis) {
      await runAdvancedAnalysis();
      setShowAdvancedResults(true);
    }
  };

  const handleRefreshAdvanced = async () => {
    await runAdvancedAnalysis();
  };

  const getAnalysisButtonText = () => {
    if (isAdvancedAnalyzing) {
      return `${analysisStatus.message} (${Math.round(advancedAnalysis.analysisProgress)}%)`;
    }
    if (hasAdvancedResults) {
      return 'Refresh Advanced Analysis';
    }
    if (needsAnalysis) {
      return 'Run Advanced CWA Analysis';
    }
    return 'Advanced Analysis Available';
  };

  const renderAnalysisStatusBanner = () => {
    if (!shouldShowAdvanced) return null;

    const statusConfig = {
      analyzing: {
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-800',
        icon: RefreshCw,
        iconClass: 'text-blue-600 animate-spin'
      },
      complete: {
        bg: 'bg-green-50 border-green-200',
        text: 'text-green-800',
        icon: CheckCircle,
        iconClass: 'text-green-600'
      },
      error: {
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-800',
        icon: AlertTriangle,
        iconClass: 'text-red-600'
      },
      ready: {
        bg: 'bg-yellow-50 border-yellow-200',
        text: 'text-yellow-800',
        icon: Zap,
        iconClass: 'text-yellow-600'
      },
      stale: {
        bg: 'bg-orange-50 border-orange-200',
        text: 'text-orange-800',
        icon: Clock,
        iconClass: 'text-orange-600'
      }
    };

    const config = statusConfig[analysisStatus.status] || statusConfig.ready;
    const Icon = config.icon;

    return (
      <div className={`${config.bg} border rounded-lg p-4 mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className={`w-5 h-5 ${config.iconClass}`} />
            <div>
              <div className={`font-medium ${config.text}`}>
                Advanced CWA Analysis
              </div>
              <div className={`text-sm ${config.text} opacity-75`}>
                {analysisStatus.message}
              </div>
            </div>
          </div>
          
          {canRunAdvancedAnalysis && (
            <button
              onClick={handleAdvancedAnalyze}
              disabled={isAdvancedAnalyzing}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isAdvancedAnalyzing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {getAnalysisButtonText()}
            </button>
          )}
        </div>
        
        {isAdvancedAnalyzing && (
          <div className="mt-3">
            <div className="flex justify-between text-sm text-blue-700 mb-1">
              <span>Progress</span>
              <span>{Math.round(advancedAnalysis.analysisProgress)}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${advancedAnalysis.analysisProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderQuickInsights = () => {
    if (!hasAdvancedResults || !advancedResults) return null;

    const { currentCWA, projectedCWA, recommendations } = advancedResults;
    const criticalActions = recommendations.immediate.filter(r => r.priority === 'critical').length;
    const highPriorityActions = recommendations.immediate.filter(r => r.priority === 'high').length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-900">
                {currentCWA.cwa.toFixed(1)}%
              </div>
              <div className="text-sm text-blue-700">Current CWA</div>
            </div>
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        <div className={`rounded-lg p-4 ${
          projectedCWA.changeDirection === 'improving' 
            ? 'bg-gradient-to-br from-green-50 to-green-100' 
            : projectedCWA.changeDirection === 'declining'
            ? 'bg-gradient-to-br from-red-50 to-red-100'
            : 'bg-gradient-to-br from-gray-50 to-gray-100'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-2xl font-bold ${
                projectedCWA.changeDirection === 'improving' ? 'text-green-900' :
                projectedCWA.changeDirection === 'declining' ? 'text-red-900' : 'text-gray-900'
              }`}>
                {projectedCWA.projected.toFixed(1)}%
              </div>
              <div className={`text-sm ${
                projectedCWA.changeDirection === 'improving' ? 'text-green-700' :
                projectedCWA.changeDirection === 'declining' ? 'text-red-700' : 'text-gray-700'
              }`}>
                Projected ({projectedCWA.change > 0 ? '+' : ''}{projectedCWA.change.toFixed(1)})
              </div>
            </div>
            <Target className={`w-6 h-6 ${
              projectedCWA.changeDirection === 'improving' ? 'text-green-600' :
              projectedCWA.changeDirection === 'declining' ? 'text-red-600' : 'text-gray-600'
            }`} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-900">
                {criticalActions + highPriorityActions}
              </div>
              <div className="text-sm text-red-700">Priority Actions</div>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-900">
                {recommendations.studyStrategies.length}
              </div>
              <div className="text-sm text-purple-700">Study Strategies</div>
            </div>
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-full mr-4">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">
              Enhanced CWA Analysis
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Advanced academic performance analysis with AI-powered insights, personalized recommendations, 
            and intelligent study scheduling to maximize your academic success.
          </p>
        </div>

        {/* Analysis Status Banner */}
        {renderAnalysisStatusBanner()}

        {/* Quick Insights */}
        {renderQuickInsights()}

        {/* Advanced Results Display */}
        {showAdvancedResults && hasAdvancedResults && (
          <div className="mb-8">
            <AdvancedCWAResults 
              analysisResults={advancedResults}
              onRefresh={handleRefreshAdvanced}
              isRefreshing={isAdvancedAnalyzing}
            />
          </div>
        )}

        {/* Traditional CWA Analysis - Show when no advanced results or user preference */}
        {(!showAdvancedResults || !hasAdvancedResults) && (
          <>
            {/* Summary Cards */}
            {(studentProfile || courses.length > 0 || analysis) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Summary Widget */}
                <div className="lg:col-span-2">
                  <CWASummaryWidget 
                    profile={studentProfile}
                    courses={courses}
                    analysis={analysis}
                    calculateCourseScore={calculateCourseScore}
                  />
                </div>
                
                {/* Behavior Insights */}
                <div>
                  <BehaviorInsightsPanel 
                    metrics={behaviorData.metrics}
                    sessions={behaviorData.sessions}
                  />
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <TabNavigation 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                studentProfile={studentProfile}
                analysis={analysis}
              />

              <div className="p-6">
                {/* Error Display */}
                {(formErrors.general || advancedError) && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">
                      {formErrors.general || advancedError?.message}
                    </p>
                  </div>
                )}

                {/* Tab Content */}
                {activeTab === 'profile' && (
                  <ProfileTab 
                    studentProfile={studentProfile}
                    onProfileSubmit={handleProfileSubmit}
                    onNext={() => setActiveTab('courses')}
                    formErrors={formErrors}
                  />
                )}

                {activeTab === 'courses' && (
                  <CoursesTab
                    courses={courses}
                    onAddCourse={handleAddCourse}
                    onAddAssignment={addAssignment}
                    onDeleteCourse={handleDeleteCourse}
                    onDeleteAssignment={handleDeleteAssignment}
                    onAnalyze={handleBasicAnalyze}
                    onBackToProfile={() => setActiveTab('profile')}
                    calculateCourseScore={calculateCourseScore}
                    isAnalyzing={isAnalyzing}
                    formErrors={formErrors}
                    behaviorMetrics={behaviorData.metrics}
                  />
                )}

                {activeTab === 'analysis' && analysis && (
                  <AnalysisTab
                    analysis={analysis}
                    onBackToCourses={() => setActiveTab('courses')}
                    onReanalyze={handleBasicAnalyze}
                  />
                )}

                {/* Advanced Analysis Prompt */}
                {activeTab === 'analysis' && analysis && canRunAdvancedAnalysis && !hasAdvancedResults && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Sparkles className="w-6 h-6 text-indigo-600" />
                        <div>
                          <h3 className="text-lg font-semibold text-indigo-800">
                            Unlock Advanced Analysis
                          </h3>
                          <p className="text-indigo-600">
                            Get AI-powered insights, personalized study strategies, and intelligent scheduling
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleAdvancedAnalyze}
                        disabled={isAdvancedAnalyzing}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 font-medium"
                      >
                        {isAdvancedAnalyzing ? 'Analyzing...' : 'Start Advanced Analysis'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Toggle View Button */}
        {hasAdvancedResults && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowAdvancedResults(!showAdvancedResults)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showAdvancedResults ? 'Show Basic Analysis' : 'Show Advanced Results'}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <Brain className="w-4 h-4 mr-1" />
              AI-Powered Analysis
            </div>
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              Performance Prediction
            </div>
            <div className="flex items-center">
              <Target className="w-4 h-4 mr-1" />
              Personalized Recommendations
            </div>
            <div className="flex items-center">
              <Sparkles className="w-4 h-4 mr-1" />
              Smart Scheduling
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCWAAnalysisPage;
