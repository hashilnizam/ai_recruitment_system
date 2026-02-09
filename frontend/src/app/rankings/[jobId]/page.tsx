'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { jobsAPI, rankingsAPI } from '@/lib/api';

export default function RankingsPage() {
  const { jobId } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const jobResponse = await jobsAPI.getJob(Number(jobId));
      setJob(jobResponse.data.data);

      const rankingsResponse = await rankingsAPI.getRankings(Number(jobId));
      setRankings(rankingsResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Loading rankings..." />
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
            AI Rankings: {job?.title}
          </h1>
          <p className="text-gray-600">
            Candidates ranked by AI based on skills, education, and experience
          </p>
        </div>

        {/* Rankings List */}
        {rankings.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <span className="text-6xl mb-4 block">🤖</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No rankings yet</h3>
            <p className="text-gray-600 mb-6">
              Trigger AI ranking to see candidate scores
            </p>
            <button
              onClick={() => router.push(`/jobs/${jobId}/applications`)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
            >
              Go to Applications
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {rankings.map((ranking: any, index) => (
              <div
                key={ranking.application_id}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-6">
                  {/* Rank Badge */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl ${
                        index === 0
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                          : index === 1
                          ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                          : index === 2
                          ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                          : 'bg-gradient-to-br from-blue-400 to-blue-600'
                      }`}
                    >
                      #{ranking.rank_position}
                    </div>
                  </div>

                  {/* Candidate Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {ranking.first_name} {ranking.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">{ranking.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">
                          {Math.round(ranking.total_score)}%
                        </div>
                        <p className="text-xs text-gray-500">Overall Match</p>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Skills Match</p>
                        <p className="text-xl font-bold text-blue-600">
                          {Math.round(ranking.skill_score)}%
                        </p>
                        <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${ranking.skill_score}%` }}
                          />
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Education</p>
                        <p className="text-xl font-bold text-green-600">
                          {Math.round(ranking.education_score)}%
                        </p>
                        <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${ranking.education_score}%` }}
                          />
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Experience</p>
                        <p className="text-xl font-bold text-purple-600">
                          {Math.round(ranking.experience_score)}%
                        </p>
                        <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${ranking.experience_score}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => router.push(`/candidates/${ranking.candidate_id}`)}
                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        View Profile
                      </button>
                      <button className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium">
                        Shortlist
                      </button>
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                        Download Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {rankings.length > 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-6 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-white/80 text-sm mb-1">Top Candidate Score</p>
                <p className="text-3xl font-bold">
                  {Math.round(rankings[0]?.total_score || 0)}%
                </p>
              </div>
              <div>
                <p className="text-white/80 text-sm mb-1">Average Score</p>
                <p className="text-3xl font-bold">
                  {Math.round(
                    rankings.reduce((sum: number, r: any) => sum + r.total_score, 0) /
                      rankings.length
                  )}
                  %
                </p>
              </div>
              <div>
                <p className="text-white/80 text-sm mb-1">Total Ranked</p>
                <p className="text-3xl font-bold">{rankings.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
