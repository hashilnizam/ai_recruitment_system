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
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingRankings: 0,
  });
  const [recentJobs, setRecentJobs] = useState([]);

  // Initialize WebSocket for real-time updates
  const { isConnected, lastMessage } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'new_application') {
        // Refresh stats when new application is received
        fetchDashboardData();
      }
    }
  });

  useEffect(() => {
    if (!user || user.role !== 'recruiter') {
      router.push('/auth/login?role=recruiter');
      return;
    }
    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats using API client
      const statsResponse = await jobsAPI.getDashboardStats();
      if (DataValidation.validateApiResponse(statsResponse)) {
        setStats(statsResponse.data);
      }
      
      // Fetch jobs using API client
      const jobsResponse = await jobsAPI.getJobs({ limit: 5 });
      if (DataValidation.validateApiResponse(jobsResponse)) {
        setRecentJobs(jobsResponse.data.slice(0, 5));
      }
      
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
          <StatCard
            title="Total Jobs Posted"
            value={stats.totalJobs}
            change="+12%"
            changeType="increase"
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
            change="+24%"
            changeType="increase"
            icon={<DocumentIcon size={24} />}
            iconBgColor="bg-gradient-to-br from-purple-400 to-purple-600"
          />
          <StatCard
            title="Pending Rankings"
            value={stats.pendingRankings}
            change="-5%"
            changeType="decrease"
            icon={<ClockIcon size={24} />}
            iconBgColor="bg-gradient-to-br from-orange-400 to-orange-600"
          />
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
          <Table
            columns={jobColumns}
            data={recentJobs}
            onRowClick={(job) => router.push(`/jobs/${job.id}`)}
          />
        </div>

        {/* Activity Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityChart
            title="Applications Received"
            data={[
              { label: 'Mon', value: 12, previousValue: 8 },
              { label: 'Tue', value: 19, previousValue: 15 },
              { label: 'Wed', value: 15, previousValue: 18 },
              { label: 'Thu', value: 25, previousValue: 20 },
              { label: 'Fri', value: 22, previousValue: 17 },
              { label: 'Sat', value: 8, previousValue: 6 },
              { label: 'Sun', value: 5, previousValue: 4 },
            ]}
            type="bar"
            color="#3B82F6"
          />
          
          <ActivityChart
            title="AI Rankings Completed"
            data={[
              { label: 'Mon', value: 8, previousValue: 6 },
              { label: 'Tue', value: 15, previousValue: 12 },
              { label: 'Wed', value: 12, previousValue: 14 },
              { label: 'Thu', value: 20, previousValue: 16 },
              { label: 'Fri', value: 18, previousValue: 15 },
              { label: 'Sat', value: 6, previousValue: 5 },
              { label: 'Sun', value: 4, previousValue: 3 },
            ]}
            type="line"
            color="#10B981"
          />
        </div>
      </div>
    </Layout>
  );
}
