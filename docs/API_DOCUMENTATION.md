# API Documentation - AI Recruitment System

👨‍💻 **Lead Developer: Hashil Nisam**  
📧 Email: hashilnizam@gmail.com  
🌐 Portfolio: https://hashilnizam.github.io/hashilnisam/  
💬 WhatsApp: https://wa.me/+917561845352  
🔗 LinkedIn: https://linkedin.com/in/hashilnisam  
🎮 Discord: hashilnizam  
🐙 GitHub: https://github.com/hashilnizam

## Base URLs

- **Backend API**: `http://localhost:5000/api`
- **AI Service**: `http://localhost:5001/api`
- **Frontend**: `http://localhost:3000`

## Authentication

All API endpoints (except authentication endpoints) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "data": {}, // Response data
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "recruiter", // or "candidate"
  "companyName": "Tech Corp" // Required for recruiters
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "recruiter"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "recruiter"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "recruiter",
    "companyName": "Tech Corp",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890"
}
```

## Job Management Endpoints

### Get All Jobs (Recruiter)
```http
GET /api/jobs
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Senior Frontend Developer",
      "description": "We are looking for an experienced Frontend Developer...",
      "status": "published",
      "location": "Remote",
      "employment_type": "full-time",
      "created_at": "2025-01-01T00:00:00.000Z",
      "application_count": 5,
      "ranked_count": 3
    }
  ],
  "count": 1
}
```

### Create Job
```http
POST /api/jobs
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Senior Full Stack Developer",
  "description": "We are looking for an experienced Full Stack Developer to join our team.",
  "requirements": "5+ years of experience with React and Node.js...",
  "location": "Remote",
  "job_type": "full-time",
  "salary_min": "80000",
  "salary_max": "120000",
  "experience_level": "senior",
  "skills": "React, Node.js, TypeScript, MongoDB, Docker"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "id": 2,
    "title": "Senior Full Stack Developer",
    "status": "draft"
  }
}
```

### Get Job by ID
```http
GET /api/jobs/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Senior Frontend Developer",
    "description": "We are looking for an experienced Frontend Developer...",
    "required_skills": ["React", "TypeScript", "CSS"],
    "required_education": ["Bachelor in Computer Science"],
    "required_experience": {"min_years": 5},
    "status": "published",
    "location": "Remote",
    "employment_type": "full-time",
    "created_at": "2025-01-01T00:00:00.000Z",
    "applications": [
      {
        "id": 1,
        "candidate_id": 2,
        "status": "ranked",
        "applied_at": "2025-01-02T00:00:00.000Z",
        "first_name": "Alice",
        "last_name": "Johnson",
        "email": "alice@example.com"
      }
    ]
  }
}
```

### Update Job
```http
PUT /api/jobs/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Updated Job Title",
  "description": "Updated description...",
  "status": "published"
}
```

### Delete Job
```http
DELETE /api/jobs/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Job deleted successfully"
}
```

### Publish Job
```http
POST /api/jobs/:id/publish
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Job published successfully"
}
```

### Get Dashboard Statistics
```http
GET /api/jobs/stats/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalJobs": 5,
    "activeJobs": 3,
    "totalApplications": 25,
    "pendingRankings": 7
  }
}
```

## AI Service Endpoints

### Screen Resume
```http
POST /api/ai/screen-resume
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "job_id": 1,
  "candidate_id": 2,
  "resume_text": "Resume content here...",
  "skills": ["React", "Node.js", "TypeScript"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "application_id": 1,
    "skill_score": 85.5,
    "education_score": 90.0,
    "experience_score": 88.0,
    "total_score": 87.8,
    "rank_position": 2,
    "feedback": {
      "strengths": ["Strong React experience", "Good education background"],
      "missing_skills": ["Cloud experience"],
      "suggestions": ["Consider AWS certification"]
    }
  }
}
```

### Batch Process Applications
```http
POST /api/ai/batch-process
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "job_id": 1,
  "application_ids": [1, 2, 3, 4, 5]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processing_job_id": "job_123456",
    "status": "queued",
    "total_applications": 5
  }
}
```

### Get Processing Status
```http
GET /api/ai/status/:job_id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "job_123456",
    "status": "processing",
    "progress": 60,
    "total_candidates": 5,
    "processed_candidates": 3,
    "started_at": "2025-01-01T12:00:00.000Z"
  }
}
```

## Error Codes

| Status Code | Description | Example |
|-------------|-------------|---------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | User doesn't have permission |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error occurred |

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per minute per IP
- **AI Processing**: 10 requests per minute per user

## Data Validation

### User Registration
- Email: Valid email format
- Password: Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number
- Name: Letters only, max 100 characters
- Role: Must be 'recruiter' or 'candidate'

### Job Creation
- Title: Required, max 255 characters
- Description: Required, max 10,000 characters
- Requirements: Required, max 5,000 characters
- Job Type: Must be one of: 'full-time', 'part-time', 'contract', 'internship'
- Experience Level: Must be one of: 'entry', 'mid', 'senior', 'executive'

## File Upload

### Resume Upload
```http
POST /api/applications/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `resume`: File (PDF, DOC, DOCX)
- `job_id`: Job ID

**Response:**
```json
{
  "success": true,
  "data": {
    "application_id": 1,
    "resume_hash": "abc123...",
    "file_size": 1024000
  }
}
```

## WebSocket Events

### Real-time Updates
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:5000');

// Events
ws.on('application_received', (data) => {
  // New application received
});

ws.on('ranking_completed', (data) => {
  // AI ranking completed
});

ws.on('job_published', (data) => {
  // Job published
});
```

## Testing

### Test Accounts
```json
// Recruiter
{
  "email": "recruiter1@techcorp.com",
  "password": "Password123!"
}

// Candidate
{
  "email": "candidate1@email.com", 
  "password": "Password123!"
}
```

📚 **Related Documentation:**
- **[Quick Start Guide](QUICK_START.md)** - Setup and testing instructions
- **[Project Architecture](PROJECT_ARCHITECTURE.md)** - System design overview
- **[Website Test Report](WEBSITE_TEST_REPORT.md)** - Comprehensive testing results
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Backend API is running",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "environment": "development"
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
// API Client
class RecruitmentAPI {
  private baseURL = 'http://localhost:5000/api';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async createJob(jobData: any) {
    const response = await fetch(`${this.baseURL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(jobData)
    });
    return response.json();
  }

  async getJobs() {
    const response = await fetch(`${this.baseURL}/jobs`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return response.json();
  }
}
```

### Python
```python
import requests

class RecruitmentAPI:
    def __init__(self, token):
        self.base_url = 'http://localhost:5000/api'
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def create_job(self, job_data):
        response = requests.post(
            f'{self.base_url}/jobs',
            json=job_data,
            headers=self.headers
        )
        return response.json()
    
    def get_jobs(self):
        response = requests.get(
            f'{self.base_url}/jobs',
            headers=self.headers
        )
        return response.json()
```

---

**Last Updated**: February 2025  
**Version**: 1.0.0  
**Lead Developer**: Hashil Nisam  
**Email**: hashilnizam@gmail.com  
**Portfolio**: https://hashilnizam.github.io/hashilnisam/  
**GitHub**: https://github.com/hashilnizam  
**Base URL**: `http://localhost:5000/api`
