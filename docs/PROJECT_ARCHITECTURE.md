# AI Recruitment System - Project Architecture

👨‍💻 **Lead Developer: Hashil Nisam**  
📧 Email: hashilnizam@gmail.com  
🌐 Portfolio: https://hashilnizam.github.io/hashilnisam/  
💬 WhatsApp: https://wa.me/+917561845352  
🔗 LinkedIn: https://linkedin.com/in/hashilnisam  
🎮 Discord: hashilnizam  
🐙 GitHub: https://github.com/hashilnizam

## Overview

The AI Recruitment System is a full-stack web application that leverages artificial intelligence to streamline the recruitment process. It features automated resume screening, candidate ranking, skill matching, and intelligent candidate evaluation.

## Technology Stack

### Frontend
- **Framework**: Next.js 14.0.3 (React-based)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library
- **State Management**: React hooks (useState, useEffect)
- **Routing**: Next.js App Router

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: JavaScript
- **Database**: MySQL 8.0+
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting

### AI Service
- **Framework**: Flask (Python)
- **AI Model**: OpenAI GPT API
- **Processing**: Asynchronous job processing
- **Integration**: REST API with backend

### Database
- **Engine**: MySQL 8.0+
- **Connection Pool**: mysql2/promise
- **Schema**: Normalized relational design
- **Features**: JSON fields, triggers, stored procedures

## Project Structure

```
ai-recruitment-system/
├── backend/                    # Node.js/Express API server
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js     # Database configuration
│   │   ├── controllers/
│   │   │   └── authController.js
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT authentication
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js   # Authentication endpoints
│   │   │   └── jobRoutes.js    # Job management endpoints
│   │   └── server.js           # Main server file
│   ├── package.json
│   └── .env                    # Environment variables
├── frontend/                   # Next.js React application
│   ├── src/
│   │   └── app/
│   │       ├── auth/           # Authentication pages
│   │       ├── dashboard/      # Dashboard pages
│   │       │   ├── recruiter/
│   │       │   └── candidate/
│   │       └── jobs/           # Job management pages
│   ├── public/
│   ├── package.json
│   └── .env.local              # Frontend environment variables
├── ai-service/                 # Python Flask AI service
│   ├── app.py                  # Main Flask application
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # AI service environment
├── database/
│   └── schema.sql              # Database schema and sample data
├── docs/                       # Documentation
└── README.md                   # Project overview
```

## Database Schema

### Core Tables

#### Users
- **Purpose**: Stores user accounts for recruiters and candidates
- **Key Fields**: id, email, password_hash, first_name, last_name, role, company_name
- **Roles**: 'recruiter', 'candidate'

#### Jobs
- **Purpose**: Job postings created by recruiters
- **Key Fields**: id, recruiter_id, title, description, required_skills (JSON), status
- **Status**: 'draft', 'published', 'closed'
- **JSON Fields**: required_skills, required_education, required_experience

#### Applications
- **Purpose**: Candidate applications to jobs
- **Key Fields**: id, job_id, candidate_id, status, resume_hash
- **Status**: 'pending', 'ranked', 'reviewed', 'rejected', 'shortlisted'

#### Rankings
- **Purpose**: AI-generated candidate rankings
- **Key Fields**: job_id, application_id, skill_score, education_score, experience_score, total_score
- **Features**: Score breakdown, rank position

#### Skills
- **Purpose**: Detailed skill information from resumes
- **Key Fields**: application_id, skill_name, proficiency_level, years_of_experience

#### Education
- **Purpose**: Educational background from resumes
- **Key Fields**: application_id, degree, field_of_study, institution, graduation_year

#### Experience
- **Purpose**: Work experience from resumes
- **Key Fields**: application_id, job_title, company, duration_months, description

### Database Features

- **Views**: job_statistics, candidate_applications_summary
- **Stored Procedures**: GetTopCandidates, GetApplicationStats
- **Triggers**: update_job_published_at, update_job_closed_at
- **Indexes**: Optimized for common query patterns

## API Architecture

### Authentication Endpoints
```
POST /api/auth/register          # User registration
POST /api/auth/login             # User login
POST /api/auth/logout            # User logout
GET  /api/auth/profile           # Get user profile
PUT  /api/auth/profile           # Update user profile
```

### Job Management Endpoints
```
GET    /api/jobs                 # Get all jobs for recruiter
POST   /api/jobs                 # Create new job
GET    /api/jobs/:id             # Get specific job
PUT    /api/jobs/:id             # Update job
DELETE /api/jobs/:id             # Delete job
POST   /api/jobs/:id/publish     # Publish job
GET    /api/jobs/stats/dashboard # Get dashboard statistics
```

