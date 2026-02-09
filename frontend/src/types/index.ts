export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'recruiter' | 'candidate';
  companyName?: string;
  phone?: string;
  createdAt: string;
}

export interface Job {
  id: number;
  recruiterId: number;
  title: string;
  description: string;
  requiredSkills: string[];
  requiredEducation: string[];
  requiredExperience: {
    minYears: number;
    preferredRoles: string[];
  };
  status: 'draft' | 'published' | 'closed';
  location?: string;
  salaryRange?: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  applicationCount?: number;
}

export interface Application {
  id: number;
  jobId: number;
  candidateId: number;
  status: 'pending' | 'ranked' | 'reviewed' | 'rejected' | 'shortlisted';
  appliedAt: string;
  skills: Skill[];
  education: Education[];
  experience: Experience[];
  candidate?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  totalScore?: number;
  rankPosition?: number;
  feedback?: Feedback;
}

export interface Skill {
  id?: number;
  applicationId?: number;
  skillName: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
}

export interface Education {
  id?: number;
  applicationId?: number;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  graduationYear: number;
  gpa?: number;
}

export interface Experience {
  id?: number;
  applicationId?: number;
  jobTitle: string;
  company: string;
  durationMonths: number;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

export interface Ranking {
  id: number;
  jobId: number;
  applicationId: number;
  skillScore: number;
  educationScore: number;
  experienceScore: number;
  totalScore: number;
  rankPosition: number;
  scoreBreakdown: {
    skill_score: number;
    education_score: number;
    experience_score: number;
    total_score: number;
  };
  rankedAt: string;
}

export interface Feedback {
  id?: number;
  applicationId?: number;
  strengths: string;
  missingSkills: string;
  suggestions: string;
  overallAssessment: string;
  generatedAt: string;
}

export interface ProcessingJob {
  id: number;
  jobId: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalCandidates: number;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface JobStatistics {
  totalApplications: number;
  ranked: number;
  shortlisted: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
}
