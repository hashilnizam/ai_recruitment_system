'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { applicationsAPI, jobsAPI, recruiterAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  TrophyIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  RefreshCwIcon,
  BrainIcon,
  StarIcon,
  BarChart3Icon,
  UsersIcon,
  ArrowLeftIcon
} from 'lucide-react';

export default function RankingResultsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rankingInProgress, setRankingInProgress] = useState(false);
  const [rankingStatus, setRankingStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [rankingMessage, setRankingMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (user?.role !== 'recruiter') {
      router.push('/');
      return;
    }
    fetchData();
    
    // Auto-refresh every 10 seconds when processing
    const interval = setInterval(() => {
      if (rankingStatus === 'processing') {
        fetchData();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [user, router, rankingStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch recruiter's jobs
      const jobsResponse = await jobsAPI.getJobs({ recruiterId: user?.id });
      const jobsList = jobsResponse.data?.data || [];
      setJobs(jobsList);

      // Fetch all applications for all jobs
      const allCandidates: any[] = [];
      for (const job of jobsList) {
        try {
          const appsResponse = await applicationsAPI.getJobApplications(job.id);
          const applications = appsResponse.data?.data || [];
          
          applications.forEach((app: any) => {
            allCandidates.push({
              ...app,
              jobTitle: job.title,
              jobId: job.id,
              candidate_id: app.candidate_id,
              status: app.application_status || app.status || 'pending',
              total_score: app.total_score,
              skill_score: app.skill_score,
              education_score: app.education_score,
              experience_score: app.experience_score,
              rank_position: app.rank_position
            });
          });
        } catch (error) {
          console.error(`Error fetching applications for job ${job.id}:`, error);
        }
      }

      // Fetch recruiter resumes with ranking data
      try {
        const resumesResponse = await recruiterAPI.getResumes();
        const resumes = resumesResponse.data || [];
        
        // Fetch ranking data for most recent job
        const recentJob = jobsList[jobsList.length - 1];
        let rankings = [];
        
        if (recentJob) {
          try {
            const rankingsResponse = await fetch(`/api/rankings/job/${recentJob.id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            const rankingsData = await rankingsResponse.json();
            rankings = rankingsData.data || [];
          } catch (error) {
            console.log('No rankings found yet');
          }
        }
        
        resumes.forEach((resume: any) => {
          const ranking = rankings.find((r: any) => r.candidate_id === resume.id);
          
          allCandidates.push({
            ...resume,
            first_name: resume.original_name?.split('.')[0] || 'Unknown',
            last_name: '',
            email: 'resume-upload@system.com',
            jobTitle: 'Direct Resume Upload',
            jobId: recentJob?.id || 0,
            candidate_id: resume.id,
            status: 'pending',
            total_score: ranking?.total_score || null,
            skill_score: ranking?.skill_score || null,
            education_score: ranking?.education_score || null,
            experience_score: ranking?.experience_score || null,
            rank_position: ranking?.rank_position || null,
            applied_at: resume.uploaded_at,
            isResumeUpload: true,
            feedback: ranking?.overall_assessment || ranking?.suggestions || null
          });
        });
      } catch (error) {
        console.error('Error fetching recruiter resumes:', error);
      }
      
      // Sort candidates by score (ranked candidates first)
      allCandidates.sort((a, b) => {
        if (a.rank_position && b.rank_position) {
          return a.rank_position - b.rank_position;
        }
        if (a.rank_position) return -1;
        if (b.rank_position) return 1;
        return (b.total_score || 0) - (a.total_score || 0);
      });
      
      setCandidates(allCandidates);
      setLastUpdated(new Date());
      
      // Check ranking status
      const rankedCandidates = allCandidates.filter((c: any) => 
        c.rank_position !== null && c.rank_position !== undefined && c.rank_position > 0
      );
      
      if (rankedCandidates.length > 0) {
        setRankingStatus('completed');
        setRankingMessage(`✅ AI ranking completed! ${rankedCandidates.length} candidates ranked`);
      } else if (rankingStatus === 'processing') {
        setRankingStatus('processing');
        setRankingMessage('🤖 AI is processing your candidates...');
      } else {
        setRankingStatus('idle');
        setRankingMessage('');
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setRankingStatus('error');
      setRankingMessage('❌ Error loading ranking data');
    } finally {
      setLoading(false);
    }
  };

  const triggerAIRanking = async () => {
    try {
      setRankingInProgress(true);
      setRankingStatus('processing');
      setRankingMessage('🚀 Starting AI ranking process...');
      
      const response = await recruiterAPI.triggerRanking();
      
      if (response?.success) {
        const result = response as any;
        const applicationsCount = result.applications_to_rank || result.data?.applications_to_rank || 1;
        setRankingMessage(`🤖 AI ranking started for ${applicationsCount} candidates`);
        
        // Start checking for results
        setTimeout(() => {
          fetchData();
        }, 5000);
        
      } else {
        setRankingStatus('error');
        setRankingMessage(`❌ Failed to start ranking: ${response?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('Error triggering AI ranking:', error);
      setRankingStatus('error');
      setRankingMessage('❌ Error starting AI ranking');
    } finally {
      setRankingInProgress(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const rankedCandidates = candidates.filter((c: any) => 
    c.rank_position !== null && c.rank_position !== undefined && c.rank_position > 0
  );
  
  const unrankedCandidates = candidates.filter((c: any) => 
    !c.rank_position || c.rank_position === null || c.rank_position === undefined
  );

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Loading ranking results..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/candidates')}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Candidates
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Ranking Results</h1>
              <p className="text-gray-600">Monitor and view AI-powered candidate rankings</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCwIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={triggerAIRanking}
              disabled={rankingInProgress}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50"
            >
              <BrainIcon className={`w-4 h-4 mr-2 ${rankingInProgress ? 'animate-pulse' : ''}`} />
              {rankingInProgress ? 'Starting...' : 'Start AI Ranking'}
            </button>
          </div>
        </div>

        {/* Status Card */}
        <div className={`rounded-xl p-6 border-2 ${
          rankingStatus === 'completed' ? 'bg-green-50 border-green-200' :
          rankingStatus === 'processing' ? 'bg-blue-50 border-blue-200' :
          rankingStatus === 'error' ? 'bg-red-50 border-red-200' :
          'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                rankingStatus === 'completed' ? 'bg-green-500' :
                rankingStatus === 'processing' ? 'bg-blue-500' :
                rankingStatus === 'error' ? 'bg-red-500' :
                'bg-gray-500'
              }`}>
                {rankingStatus === 'completed' ? (
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                ) : rankingStatus === 'processing' ? (
                  <BrainIcon className="w-6 h-6 text-white animate-pulse" />
                ) : rankingStatus === 'error' ? (
                  <XCircleIcon className="w-6 h-6 text-white" />
                ) : (
                  <ClockIcon className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {rankingStatus === 'completed' ? 'Ranking Complete' :
                   rankingStatus === 'processing' ? 'Processing...' :
                   rankingStatus === 'error' ? 'Error' :
                   'Ready to Rank'}
                </h2>
                <p className="text-gray-600">{rankingMessage}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="text-sm font-medium text-gray-700">
                {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Candidates</p>
                <p className="text-3xl font-bold text-gray-900">{candidates.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white">
                <UsersIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ranked</p>
                <p className="text-3xl font-bold text-green-600">{rankedCandidates.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white">
                <TrophyIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{unrankedCandidates.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-white">
                <ClockIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Score</p>
                <p className="text-3xl font-bold text-purple-600">
                  {rankedCandidates.length > 0 
                    ? Math.round(rankedCandidates.reduce((sum, c) => sum + (c.total_score || 0), 0) / rankedCandidates.length)
                    : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white">
                <BarChart3Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Ranked Candidates */}
        {rankedCandidates.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <TrophyIcon className="w-6 h-6 text-yellow-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">Ranked Candidates</h2>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {rankedCandidates.map((candidate, index) => (
                <div key={candidate.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-600' :
                        'bg-blue-500'
                      }`}>
                        {candidate.rank_position}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {candidate.first_name} {candidate.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{candidate.email}</p>
                        <p className="text-sm text-gray-500">{candidate.jobTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">AI Score</p>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                candidate.total_score >= 80 ? 'bg-green-500' : 
                                candidate.total_score >= 60 ? 'bg-blue-500' : 
                                candidate.total_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${candidate.total_score}%` }}
                            />
                          </div>
                          <span className="font-bold text-blue-600">
                            {Math.round(candidate.total_score)}%
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-gray-500">Skills</p>
                          <p className="font-bold text-blue-600">{Math.round(candidate.skill_score || 0)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Education</p>
                          <p className="font-bold text-green-600">{Math.round(candidate.education_score || 0)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Experience</p>
                          <p className="font-bold text-purple-600">{Math.round(candidate.experience_score || 0)}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {candidate.feedback && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 mb-1">AI Feedback:</p>
                      <p className="text-sm text-gray-600">{candidate.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unranked Candidates */}
        {unrankedCandidates.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <ClockIcon className="w-6 h-6 text-yellow-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">Pending Ranking</h2>
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                  {unrankedCandidates.length}
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {unrankedCandidates.map((candidate) => (
                <div key={candidate.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {candidate.first_name} {candidate.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{candidate.email}</p>
                      <p className="text-sm text-gray-500">{candidate.jobTitle}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                        Pending
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
