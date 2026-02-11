'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { jobsAPI } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';
import { BriefcaseIcon, TrendingUpIcon, MapPinIcon, CurrencyDollarIcon, StarIcon } from './Icons';

interface JobRecommendation {
  jobId: number;
  jobTitle: string;
  company: string;
  location: string;
  salaryRange: string;
  employmentType: string;
  matchScore: number;
  matchPercentage: number;
  breakdown: {
    skills: number;
    experience: number;
    education: number;
    location: number;
    salary: number;
    company: number;
  };
  reasons: string[];
  missingSkills: string[];
  applicationStatus: string | null;
  recommendedAt: string;
}

interface RecommendationsResponse {
  recommendations: JobRecommendation[];
  totalJobs: number;
  relevantMatches: number;
  averageMatchScore: number;
  generatedAt: string;
}

export default function JobRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await jobsAPI.getRecommendations();
      setRecommendations(response.data);
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecommendations = recommendations?.recommendations.filter(job => {
    if (filter === 'applied') return job.applicationStatus === 'applied';
    if (filter === 'not-applied') return !job.applicationStatus;
    return true;
  }) || [];

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-blue-600 bg-blue-100';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getMatchLabel = (percentage: number) => {
    if (percentage >= 80) return 'Excellent Match';
    if (percentage >= 60) return 'Good Match';
    if (percentage >= 40) return 'Fair Match';
    return 'Poor Match';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Personalized Job Recommendations</h2>
        </div>
        <LoadingSpinner text="Analyzing your profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Personalized Job Recommendations</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchRecommendations}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Personalized Job Recommendations</h2>
        </div>
        <div className="text-center py-8">
          <BriefcaseIcon size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No job recommendations available</p>
          <p className="text-gray-500 text-sm">Complete your profile to get personalized recommendations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Personalized Job Recommendations</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>{recommendations.relevantMatches} matches</span>
          <span>•</span>
          <span>Avg. Score: {Math.round(recommendations.averageMatchScore)}%</span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{recommendations.totalJobs}</div>
          <div className="text-sm text-gray-600">Total Jobs</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{recommendations.relevantMatches}</div>
          <div className="text-sm text-gray-600">Relevant Matches</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{Math.round(recommendations.averageMatchScore)}%</div>
          <div className="text-sm text-gray-600">Avg. Match</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {recommendations.recommendations.filter(r => r.matchPercentage >= 70).length}
          </div>
          <div className="text-sm text-gray-600">Strong Matches</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Jobs ({recommendations.recommendations.length})
        </button>
        <button
          onClick={() => setFilter('not-applied')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            filter === 'not-applied'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Not Applied ({recommendations.recommendations.filter(r => !r.applicationStatus).length})
        </button>
        <button
          onClick={() => setFilter('applied')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            filter === 'applied'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Applied ({recommendations.recommendations.filter(r => r.applicationStatus).length})
        </button>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {filteredRecommendations.map((job) => (
          <div key={job.jobId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Job Header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                      {job.jobTitle}
                    </h3>
                    <p className="text-gray-600">{job.company}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMatchColor(job.matchPercentage)}`}>
                      {getMatchLabel(job.matchPercentage)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{job.matchPercentage}% Match</div>
                  </div>
                </div>

                {/* Job Details */}
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center">
                    <MapPinIcon size={16} className="mr-1" />
                    {job.location || 'Remote'}
                  </div>
                  <div className="flex items-center">
                    <BriefcaseIcon size={16} className="mr-1" />
                    {job.employmentType}
                  </div>
                  {job.salaryRange && (
                    <div className="flex items-center">
                      <CurrencyDollarIcon size={16} className="mr-1" />
                      {job.salaryRange}
                    </div>
                  )}
                </div>

                {/* Match Breakdown */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Match Breakdown</span>
                    <span className="text-gray-500">Score: {job.matchScore}/100</span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(job.breakdown).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="capitalize text-gray-600">{key}:</span>
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${(value / 25) * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-500">{value}/25</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reasons */}
                {job.reasons.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">Why this matches:</div>
                    <div className="space-y-1">
                      {job.reasons.slice(0, 2).map((reason, index) => (
                        <div key={index} className="flex items-start text-xs text-gray-600">
                          <StarIcon size={12} className="text-green-500 mr-1 mt-0.5" />
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Skills */}
                {job.missingSkills.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">Consider developing:</div>
                    <div className="flex flex-wrap gap-1">
                      {job.missingSkills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.missingSkills.length > 3 && (
                        <span className="text-xs text-gray-500">+{job.missingSkills.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Recommended {new Date(job.recommendedAt).toLocaleDateString()}
                  </div>
                  {job.applicationStatus === 'applied' ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Applied
                    </span>
                  ) : (
                    <button
                      onClick={() => window.location.href = `/jobs/${job.jobId}`}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      View Job
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredRecommendations.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No jobs found for the selected filter</p>
        </div>
      )}
    </div>
  );
}
