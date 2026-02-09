'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatCard from '@/components/StatCard';
import { applicationsAPI, jobsAPI, rankingsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function JobApplicationsPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankingStatus, setRankingStatus] = useState<any>(null);

  useEffect(() => {
    if (user?.role !== 'recruiter') {
      router.push('/');
      return;
    }
    fetchData();
  }, [user, id, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch job details
      const jobResponse = await jobsAPI.getJob(Number(id));
      setJob(jobResponse.data.data);

      // Fetch applications
      const appsResponse = await applicationsAPI.getJobApplications(Number(id));
      setApplications(appsResponse.data.data || []);

      // Fetch ranking status
      try {
        const statusResponse = await rankingsAPI.getRankingStatus(Number(id));
        setRankingStatus(statusResponse.data.data);
      } catch (error) {
        // No ranking exists yet
        setRankingStatus(null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerRanking = async () => {
    try {
      await rankingsAPI.triggerRanking(Number(id));
      // Refresh status after triggering
      setTimeout(fetchData, 2000);
    } catch (error) {
      console.error('Error triggering ranking:', error);
    }
  };

  const columns = [
    {
      key: 'candidate',
      label: 'Candidate',
      render: (_: any, row: any) => (
        <div>
          <p className="font-semibold text-gray-900">
            {row.first_name} {row.last_name}
          </p>
          <p className="text-xs text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'skills',
      label: 'Skills',
      render: (skills: any[]) => (
        <div className="flex flex-wrap gap-1">
          {skills?.slice(0, 3).map((skill, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
            >
              {skill.skill_name}
            </span>
          ))}
          {skills?.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
              +{skills.length - 3}
            </span>
          )}
        </div>
      ),
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
      key: 'status',
      label: 'Status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: 'bg-yellow-100 text-yellow-700',
          ranked: 'bg-blue-100 text-blue-700',
          shortlisted: 'bg-green-100 text-green-700',
          rejected: 'bg-red-100 text-red-700',
        };
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
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

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Loading applications..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 mb-2 flex items-center space-x-1"
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Applications: {job?.title}
          </h1>
          <p className="text-gray-600">
            Manage and rank candidates for this position
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Applications"
            value={applications.length}
            icon="📝"
            iconBgColor="bg-gradient-to-br from-blue-400 to-blue-600"
          />
          <StatCard
            title="Pending Review"
            value={applications.filter((app: any) => app.status === 'pending').length}
            icon="⏳"
            iconBgColor="bg-gradient-to-br from-yellow-400 to-yellow-600"
          />
          <StatCard
            title="Ranked"
            value={applications.filter((app: any) => app.total_score).length}
            icon="📊"
            iconBgColor="bg-gradient-to-br from-purple-400 to-purple-600"
          />
          <StatCard
            title="Shortlisted"
            value={applications.filter((app: any) => app.status === 'shortlisted').length}
            icon="⭐"
            iconBgColor="bg-gradient-to-br from-green-400 to-green-600"
          />
        </div>

        {/* AI Ranking Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">AI Ranking</h3>
              <p className="text-sm text-gray-600">
                Rank candidates automatically using AI
              </p>
            </div>
            <button
              onClick={triggerRanking}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
            >
              🤖 Trigger AI Ranking
            </button>
          </div>

          {rankingStatus && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-900">Ranking Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  rankingStatus.status === 'completed' 
                    ? 'bg-green-100 text-green-700'
                    : rankingStatus.status === 'processing'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {rankingStatus.status}
                </span>
              </div>
              {rankingStatus.status === 'processing' && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{rankingStatus.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${rankingStatus.progress}%` }}
                    />
                  </div>
                </div>
              )}
              {rankingStatus.status === 'completed' && (
                <div className="mt-3 flex items-center space-x-4">
                  <button
                    onClick={() => router.push(`/rankings/${id}`)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    View Rankings →
                  </button>
                  <span className="text-sm text-gray-600">
                    {rankingStatus.totalCandidates} candidates ranked
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Applications Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">All Applications</h2>
            {applications.length > 0 && (
              <button
                onClick={() => router.push(`/rankings/${id}`)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
              >
                <span>View Rankings</span>
                <span>→</span>
              </button>
            )}
          </div>
          
          {applications.length === 0 ? (
            <div className="bg-white rounded-xl p-12 shadow-sm text-center">
              <span className="text-6xl mb-4 block">📭</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-600">
                Candidates will appear here once they start applying
              </p>
            </div>
          ) : (
            <Table
              columns={columns}
              data={applications}
              onRowClick={(application) => router.push(`/candidates/${application.candidate_id}`)}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
