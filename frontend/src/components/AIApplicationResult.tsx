'use client';

import { useState } from 'react';
import { CheckCircleIcon, TargetIcon, LightbulbIcon, PlusIcon, EditIcon } from './Icons';

interface AIApplicationResultProps {
  data: {
    aiEnhancedData: any;
    resumeData: any;
    feedback: any;
    needsManualFix: boolean;
    missingFields: any[];
    skillGaps: any[];
    recommendations: string[];
    aiMatchScore: number;
    score: number;
  };
  onManualEdit?: (field: string, value: any) => void;
  onClose?: () => void;
}

export default function AIApplicationResult({ data, onManualEdit, onClose }: AIApplicationResultProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'missing' | 'skills' | 'recommendations'>('overview');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleManualFix = (field: string, suggestion: string) => {
    if (onManualEdit) {
      onManualEdit(field, suggestion);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">AI-Powered Application Analysis</h2>
              <p className="text-blue-100">Your application has been analyzed with AI insights</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors"
              >
                <PlusIcon size={24} className="rotate-45" />
              </button>
            )}
          </div>
        </div>

        {/* Score Overview */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">{data.score}</div>
              <div className="text-sm text-gray-600">Traditional Score</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold px-3 py-1 rounded-lg ${getScoreColor(data.aiMatchScore || 0)}`}>
                {data.aiMatchScore || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">AI Match Score</div>
            </div>
            <div className="text-center">
              <div className={`flex items-center justify-center px-3 py-1 rounded-lg ${
                data.needsManualFix ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {data.needsManualFix ? (
                  <>
                    <TargetIcon size={16} className="mr-1" />
                    Needs Review
                  </>
                ) : (
                  <>
                    <CheckCircleIcon size={16} className="mr-1" />
                    Complete
                  </>
                )}
              </div>
              <div className="text-sm text-gray-600">Application Status</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('missing')}
              className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
                activeTab === 'missing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Missing Fields
              {data.missingFields?.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {data.missingFields.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
                activeTab === 'skills'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Skill Gaps
              {data.skillGaps?.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {data.skillGaps.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recommendations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Recommendations
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* AI Feedback */}
              {data.feedback && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">AI Feedback</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-blue-700">Strengths:</span>
                      <p className="text-blue-600 mt-1">{data.feedback.strengths}</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">Overall Assessment:</span>
                      <p className="text-blue-600 mt-1">{data.feedback.overallAssessment}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Extracted Data Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Extracted Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Skills:</span>
                    <span className="text-gray-600 ml-2">{data.resumeData?.skills?.length || 0} found</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Experience:</span>
                    <span className="text-gray-600 ml-2">{data.resumeData?.experience?.length || 0} positions</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Education:</span>
                    <span className="text-gray-600 ml-2">{data.resumeData?.education?.length || 0} degrees</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Projects:</span>
                    <span className="text-gray-600 ml-2">{data.resumeData?.projects?.length || 0} projects</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'missing' && (
            <div className="space-y-4">
              {data.missingFields?.length > 0 ? (
                data.missingFields.map((field, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="font-semibold text-gray-900">{field.field}</h4>
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getImportanceColor(field.importance)}`}>
                            {field.importance}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{field.suggestion}</p>
                      </div>
                      {onManualEdit && (
                        <button
                          onClick={() => handleManualFix(field.field, field.suggestion)}
                          className="ml-4 flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <EditIcon size={16} className="mr-1" />
                          Fix Now
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircleIcon size={48} className="text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No critical fields missing!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-4">
              {data.skillGaps?.length > 0 ? (
                data.skillGaps.map((gap, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="font-semibold text-gray-900">{gap.required_skill}</h4>
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getImportanceColor(gap.importance)}`}>
                            {gap.importance}
                          </span>
                          <span className="ml-2 px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                            {gap.candidate_level}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{gap.suggestion}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircleIcon size={48} className="text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">Great job! No significant skill gaps identified.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              {data.recommendations?.length > 0 ? (
                data.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
                    <LightbulbIcon size={20} className="text-yellow-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">{rec}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <LightbulbIcon size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No additional recommendations at this time.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-end space-x-3">
            {data.needsManualFix && onManualEdit && (
              <button
                onClick={() => setActiveTab('missing')}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Review Missing Fields
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
