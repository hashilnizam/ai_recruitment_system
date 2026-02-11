'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  UserIcon, 
  MailIcon, 
  PhoneIcon, 
  BriefcaseIcon, 
  DocumentIcon,
  ChartIcon,
  StarIcon,
  ClockIcon,
  MapPinIcon,
  CalendarIcon,
  ArrowLeftIcon
} from '@/components/Icons';
import toast from 'react-hot-toast';

interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  created_at: string;
  applications: any[];
  skills: any[];
  education: any[];
  experience: any[];
  stats: {
    totalApplications: number;
    pendingApplications: number;
    rankedApplications: number;
    shortlistedApplications: number;
    averageScore: number;
    highestRank: number;
    totalSkills: number;
    uniqueSkills: number;
  };
  statusBreakdown: Record<string, number>;
  skillProficiency: Record<string, number>;
}

export default function CandidateProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCandidateDetails();
    }
  }, [id]);

  const fetchCandidateDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/candidates/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setCandidate(result.data);
      } else {
        toast.error(result.message || 'Failed to fetch candidate details');
      }
    } catch (error) {
      console.error('Error fetching candidate:', error);
      toast.error('Failed to fetch candidate details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      ranked: 'bg-blue-100 text-blue-700',
      reviewed: 'bg-purple-100 text-purple-700',
      shortlisted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getProficiencyColor = (level: string) => {
    const colors = {
      beginner: 'bg-gray-100 text-gray-700',
      intermediate: 'bg-blue-100 text-blue-700',
      advanced: 'bg-purple-100 text-purple-700',
      expert: 'bg-green-100 text-green-700'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Loading candidate profile..." />
      </Layout>
    );
  }

  if (!candidate) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <UserIcon size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Candidate not found</h3>
            <p className="text-gray-600 mb-6">The candidate profile you're looking for doesn't exist or you don't have access.</p>
            <button
              onClick={() => router.back()}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {candidate.first_name} {candidate.last_name}
              </h1>
              <p className="text-gray-600">Candidate Profile</p>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{candidate.stats.totalApplications}</p>
              </div>
              <DocumentIcon className="text-blue-500" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {candidate.stats.averageScore ? candidate.stats.averageScore.toFixed(1) : 'N/A'}
                </p>
              </div>
              <ChartIcon className="text-green-500" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Highest Rank</p>
                <p className="text-2xl font-bold text-gray-900">
                  {candidate.stats.highestRank ? `#${candidate.stats.highestRank}` : 'N/A'}
                </p>
              </div>
              <StarIcon className="text-yellow-500" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Skills</p>
                <p className="text-2xl font-bold text-gray-900">{candidate.stats.uniqueSkills}</p>
              </div>
              <BriefcaseIcon className="text-purple-500" size={24} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <MailIcon className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{candidate.email}</p>
                  </div>
                </div>
                {candidate.phone && (
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{candidate.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="font-medium text-gray-900">
                      {new Date(candidate.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Skills</h2>
              {candidate.skills.length > 0 ? (
                <div className="space-y-3">
                  {candidate.skills.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{skill.skill_name}</p>
                        <p className="text-sm text-gray-600">Used in {skill.usage_count} application{skill.usage_count !== 1 ? 's' : ''}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getProficiencyColor(skill.proficiency_level)}`}>
                        {skill.proficiency_level}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No skills listed</p>
              )}
            </div>

            {/* Applications */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Applications</h2>
              {candidate.applications.length > 0 ? (
                <div className="space-y-4">
                  {candidate.applications.slice(0, 5).map((application, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{application.job_title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {application.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <CalendarIcon size={14} className="mr-1" />
                          {new Date(application.applied_at).toLocaleDateString()}
                        </span>
                        {application.total_score && (
                          <span className="flex items-center">
                            <ChartIcon size={14} className="mr-1" />
                            Score: {application.total_score.toFixed(1)}
                          </span>
                        )}
                        {application.rank_position && (
                          <span className="flex items-center">
                            <StarIcon size={14} className="mr-1" />
                            Rank: #{application.rank_position}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No applications yet</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Status Breakdown */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Application Status</h3>
              <div className="space-y-3">
                {Object.entries(candidate.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{status}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Proficiency */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Skill Proficiency</h3>
              <div className="space-y-3">
                {Object.entries(candidate.skillProficiency).map(([level, count]) => (
                  <div key={level} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{level}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-6 shadow-lg">
              <h3 className="font-bold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Shortlisted</span>
                  <span className="font-bold">{candidate.stats.shortlistedApplications}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Pending Review</span>
                  <span className="font-bold">{candidate.stats.pendingApplications}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Ranked</span>
                  <span className="font-bold">{candidate.stats.rankedApplications}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
