import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';
import { ApiErrorHandler } from '@/utils/apiErrorHandler';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
      timeout: 30000, // Increased from 10000 to 30000ms (30 seconds) for AI processing
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(' API Client baseURL:', this.client.defaults.baseURL);
    console.log(' Environment variable NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Don't set Content-Type for FormData - let axios set it automatically
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }
        
        console.log(' API Request:', config.method?.toUpperCase(), (config.baseURL || '') + (config.url || ''));
        console.log(' Request data type:', config.data instanceof FormData ? 'FormData' : typeof config.data);
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Check for API errors
        if (response.status >= 400) {
          const apiError = ApiErrorHandler.handle(response, 'API request failed');
          return Promise.reject(new Error(apiError.message));
        }
        
        return response;
      },
      (error) => {
        // Handle different error types
        ApiErrorHandler.handle(error, 'Network error occurred');
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data);
    return response.data;
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data);
    return response.data;
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url);
    return response.data;
  }
}

// Create API client instance
const api = new ApiClient();

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/api/auth/login', { email, password }),
  
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'recruiter' | 'candidate';
    companyName?: string;
    phone?: string;
  }) => api.post('/api/auth/register', userData),
  
  getProfile: () => api.get('/api/auth/me'),
  
  updateProfile: (data: {
    firstName: string;
    lastName: string;
    companyName?: string;
    phone?: string;
  }) => api.put('/api/auth/profile', data),
};

// Jobs API
export const jobsAPI = {
  getJobs: (params?: {
    status?: string;
    recruiterId?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }) => api.get('/api/jobs', params),
  
  getJob: (id: number) => api.get(`/api/jobs/${id}`),
  
  createJob: (data: {
    title: string;
    description: string;
    requirements: string;
    location: string;
    job_type: string;
    salary_min: number;
    salary_max: number;
    employment_type: string;
  }) => api.post('/api/jobs', data),
  
  updateJob: (id: number, data: any) => api.put(`/api/jobs/${id}`, data),
  
  deleteJob: (id: number) => api.delete(`/api/jobs/${id}`),
  
  publishJob: (id: number) => api.post(`/api/jobs/${id}/publish`),
  
  getJobApplications: (jobId: number) => api.get(`/api/jobs/${jobId}/applications`),
  
  getRecommendations: () => api.get('/api/jobs/recommendations'),
  
  getInsights: () => api.get('/api/jobs/insights'),
  
  getTrends: () => api.get('/api/jobs/trends'),
  
  getDashboardStats: () => api.get('/api/jobs/stats/dashboard'),
};

// Applications API
export const applicationsAPI = {
  submitApplication: (data: {
    jobId: number;
    skills: Array<{
      name: string;
      proficiencyLevel?: string;
      yearsOfExperience?: number;
    }>;
    education?: string;
    experience?: string;
    resume: File;
  }) => {
    const formData = new FormData();
    formData.append('jobId', data.jobId.toString());
    formData.append('skills', JSON.stringify(data.skills));
    if (data.education) formData.append('education', data.education);
    if (data.experience) formData.append('experience', data.experience);
    formData.append('resume', data.resume);
    
    return api.post('/api/applications/submit', formData);
  },
  
  getJobApplications: (jobId: number) => api.get(`/api/applications/job/${jobId}`),
  
  getMyApplications: () => api.get('/api/applications/my'),
  
  updateApplicationStatus: (applicationId: number, status: string) => 
    api.patch(`/api/applications/${applicationId}/status`, { status }),
  
  getApplication: (id: number) => api.get(`/api/applications/${id}`),
  
  cancelApplication: (id: number) => api.post(`/api/applications/${id}/cancel`),
};

// Rankings API
export const rankingsAPI = {
  triggerRanking: (jobId: number) => api.post('/api/rankings/trigger', { jobId }),
  
  getRankingStatus: (jobId: number) => api.get(`/api/rankings/status/${jobId}`),
  
  getRankedCandidates: (jobId: number, limit?: number) =>
    api.get(`/api/rankings/candidates/${jobId}`, { limit }),
  
  getRankings: (jobId: number) => api.get(`/api/rankings/job/${jobId}`),
};

// Recruiter API
export const recruiterAPI = {
  getResumes: async () => {
    const response = await api.get('/api/recruiter/resumes');
    return response; // Return the full response (api.get already unwraps)
  },
  
  uploadResumes: async (formData: FormData) => {
    // Use the main API client to ensure authentication works properly
    const response = await api.post('/api/recruiter/resumes', formData);
    return response; // Return the full response (api.post already unwraps)
  },
  
  deleteResume: async (id: number) => {
    const response = await api.delete(`/api/recruiter/resumes/${id}`);
    return response; // Return the full response since api.delete() already unwraps
  },
};

// AI Service API (direct to AI service)
export const aiAPI = {
  testConnection: () => 
    axios.get(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:5001'}/api/test-connection`),
  
  rankCandidates: (jobId: number) =>
    axios.post(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:5001'}/api/rank-candidates`, {
      jobId,
    }),
  
  getRankingStatus: (jobId: number) =>
    axios.get(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:5001'}/api/ranking-status/${jobId}`),
};

export default api;
