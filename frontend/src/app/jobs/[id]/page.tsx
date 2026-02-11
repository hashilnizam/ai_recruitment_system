'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import ResumeUpload from '@/components/ResumeUpload';
import { jobsAPI, applicationsAPI } from '@/lib/api';
import { 
  BriefcaseIcon, 
  MapPinIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from '@/components/Icons';
import toast from 'react-hot-toast';

export default function JobDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [applicationData, setApplicationData] = useState({
    skills: '',
    education: '',
    experience: '',
    coverLetter: ''
  });
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJobDetails();
      checkIfAlreadyApplied();
    }
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching job details for ID:', id);
      const response = await jobsAPI.getJob(parseInt(id as string));
      console.log('📊 Job API response:', response);
      console.log('📋 Response.data:', response.data);
      console.log('📋 Response type:', typeof response.data);
      console.log('📋 Response is array:', Array.isArray(response.data));
      
      // Handle different response structures
      let jobData = null;
      if (response && typeof response === 'object') {
        if (response.data && typeof response.data === 'object') {
          jobData = response.data;
        } else if (response.success && response.data) {
          jobData = response.data;
        }
      }
      
      console.log('📋 Final job data:', jobData);
      console.log('📋 Job data keys:', jobData ? Object.keys(jobData) : 'undefined');
      
      setJob(jobData);
    } catch (error) {
      console.error('❌ Error fetching job details:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const checkIfAlreadyApplied = async () => {
    try {
      // Only check applications if user is a candidate
      if (user?.role === 'candidate') {
        const response = await applicationsAPI.getMyApplications();
        console.log('📋 Applications API response:', response);
        
        // Handle both response structures
        const applications = response.data || response.data?.data || [];
        console.log('📋 Applications data:', applications);
        
        const alreadyApplied = applications.some((app: any) => app.job_id == id);
        setHasApplied(alreadyApplied);
      } else {
        // Recruiters don't apply to jobs
        setHasApplied(false);
      }
    } catch (error) {
      console.error('Error checking application status:', error);
      setHasApplied(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setApplicationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please upload your resume');
      return;
    }

    if (!applicationData.skills) {
      toast.error('Please list your skills');
      return;
    }

    try {
      setApplying(true);

      console.log('🔄 Submitting application...');
      console.log('📋 API client:', applicationsAPI);
      console.log('📋 Job ID:', parseInt(id as string));
      console.log('📋 Skills:', applicationData.skills);
      console.log('📋 Resume file:', selectedFile);

      const response = await applicationsAPI.submitApplication({
        jobId: parseInt(id as string),
        skills: applicationData.skills.split(',').map(skill => ({
          name: skill.trim(),
          proficiencyLevel: 'intermediate'
        })),
        education: applicationData.education,
        experience: applicationData.experience,
        resume: selectedFile
      });

      console.log('📊 Application response:', response);

      if (response.success) {
        toast.success('Application submitted successfully!');
        setHasApplied(true);
        setShowApplicationForm(false);
        setSelectedFile(null);
        setApplicationData({
          skills: '',
          education: '',
          experience: '',
          coverLetter: ''
        });
      } else {
        toast.error(response.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Loading job details..." />
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Job not found</h3>
            <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => router.push('/jobs')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Browse Jobs
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const requiredSkills = Array.isArray(job.required_skills) 
    ? job.required_skills 
    : JSON.parse(job.required_skills || '[]');

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
            <div className="flex items-center space-x-4 mt-2 text-gray-600">
              <span className="flex items-center">
                <MapPinIcon size={16} className="mr-1" />
                {job.location || 'Remote'}
              </span>
              <span className="flex items-center">
                <BriefcaseIcon size={16} className="mr-1" />
                {job.employment_type || 'Full-time'}
              </span>
              {job.salary_range && (
                <span className="flex items-center">
                  <CurrencyDollarIcon size={16} className="mr-1" />
                  {job.salary_range}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                </div>
              </div>

              {/* Requirements */}
              {job.requirements && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                  </div>
                </div>
              )}

              {/* Required Skills */}
              {requiredSkills.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Required Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {requiredSkills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Job Info Card */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">Job Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <CalendarIcon size={16} className="mr-2" />
                    <span className="text-sm">Posted {new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <UserGroupIcon size={16} className="mr-2" />
                    <span className="text-sm">{job.application_count || 0} applicants</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <ClockIcon size={16} className="mr-2" />
                    <span className="text-sm capitalize">{job.status}</span>
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              {hasApplied ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <CheckCircleIcon size={48} className="text-green-600 mx-auto mb-3" />
                  <h3 className="font-bold text-green-900 mb-2">Already Applied</h3>
                  <p className="text-green-700 text-sm">You have already applied for this position.</p>
                </div>
              ) : (
                <button
                  onClick={() => setShowApplicationForm(!showApplicationForm)}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
                >
                  Apply for This Position
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Application Form */}
        {showApplicationForm && !hasApplied && (
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Apply for {job.title}</h2>
            
            <form onSubmit={handleSubmitApplication} className="space-y-6">
              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resume *
                </label>
                <ResumeUpload
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                  selectedFile={selectedFile}
                  loading={applying}
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills *
                </label>
                <textarea
                  name="skills"
                  value={applicationData.skills}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="List your relevant skills (comma-separated)..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: JavaScript, React, Node.js, Python, AWS
                </p>
              </div>

              {/* Education */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education
                </label>
                <textarea
                  name="education"
                  value={applicationData.education}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Your educational background..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Experience
                </label>
                <textarea
                  name="experience"
                  value={applicationData.experience}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Your relevant work experience..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Cover Letter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter
                </label>
                <textarea
                  name="coverLetter"
                  value={applicationData.coverLetter}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Why are you interested in this position? (Optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={applying || !selectedFile}
                  className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowApplicationForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}
