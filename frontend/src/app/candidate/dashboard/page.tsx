'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import Table from '@/components/Table';
import { applicationsAPI, jobsAPI } from '@/lib/api';
import { 
  BriefcaseIcon, 
  DocumentIcon, 
  UsersIcon, 
  ChartIcon, 
  TargetIcon,
  ClockIcon
} from '@/components/Icons';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    shortlistedApplications: 0,
    avgMatchScore: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'candidate') {
      router.push('/auth/login?role=candidate');
      return;
    }
    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch applications
      const appsResponse = await applicationsAPI.getMyApplications();
      const applications = appsResponse.data.data || [];
      
      // Fetch jobs
      const jobsResponse = await jobsAPI.getJobs({ status: 'published', limit: 5 });
      const jobs = jobsResponse.data.data || [];
      
      setRecentApplications(applications.slice(0, 5));
      setRecommendedJobs(jobs);
      
      // Calculate stats
      const totalApps = applications.length;
      const pendingApps = applications.filter((app: any) => app.status === 'pending').length;
      const shortlistedApps = applications.filter((app: any) => app.status === 'shortlisted').length;
      const avgScore = applications.length > 0
        ? applications.reduce((sum: number, app: any) => sum + (app.total_score || 0), 0) / applications.length
        : 0;
      
      setStats({
        totalApplications: totalApps,
        pendingApplications: pendingApps,
        shortlistedApplications: shortlistedApps,
        avgMatchScore: Math.round(avgScore),
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </Layout>
    );
  }

  const applicationColumns = [
    {
      key: 'job_title',
      label: 'Position',
      render: (value: string, row: any) => (
        <div>
          <p className="font-semibold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{row.company_name || 'Company'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => {
        const colors: Record<string, string> = {
          pending: 'bg-yellow-100 text-yellow-700',
          ranked: 'bg-blue-100 text-blue-700',
          shortlisted: 'bg-green-100 text-green-700',
          rejected: 'bg-red-100 text-red-700',
        };
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[value] || 'bg-gray-100 text-gray-700'}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      },
    },
    {
      key: 'total_score',
      label: 'Match Score',
      render: (score: number) => (
        score ? (
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="font-bold text-blue-600">{Math.round(score)}%</span>
          </div>
        ) : (
          <span className="text-sm text-gray-500">Not ranked</span>
        )
      ),
    },
    {
      key: 'applied_at',
      label: 'Applied',
      render: (date: string) => (
        <span className="text-sm text-gray-600">
          {new Date(date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Applications"
            value={stats.totalApplications}
            change="+12%"
            changeType="increase"
            icon={<DocumentIcon size={24} />}
            iconBgColor="bg-gradient-to-br from-blue-400 to-blue-600"
          />
          <StatCard
            title="Pending Review"
            value={stats.pendingApplications}
            change="+3%"
            changeType="increase"
            icon={<ClockIcon size={24} />}
            iconBgColor="bg-gradient-to-br from-yellow-400 to-yellow-600"
          />
          <StatCard
            title="Shortlisted"
            value={stats.shortlistedApplications}
            change="+8%"
            changeType="increase"
            icon={<TargetIcon size={24} />}
            iconBgColor="bg-gradient-to-br from-green-400 to-green-600"
          />
          <StatCard
            title="Avg Match Score"
            value={`${stats.avgMatchScore}%`}
            change="+5%"
            changeType="increase"
            icon={<ChartIcon size={24} />}
            iconBgColor="bg-gradient-to-br from-purple-400 to-purple-600"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => router.push('/jobs')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <BriefcaseIcon size={24} className="text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-lg">Browse Jobs</p>
                <p className="text-sm text-white/80">Find new opportunities</p>
              </div>
            </div>
            <span className="block mt-4 text-sm font-medium group-hover:translate-x-1 transition-transform">
              Explore jobs →
            </span>
          </button>

          <button
            onClick={() => router.push('/applications')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <DocumentIcon size={24} className="text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-lg">My Applications</p>
                <p className="text-sm text-white/80">Track your progress</p>
              </div>
            </div>
            <span className="block mt-4 text-sm font-medium group-hover:translate-x-1 transition-transform">
              View applications →
            </span>
          </button>
        </div>

        {/* Recent Applications */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Recent Applications</h2>
            <button
              onClick={() => router.push('/applications')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
            >
              <span>View all</span>
              <span>→</span>
            </button>
          </div>
          
          {recentApplications.length === 0 ? (
            <div className="bg-white rounded-xl p-12 shadow-sm text-center">
              <DocumentIcon size={48} className="text-gray-400 mx-auto mb-2" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-600 mb-6">Start applying to jobs to track your progress</p>
              <button
                onClick={() => router.push('/jobs')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
              >
                Browse Jobs
              </button>
            </div>
          ) : (
            <Table
              columns={applicationColumns}
              data={recentApplications}
              onRowClick={(application: any) => router.push(`/applications/${application.id}`)}
            />
          )}
        </div>

        {/* Recommended Jobs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Recommended Jobs</h2>
            <button
              onClick={() => router.push('/jobs')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
            >
              <span>View all</span>
              <span>→</span>
            </button>
          </div>
          
          {recommendedJobs.length === 0 ? (
            <div className="bg-white rounded-xl p-12 shadow-sm text-center">
              <BriefcaseIcon size={48} className="text-gray-400 mx-auto mb-2" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No jobs available</h3>
              <p className="text-gray-600">Check back later for new opportunities</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedJobs.map((job: any) => (
                <div
                  key={job.id}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {job.location || 'Remote'}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        job.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>

                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                    {job.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <BriefcaseIcon size={16} className="mr-1" />
                        {job.employment_type || 'Full-time'}
                      </span>
                      {job.application_count !== undefined && (
                        <span className="flex items-center">
                          <UsersIcon size={16} className="mr-1" />
                          {job.application_count} applicants
                        </span>
                      )}
                    </div>
                    <span className="text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                      View Details →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
