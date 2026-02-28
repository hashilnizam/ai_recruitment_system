'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, FileText, BarChart3, Eye } from 'lucide-react';
import { recruiterAPI } from '@/lib/api';


interface ResumeDetails {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  isResumeUpload: boolean;
  uploaded_at: string;
  file_size: number;
  original_name: string;
  total_score?: number;
  rank_position?: number;
  skill_score?: number;
  education_score?: number;
  experience_score?: number;
  score_breakdown?: any;
  strengths?: string;
  missing_skills?: string;
  suggestions?: string;
  overall_assessment?: string;
}

export default function ResumeDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [resume, setResume] = useState<ResumeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleDownload = async (resumeId: number) => {
    try {
      const response = await fetch(`/api/recruiter/resumes/download/${resumeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume-${resumeId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  useEffect(() => {
    const fetchResumeDetails = async () => {
      try {
        const response = await recruiterAPI.getResumeDetails(params.id);
        if (response.success) {
          setResume(response.data);
        } else {
          setError(response.message || 'Failed to fetch resume details');
        }
      } catch (err) {
        setError('Failed to fetch resume details');
        console.error('Error fetching resume details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResumeDetails();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resume details...</p>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Resume Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Candidates
            </button>
            <button
              onClick={() => handleDownload(resume.id)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Resume
            </button>
          </div>

          {/* Resume Info */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{resume.first_name}</h1>
              <p className="text-gray-600">{resume.email}</p>
              <p className="text-sm text-gray-500">
                Uploaded on {new Date(resume.uploaded_at).toLocaleDateString()} •{' '}
                {(resume.file_size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>

        {/* AI Ranking Results */}
        {resume.total_score && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              AI Ranking Results
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">#{resume.rank_position}</div>
                <div className="text-sm text-gray-600">Rank Position</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {typeof resume.total_score === 'number' ? resume.total_score.toFixed(1) : '0.0'}%
                </div>
                <div className="text-sm text-gray-600">Total Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {typeof resume.skill_score === 'number' ? resume.skill_score.toFixed(1) : '0.0'}%
                </div>
                <div className="text-sm text-gray-600">Skills</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {typeof resume.experience_score === 'number' ? resume.experience_score.toFixed(1) : '0.0'}%
                </div>
                <div className="text-sm text-gray-600">Experience</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {typeof resume.education_score === 'number' ? resume.education_score.toFixed(1) : '0.0'}%
                </div>
                <div className="text-sm text-gray-600">Education</div>
              </div>
            </div>
          </div>
        )}

        {/* AI Feedback */}
        {resume.overall_assessment && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">AI Analysis & Feedback</h2>

            {resume.strengths && (
              <div className="mb-4">
                <h3 className="font-semibold text-green-700 mb-2">Strengths</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{resume.strengths}</p>
              </div>
            )}

            {resume.missing_skills && (
              <div className="mb-4">
                <h3 className="font-semibold text-orange-700 mb-2">Missing Skills</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{resume.missing_skills}</p>
              </div>
            )}

            {resume.suggestions && (
              <div className="mb-4">
                <h3 className="font-semibold text-blue-700 mb-2">Suggestions</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{resume.suggestions}</p>
              </div>
            )}

            {resume.overall_assessment && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Overall Assessment</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{resume.overall_assessment}</p>
              </div>
            )}
          </div>
        )}

        {/* Resume File Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            File Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Original Filename</div>
              <div className="font-medium">{resume.original_name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">File Size</div>
              <div className="font-medium">{(resume.file_size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Upload Date</div>
              <div className="font-medium">{new Date(resume.uploaded_at).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Type</div>
              <div className="font-medium">Resume Upload</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}