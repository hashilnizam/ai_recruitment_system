'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { jobsAPI, applicationsAPI } from '@/lib/api';
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

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [allApplications, setAllApplications] = useState<any[]>([]);

  interface Job {
    id: number;
    title: string;
    status: string;
    location?: string;
    employment_type?: string;
    salary_min?: number;
    salary_max?: number;
    experience_level?: string;
    created_at: string;
    updated_at: string;
  }

  interface Application {
    id: number;
    job_id: number;
    candidate_id: number;
    status: string;
    applied_at: string;
    updated_at: string;
    total_score?: number;
    rank_position?: number;
    skill_score?: number;
    education_score?: number;
    experience_score?: number;
    skills?: Array<{
      skill_name: string;
      proficiency_level: string;
      years_of_experience?: number;
    }>;
  }

  interface AnalyticsData {
    overview: {
      totalJobs: number;
      activeJobs: number;
      totalApplications: number;
      avgScore: number;
      conversionRate: number;
    };
    jobPerformance: Array<{
      jobTitle: string;
      applications: number;
      avgScore: number;
      status: string;
    }>;
    applicationTrends: Array<{
      month: string;
      applications: number;
    }>;
    topSkills: Array<{
      skill: string;
      count: number;
    }>;
    scoringInsights: {
      highScorers: number;
      mediumScorers: number;
      lowScorers: number;
    };
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      console.log('🔄 Starting analytics fetch for user:', user?.id, user?.role);
      
      // Fetch jobs
      const jobsResponse = await jobsAPI.getJobs({ recruiterId: user?.id });
      console.log('📊 Jobs API response:', jobsResponse.data);
      const jobsList = jobsResponse.data?.data || [];
      console.log('📋 Jobs list:', jobsList);
      setJobs(jobsList);

      // Fetch all applications
      let applications: any[] = [];
      let rankedCount = 0;
      const skillsMap: Record<string, number> = {};

      for (const job of jobsList) {
        try {
          console.log(`🔍 Fetching applications for job ${job.id}`);
          const appsResponse = await applicationsAPI.getJobApplications(job.id);
          console.log(`📄 Applications for job ${job.id}:`, appsResponse.data);
          const jobApplications = appsResponse.data?.data || [];
          applications = [...applications, ...jobApplications];
          
          jobApplications.forEach((app: any) => {
            if (app.skills) {
              app.skills.forEach((skill: any) => {
                skillsMap[skill.skill_name] = (skillsMap[skill.skill_name] || 0) + 1;
              });
            }
            if (app.total_score) rankedCount++;
          });
        } catch (error) {
          console.error(`Error fetching applications for job ${job.id}:`, error);
        }
      }

      setAllApplications(applications);

      // Calculate job performance
      const jobPerformance = (jobsList || []).map((job: Job) => {
        const jobApps = applications.filter((app: Application) => app.job_id === job.id);
        const avgScore = jobApps.length > 0
          ? jobApps.reduce((sum, app) => sum + (app.total_score || 0), 0) / jobApps.length
          : 0;
        
        return {
          jobTitle: job.title,
          applications: jobApps.length,
          avgScore: Math.round(avgScore),
          status: job.status,
        };
      }).sort((a: { applications: number }, b: { applications: number }) => b.applications - a.applications).slice(0, 5);

      // Top skills
      const topSkills = Object.entries(skillsMap)
        .map(([skill, count]) => ({ skill, count }))
        .sort((a: { count: number }, b: { count: number }) => b.count - a.count)
        .slice(0, 10);

      // Calculate overview
      const overview = {
        totalJobs: jobsList.length,
        activeJobs: jobsList.filter((job: Job) => job.status === 'published').length,
        totalApplications: applications.length,
        avgScore: applications.length > 0 
          ? Math.round(applications.reduce((sum, app) => sum + (app.total_score || 0), 0) / applications.length)
          : 0,
        conversionRate: rankedCount > 0 ? Math.round((rankedCount / applications.length) * 100) : 0
      };

      // Application trends (mock data for now - you can enhance this)
      const applicationTrends = [
        { month: 'Jan', applications: Math.floor(Math.random() * 20) + 10 },
        { month: 'Feb', applications: Math.floor(Math.random() * 20) + 15 },
        { month: 'Mar', applications: Math.floor(Math.random() * 20) + 20 },
        { month: 'Apr', applications: Math.floor(Math.random() * 20) + 18 },
        { month: 'May', applications: Math.floor(Math.random() * 20) + 25 },
        { month: 'Jun', applications: allApplications.length },
      ];

      setAnalytics({
        overview,
        jobPerformance,
        applicationTrends,
        topSkills,
        scoringInsights: {
          highScorers: allApplications.filter((a: any) => a.total_score >= 80).length,
          mediumScorers: allApplications.filter((a: any) => a.total_score >= 60 && a.total_score < 80).length,
          lowScorers: allApplications.filter((a: any) => a.total_score > 0 && a.total_score < 60).length,
        },
      });
      
      console.log('✅ Analytics data set successfully:', {
        overview,
        jobPerformance: jobPerformance.length,
        topSkills: topSkills.length,
        applicationsCount: applications.length
      });
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      // Set default analytics data to prevent infinite loading
      setAnalytics({
        overview: {
          totalJobs: 0,
          activeJobs: 0,
          totalApplications: 0,
          avgScore: 0,
          conversionRate: 0
        },
        jobPerformance: [],
        applicationTrends: [],
        topSkills: [],
        scoringInsights: {
          highScorers: 0,
          mediumScorers: 0,
          lowScorers: 0
        }
      });
    } finally {
      console.log('🏁 Analytics fetch completed, setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🎯 Analytics useEffect triggered:', { user: user?.id, role: user?.role });
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    if (user.role !== 'recruiter') {
      console.log('❌ User is not a recruiter, redirecting to candidate dashboard...');
      router.push('/dashboard/candidate');
      return;
    }
    console.log('✅ User is recruiter, fetching analytics...');
    fetchAnalytics();
  }, [user, router]);

  if (loading || !analytics) {
    console.log('🔄 Still loading or no analytics data:', { loading, analytics });
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your recruitment performance and insights</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Total Jobs"
            value={analytics.overview.totalJobs}
            icon={<BriefcaseIcon className="w-6 h-6" />}
            iconBgColor="bg-gradient-to-br from-blue-400 to-blue-600"
          />
          <StatCard
            title="Active Jobs"
            value={analytics.overview.activeJobs}
            icon={<SparklesIcon className="w-6 h-6" />}
            iconBgColor="bg-gradient-to-br from-green-400 to-green-600"
          />
          <StatCard
            title="Applications"
            value={analytics.overview.totalApplications}
            icon={<FileTextIcon className="w-6 h-6" />}
            iconBgColor="bg-gradient-to-br from-purple-400 to-purple-600"
          />
          <StatCard
            title="Avg Match Score"
            value={`${analytics.overview.avgScore}%`}
            icon={<TargetIcon className="w-6 h-6" />}
            iconBgColor="bg-gradient-to-br from-orange-400 to-orange-600"
          />
          <StatCard
            title="Apps per Job"
            value={analytics.overview.conversionRate}
            icon={<BarChart3Icon className="w-6 h-6" />}
            iconBgColor="bg-gradient-to-br from-pink-400 to-pink-600"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Application Trends */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-6">
              <TrendingUpIcon className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">Application Trends</h3>
            </div>
            <div className="space-y-3">
              {analytics.applicationTrends.map((trend: any, idx: number) => (
                <div key={idx} className="flex items-center">
                  <span className="text-sm text-gray-600 w-12">{trend.month}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-8 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                      style={{ width: `${(trend.applications / 30) * 100}%` }}
                    >
                      <span className="text-xs font-semibold text-white">
                        {trend.applications}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scoring Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-6">
              <AwardIcon className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">Score Distribution</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">High Scores (80-100%)</p>
                  <p className="text-xs text-gray-500">Excellent matches</p>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {analytics.scoringInsights.highScorers}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">Medium Scores (60-79%)</p>
                  <p className="text-xs text-gray-500">Good potential</p>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {analytics.scoringInsights.mediumScorers}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">Low Scores (0-59%)</p>
                  <p className="text-xs text-gray-500">Needs improvement</p>
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  {analytics.scoringInsights.lowScorers}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Performance */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center mb-6">
            <BriefcaseIcon className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-bold text-gray-900">Top Performing Jobs</h3>
          </div>
          <div className="space-y-4">
            {analytics.jobPerformance.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No job data available</p>
            ) : (
              analytics.jobPerformance.map((job: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl font-bold text-gray-300">#{idx + 1}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{job.jobTitle}</h4>
                        <p className="text-sm text-gray-500">
                          {job.applications} applications • Avg score: {job.avgScore}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{job.applications}</div>
                      <div className="text-xs text-gray-500">applicants</div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        job.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Skills */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center mb-6">
            <UsersIcon className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-bold text-gray-900">Most Common Skills</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {analytics.topSkills.map((item: any, idx: number) => (
              <div
                key={idx}
                className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg"
              >
                <span className="font-semibold text-gray-900">{item.skill}</span>
                <span className="ml-2 text-sm text-gray-600">({item.count})</span>
              </div>
            ))}
            {analytics.topSkills.length === 0 && (
              <p className="text-gray-500">No skill data available</p>
            )}
          </div>
        </div>

        {/* Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
            <LightbulbIcon className="w-8 h-8 mb-3" />
            <h4 className="font-bold text-lg mb-2">Quick Insight</h4>
            <p className="text-sm text-white/90">
              Your average match score is {analytics.overview.avgScore}%. 
              {analytics.overview.avgScore >= 70 
                ? " Great job finding quality candidates!"
                : " Consider refining job requirements."}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
            <TargetIcon className="w-8 h-8 mb-3" />
            <h4 className="font-bold text-lg mb-2">Success Rate</h4>
            <p className="text-sm text-white/90">
              {analytics.overview.totalApplications > 0 
                ? `${((analytics.scoringInsights.highScorers / analytics.overview.totalApplications) * 100).toFixed(1)}% of candidates scored above 80%, indicating strong matches.`
                : 'No applications yet to calculate success rate.'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
            <TrendingUpIcon className="w-8 h-8 mb-3" />
            <h4 className="font-bold text-lg mb-2">Growth</h4>
            <p className="text-sm text-white/90">
              You're averaging {analytics.overview.conversionRate} applications per job. 
              Keep posting quality positions!
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
