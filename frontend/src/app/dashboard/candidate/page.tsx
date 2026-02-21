'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import JobRecommendations from '@/components/JobRecommendations';
import LoadingSpinner from '@/components/LoadingSpinner';
import { applicationsAPI, jobsAPI } from '@/lib/api';
import { DataValidation } from '@/utils/dataValidation';
import { BriefcaseIcon, DocumentIcon, TrendingUpIcon, UserIcon, CalendarIcon, CheckCircleIcon, SearchIcon } from '@/components/Icons';
import toast from 'react-hot-toast';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    rankedApplications: 0,
    interviewApplications: 0,
    availableJobs: 0,
    averageScore: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'candidate') {
      router.push('/dashboard/recruiter');
      return;
    }

    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch available jobs
      const jobsResponse = await jobsAPI.getJobs({ status: 'published' });
      if (DataValidation.validateApiResponse(jobsResponse)) {
        setJobs(jobsResponse.data || []);
      }

      // Fetch my applications
      const applicationsResponse = await applicationsAPI.getMyApplications();
      if (DataValidation.validateApiResponse(applicationsResponse)) {
        setApplications(applicationsResponse.data || []);
        
        // Calculate stats
        const apps = applicationsResponse.data || [];
        const avgScore = DataValidation.calculateAverageScore(apps);
        
        setStats({
          totalApplications: apps.length,
          pendingApplications: DataValidation.filterByStatus(apps, 'pending').length,
          rankedApplications: DataValidation.filterByStatus(apps, 'ranked').length,
          interviewApplications: DataValidation.filterByStatus(apps, 'interview').length,
          availableJobs: jobsResponse.data?.length || 0,
          averageScore: Math.round(avgScore)
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // This will be handled by the AuthContext
    router.push('/');
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Candidate Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {user?.firstName}</span>
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DocumentIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <TrendingUpIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Interviews</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.interviewApplications}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Profile Score</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Job Recommendations */}
          <JobRecommendations />

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Applications */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">My Applications</h2>
                    <button 
                      onClick={() => router.push('/jobs')}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Browse Jobs
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {applications.length === 0 ? (
                    <div className="text-center py-8">
                      <DocumentIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No applications yet</p>
                      <button 
                        onClick={() => router.push('/jobs')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Browse Available Jobs
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applications.map((application: any) => (
                        <div key={application.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h3 className="font-medium text-gray-900">{application.job_title || 'Unknown Job'}</h3>
                            <p className="text-sm text-gray-600">Applied: {new Date(application.applied_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              application.status === 'ranked' ? 'bg-green-100 text-green-800' : 
                              application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {application.status}
                            </span>
                            {application.total_score && (
                              <span className="text-sm font-medium text-blue-600">
                                Score: {parseFloat(application.total_score).toFixed(1)}
                              </span>
                            )}
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats & Recommended Jobs */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push('/jobs')}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg text-left font-medium transition-colors"
                  >
                    <div className="flex items-center">
                      <SearchIcon className="w-5 h-5 mr-3" />
                      Browse Jobs
                    </div>
                  </button>
                  <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-left font-medium transition-colors">
                    <div className="flex items-center">
                      <UserIcon className="w-5 h-5 mr-3" />
                      Update Profile
                    </div>
                  </button>
                  <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-left font-medium transition-colors">
                    <div className="flex items-center">
                      <DocumentIcon className="w-5 h-5 mr-3" />
                      My Applications
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Personalized Feedback</p>
                      <p className="text-xs text-gray-600">Get AI-powered insights</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Skill Analysis</p>
                      <p className="text-xs text-gray-600">Improve your profile</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Job Matching</p>
                      <p className="text-xs text-gray-600">Smart recommendations</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}
