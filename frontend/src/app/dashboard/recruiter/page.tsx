'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import Table from '@/components/Table';
import ActivityChart from '@/components/ActivityChart';
import { useWebSocket } from '@/hooks/useWebSocket';
import { jobsAPI } from '@/lib/api';
import { DataValidation } from '@/utils/dataValidation';
import { 
  BriefcaseIcon, 
  SparklesIcon, 
  DocumentIcon, 
  ClockIcon, 
  UsersIcon, 
  ChartIcon 
} from '@/components/Icons';

export default function RecruiterDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingRankings: 0,
    percentageChanges: {
      jobsChange: 0,
      applicationsChange: 0
    }
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [weeklyTrends, setWeeklyTrends] = useState({
    applications: [],
    rankings: []
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [widgetErrors, setWidgetErrors] = useState<{[key: string]: string | null}>({});
  const [widgetLoading, setWidgetLoading] = useState<{[key: string]: boolean}>({});

  // Initialize WebSocket for real-time updates
  const { isConnected, lastMessage } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'new_application') {
        // Refresh stats when new application is received
        fetchDashboardData();
      } else if (message.type === 'ranking_completed') {
        // Refresh stats when AI ranking is completed
        fetchDashboardData();
      } else if (message.type === 'job_published') {
        // Refresh stats when job is published
        fetchDashboardData();
      }
    }
  });

  useEffect(() => {
    // Don't redirect while auth is loading
    if (authLoading) return;
    
    if (!user || user.role !== 'recruiter') {
      router.push('/auth/login?role=recruiter');
      return;
    }
    fetchDashboardData();
  }, [user, router, authLoading]);

  // Auto-refresh dashboard data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchDashboardData();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setWidgetErrors({});
      
      // Fetch dashboard stats using API client
      try {
        setWidgetLoading(prev => ({ ...prev, stats: true }));
        const statsResponse = await jobsAPI.getDashboardStats();
        if (statsResponse && statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
          setWidgetErrors(prev => ({ ...prev, stats: null }));
        } else {
          setWidgetErrors(prev => ({ ...prev, stats: 'Invalid stats data received' }));
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setWidgetErrors(prev => ({ ...prev, stats: 'Failed to load dashboard stats' }));
      } finally {
        setWidgetLoading(prev => ({ ...prev, stats: false }));
      }
      
      // Fetch jobs using API client
      try {
        setWidgetLoading(prev => ({ ...prev, jobs: true }));
        const jobsResponse = await jobsAPI.getJobs({ limit: 5 });
        if (jobsResponse && jobsResponse.success && jobsResponse.data) {
          setRecentJobs(jobsResponse.data.slice(0, 5));
          setWidgetErrors(prev => ({ ...prev, jobs: null }));
        } else {
          setWidgetErrors(prev => ({ ...prev, jobs: 'Invalid jobs data received' }));
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setWidgetErrors(prev => ({ ...prev, jobs: 'Failed to load recent jobs' }));
      } finally {
        setWidgetLoading(prev => ({ ...prev, jobs: false }));
      }
      
      // Fetch weekly trends
      try {
        setWidgetLoading(prev => ({ ...prev, trends: true }));
        const trendsResponse = await jobsAPI.getWeeklyTrends();
        if (trendsResponse && trendsResponse.success && trendsResponse.data) {
          setWeeklyTrends(trendsResponse.data);
          setWidgetErrors(prev => ({ ...prev, trends: null }));
        } else {
          setWidgetErrors(prev => ({ ...prev, trends: 'Invalid trends data received' }));
        }
      } catch (error) {
        console.error('Error fetching trends:', error);
        setWidgetErrors(prev => ({ ...prev, trends: 'Failed to load weekly trends' }));
      } finally {
        setWidgetLoading(prev => ({ ...prev, trends: false }));
      }
      
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </Layout>
    );
  }

  const jobColumns = [
    {
      key: 'title',
      label: 'Job Title',
      render: (value: string, row: any) => (
        <div>
          <p className="font-semibold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{row.location || 'Remote'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
            value === 'published'
              ? 'bg-green-100 text-green-700'
              : value === 'draft'
              ? 'bg-gray-100 text-gray-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: 'application_count',
      label: 'Applications',
      render: (value: number) => (
        <span className="font-semibold text-blue-600">{value || 0}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Posted',
      render: (value: string) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
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
          {widgetLoading.stats ? (
            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : widgetErrors.stats ? (
            <div className="col-span-full bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center space-x-2">
                <span className="text-red-600">⚠️</span>
                <span className="text-red-700">{widgetErrors.stats}</span>
                <button
                  onClick={() => fetchDashboardData()}
                  className="ml-auto px-3 py-1 text-red-600 hover:text-red-700 font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              <StatCard
                title="Total Jobs Posted"
                value={stats.totalJobs}
                change={`${stats.percentageChanges?.jobsChange > 0 ? '+' : ''}${stats.percentageChanges?.jobsChange || 0}%`}
                changeType={stats.percentageChanges?.jobsChange > 0 ? 'increase' : stats.percentageChanges?.jobsChange < 0 ? 'decrease' : 'neutral'}
                icon={<BriefcaseIcon size={24} />}
                iconBgColor="bg-gradient-to-br from-blue-400 to-blue-600"
              />
              <StatCard
                title="Active Jobs"
                value={stats.activeJobs}
                change="+8%"
                changeType="increase"
                icon={<SparklesIcon size={24} />}
                iconBgColor="bg-gradient-to-br from-green-400 to-green-600"
              />
              <StatCard
                title="Total Applications"
                value={stats.totalApplications}
                change={`${stats.percentageChanges?.applicationsChange > 0 ? '+' : ''}${stats.percentageChanges?.applicationsChange || 0}%`}
                changeType={stats.percentageChanges?.applicationsChange > 0 ? 'increase' : stats.percentageChanges?.applicationsChange < 0 ? 'decrease' : 'neutral'}
                icon={<DocumentIcon size={24} />}
                iconBgColor="bg-gradient-to-br from-purple-400 to-purple-600"
              />
              <StatCard
                title="Pending Rankings"
                value={stats.pendingRankings}
                change={stats.pendingRankings > 0 ? '-5%' : '0%'}
                changeType={stats.pendingRankings > 0 ? 'decrease' : 'neutral'}
                icon={<ClockIcon size={24} />}
                iconBgColor="bg-gradient-to-br from-orange-400 to-orange-600"
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/jobs/create')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <SparklesIcon size={24} className="text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-lg">Post New Job</p>
                <p className="text-sm text-white/80">Create job posting</p>
              </div>
            </div>
            <span className="block mt-4 text-sm font-medium group-hover:translate-x-1 transition-transform">
              Get started →
            </span>
          </button>

          <button
            onClick={() => router.push('/candidates')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <UsersIcon size={24} className="text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-lg">View Candidates</p>
                <p className="text-sm text-white/80">Browse all applicants</p>
              </div>
            </div>
            <span className="block mt-4 text-sm font-medium group-hover:translate-x-1 transition-transform">
              Explore →
            </span>
          </button>

          <button
            onClick={() => router.push('/recruiter/analytics')}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <ChartIcon size={24} className="text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-lg">Analytics</p>
                <p className="text-sm text-white/80">View insights</p>
              </div>
            </div>
            <span className="block mt-4 text-sm font-medium group-hover:translate-x-1 transition-transform">
              View reports →
            </span>
          </button>
        </div>

        {/* Recent Jobs Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Recent Job Postings</h2>
            <button
              onClick={() => router.push('/jobs')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
            >
              <span>View all</span>
              <span>→</span>
            </button>
          </div>
          {widgetLoading.jobs ? (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/8"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : widgetErrors.jobs ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8">
              <div className="flex items-center space-x-2">
                <span className="text-red-600">⚠️</span>
                <span className="text-red-700">{widgetErrors.jobs}</span>
                <button
                  onClick={() => fetchDashboardData()}
                  className="ml-auto px-3 py-1 text-red-600 hover:text-red-700 font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <Table
              columns={jobColumns}
              data={recentJobs}
              onRowClick={(job) => router.push(`/jobs/${job.id}`)}
            />
          )}
        </div>

        {/* Activity Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {widgetLoading.trends ? (
            <>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
                  <div className="h-40 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <div key={i} className="h-3 bg-gray-200 rounded w-8"></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
                  <div className="h-40 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <div key={i} className="h-3 bg-gray-200 rounded w-8"></div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : widgetErrors.trends ? (
            <div className="col-span-full bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center space-x-2">
                <span className="text-red-600">⚠️</span>
                <span className="text-red-700">{widgetErrors.trends}</span>
                <button
                  onClick={() => fetchDashboardData()}
                  className="ml-auto px-3 py-1 text-red-600 hover:text-red-700 font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              <ActivityChart
                title="Applications Received"
                data={weeklyTrends.applications.length > 0 ? weeklyTrends.applications : [
                  { label: 'Mon', value: 0, previousValue: 0 },
                  { label: 'Tue', value: 0, previousValue: 0 },
                  { label: 'Wed', value: 0, previousValue: 0 },
                  { label: 'Thu', value: 0, previousValue: 0 },
                  { label: 'Fri', value: 0, previousValue: 0 },
                  { label: 'Sat', value: 0, previousValue: 0 },
                  { label: 'Sun', value: 0, previousValue: 0 },
                ]}
                type="bar"
                color="#3B82F6"
              />
              
              <ActivityChart
                title="AI Rankings Completed"
                data={weeklyTrends.rankings.length > 0 ? weeklyTrends.rankings : [
                  { label: 'Mon', value: 0, previousValue: 0 },
                  { label: 'Tue', value: 0, previousValue: 0 },
                  { label: 'Wed', value: 0, previousValue: 0 },
                  { label: 'Thu', value: 0, previousValue: 0 },
                  { label: 'Fri', value: 0, previousValue: 0 },
                  { label: 'Sat', value: 0, previousValue: 0 },
                  { label: 'Sun', value: 0, previousValue: 0 },
                ]}
                type="line"
                color="#10B981"
              />
            </>
          )}
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>WebSocket: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</span>
            {lastUpdated && (
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            )}
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1 text-blue-600 hover:text-blue-700 font-medium"
          >
            Refresh
          </button>
        </div>
      </div>
    </Layout>
  );
}
