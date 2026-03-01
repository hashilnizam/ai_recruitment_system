'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import Table from '@/components/Table';
import { dashboardAPI } from '@/lib/api';
import { 
  BriefcaseIcon, 
  SparklesIcon, 
  DocumentIcon, 
  ClockIcon, 
  UsersIcon, 
  ChartIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from '@/components/Icons';

interface DashboardData {
  summary: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    pendingRankings: number;
    changes: {
      jobsChange: number;
      activeJobsChange: number;
      applicationsChange: number;
      pendingChange: number;
    };
  };
  recentJobs: Array<{
    id: number;
    title: string;
    status: string;
    application_count: number;
    created_at: string;
    location?: string;
  }>;
  applications7Days: {
    data: Array<{
      date: string;
      count: number;
    }>;
    total: number;
    average: number;
  };
  rankings7Days: {
    data: Array<{
      date: string;
      count: number;
    }>;
    total: number;
    average: number;
  };
}

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

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
      console.log('🔄 Fetching dashboard data for user:', user?.id);
      
      const response = await dashboardAPI.getRecruiterDashboard();
      
      if (response.data && response.data.success) {
        console.log('✅ Dashboard data received:', response.data.data);
        setDashboardData(response.data.data);
      } else {
        console.error('❌ Dashboard API error:', response.data?.message || 'Unknown error');
        // Set fallback data to prevent infinite loading
        setDashboardData({
          summary: {
            totalJobs: 0,
            activeJobs: 0,
            totalApplications: 0,
            pendingRankings: 0,
            changes: {
              jobsChange: 0,
              activeJobsChange: 0,
              applicationsChange: 0,
              pendingChange: 0
            }
          },
          recentJobs: [],
          applications7Days: { data: [], total: 0, average: 0 },
          rankings7Days: { data: [], total: 0, average: 0 }
        });
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      // Set fallback data to prevent infinite loading
      setDashboardData({
        summary: {
          totalJobs: 0,
          activeJobs: 0,
          totalApplications: 0,
          pendingRankings: 0,
          changes: {
            jobsChange: 0,
            activeJobsChange: 0,
            applicationsChange: 0,
            pendingChange: 0
          }
        },
        recentJobs: [],
        applications7Days: { data: [], total: 0, average: 0 },
        rankings7Days: { data: [], total: 0, average: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData) {
    console.log('🔍 Dashboard loading state:', { loading, dashboardData: !!dashboardData, user: !!user });
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

  // Simple bar chart component
  const SimpleBarChart = ({ data, title, color, total, average }: {
    data: Array<{ date: string; count: number }>;
    title: string;
    color: string;
    total: number;
    average: number;
  }) => {
    const maxCount = Math.max(...data.map(d => d.count), 1);
    
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div>
              <span className="text-gray-500">Total:</span>
              <span className="font-semibold text-gray-900 ml-1">{total}</span>
            </div>
            <div>
              <span className="text-gray-500">Avg:</span>
              <span className="font-semibold text-gray-900 ml-1">{average}</span>
            </div>
          </div>
        </div>
        
        <div className="h-48 flex items-end justify-between space-x-2">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className={`w-full ${color} rounded-t transition-all duration-300 hover:opacity-80`}
                style={{ 
                  height: `${Math.max((item.count / maxCount) * 100, 2)}%` 
                }}
              />
              <div className="text-xs text-gray-600 mt-2 font-medium">
                {item.date}
              </div>
              <div className="text-sm font-bold text-gray-900">
                {item.count}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Jobs Posted"
            value={dashboardData.summary.totalJobs}
            change={`${dashboardData.summary.changes.jobsChange > 0 ? '+' : ''}${dashboardData.summary.changes.jobsChange}%`}
            changeType={dashboardData.summary.changes.jobsChange > 0 ? 'increase' : dashboardData.summary.changes.jobsChange < 0 ? 'decrease' : 'neutral'}
            icon={<BriefcaseIcon size={24} />}
            iconBgColor="bg-gradient-to-br from-blue-400 to-blue-600"
          />
          <StatCard
            title="Active Jobs"
            value={dashboardData.summary.activeJobs}
            change={`${dashboardData.summary.changes.activeJobsChange > 0 ? '+' : ''}${dashboardData.summary.changes.activeJobsChange}%`}
            trend={dashboardData.summary.changes.activeJobsChange > 0 ? 'up' : 'down'}
            icon={<SparklesIcon size={24} />}
            iconBgColor="bg-gradient-to-br from-green-400 to-green-600"
          />
          <StatCard
            title="Total Applications"
            value={dashboardData.summary.totalApplications}
            change={`${dashboardData.summary.changes.applicationsChange > 0 ? '+' : ''}${dashboardData.summary.changes.applicationsChange}%`}
            changeType={dashboardData.summary.changes.applicationsChange > 0 ? 'increase' : dashboardData.summary.changes.applicationsChange < 0 ? 'decrease' : 'neutral'}
            icon={<DocumentIcon size={24} />}
            iconBgColor="bg-gradient-to-br from-purple-400 to-purple-600"
          />
          <StatCard
            title="Pending Rankings"
            value={dashboardData.summary.pendingRankings}
            change={`${dashboardData.summary.changes.pendingChange > 0 ? '+' : ''}${dashboardData.summary.changes.pendingChange}%`}
            changeType={dashboardData.summary.changes.pendingChange > 0 ? 'increase' : dashboardData.summary.changes.pendingChange < 0 ? 'decrease' : 'neutral'}
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
            data={dashboardData.recentJobs}
            onRowClick={(job) => router.push(`/jobs/${job.id}`)}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SimpleBarChart
            data={dashboardData.applications7Days.data}
            title="Applications Received (Last 7 Days)"
            color="bg-blue-500"
            total={dashboardData.applications7Days.total}
            average={dashboardData.applications7Days.average}
          />
          
          <SimpleBarChart
            data={dashboardData.rankings7Days.data}
            title="AI Rankings Completed (Last 7 Days)"
            color="bg-green-500"
            total={dashboardData.rankings7Days.total}
            average={dashboardData.rankings7Days.average}
          />
        </div>
      </div>
    </Layout>
  );
}
