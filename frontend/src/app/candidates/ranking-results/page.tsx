'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import AIRankingModal from '@/components/AIRankingModal';
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
  ArrowLeftIcon,
  UserIcon,
  FileTextIcon,
  EyeIcon,
  TrashIcon
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
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<number | null>(null);
  const [applicationsToRank, setApplicationsToRank] = useState(0);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [selectedResume, setSelectedResume] = useState<any>(null);
  const [resumeData, setResumeData] = useState<any>(null);

  useEffect(() => {
    if (user?.role !== 'recruiter') {
      router.push('/');
      return;
    }
    fetchData();
    
    // Auto-refresh every 3 seconds when processing, and check for completion
    const interval = setInterval(() => {
      if (rankingStatus === 'processing') {
        fetchData();
      }
    }, 3000); // Reduced from 10 seconds to 3 seconds for faster updates

    return () => clearInterval(interval);
  }, [user, router, rankingStatus]);

  // Effect to handle ranking completion
  useEffect(() => {
    if (rankingStatus === 'completed') {
      // Ranking just completed - show success message and ensure data is fresh
      console.log('🎉 Ranking completed, refreshing data...');
      // Small delay to ensure backend has finished saving
      setTimeout(() => {
        fetchData();
      }, 1000);
    }
  }, [rankingStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch recruiter's jobs
      console.log('🔍 Fetching jobs for recruiter:', user?.id);
      const jobsResponse = await jobsAPI.getJobs({ recruiterId: user?.id });
      console.log('📋 Jobs API response:', jobsResponse);
      const jobsList = jobsResponse.data?.data || jobsResponse.data || [];
      console.log('📊 Jobs list extracted:', jobsList);
      setJobs(jobsList);
      
      // If no jobs found, try fallback to recent job (job 23)
      if (jobsList.length === 0) {
        console.log('⚠️ No jobs found, trying fallback to job 23');
        // Add fallback job
        jobsList.push({
          id: 23,
          title: 'Direct Resume Upload',
          description: 'Uploaded resumes for ranking'
        });
      }
      
      const allCandidates: any[] = [];
      
      // Fetch rankings for each job
      for (const job of jobsList) {
        try {
          const rankingsResponse = await fetch(`http://localhost:5000/api/rankings/job/${job.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!rankingsResponse.ok) {
            continue;
          }
          
          const rankingsData = await rankingsResponse.json();
          const rankedCandidates = rankingsData.data || [];
          
          // Add all ranked candidates
          rankedCandidates.forEach((candidate: any) => {
            allCandidates.push({
              ...candidate,
              jobTitle: job.title,
              jobId: job.id,
              candidate_id: candidate.candidate_id || candidate.id,
              status: candidate.rank_position ? 'ranked' : 'pending',
              total_score: candidate.total_score,
              skill_score: candidate.skill_score,
              education_score: candidate.education_score,
              experience_score: candidate.experience_score,
              rank_position: candidate.rank_position,
              isResumeUpload: candidate.isResumeUpload || false,
              feedback: candidate.overall_assessment || candidate.suggestions || null,
              applied_at: candidate.applied_at
            });
          });
          
        } catch (error) {
          // No rankings found for this job
        }
      }
      
      // IMPORTANT: If no jobs found, try to get rankings from the most recent job (23)
      if (jobsList.length === 0) {
        try {
          // Try job ID 23 (from your AI service logs)
          const rankingsResponse = await fetch(`http://localhost:5000/api/rankings/job/23`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (rankingsResponse.ok) {
            const rankingsData = await rankingsResponse.json();
            const rankedCandidates = rankingsData.data || [];
            
            // Add all ranked candidates
            rankedCandidates.forEach((candidate: any) => {
              allCandidates.push({
                ...candidate,
                jobTitle: 'AI Ranked Candidates',
                jobId: 23,
                candidate_id: candidate.candidate_id || candidate.id,
                status: candidate.rank_position ? 'ranked' : 'pending',
                total_score: candidate.total_score,
                skill_score: candidate.skill_score,
                education_score: candidate.education_score,
                experience_score: candidate.experience_score,
                rank_position: candidate.rank_position,
                isResumeUpload: candidate.isResumeUpload || false,
                feedback: candidate.overall_assessment || candidate.suggestions || null,
                applied_at: candidate.applied_at
              });
            });
          }
        } catch (error) {
          // No rankings found
        }
      }
      
      // Also get resumes for direct uploads
      try {
        const resumesResponse = await recruiterAPI.getResumes();
        const resumes = resumesResponse.data || [];
        
        // Fetch ranking data for most recent job or job 23
        const recentJob = jobsList.length > 0 ? jobsList[jobsList.length - 1] : { id: 23 };
        let rankings = [];
        
        try {
          const rankingsResponse = await fetch(`http://localhost:5000/api/rankings/job/${recentJob.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          const rankingsData = await rankingsResponse.json();
          rankings = rankingsData.data || [];
        } catch (error) {
          // No resume rankings found
        }
        
        resumes.forEach((resume: any) => {
          // Try multiple ways to find the ranking
          const ranking = rankings.find((r: any) => 
            r.candidate_id === resume.id || 
            r.id === resume.id || 
            r.application_id === resume.id
          );
          
          allCandidates.push({
            ...resume,
            first_name: resume.original_name?.split('.')[0] || 'Unknown',
            last_name: '',
            email: 'resume-upload@system.com',
            jobTitle: 'Direct Resume Upload',
            jobId: recentJob?.id || 23,
            candidate_id: resume.id,
            status: ranking?.rank_position ? 'ranked' : 'pending',
            total_score: ranking?.total_score || null,
            skill_score: ranking?.skill_score || null,
            education_score: ranking?.education_score || null,
            experience_score: ranking?.experience_score || null,
            rank_position: ranking?.rank_position || null,
            isResumeUpload: true,
            feedback: ranking?.overall_assessment || ranking?.suggestions || null,
            applied_at: resume.uploaded_at
          });
        });
      } catch (error) {
        // Error fetching resumes
      }
      
      // Sort candidates by score (ranked candidates first)
      allCandidates.sort((a, b) => {
        // Both have rank_position - sort by rank_position
        if (a.rank_position && b.rank_position) {
          return a.rank_position - b.rank_position;
        }
        // Only one has rank_position - ranked candidate comes first
        if (a.rank_position) return -1;
        if (b.rank_position) return 1;
        // Neither has rank_position - sort by total_score (highest first)
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

  const handleCleanData = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('http://localhost:5000/api/rankings/clean', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('✅ All ranking data cleaned successfully!');
        
        // Refresh data to show empty state
        await fetchData();
      } else {
        alert('❌ Failed to clean data. Make sure backend is running with the clean endpoint.');
      }
    } catch (error) {
      alert('❌ Error cleaning data. Make sure backend is running.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const triggerAIRanking = async () => {
    try {
      setRankingInProgress(true);
      setRankingStatus('processing');
      setRankingMessage('🚀 Starting AI ranking process...');
      
      const response = await recruiterAPI.triggerRanking();
      
      if (response?.success) {
        const result = response as any;
        const jobId = result.job_id || result.data?.job_id;
        const applicationsCount = result.applications_to_rank || result.data?.applications_to_rank || 1;
        
        setCurrentJobId(jobId);
        setApplicationsToRank(applicationsCount);
        setShowRankingModal(true);
        setRankingMessage(`🤖 AI ranking started for ${applicationsCount} candidates`);
        
        // Start checking for results
        setTimeout(() => {
          fetchData();
        }, 5000);
        
      } else {
        setRankingStatus('error');
        setRankingMessage(`❌ Failed to start ranking: ${response?.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      setRankingStatus('error');
      setRankingMessage(`❌ Failed to start ranking: ${error.message}`);
    } finally {
      setRankingInProgress(false);
    }
  };

  const handleViewResume = async (candidate: any) => {
    try {
      setSelectedResume(candidate);
      setShowResumeModal(true);
      
      // Try to get detailed resume data
      if (candidate.isResumeUpload) {
        // For resume uploads, fetch the parsed data
        try {
          const response = await fetch(`http://localhost:5000/api/recruiter/resumes/${candidate.candidate_id}/details`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setResumeData(data.data || data);
          }
        } catch (error) {
          console.error('Error fetching resume details:', error);
          setResumeData(null);
        }
      }
    } catch (error) {
      console.error('Error opening resume modal:', error);
    }
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
              onClick={handleCleanData}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Clean Data
            </button>
            <button
              onClick={triggerAIRanking}
              disabled={rankingInProgress || unrankedCandidates.length === 0}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 transform hover:scale-105"
            >
              <BrainIcon className={`w-4 h-4 mr-2 ${rankingInProgress ? 'animate-pulse' : ''}`} />
              {rankingInProgress ? 'Starting...' : unrankedCandidates.length === 0 ? 'No Resumes to Rank' : 'Start AI Ranking'}
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
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last updated</p>
                <p className="text-sm font-medium text-gray-700">
                  {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
              >
                <RefreshCwIcon className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
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
                  {(() => {
                    if (rankedCandidates.length > 0) {
                      const validScores = rankedCandidates.filter(c => c.total_score != null && !isNaN(c.total_score));
                      if (validScores.length > 0) {
                        const avgScore = validScores.reduce((sum, c) => sum + c.total_score, 0) / validScores.length;
                        return Math.round(avgScore);
                      }
                    }
                    if (candidates.length > 0) {
                      const validScores = candidates.filter(c => c.total_score != null && !isNaN(c.total_score));
                      if (validScores.length > 0) {
                        const avgScore = validScores.reduce((sum, c) => sum + c.total_score, 0) / validScores.length;
                        return Math.round(avgScore);
                      }
                    }
                    return 0;
                  })()}%
                </p>
                {(() => {
                  const avgScore = (() => {
                    if (rankedCandidates.length > 0) {
                      const validScores = rankedCandidates.filter(c => c.total_score != null && !isNaN(c.total_score));
                      if (validScores.length > 0) {
                        return validScores.reduce((sum, c) => sum + c.total_score, 0) / validScores.length;
                      }
                    }
                    if (candidates.length > 0) {
                      const validScores = candidates.filter(c => c.total_score != null && !isNaN(c.total_score));
                      if (validScores.length > 0) {
                        return validScores.reduce((sum, c) => sum + c.total_score, 0) / validScores.length;
                      }
                    }
                    return 0;
                  })();
                  
                  if (avgScore >= 80) return '🏆 Excellent';
                  if (avgScore >= 60) return '✅ Good';
                  if (avgScore >= 40) return '⚠️ Average';
                  if (avgScore > 0) return '❌ Poor';
                  return '📊 No Data';
                })()}
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white">
                <BarChart3Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Ranked Candidates */}
        {rankedCandidates.length > 0 && (
          <div className="space-y-6">
            {/* Ranked Resumes Section */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                      <FileTextIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Ranked Resumes</h2>
                      <p className="text-sm text-gray-600">AI-powered evaluation of uploaded resumes</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                    {rankedCandidates.filter(c => c.isResumeUpload).length} resumes
                  </span>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {rankedCandidates.filter(c => c.isResumeUpload).map((candidate, index) => (
                  <div key={candidate.id} className="p-6 hover:bg-purple-50 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg' : 
                          index === 1 ? 'bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-md' : 
                          index === 2 ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-md' :
                          'bg-gradient-to-br from-gray-400 to-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center">
                            <FileTextIcon className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{candidate.first_name}</p>
                            <p className="text-sm text-gray-500">Resume Upload</p>
                            <p className="text-xs text-purple-600 font-medium">Uploaded: {new Date(candidate.applied_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-600 mb-1">AI Score</p>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  candidate.total_score >= 80 ? 'bg-purple-500' : 
                                  candidate.total_score >= 60 ? 'bg-indigo-500' : 
                                  candidate.total_score >= 40 ? 'bg-blue-500' : 
                                  candidate.total_score > 0 ? 'bg-gray-500' : 'bg-gray-300'
                                }`}
                                style={{ width: `${candidate.total_score || 5}%` }}
                              />
                            </div>
                            <span className="font-bold text-purple-600 text-lg">
                              {candidate.total_score ? Math.round(candidate.total_score) : 'N/A'}%
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                          onClick={() => handleViewResume(candidate)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                          <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Score Breakdown */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-purple-600 font-medium">Skills</p>
                        <p className="text-lg font-bold text-purple-700">{Math.round(candidate.skill_score || 0)}%</p>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-indigo-600 font-medium">Education</p>
                        <p className="text-lg font-bold text-indigo-700">{Math.round(candidate.education_score || 0)}%</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-blue-600 font-medium">Experience</p>
                        <p className="text-lg font-bold text-blue-700">{Math.round(candidate.experience_score || 0)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regular Applications Ranking */}
            {rankedCandidates.filter(c => !c.isResumeUpload).length > 0 && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrophyIcon className="w-6 h-6 text-yellow-600 mr-2" />
                      <h2 className="text-xl font-bold text-gray-900">Ranked Applications</h2>
                      <span className="ml-3 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                        {rankedCandidates.filter(c => !c.isResumeUpload).length} candidates
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Sorted by AI score
                    </div>
                  </div>
                </div>
                
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 text-sm font-semibold text-gray-700 border-b">
                  <div className="col-span-1">Rank</div>
                  <div className="col-span-3">Candidate</div>
                  <div className="col-span-2">Job</div>
                  <div className="col-span-2">Overall Score</div>
                  <div className="col-span-3 text-center">Score Breakdown</div>
                  <div className="col-span-1 text-center">Actions</div>
                </div>
                
                {/* Table Rows */}
                <div className="divide-y divide-gray-100">
                  {rankedCandidates.filter(c => !c.isResumeUpload).map((candidate, index) => (
                    <div key={candidate.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-all duration-200 items-center">
                      {/* Rank */}
                      <div className="col-span-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg' : 
                          index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600 shadow-md' : 
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-md' :
                          'bg-gradient-to-br from-blue-400 to-blue-600'
                        }`}>
                          {candidate.rank_position}
                        </div>
                      </div>
                      
                      {/* Candidate Info */}
                      <div className="col-span-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {candidate.first_name} {candidate.last_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{candidate.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Job */}
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{candidate.jobTitle}</p>
                        <p className="text-xs text-gray-500">ID: {candidate.jobId}</p>
                      </div>
                      
                      {/* Overall Score */}
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600">Score</span>
                              <span className="text-sm font-bold text-blue-600">
                                {candidate.total_score ? Math.round(candidate.total_score) : 'N/A'}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  candidate.total_score >= 80 ? 'bg-green-500' : 
                                  candidate.total_score >= 60 ? 'bg-blue-500' : 
                                  candidate.total_score >= 40 ? 'bg-yellow-500' : 
                                  candidate.total_score > 0 ? 'bg-red-500' : 'bg-gray-300'
                                }`}
                                style={{ width: `${candidate.total_score || 5}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Score Breakdown */}
                      <div className="col-span-3">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-blue-50 rounded-lg p-2">
                            <p className="text-xs text-blue-600 font-medium">Skills</p>
                            <p className="text-sm font-bold text-blue-700">{Math.round(candidate.skill_score || 0)}%</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2">
                            <p className="text-xs text-green-600 font-medium">Education</p>
                            <p className="text-sm font-bold text-green-700">{Math.round(candidate.education_score || 0)}%</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-2">
                            <p className="text-xs text-purple-600 font-medium">Experience</p>
                            <p className="text-sm font-bold text-purple-700">{Math.round(candidate.experience_score || 0)}%</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="col-span-1 text-center">
                        <button 
                        onClick={() => handleViewResume(candidate)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Unranked Candidates */}
        {unrankedCandidates.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ClockIcon className="w-6 h-6 text-yellow-600 mr-2" />
                  <h2 className="text-xl font-bold text-gray-900">Pending Ranking</h2>
                  <span className="ml-3 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold animate-pulse">
                    {unrankedCandidates.length}
                  </span>
                </div>
                <button
                  onClick={triggerAIRanking}
                  disabled={rankingInProgress}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 transform hover:scale-105"
                >
                  <BrainIcon className={`w-4 h-4 mr-2 ${rankingInProgress ? 'animate-pulse' : ''}`} />
                  {rankingInProgress ? 'Starting...' : 'Start AI Ranking'}
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {unrankedCandidates.map((candidate) => (
                <div key={candidate.id} className="p-6 hover:bg-gray-50 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {candidate.first_name} {candidate.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{candidate.email}</p>
                        <p className="text-sm text-gray-500">{candidate.jobTitle}</p>
                        {candidate.isResumeUpload && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                            <FileTextIcon className="w-3 h-3 mr-1" />
                            Resume Upload
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold animate-pulse">
                        Pending
                      </span>
                      <button 
                        onClick={() => handleViewResume(candidate)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* AI Ranking Modal */}
      <AIRankingModal
        isOpen={showRankingModal}
        onClose={() => setShowRankingModal(false)}
        jobId={currentJobId}
        applicationsToRank={applicationsToRank}
      />

      {/* Resume View Modal */}
      {showResumeModal && selectedResume && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <FileTextIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {selectedResume.first_name} {selectedResume.last_name}
                    </h3>
                    <p className="text-purple-100">{selectedResume.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowResumeModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XCircleIcon className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {resumeData ? (
                <div className="space-y-6">
                  {/* Personal Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <UserIcon className="w-5 h-5 mr-2 text-purple-600" />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">{resumeData.personal_info?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{resumeData.personal_info?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{resumeData.personal_info?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium">{resumeData.personal_info?.location || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <BrainIcon className="w-5 h-5 mr-2 text-blue-600" />
                      Skills ({resumeData.skills?.length || 0})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {resumeData.skills?.map((skill: any, index: number) => (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            skill.category === 'technical' ? 'bg-blue-100 text-blue-700' :
                            skill.category === 'tool' ? 'bg-green-100 text-green-700' :
                            skill.category === 'framework' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {skill.name} ({skill.level})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
                      Education ({resumeData.education?.length || 0})
                    </h4>
                    <div className="space-y-3">
                      {resumeData.education?.map((edu: any, index: number) => (
                        <div key={index} className="border-l-4 border-green-500 pl-4">
                          <p className="font-medium">{edu.degree} in {edu.field}</p>
                          <p className="text-sm text-gray-600">{edu.institution}</p>
                          <p className="text-xs text-gray-500">{edu.start_date} - {edu.end_date}</p>
                          {edu.gpa && <p className="text-xs text-gray-500">GPA: {edu.gpa}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <BarChart3Icon className="w-5 h-5 mr-2 text-purple-600" />
                      Experience ({resumeData.experience?.length || 0})
                    </h4>
                    <div className="space-y-3">
                      {resumeData.experience?.map((exp: any, index: number) => (
                        <div key={index} className="border-l-4 border-purple-500 pl-4">
                          <p className="font-medium">{exp.title}</p>
                          <p className="text-sm text-gray-600">{exp.company}</p>
                          <p className="text-xs text-gray-500">{exp.start_date} - {exp.end_date}</p>
                          {exp.description && (
                            <p className="text-sm text-gray-700 mt-1">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Projects */}
                  {resumeData.projects && resumeData.projects.length > 0 && (
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <StarIcon className="w-5 h-5 mr-2 text-orange-600" />
                        Projects ({resumeData.projects.length})
                      </h4>
                      <div className="space-y-3">
                        {resumeData.projects.map((project: any, index: number) => (
                          <div key={index} className="border-l-4 border-orange-500 pl-4">
                            <p className="font-medium">{project.name}</p>
                            <p className="text-sm text-gray-700">{project.description}</p>
                            {project.technologies && project.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {project.technologies.map((tech: string, techIndex: number) => (
                                  <span key={techIndex} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {resumeData.certifications && resumeData.certifications.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <TrophyIcon className="w-5 h-5 mr-2 text-yellow-600" />
                        Certifications ({resumeData.certifications.length})
                      </h4>
                      <div className="space-y-2">
                        {resumeData.certifications.map((cert: any, index: number) => (
                          <div key={index} className="flex items-center justify-between">
                            <p className="font-medium">{cert.name}</p>
                            {cert.issuer && <p className="text-sm text-gray-600">{cert.issuer}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  
                  {/* Simple PDF Download Section */}
                  <div className="mt-6">
                    <p className="text-sm text-gray-600 mb-3">View Original Resume:</p>
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={() => window.open(`http://localhost:5000/api/recruiter/resumes/download/${selectedResume.candidate_id}`, '_blank')}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        Open PDF
                      </button>
                      <button
                        onClick={() => window.open(`http://localhost:5000/api/recruiter/resumes/download/${selectedResume.candidate_id}`, '_blank')}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FileTextIcon className="w-4 h-4 mr-2" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
}