### AI Service Endpoints
```
POST /api/ai/screen-resume       # Screen and rank resume
POST /api/ai/batch-process       # Process multiple applications
GET  /api/ai/status/:job_id      # Check processing status
```

## Frontend Architecture

### Page Structure

#### Authentication Pages
- `/auth/login` - User login
- `/auth/register` - User registration
- `/auth/forgot-password` - Password reset

#### Dashboard Pages
- `/dashboard/recruiter` - Recruiter dashboard with stats and job listings
- `/dashboard/candidate` - Candidate dashboard with applications

#### Job Management Pages
- `/jobs` - List all jobs
- `/jobs/create` - Create new job posting
- `/jobs/:id` - View/edit job details
- `/jobs/:id/applications` - View job applications

#### Candidate Management
- `/candidates` - Manage candidates
- `/candidates/:id` - View candidate profile

### Component Architecture

#### Layout Components
- Header with navigation
- Sidebar for recruiter actions
- Footer with links

#### Feature Components
- Job cards and listings
- Application tables
- Statistics cards
- AI feature indicators

#### Form Components
- Job creation form
- User registration/login forms
- Application forms

## Security Architecture

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (recruiter vs candidate)
- Token expiration and refresh
- Protected routes and API endpoints

### Data Security
- Password hashing with bcrypt
- SQL injection prevention with parameterized queries
- Rate limiting on API endpoints
- CORS configuration
- Helmet.js for security headers

### Privacy
- Resume data hashing
- Secure file handling
- Data access controls
- GDPR compliance considerations

## AI Integration Architecture

### Resume Processing Pipeline
1. **Resume Upload** → File storage and hashing
2. **Text Extraction** → Parse resume content
3. **Skill Extraction** → Identify skills and experience
4. **AI Analysis** → OpenAI GPT evaluation
5. **Scoring** → Calculate skill, education, experience scores
6. **Ranking** → Generate overall ranking
7. **Storage** → Save results to database

### AI Features
- **Smart Ranking**: AI-powered candidate evaluation
- **Skill Matching**: Advanced skill analysis and matching
- **Real-time Processing**: Instant candidate insights
- **Feedback Generation**: Automated candidate feedback

### Asynchronous Processing
- Job queue for batch processing
- Progress tracking
- Error handling and retry logic
- Status monitoring

## Development Workflow

### Environment Setup
1. Clone repository
2. Install dependencies (npm install for frontend/backend, pip install for AI service)
3. Set up MySQL database
4. Configure environment variables
5. Run database schema
6. Start all services

📚 **Related Documentation:**
- **[Quick Start Guide](QUICK_START.md)** - Step-by-step setup instructions
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment
- **[UI Overview](UI_OVERVIEW.md)** - Frontend architecture and design

### Development Commands
```bash
# Backend
cd backend && npm run dev

# Frontend  
cd frontend && npm run dev

# AI Service
cd ai-service && python app.py
```

### Database Setup
```bash
mysql -u root -p < database/schema.sql
```

## Deployment Architecture

### Production Considerations
- Load balancing for multiple instances
- Database connection pooling
- Redis for session storage
- File storage for resumes (S3/Azure)
- Monitoring and logging
- CI/CD pipeline

### Environment Variables
- Database credentials
- JWT secrets
- OpenAI API keys
- CORS origins
- File storage configurations

## Performance Optimizations

### Database Optimizations
- Indexed queries
- Connection pooling
- Query optimization
- Caching strategies

### Frontend Optimizations
- Code splitting
- Lazy loading
- Image optimization
- Bundle size optimization

### API Optimizations
- Response caching
- Compression
- Rate limiting
- Pagination

## Monitoring & Analytics

### Application Metrics
- API response times
- Database query performance
- User engagement metrics
- AI processing statistics

### Error Handling
- Centralized error logging
- User-friendly error messages
- Performance monitoring
- Health check endpoints

## Future Enhancements

### Planned Features
- Video interview integration
- Advanced analytics dashboard
- Mobile applications
- Integration with job boards
- Advanced AI models

### Scalability Plans
- Microservices architecture
- Container orchestration
- Database sharding
- CDN integration

---

**Last Updated**: February 2025  
**Version**: 1.0.0  
**Lead Developer**: Hashil Nisam  
**Email**: hashilnizam@gmail.com  
**Portfolio**: https://hashilnizam.github.io/hashilnisam/  
**GitHub**: https://github.com/hashilnizam
