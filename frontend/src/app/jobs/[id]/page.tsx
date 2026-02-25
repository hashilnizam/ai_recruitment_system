'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import ResumeUpload from '@/components/ResumeUpload';
import { jobsAPI, applicationsAPI } from '@/lib/api';
import api from '@/lib/api';
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
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showExtractedForm, setShowExtractedForm] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [manualData, setManualData] = useState<any>({}); // Store manually added data

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
        const applications = response.data?.data || response.data || [];
        console.log('📋 Applications data:', applications);
        
        const alreadyApplied = applications.some((app: any) => 
          app.job_id == id && app.status !== 'cancelled'
        );
        console.log('🔍 Checking if already applied:', {
          jobId: id,
          userApplications: applications,
          alreadyApplied: alreadyApplied,
          activeApplications: applications.filter((app: any) => app.job_id == id && app.status !== 'cancelled')
        });
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

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    
    // Start AI extraction when file is selected
    if (file && file.type === 'application/pdf') {
      setIsExtracting(true);
      setExtractedData(null);
      setShowExtractedForm(false);
      
      try {
        console.log('🤖 Starting AI resume extraction...');
        
        // Create form data for file upload
        const formData = new FormData();
        formData.append('resume', file);
        
        // Call backend to extract resume data using API client
        const response = await api.post('/api/applications/extract-resume', formData);
        
        const result = response.data;
        
        console.log('🔍 Full API response:', result);
        console.log('🔍 result.success:', result.success);
        console.log('🔍 result.message:', result.message);
        
        // The API returns the data directly, not wrapped in success/data structure
        const extractedData = result;
        const hasSuccess = result.success !== undefined ? result.success : true;
        
        if (hasSuccess && extractedData) {
          console.log('✅ Resume extraction successful:', extractedData);
          console.log('📊 Raw AI response:', JSON.stringify(extractedData, null, 2));
          setExtractedData(extractedData);
          
          // Check if any meaningful data was extracted
          const hasExtractedData = extractedData && (
            (extractedData.skills && extractedData.skills.length > 0) ||
            (extractedData.education && extractedData.education.length > 0) ||
            (extractedData.experience && extractedData.experience.length > 0)
          );
          
          if (!hasExtractedData) {
            console.warn('⚠️ No meaningful data extracted from resume');
            toast('AI couldn\'t extract detailed information from your resume. You can enter the details manually.', {
              icon: '⚠️',
              duration: 5000
            });
            // Still show the form but with empty fields for manual input
            setShowExtractedForm(true);
            setApplicationData({
              skills: '',
              education: '',
              experience: '',
              coverLetter: ''
            });
            return;
          }
          
          // Auto-fill form with extracted data
          const newApplicationData = {
            skills: extractedData.skills ? 
              (Array.isArray(extractedData.skills) 
                ? extractedData.skills.map((s: any) => s.name || s.skill_name || s).join(', ')
                : extractedData.skills) 
              : '',
            education: extractedData.education ? 
              (Array.isArray(extractedData.education)
                ? extractedData.education.map((edu: any) => 
                    `${edu.degree || ''} in ${edu.field || edu.field_of_study || ''} at ${edu.institution || ''}`
                  ).join('\n')
                : extractedData.education)
              : '',
            experience: extractedData.experience ?
              (Array.isArray(extractedData.experience)
                ? extractedData.experience.map((exp: any) => 
                    `${exp.title || exp.job_title || ''} at ${exp.company || ''}\n${exp.description || ''}`
                  ).join('\n\n')
                : extractedData.experience)
              : '',
            coverLetter: '' // Cover letter is not extracted
          };
          
          console.log('📝 Application data to set:', newApplicationData);
          setApplicationData(newApplicationData);
          setShowExtractedForm(true);
          console.log('👀 showExtractedForm set to true');
          toast.success('Resume data extracted successfully!');
        } else {
          console.error('❌ Resume extraction failed:', result.message);
          toast.error(result.message || 'Failed to extract resume data');
        }
      } catch (error) {
        console.error('❌ Error during resume extraction:', error);
        toast.error('Failed to extract resume data. Please try again.');
      } finally {
        setIsExtracting(false);
      }
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setExtractedData(null);
    setShowExtractedForm(false);
    setManualData({}); // Clear manual data
    setApplicationData({
      skills: '',
      education: '',
      experience: '',
      coverLetter: ''
    });
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

      // Add timeout handling
      const response = await Promise.race([
        applicationsAPI.submitApplication({
          jobId: parseInt(id as string),
          skills: applicationData.skills.split(',').map(skill => ({
            name: skill.trim(),
            proficiencyLevel: 'intermediate'
          })),
          education: applicationData.education,
          experience: applicationData.experience,
          resume: selectedFile
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Application submission timed out. Please try again.')), 25000)
        )
      ]);

      console.log('📊 Application response:', response);

      if ((response as any).success) {
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
        toast.error((response as any).message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      
      // Handle different types of errors
      let errorMessage = 'Failed to submit application';
      const errorObj = error as any;
      
      if (errorObj.message && errorObj.message.includes('timed out')) {
        errorMessage = 'Application submission timed out. The AI processing is taking too long. Please try again or use a smaller resume file.';
      } else if (errorObj.code === 'ECONNABORTED') {
        errorMessage = 'Connection timed out. Please check your internet connection and try again.';
      } else if (errorObj.response?.data?.message) {
        errorMessage = errorObj.response.data.message;
      }
      
      toast.error(errorMessage);
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

              {/* Apply Button - Only for Candidates */}
              {user?.role === 'candidate' && (
                hasApplied ? (
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
                )
              )}

              {/* Recruiter View - No Apply Button */}
              {user?.role === 'recruiter' && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                  <BriefcaseIcon size={48} className="text-gray-600 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2">Recruiter View</h3>
                  <p className="text-gray-700 text-sm">This is your job posting. Candidates can apply from their dashboard.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Application Form - Only for Candidates */}
        {showApplicationForm && !hasApplied && user?.role === 'candidate' && (
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Apply for {job.title}</h2>
            
            <form onSubmit={handleSubmitApplication} className="space-y-6">
              {/* Resume Upload with AI Extraction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resume *
                </label>
                <ResumeUpload
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                  selectedFile={selectedFile}
                  loading={isExtracting || applying}
                />
                
                {/* AI Extraction Status */}
                {isExtracting && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-blue-700">AI is extracting data from your resume...</span>
                    </div>
                  </div>
                )}
                
                {extractedData && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon size={16} className="text-green-600" />
                      <span className="text-sm text-green-700">Resume data extracted successfully!</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Extracted Data Form - Only show after AI extraction */}
              {showExtractedForm && (
                <>
                  {console.log('🎯 Rendering extracted form, showExtractedForm:', showExtractedForm)}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Extracted Information</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      AI has extracted the following information from your resume. Please review and edit as needed.
                    </p>
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

                  {/* Add Missing Skills Button */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newSkill = prompt('Add a skill that AI might have missed:');
                        if (newSkill && newSkill.trim()) {
                          setApplicationData((prev: any) => ({
                            ...prev,
                            skills: prev.skills ? `${prev.skills}, ${newSkill.trim()}` : newSkill.trim()
                          }));
                          setManualData((prev: any) => ({
                            ...prev,
                            skills: [...(prev.skills || []), newSkill.trim()]
                          }));
                        }
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add Missing Skill
                    </button>
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
                    <button
                      type="button"
                      onClick={() => {
                        const newEdu = prompt('Add education that AI might have missed:');
                        if (newEdu && newEdu.trim()) {
                          setApplicationData((prev: any) => ({
                            ...prev,
                            education: prev.education ? `${prev.education}\n${newEdu.trim()}` : newEdu.trim()
                          }));
                          setManualData((prev: any) => ({
                            ...prev,
                            education: [...(prev.education || []), newEdu.trim()]
                          }));
                        }
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                    >
                      + Add Missing Education
                    </button>
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
                    <button
                      type="button"
                      onClick={() => {
                        const newExp = prompt('Add experience that AI might have missed:');
                        if (newExp && newExp.trim()) {
                          setApplicationData((prev: any) => ({
                            ...prev,
                            experience: prev.experience ? `${prev.experience}\n\n${newExp.trim()}` : newExp.trim()
                          }));
                          setManualData((prev: any) => ({
                            ...prev,
                            experience: [...(prev.experience || []), newExp.trim()]
                          }));
                        }
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                    >
                      + Add Missing Experience
                    </button>
                  </div>
                </>
              )}

              {/* Submit Buttons */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={applying || !selectedFile || !showExtractedForm}
                  className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowApplicationForm(false);
                    setShowExtractedForm(false);
                  }}
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
