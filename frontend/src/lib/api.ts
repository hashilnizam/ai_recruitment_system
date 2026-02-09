import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/auth/login';
        }
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
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'recruiter' | 'candidate';
    companyName?: string;
    phone?: string;
  }) => api.post('/auth/register', userData),
  
  getProfile: () => api.get('/auth/me'),
  
  updateProfile: (data: {
    firstName: string;
    lastName: string;
    companyName?: string;
    phone?: string;
  }) => api.put('/auth/profile', data),
};

// Jobs API
export const jobsAPI = {
  getJobs: (params?: {
    status?: string;
    recruiterId?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }) => api.get('/jobs', params),
  
  getJob: (id: number) => api.get(`/jobs/${id}`),
  
  createJob: (data: {
    title: string;
    description: string;
    requiredSkills: string[];
    requiredEducation: string[];
    requiredExperience: {
      minYears: number;
      preferredRoles: string[];
    };
    location?: string;
    salaryRange?: string;
    employmentType?: string;
    status?: string;
  }) => api.post('/jobs', data),
  
  updateJob: (id: number, data: any) => api.put(`/jobs/${id}`, data),
  
  deleteJob: (id: number) => api.delete(`/jobs/${id}`),
  
  getJobStats: (id: number) => api.get(`/jobs/${id}/stats`),
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
    education: Array<{
      degree: string;
      fieldOfStudy: string;
      institution: string;
      graduationYear: number;
      gpa?: number;
    }>;
    experience: Array<{
      jobTitle: string;
      company: string;
      durationMonths: number;
      startDate?: string;
      endDate?: string;
      isCurrent?: boolean;
      description?: string;
    }>;
  }) => api.post('/applications', data),
  
  getJobApplications: (jobId: number) => api.get(`/applications/job/${jobId}`),
  
  getMyApplications: () => api.get('/applications/my'),
  
  getApplication: (id: number) => api.get(`/applications/${id}`),
  
  updateApplicationStatus: (id: number, status: string) =>
    api.patch(`/applications/${id}/status`, { status }),
};

// Rankings API
export const rankingsAPI = {
  triggerRanking: (jobId: number) => api.post('/rankings/trigger', { jobId }),
  
  getRankingStatus: (jobId: number) => api.get(`/rankings/status/${jobId}`),
  
  getRankedCandidates: (jobId: number, limit?: number) =>
    api.get(`/rankings/candidates/${jobId}`, { limit }),
  
  getRankings: (jobId: number) => api.get(`/rankings/job/${jobId}`),
};

// AI Service API (direct to AI service)
export const aiAPI = {
  testConnection: () => 
    axios.get(`${process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:5001'}/api/test-connection`),
  
  rankCandidates: (jobId: number) =>
    axios.post(`${process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:5001'}/api/rank-candidates`, {
      jobId,
    }),
  
  getRankingStatus: (jobId: number) =>
    axios.get(`${process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:5001'}/api/ranking-status/${jobId}`),
};

export default api;
