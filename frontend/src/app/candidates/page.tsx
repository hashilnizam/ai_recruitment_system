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
  RefreshCwIcon
} from 'lucide-react';

export default function CandidatesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [jobs, setJobs] = useState<any[]>([]);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
              total_score: app.total_score
            });
          });
        } catch (error) {
          console.error(`Error fetching applications for job ${job.id}:`, error);
        }
      }

      // Fetch recruiter resumes and add them as candidates
      try {
        const resumesResponse = await recruiterAPI.getResumes();
        const resumes = resumesResponse.data?.data || [];
        
        resumes.forEach((resume: any) => {
          allCandidates.push({
            ...resume,
            first_name: resume.original_name?.split('.')[0] || 'Unknown',
            last_name: '',
            email: 'resume-upload@system.com',
            jobTitle: 'Direct Resume Upload',
            jobId: 0,
            candidate_id: resume.id,
            status: 'pending',
            total_score: null,
            applied_at: resume.uploaded_at,
            isResumeUpload: true
          });
        });
      } catch (error) {
        console.error('Error fetching recruiter resumes:', error);
      }
      
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
                onClick={() => setShowUploadSection(!showUploadSection)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UploadIcon className="w-4 h-4 mr-2" />
                {showUploadSection ? 'Hide Upload' : 'Upload Resumes'}
              </button>
            </div>
          </div>
        </div>

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
    </Layout>
  );
}
