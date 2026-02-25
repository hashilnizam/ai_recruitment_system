'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadIcon, FileTextIcon, X, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { recruiterAPI } from '@/lib/api';

interface UploadedResume {
  id: number;
  filename: string;
  original_name: string;
  file_size: number;
  uploaded_at: string;
}

interface MultiResumeUploadProps {
  onUploadComplete?: (resumes: UploadedResume[]) => void;
  maxFiles?: number;
}

export default function MultiResumeUpload({ onUploadComplete, maxFiles = 25 }: MultiResumeUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedResumes, setUploadedResumes] = useState<UploadedResume[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (uploading) return;

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (uploading) return;

    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const allowedTypes = ['.pdf', '.doc', '.docx'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        toast.error(`Invalid file type: ${file.name}. Only PDF, DOC, and DOCX files are allowed.`);
        return false;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File too large: ${file.name}. Maximum size is 10MB.`);
        return false;
      }

      return true;
    });

    const totalFiles = selectedFiles.length + validFiles.length;
    if (totalFiles > maxFiles) {
      toast.error(`Cannot select ${validFiles.length} files. Maximum ${maxFiles} files allowed per upload.`);
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    setUploadProgress({});

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('resumes', file);
      });

      const response = await recruiterAPI.uploadResumes(formData);
      
      console.log('🔄 Upload response:', response);
      console.log('📊 Response structure:', response);
      
      if (response.success) {
        // Show detailed upload results
        const { uploaded_files, duplicate_files, skipped_files, duplicates } = response.data || response;
        
        if (duplicate_files > 0) {
          toast.success(`${uploaded_files} resume(s) uploaded. ${duplicate_files} duplicate(s) skipped.`, {
            duration: 5000,
          });
          
          // Show details about duplicates
          if (duplicates && duplicates.length > 0) {
            duplicates.forEach((dup: any) => {
              toast(`${dup.filename} was already uploaded on ${new Date(dup.uploadedAt).toLocaleDateString()}`, {
                icon: '⚠️',
                duration: 4000,
              });
            });
          }
        } else {
          toast.success(`Successfully uploaded ${uploaded_files} resume(s)`);
        }
        
        setSelectedFiles([]);
        
        // Refresh uploaded resumes list
        await fetchUploadedResumes();
        
        if (onUploadComplete) {
          onUploadComplete(response.data);
        }
      } else {
        toast.error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload resumes';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const fetchUploadedResumes = async () => {
    try {
      console.log('🔄 Fetching uploaded resumes...');
      const token = localStorage.getItem('token');
      console.log('🔑 Auth token:', token ? 'Present' : 'Missing');
      console.log('🔑 Token length:', token?.length || 0);
      
      const response = await recruiterAPI.getResumes();
      console.log('📋 Fetch resumes response:', response);
      console.log('📊 Response success:', response.success);
      console.log('📄 Response data:', response.data);
      console.log('📈 Data length:', response.data?.length);
      
      if (response.success) {
        setUploadedResumes(response.data);
        console.log('✅ Uploaded resumes state updated:', response.data);
      } else {
        console.log('❌ Response not successful:', response.message);
        console.log('❌ Full response:', response);
        
        // If authentication error, show user-friendly message
        if (response.message?.includes('token')) {
          toast.error('Please log in again to access resume uploads');
        }
      }
    } catch (error: any) {
      console.error('Error fetching uploaded resumes:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Handle authentication errors
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else {
        toast.error('Failed to fetch uploaded resumes');
      }
    }
  };

  const handleDeleteResume = async (resumeId: number) => {
    try {
      const response = await recruiterAPI.deleteResume(resumeId);
      console.log('🗑️ Delete response:', response);
      
      if (response.success) {
        toast.success('Resume deleted successfully');
        setUploadedResumes(prev => prev.filter(r => r.id !== resumeId));
      } else {
        toast.error(response.message || 'Failed to delete resume');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete resume';
      toast.error(errorMessage);
    }
  };

  // Fetch uploaded resumes on component mount
  useEffect(() => {
    // Only fetch if component is mounted
    const timer = setTimeout(() => {
      fetchUploadedResumes();
    }, 1000); // Delay to ensure authentication is ready
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Resumes</h3>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : uploading
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-gray-400 cursor-pointer'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleChange}
            accept=".pdf,.doc,.docx"
            className="hidden"
            disabled={uploading}
          />
          
          <UploadIcon className={`w-12 h-12 mx-auto mb-4 ${uploading ? 'text-gray-400' : 'text-gray-500'}`} />
          
          <p className="text-lg font-medium text-gray-900 mb-2">
            {uploading ? 'Uploading...' : 'Drop resumes here or click to browse'}
          </p>
          
          <p className="text-sm text-gray-600 mb-4">
            Upload up to {maxFiles} resumes (PDF, DOC, DOCX • Max 10MB each)
          </p>
          
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
            <span>✓ PDF</span>
            <span>✓ DOC</span>
            <span>✓ DOCX</span>
            <span>✓ Max 10MB</span>
          </div>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">
                Selected Files ({selectedFiles.length}/{maxFiles})
              </h4>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
              </button>
            </div>
            
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileTextIcon className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                    className="text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Resumes */}
      {uploadedResumes.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Uploaded Resumes ({uploadedResumes.length}/{maxFiles})
            </h3>
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span>{uploadedResumes.length} of {maxFiles} slots used</span>
            </div>
          </div>
          
          <div className="space-y-2">
            {uploadedResumes.map((resume) => (
              <div key={resume.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileTextIcon className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{resume.original_name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(resume.file_size)} • 
                      Uploaded {new Date(resume.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteResume(resume.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete resume"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          
          {uploadedResumes.length >= maxFiles && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center text-yellow-800">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  You have reached the maximum limit of {maxFiles} resumes. Delete some resumes to upload more.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
