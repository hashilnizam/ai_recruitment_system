'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { jobsAPI } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';
import { BriefcaseIcon, MapPinIcon, CurrencyDollarIcon, StarIcon } from './Icons';

interface JobRecommendation {
  id: number;
  title: string;
  description: string;
  recruiter_first_name: string;
  recruiter_last_name: string;
  company_name: string;
  location: string;
  salary_range: string;
  employment_type: string;
  application_count: number;
  applicationStatus: string | null;
}

interface RecommendationsResponse {
  relevantMatches: number;
  jobs: JobRecommendation[];
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

  const filteredRecommendations = recommendations?.jobs.filter(job => {
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

  if (!recommendations || recommendations.jobs.length === 0) {
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
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {recommendations.relevantMatches} jobs found
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Jobs ({recommendations.jobs.length})
        </button>
        <button
          onClick={() => setFilter('not-applied')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            filter === 'not-applied'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Not Applied
        </button>
        <button
          onClick={() => setFilter('applied')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            filter === 'applied'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Applied
        </button>
      </div>

      {/* Job List */}
      <div className="space-y-4">
        {filteredRecommendations.map((job) => (
          <div
            key={job.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => window.location.href = `/jobs/${job.id}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{job.description}</p>
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <div className="flex items-center">
                    <BriefcaseIcon size={16} className="mr-1" />
                    {job.company_name}
                  </div>
                  {job.location && (
                    <div className="flex items-center">
                      <MapPinIcon size={16} className="mr-1" />
                      {job.location}
                    </div>
                  )}
                  {job.salary_range && (
                    <div className="flex items-center">
                      <CurrencyDollarIcon size={16} className="mr-1" />
                      {job.salary_range}
                    </div>
                  )}
                  <div className="flex items-center">
                    <BriefcaseIcon size={16} className="mr-1" />
                    {job.employment_type}
                  </div>
                </div>
              </div>
              
              <div className="ml-4 flex flex-col items-end">
                {job.applicationStatus === 'applied' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Applied
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Apply Now
                  </span>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  {job.application_count} applicants
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <div className="text-center py-8">
          <BriefcaseIcon size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No jobs found for this filter</p>
          <p className="text-gray-500 text-sm">Try a different filter</p>
        </div>
      )}
    </div>
  );
}
