'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import LoadingSpinner from '@/components/LoadingSpinner';
import MultiResumeUpload from '@/components/MultiResumeUpload';
import { applicationsAPI, jobsAPI, recruiterAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UsersIcon, 
  ClockIcon, 
  StarIcon, 
  BarChart3Icon,
  SearchIcon,
  FilterIcon,
  UploadIcon,
  RefreshCwIcon,
  TrophyIcon,
  FileTextIcon,
  EyeIcon,
  BrainIcon
} from 'lucide-react';

export default function CandidatesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rankingInProgress, setRankingInProgress] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState('all');
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [topRankedCandidates, setTopRankedCandidates] = useState<any[]>([]);
  const [rankingSuccess, setRankingSuccess] = useState(false);
  const [rankingMessage, setRankingMessage] = useState('');

  useEffect(() => {
    if (user?.role !== 'recruiter') {
      router.push('/');
      return;
    }
    fetchData();
  }, [user, router]);

  // Auto-refresh data every 30 seconds to keep counts updated
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchData();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loading]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleCheckResults = async () => {
    setRefreshing(true);
    console.log('🔍 Manually checking for AI ranking results...');
    await fetchData();
    
    // Check if we have ranked candidates after refresh
    const rankedCandidates = candidates.filter((c: any) => 
      c.rank_position !== null && c.rank_position !== undefined && c.rank_position > 0
    );
    
    if (rankedCandidates.length > 0) {
      setRankingMessage(`✅ Found ${rankedCandidates.length} ranked candidates!`);
      setTimeout(() => {
        setRankingSuccess(false);
        setRankingMessage('');
      }, 3000);
    } else {
      setRankingMessage('⏱️ No rankings found yet. AI processing may still be in progress.');
    }
    
    setRefreshing(false);
  };

  const triggerAIRanking = async () => {
    try {
      setRankingInProgress(true);
      
      // Use the recruiter API client which includes authentication
      const response = await recruiterAPI.triggerRanking();
      
      console.log('AI ranking response:', response);
      
      if (response?.success) {
        const result = response as any;
        console.log('AI ranking triggered:', result);
        const applicationsCount = result.applications_to_rank || result.data?.applications_to_rank || 1;
        setRankingMessage(`AI ranking started for ${applicationsCount} candidates`);
        setRankingSuccess(true);
        
        // Start polling for updates
        let pollCount = 0;
        const maxPolls = 12; // 1 minute max (12 * 5 seconds)
        
        const pollInterval = setInterval(async () => {
          pollCount++;
          console.log(`Poll ${pollCount}: Checking for ranking updates...`);
          await fetchData();
          
          // Get fresh candidates data and check if any have rankings
          const freshCandidates = candidates;
          const rankedCandidates = freshCandidates.filter((c: any) => 
            c.rank_position !== null && c.rank_position !== undefined && c.rank_position > 0
          );
          
          console.log(`Poll ${pollCount}: Found ${rankedCandidates.length} ranked candidates out of ${freshCandidates.length} total`);
          
          if (rankedCandidates.length > 0 || pollCount >= maxPolls) {
            clearInterval(pollInterval);
            setRankingInProgress(false);
            await fetchData(); // Final refresh
            
            if (rankedCandidates.length > 0) {
              setRankingMessage(`✅ AI ranking completed! ${rankedCandidates.length} candidates ranked`);
            } else {
              setRankingMessage('⏱️ AI ranking timed out. Click "Check Results" to try again.');
            }
            
            // Hide success message after 5 seconds
            setTimeout(() => {
              setRankingSuccess(false);
              setRankingMessage('');
            }, 5000);
          }
        }, 10000); // Changed to 10 seconds instead of 5
        
      } else {
        console.error('Failed to trigger AI ranking:', response?.message || 'Unknown error');
        setRankingInProgress(false);
      }
    } catch (error) {
      console.error('Error triggering AI ranking:', error);
      setRankingInProgress(false);
    }
  };

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
        const recentJob = jobsList[jobsList.length - 1]; // Get last job (usually for ranking)
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
          // Find ranking for this resume
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
      
      // Get top 3 ranked candidates
      const topRanked = allCandidates.filter(c => c.rank_position && c.rank_position <= 3);
      setTopRankedCandidates(topRanked);
      
      setCandidates(allCandidates);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Ensure jobs is never undefined
      setJobs([]);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter((candidate: any) => {
    const matchesSearch = 
      candidate.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      candidate.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(search.toLowerCase()) ||
      candidate.jobTitle?.toLowerCase().includes(search.toLowerCase());
    
    const matchesJob = selectedJob === 'all' || candidate.jobId === parseInt(selectedJob);
    
    return matchesSearch && matchesJob;
  });

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
      key: 'jobTitle',
      label: 'Applied For',
      render: (value: string) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
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
      label: 'AI Match Score',
      render: (score: number, row: any) => {
        if (row.rank_position) {
          return (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <TrophyIcon className="w-4 h-4 text-yellow-500" />
                <span className="font-bold text-yellow-600">#{row.rank_position}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                  <div
                    className={`h-2 rounded-full ${
                      score >= 80 ? 'bg-green-500' : 
                      score >= 60 ? 'bg-blue-500' : 
                      score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="font-bold text-blue-600">{Math.round(score)}%</span>
              </div>
            </div>
          );
        }
        return score ? (
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
              <div
                className={`h-2 rounded-full ${
                  score >= 80 ? 'bg-green-500' : 
                  score >= 60 ? 'bg-blue-500' : 
                  score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="font-bold text-blue-600">{Math.round(score)}%</span>
          </div>
        ) : (
          <span className="text-sm text-gray-500">Not ranked</span>
        );
      },
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
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex items-center space-x-2">
          {row.isResumeUpload && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/api/recruiter/resumes/download/${row.id}`, '_blank');
              }}
              className="flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
            >
              <EyeIcon className="w-4 h-4 mr-1" />
              View Resume
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (row.isResumeUpload) {
                router.push(`/recruiter/resumes/${row.candidate_id}/details`);
              } else {
                router.push(`/candidates/${row.candidate_id}`);
              }
            }}
            className="flex items-center px-3 py-1 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            <FileTextIcon className="w-4 h-4 mr-1" />
            Details
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Loading candidates..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header with Stats */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">All Candidates</h1>
              <p className="text-gray-600">View and manage all candidate applications</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCwIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={triggerAIRanking}
                disabled={rankingInProgress}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BrainIcon className={`w-4 h-4 mr-2 ${rankingInProgress ? 'animate-pulse' : ''}`} />
                {rankingInProgress ? 'AI Ranking...' : 'AI Ranking'}
              </button>
              <button
                onClick={() => router.push('/candidates/ranking-results')}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <TrophyIcon className="w-4 h-4 mr-2" />
                View Results
              </button>
              <button
                onClick={() => setShowUploadSection(!showUploadSection)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UploadIcon className="w-4 h-4 mr-2" />
                {showUploadSection ? 'Hide Upload' : 'Upload Resumes'}
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {rankingSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <p className="text-green-800 font-medium">{rankingMessage}</p>
              </div>
              <button
                onClick={handleCheckResults}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              >
                Check Results
              </button>
            </div>
          </div>
        )}

        {/* Resume Upload Section */}
        {showUploadSection && (
          <MultiResumeUpload 
            onUploadComplete={() => {
              // Refresh candidates data after upload
              fetchData();
            }}
            maxFiles={25}
          />
        )}

        {/* Top Ranked Candidates Section */}
        {topRankedCandidates.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 shadow-sm border border-purple-100">
            <div className="flex items-center mb-4">
              <TrophyIcon className="w-6 h-6 text-yellow-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Top Ranked Candidates</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topRankedCandidates.map((candidate, index) => (
                <div key={candidate.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        'bg-orange-600'
                      }`}>
                        {candidate.rank_position}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {candidate.first_name} {candidate.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{candidate.jobTitle}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">AI Score:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              candidate.total_score >= 80 ? 'bg-green-500' : 
                              candidate.total_score >= 60 ? 'bg-blue-500' : 
                              candidate.total_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${candidate.total_score}%` }}
                          />
                        </div>
                        <span className="font-bold text-sm text-blue-600">
                          {Math.round(candidate.total_score)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <p className="text-gray-500">Skills</p>
                        <p className="font-bold text-blue-600">{Math.round(candidate.skill_score || 0)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Education</p>
                        <p className="font-bold text-green-600">{Math.round(candidate.education_score || 0)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Experience</p>
                        <p className="font-bold text-purple-600">{Math.round(candidate.experience_score || 0)}%</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                      {candidate.isResumeUpload && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/api/recruiter/resumes/download/${candidate.id}`, '_blank');
                          }}
                          className="flex-1 flex items-center justify-center px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-xs"
                        >
                          <EyeIcon className="w-3 h-3 mr-1" />
                          View Resume
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCandidate(candidate);
                        }}
                        className="flex-1 flex items-center justify-center px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors text-xs"
                      >
                        <TrophyIcon className="w-3 h-3 mr-1" />
                        Why #1?
                      </button>
                    </div>
                    
                    {candidate.feedback && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                        <p className="font-semibold text-gray-700 mb-1">AI Feedback:</p>
                        <p className="text-gray-600 line-clamp-2">{candidate.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                <p className="text-sm text-gray-600 mb-1">Pending Review</p>
                <p className="text-3xl font-bold text-gray-900">
                  {candidates.filter((c: any) => c.status === 'pending').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-white">
                <ClockIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Shortlisted</p>
                <p className="text-3xl font-bold text-gray-900">
                  {candidates.filter((c: any) => c.status === 'shortlisted').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white">
                <StarIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ranked</p>
                <p className="text-3xl font-bold text-gray-900">
                  {candidates.filter((c: any) => c.status === 'ranked' || (c.total_score && c.total_score > 0)).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white">
                <BarChart3Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <SearchIcon className="w-4 h-4 mr-2" />
                Search Candidates
              </label>
              <input
                type="text"
                placeholder="Search by name, email, or job..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FilterIcon className="w-4 h-4 mr-2" />
                Filter by Job
              </label>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Jobs</option>
                {loading ? (
                  <option value="">Loading jobs...</option>
                ) : (
                  (jobs || []).map((job: any) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Candidates Table */}
        {filteredCandidates.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredCandidates}
            onRowClick={(candidate) => router.push(`/candidates/${candidate.candidate_id}`)}
          />
        )}
      </div>
      
      {/* Candidate Feedback Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedCandidate.first_name} {selectedCandidate.last_name}
                </h3>
                <p className="text-sm text-gray-500">Rank #{selectedCandidate.rank_position}</p>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Overall Score */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Overall AI Score</h4>
                <div className="flex items-center space-x-3">
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.round(selectedCandidate.total_score || 0)}%
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          selectedCandidate.total_score >= 80 ? 'bg-green-500' : 
                          selectedCandidate.total_score >= 60 ? 'bg-blue-500' : 
                          selectedCandidate.total_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${selectedCandidate.total_score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Skills</p>
                  <p className="text-xl font-bold text-blue-600">
                    {Math.round(selectedCandidate.skill_score || 0)}%
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Education</p>
                  <p className="text-xl font-bold text-green-600">
                    {Math.round(selectedCandidate.education_score || 0)}%
                  </p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Experience</p>
                  <p className="text-xl font-bold text-purple-600">
                    {Math.round(selectedCandidate.experience_score || 0)}%
                  </p>
                </div>
              </div>

              {/* AI Feedback */}
              {selectedCandidate.feedback && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">AI Analysis & Feedback</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedCandidate.feedback}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                {selectedCandidate.isResumeUpload && (
                  <button
                    onClick={() => window.open(`/api/recruiter/resumes/download/${selectedCandidate.id}`, '_blank')}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <EyeIcon className="w-4 h-4 mr-2" />
                    View Resume
                  </button>
                )}
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}