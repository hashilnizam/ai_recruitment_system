# Candidate Resume AI Ranking Implementation

## Overview

The AI Resume Ranking system automatically analyzes and ranks uploaded resumes based on job requirements using OpenAI's GPT model. The system processes resumes, extracts candidate information, calculates match scores, and provides detailed feedback.

## How AI Ranking Works

### 1. Resume Processing
- **PDF Parsing**: Resumes are parsed using PyPDF2 to extract text content
- **AI Analysis**: OpenAI GPT analyzes the resume text and extracts structured data including:
  - Skills (technical, soft, tools)
  - Education (degrees, institutions, years)
  - Experience (job titles, companies, duration)
  - Personal information (name, email, contact)

### 2. Score Calculation
The AI calculates three main scores:
- **Skills Score (40%)**: Match between candidate skills and job requirements
- **Education Score (30%)**: Alignment of education with job requirements
- **Experience Score (30%)**: Relevance and duration of work experience

### 3. Ranking Generation
- **Total Score**: Weighted combination of all three scores
- **Position Assignment**: Candidates are ranked 1, 2, 3... based on total score
- **Feedback Generation**: AI provides strengths, missing skills, and suggestions

## API Endpoints

### Frontend → Backend

#### Trigger AI Ranking
```
POST /api/recruiter/trigger-ranking
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "message": "AI ranking process started",
  "job_id": 14,
  "applications_to_rank": 4
}
```

#### Get Rankings
```
GET /api/rankings/job/{jobId}
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "data": [
    {
      "candidate_id": 162,
      "first_name": "Aadhira Menon.pdf",
      "total_score": 85.5,
      "rank_position": 1,
      "skill_score": 90.0,
      "education_score": 80.0,
      "experience_score": 85.0,
      "overall_assessment": "Strong candidate with relevant experience..."
    }
  ]
}
```

#### Download Resume
```
GET /api/resumes/download/{resumeId}
Headers: Authorization: Bearer <token>
Response: PDF file stream
```

### Backend → AI Service

#### Start Ranking Process
```
POST http://localhost:5001/api/rank-candidates
Body: { "job_id": 14 }
Response: {
  "success": true,
  "message": "Ranking process started",
  "job_id": 14
}
```

## Database Tables

### Core Tables

#### `recruiter_resumes`
Stores uploaded resume files:
```sql
CREATE TABLE recruiter_resumes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recruiter_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recruiter_id) REFERENCES users(id)
);
```

#### `rankings` (Updated for Resume Support)
Stores AI ranking results:
```sql
CREATE TABLE rankings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    application_id INT NULL,                    -- For regular applications
    candidate_id INT NULL,                      -- For recruiter resumes
    skill_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    education_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    experience_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    total_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    rank_position INT NOT NULL,
    score_breakdown JSON NULL,
    is_resume_upload BOOLEAN DEFAULT FALSE,     -- NEW: Flag for resume uploads
    ranked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (application_id) REFERENCES applications(id),
    FOREIGN KEY (candidate_id) REFERENCES recruiter_resumes(id)
);
```

#### `feedback`
Stores AI-generated feedback:
```sql
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NULL,                    -- For regular applications
    candidate_id INT NULL,                      -- For recruiter resumes
    strengths TEXT NULL,
    missing_skills TEXT NULL,
    suggestions TEXT NULL,
    overall_assessment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id),
    FOREIGN KEY (candidate_id) REFERENCES recruiter_resumes(id)
);
```

#### `processing_jobs`
Tracks ranking progress:
```sql
CREATE TABLE processing_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    status ENUM('queued', 'processing', 'completed', 'failed') DEFAULT 'queued',
    progress INT DEFAULT 0,
    total_candidates INT DEFAULT 0,
    error_message TEXT NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Overall Flow

### 1. Resume Upload
```
User uploads PDF → Frontend → Backend → Store in recruiter_resumes table
```

### 2. Trigger AI Ranking
```
User clicks "AI Ranking" → Frontend → Backend → AI Service → Start processing
```

### 3. AI Processing
```
AI Service:
├── Get job requirements from database
├── Fetch all applications + recruiter resumes
├── For each candidate:
│   ├── Parse PDF (if resume upload)
│   ├── Extract data with OpenAI
│   ├── Calculate skill/education/experience scores
│   ├── Generate total score
│   └── Create feedback
├── Assign rank positions
└── Store results in rankings table
```

### 4. Display Results
```
Frontend polls rankings endpoint → Update UI with ranked candidates → Show scores and feedback
```

## Important Logic

### Resume vs Application Handling
The system handles two types of candidates:

1. **Regular Applications**: Complete applications with user accounts
2. **Resume Uploads**: Direct PDF uploads without user accounts

Key differences:
- Resume uploads use `candidate_id` in rankings table
- Regular applications use `application_id`
- Resume uploads get email: `resume-upload@system.com`
- Resume uploads skip user creation steps

### Score Calculation Logic
```python
# Skill Match (40%)
skill_score = calculate_skill_match(candidate_skills, job_required_skills)

# Education Match (30%)  
education_score = calculate_education_match(candidate_education, job_education)

# Experience Match (30%)
experience_score = calculate_experience_match(candidate_experience, job_experience)

# Total Score
total_score = (skill_score * 0.4) + (education_score * 0.3) + (experience_score * 0.3)
```

### AI Service Dependencies
- **OpenAI API**: For resume analysis and feedback generation
- **PyPDF2**: For PDF text extraction
- **MySQL Database**: For storing and retrieving data
- **Flask**: Web framework for AI service

## Frontend Implementation

### Key Components
- **Candidates Page**: Displays ranked candidates with scores
- **Top Candidates Section**: Shows #1, #2, #3 ranked candidates
- **Feedback Modal**: Detailed AI analysis for each candidate
- **Resume Viewer**: Opens PDF files for top-ranked candidates

### Real-time Updates
- Polls every 5 seconds during ranking process
- Updates UI automatically when rankings are available
- Shows progress indicators and loading states

## Error Handling

### Common Issues
1. **Collation Errors**: Fixed by casting text fields in UNION queries
2. **Timeout Issues**: AI processing can take 30+ seconds for multiple resumes
3. **PDF Parsing Failures**: Falls back to empty data if parsing fails
4. **OpenAI API Limits**: Built-in delays to prevent rate limiting

### Monitoring
- Processing jobs table tracks progress
- Error messages stored for failed rankings
- Frontend shows appropriate error states

## Performance Considerations

- **Async Processing**: AI ranking runs in background threads
- **Batch Processing**: Multiple resumes processed sequentially
- **Database Optimization**: Indexes on score and position fields
- **Caching**: Job requirements cached during processing

## Security

- **Authentication**: All endpoints require valid JWT tokens
- **Authorization**: Recruiters can only rank their own job candidates
- **File Access**: Resume downloads restricted to file owners
- **Input Validation**: All API inputs validated and sanitized
