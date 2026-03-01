'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { analyticsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BriefcaseIcon, 
  SparklesIcon, 
  FileTextIcon, 
  TargetIcon, 
  BarChart3Icon,
  LightbulbIcon,
  TrendingUpIcon,
  UsersIcon,
  AwardIcon,
  PieChartIcon
} from 'lucide-react';

interface AnalyticsData {
  summary: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    avgMatchScore: string;
    appsPerJob: string;
  };
  trends: Array<{
    month: string;
    count: number;
  }>;
  scoreDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  topJobs: Array<{
    id: number;
    title: string;
    application_count: number;
    avg_score: number;
  }>;
  commonSkills: Array<{
    skill_name: string;
    count: number;
  }>;
  successRate: number;
  growth: number;
  insights: Array<{
    type: 'success' | 'warning' | 'info';
    message: string;
  }>;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching analytics for user:', user?.id);
      
      const response = await analyticsAPI.getRecruiterAnalytics();
      
      if (response.success) {
        console.log('✅ Analytics data received:', response.data);
        setAnalytics(response.data);
      } else {
        console.error('❌ Analytics API error:', response.message);
      }
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    if (user.role !== 'recruiter') {
      console.log('❌ User is not a recruiter, redirecting...');
      router.push('/dashboard/candidate');
      return;
    }
    
    console.log('✅ User is recruiter, fetching analytics...');
    fetchAnalytics();
  }, [user, router]);

  if (loading || !analytics) {
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </Layout>
    );
  }

  // Calculate score distribution percentages
  const totalScores = analytics.scoreDistribution.high + analytics.scoreDistribution.medium + analytics.scoreDistribution.low;
  const highScorePercentage = totalScores > 0 ? ((analytics.scoreDistribution.high / totalScores) * 100).toFixed(1) : 0;
  const mediumScorePercentage = totalScores > 0 ? ((analytics.scoreDistribution.medium / totalScores) * 100).toFixed(1) : 0;
  const lowScorePercentage = totalScores > 0 ? ((analytics.scoreDistribution.low / totalScores) * 100).toFixed(1) : 0;

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your recruitment performance and insights</p>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Total Jobs"
            value={analytics.summary.totalJobs}
            icon={<BriefcaseIcon className="w-6 h-6" />}
            iconBgColor="bg-gradient-to-br from-blue-400 to-blue-600"
          />
          <StatCard
            title="Active Jobs"
            value={analytics.summary.activeJobs}
            icon={<TargetIcon className="w-6 h-6" />}
            iconBgColor="bg-gradient-to-br from-green-400 to-green-600"
          />
          <StatCard
            title="Applications"
            value={analytics.summary.totalApplications}
            icon={<FileTextIcon className="w-6 h-6" />}
            iconBgColor="bg-gradient-to-br from-purple-400 to-purple-600"
          />
          <StatCard
            title="Avg Match Score"
            value={`${analytics.summary.avgMatchScore}%`}
            icon={<SparklesIcon className="w-6 h-6" />}
            iconBgColor="bg-gradient-to-br from-orange-400 to-orange-600"
          />
          <StatCard
            title="Apps per Job"
            value={analytics.summary.appsPerJob}
            icon={<BarChart3Icon className="w-6 h-6" />}
            iconBgColor="bg-gradient-to-br from-indigo-400 to-indigo-600"
          />
        </div>

        {/* Application Trends */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <TrendingUpIcon className="w-5 h-5 mr-2" />
            Application Trends (Monthly Data)
          </h2>
          <div className="h-64">
            <div className="flex items-end justify-between h-full space-x-2">
              {analytics.trends.map((trend, index) => (
                <div key={trend.month} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                    style={{ 
                      height: `${Math.max((trend.count / Math.max(...analytics.trends.map(t => t.count))) * 100, 5)}%` 
                    }}
                  />
                  <div className="text-xs text-gray-600 mt-2 font-medium">
                    {trend.month}
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {trend.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <PieChartIcon className="w-5 h-5 mr-2" />
            Score Distribution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.scoreDistribution.high}</div>
              <div className="text-sm text-gray-600">High Scores (80–100%)</div>
              <div className="text-xs text-gray-500 mt-1">{highScorePercentage}% of total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{analytics.scoreDistribution.medium}</div>
              <div className="text-sm text-gray-600">Medium Scores (60–79%)</div>
              <div className="text-xs text-gray-500 mt-1">{mediumScorePercentage}% of total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{analytics.scoreDistribution.low}</div>
              <div className="text-sm text-gray-600">Low Scores (0–59%)</div>
              <div className="text-xs text-gray-500 mt-1">{lowScorePercentage}% of total</div>
            </div>
          </div>
        </div>

        {/* Top Performing Jobs */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <AwardIcon className="w-5 h-5 mr-2" />
            Top Performing Jobs
          </h2>
          {analytics.topJobs.length > 0 ? (
            <div className="space-y-3">
              {analytics.topJobs.map((job, index) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-600">
                        {job.application_count} applications • Avg score: {
                          job.avg_score && job.avg_score !== null && !isNaN(Number(job.avg_score)) 
                            ? Number(job.avg_score).toFixed(1) 
                            : 'N/A'
                        }%
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    #{job.application_count}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No job data available
            </div>
          )}
        </div>

        {/* Most Common Skills */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <UsersIcon className="w-5 h-5 mr-2" />
            Most Common Skills
          </h2>
          {analytics.commonSkills.length > 0 ? (
            <div className="space-y-2">
              {analytics.commonSkills.map((skill, index) => (
                <div key={skill.skill_name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-xs">{index + 1}</span>
                    </div>
                    <span className="font-medium text-gray-900">{skill.skill_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-lg font-bold text-purple-600">{skill.count}</div>
                    <div className="text-sm text-gray-600">candidates</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No skill data available
            </div>
          )}
        </div>

        {/* Quick Insights */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <LightbulbIcon className="w-5 h-5 mr-2" />
            Quick Insights
          </h2>
          <div className="space-y-3">
            {analytics.insights.length > 0 ? (
              analytics.insights.map((insight, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    insight.type === 'success' ? 'bg-green-50 border-green-400 text-green-800' :
                    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-800' :
                    'bg-blue-50 border-blue-400 text-blue-800'
                  }`}
                >
                  <div className="font-medium">{insight.message}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No insights available at this time
              </div>
            )}
          </div>
        </div>

        {/* Success Rate and Growth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Success Rate</h2>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{analytics.successRate}%</div>
              <div className="text-sm text-gray-600 mt-2">
                Shortlisted candidates ÷ Total applications × 100
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Growth</h2>
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                analytics.growth > 0 ? 'text-green-600' : 
                analytics.growth < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {analytics.growth > 0 ? '+' : ''}{analytics.growth}%
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Change in applications compared to previous month
              </div>
            </div>
          </div>
        </div>
    </div>
  </Layout>
);
}
