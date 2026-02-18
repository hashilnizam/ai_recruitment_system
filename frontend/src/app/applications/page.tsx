'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { applicationsAPI } from '@/lib/api';
import { DataValidation } from '@/utils/dataValidation';
import { 
  DocumentIcon, 
  ClockIcon, 
  TargetIcon, 
  ChartIcon,
  BriefcaseIcon,
  UserIcon
} from '@/components/Icons';
import toast from 'react-hot-toast';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationsAPI.getMyApplications();
      
      if (DataValidation.validateApiResponse(response)) {
        setApplications(response.data.data || []);
      } else {
        toast.error('Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter((app: any) => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      ranked: 'bg-blue-100 text-blue-700',
      reviewed: 'bg-purple-100 text-purple-700',
      shortlisted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return DataValidation.safeGetString(colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon size={16} />;
      case 'ranked': return <ChartIcon size={16} />;
      case 'reviewed': return <TargetIcon size={16} />;
      case 'shortlisted': return <TargetIcon size={16} />;
      case 'rejected': return <DocumentIcon size={16} />;
      default: return <DocumentIcon size={16} />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Loading applications..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
            <p className="text-gray-600">Track your job applications and status</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by status:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Applications</option>
              <option value="pending">Pending</option>
              <option value="ranked">Ranked</option>
              <option value="reviewed">Reviewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <DocumentIcon size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "You haven't applied to any jobs yet" 
                : `No applications with status "${filter}"`
              }
            </p>
            <button
              onClick={() => window.location.href = '/jobs'}
              className="mt-4 bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application: any) => (
              <div key={application.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{application.job_title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center space-x-1 ${getStatusColor(application.status)}`}>
                        {getStatusIcon(application.status)}
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <BriefcaseIcon size={14} className="mr-1" />
                          {application.company_name || 'Company'}
                        </span>
                        <span className="flex items-center">
                          <UserIcon size={14} className="mr-1" />
                          {application.location || 'Remote'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <ClockIcon size={14} className="mr-1" />
                          Applied: {new Date(application.applied_at).toLocaleDateString()}
                        </span>
                        {DataValidation.safeGetNumber(application.total_score, 0) && (
                          <span className="flex items-center">
                            <ChartIcon size={14} className="mr-1" />
                            Score: {DataValidation.safeGetNumber(application.total_score, 0).toFixed(1)}
                          </span>
                        )}
                        {application.rank_position && (
                          <span className="flex items-center">
                            <TargetIcon size={14} className="mr-1" />
                            Rank: #{application.rank_position}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* AI Feedback */}
                    {application.feedback && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">AI Feedback</h4>
                        <div className="space-y-2 text-sm">
                          {application.feedback.strengths && (
                            <div>
                              <span className="font-medium text-green-700">Strengths:</span>
                              <p className="text-gray-600">{application.feedback.strengths}</p>
                            </div>
                          )}
                          {application.feedback.missing_skills && (
                            <div>
                              <span className="font-medium text-orange-700">Areas to Improve:</span>
                              <p className="text-gray-600">{application.feedback.missing_skills}</p>
                            </div>
                          )}
                          {application.feedback.suggestions && (
                            <div>
                              <span className="font-medium text-blue-700">Suggestions:</span>
                              <p className="text-gray-600">{application.feedback.suggestions}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <button
                      onClick={() => window.location.href = `/jobs/${application.job_id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      View Job →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
