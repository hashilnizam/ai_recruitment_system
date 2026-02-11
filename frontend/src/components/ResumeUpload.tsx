'use client';

import { useState, useRef } from 'react';
import { UploadIcon, FileTextIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ResumeUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  loading?: boolean;
}

export default function ResumeUpload({ onFileSelect, onFileRemove, selectedFile, loading = false }: ResumeUploadProps) {
  const [dragActive, setDragActive] = useState(false);
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

    if (loading) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (loading) return;

    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Check file type
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast.error('Only PDF, DOC, and DOCX files are allowed');
      return;
    }

    // Check file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    onFileSelect(file);
    toast.success(`Resume file selected: ${file.name}`);
  };

  const handleButtonClick = () => {
    if (loading) return;
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    onFileRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleChange}
        accept=".pdf,.doc,.docx"
        className="hidden"
        disabled={loading}
      />

      {selectedFile ? (
        <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <FileTextIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            {!loading && (
              <button
                onClick={handleRemoveFile}
                className="text-red-500 hover:text-red-700 p-1"
                title="Remove file"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className={`p-4 rounded-full ${dragActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <UploadIcon className={`h-8 w-8 ${dragActive ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {loading ? 'Uploading...' : 'Upload your resume'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop your resume here, or click to browse
              </p>
            </div>
            <div className="text-xs text-gray-400">
              Supported formats: PDF, DOC, DOCX (Max 10MB)
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-blue-700">Processing your resume...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
