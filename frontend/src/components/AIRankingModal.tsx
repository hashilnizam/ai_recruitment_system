'use client';

import { useState, useEffect } from 'react';
import { 
  BrainIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
 XIcon,
  UserIcon,
  FileTextIcon,
  BarChart3Icon,
  ClockIcon
} from 'lucide-react';

interface AIRankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number | null;
  applicationsToRank: number;
}

interface RankingProgress {
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  total_candidates: number;
  current_candidate?: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
}

export default function AIRankingModal({ 
  isOpen, 
  onClose, 
  jobId, 
  applicationsToRank 
}: AIRankingModalProps) {
  const [progress, setProgress] = useState<RankingProgress>({
    status: 'processing',
    progress: 0,
    total_candidates: applicationsToRank
  });
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && jobId) {
      // Start polling for progress
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`http://localhost:5001/api/ranking-status/${jobId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setProgress(data.data);
              
              // Stop polling if completed or failed
              if (data.data.status === 'completed' || data.data.status === 'failed') {
                clearInterval(interval);
                setPollingInterval(null);
                
                // Auto-close after 3 seconds if successful
                if (data.data.status === 'completed') {
                  setTimeout(() => {
                    onClose();
                  }, 3000);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error polling ranking status:', error);
        }
      }, 2000); // Poll every 2 seconds

      setPollingInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [isOpen, jobId, onClose]);

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  if (!isOpen) return null;

  const getStatusColor = () => {
    switch (progress.status) {
      case 'processing':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBg = () => {
    switch (progress.status) {
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getProgressColor = () => {
    switch (progress.status) {
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transform transition-all">
        {/* Header */}
        <div className={`p-6 border-2 ${getStatusBg()} rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                progress.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                progress.status === 'completed' ? 'bg-green-500' :
                progress.status === 'failed' ? 'bg-red-500' :
                'bg-gray-500'
              }`}>
                {progress.status === 'processing' ? (
                  <BrainIcon className="w-6 h-6 text-white animate-spin" />
                ) : progress.status === 'completed' ? (
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                ) : progress.status === 'failed' ? (
                  <XCircleIcon className="w-6 h-6 text-white" />
                ) : (
                  <ClockIcon className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {progress.status === 'processing' ? 'AI Ranking in Progress' :
                   progress.status === 'completed' ? 'Ranking Complete!' :
                   progress.status === 'failed' ? 'Ranking Failed' :
                   'AI Ranking'}
                </h2>
                <p className={`text-sm ${getStatusColor()}`}>
                  {progress.status === 'processing' 
                    ? `Analyzing ${applicationsToRank} candidate(s)...`
                    : progress.status === 'completed'
                    ? 'All candidates have been successfully ranked!'
                    : progress.status === 'failed'
                    ? progress.error_message || 'An error occurred during ranking'
                    : 'Preparing to rank candidates...'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{progress.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <UserIcon className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{progress.total_candidates}</p>
              <p className="text-xs text-gray-600">Total Candidates</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <FileTextIcon className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((progress.progress / 100) * progress.total_candidates)}
              </p>
              <p className="text-xs text-gray-600">Processed</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <BarChart3Icon className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {progress.total_candidates - Math.round((progress.progress / 100) * progress.total_candidates)}
              </p>
              <p className="text-xs text-gray-600">Remaining</p>
            </div>
          </div>

          {/* Current Processing Info */}
          {progress.status === 'processing' && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <BrainIcon className="w-5 h-5 text-blue-600 animate-pulse" />
                <p className="text-sm text-blue-800">
                  AI is analyzing resumes and calculating scores...
                </p>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                This may take a few moments depending on the number of candidates
              </p>
            </div>
          )}

          {/* Success State */}
          {progress.status === 'completed' && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-800">
                  Ranking completed successfully! 
                </p>
              </div>
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <p className="text-sm text-yellow-800 font-medium">
                    <strong>IMPORTANT:</strong> Please click the "Refresh" button in the top-right corner to see the updated ranking results!
                  </p>
                </div>
                <p className="text-xs text-yellow-700 mt-2">
                  The page needs to be refreshed to display the new AI scores and rankings.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {progress.status === 'failed' && (
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <XCircleIcon className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-800">
                  {progress.error_message || 'An error occurred during ranking'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-3 w-full bg-red-600 text-white rounded-lg py-2 hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {progress.status === 'processing' && (
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full bg-gray-600 text-white rounded-lg py-2 hover:bg-gray-700 transition-colors"
            >
              Run in Background
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
