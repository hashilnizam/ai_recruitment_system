# 📚 AI Recruitment System - Documentation

👨‍💻 **Lead Developer: Hashil Nisam**  
📧 Email: hashilnizam@gmail.com  
🌐 Portfolio: https://hashilnizam.github.io/hashilnisam/  
💬 WhatsApp: https://wa.me/+917561845352  
🔗 LinkedIn: https://linkedin.com/in/hashilnisam  
🎮 Discord: hashilnizam  
🐙 GitHub: https://github.com/hashilnizam

## Overview

Welcome to the AI Recruitment System documentation. This comprehensive system leverages artificial intelligence to streamline and optimize the recruitment process through automated resume screening, candidate ranking, and intelligent matching.

## 📋 Documentation Structure

### � **Getting Started**
- **[Quick Start Guide](./QUICK_START.md)** - Fast track to getting the system running
- **[Project Architecture](./PROJECT_ARCHITECTURE.md)** - Understanding the system design

### 🔧 **Technical Documentation**
- **[API Documentation](./API_DOCUMENTATION.md)** - Complete REST API reference
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Production deployment instructions

### 🎨 **Frontend & UI**
- **[UI Overview](./UI_OVERVIEW.md)** - User interface design and features
- **[Website Test Report](./WEBSITE_TEST_REPORT.md)** - Comprehensive testing results

### � **Development Records**
- **[All Pages Created](./ALL_PAGES_CREATED.md)** - Complete page inventory
- **[Beautiful UI Setup Complete](./BEAUTIFUL_UI_SETUP_COMPLETE.md)** - UI development completion
- **[Icons and Routes Updated](./ICONS_AND_ROUTES_UPDATED.md)** - UI enhancements
- **[Batch Files](./BATCH_FILES.md)** - Automation scripts documentation

## Quick Start

### For Developers
1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd ai-recruitment-system
   ```

2. **Setup Development Environment**
   ```bash
   # Run the automated setup
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Start All Services**
   ```bash
   # Using the provided script
   ./start-project.bat  # Windows
   # or
   ./start-project.sh   # Linux/Mac
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - AI Service: http://localhost:5001

### Test Accounts
- **Recruiter**: recruiter1@techcorp.com / Password123!
- **Candidate**: candidate1@email.com / Password123!

## System Features

### 🤖 AI-Powered Features
- **Smart Resume Screening**: Automated analysis of resumes using AI
- **Candidate Ranking**: Intelligent scoring and ranking of candidates
- **Skill Matching**: Advanced skill analysis and job matching
- **Real-time Processing**: Instant candidate insights and feedback

### 👥 User Roles
- **Recruiters**: Create jobs, manage applications, view rankings
- **Candidates**: Apply for jobs, track application status
- **Administrators**: System management and oversight

### 📊 Dashboard & Analytics
- Real-time statistics and metrics
- Application tracking and management
- Performance analytics and reporting
- AI processing status monitoring

## Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Hooks** - State management

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MySQL 8.0** - Relational database
- **JWT** - Authentication and authorization

### AI Service
- **Python** - AI/ML development
- **Flask** - Web framework
- **OpenAI API** - AI processing
- **Async Processing** - Background job handling

## Security Features

- 🔐 JWT-based authentication
- 🛡️ SQL injection prevention
- 🚫 Rate limiting and DDoS protection
- 🔒 HTTPS/SSL encryption
- 👤 Role-based access control
- 📝 Audit logging

## Performance Optimizations

- ⚡ Database query optimization
- 🗂️ Connection pooling
- 📦 Response caching
- 🗜️ Gzip compression
- 🌐 CDN support
- 📊 Performance monitoring

## Development Workflow

### Code Structure
```
ai-recruitment-system/
├── README.md                 # Main project README
├── setup.sh                 # Automated setup script
├── docs/                    # 📚 Documentation (this folder)
│   ├── README.md           # This file - documentation overview
│   ├── QUICK_START.md      # Quick setup instructions
│   ├── PROJECT_ARCHITECTURE.md  # Technical architecture
│   ├── API_DOCUMENTATION.md     # API reference
│   ├── DEPLOYMENT_GUIDE.md      # Deployment instructions
│   ├── UI_OVERVIEW.md          # UI design documentation
│   ├── WEBSITE_TEST_REPORT.md  # Testing results
│   └── [Additional development docs...]
├── backend/          # Node.js API server
├── frontend/         # Next.js React app
├── ai-service/       # Python Flask AI service
└── database/         # Database schema
```

### Environment Variables
- Backend: `backend/.env`
- Frontend: `frontend/.env.local`
- AI Service: `ai-service/.env`

### Database Setup
```bash
mysql -u root -p < database/schema.sql
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### AI Processing
- `POST /api/ai/screen-resume` - Screen and rank resume
- `POST /api/ai/batch-process` - Process multiple applications
- `GET /api/ai/status/:job_id` - Check processing status

## Testing

### Unit Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Integration Tests
```bash
# API endpoint testing
npm run test:integration

# AI service testing
cd ai-service && python -m pytest
```

### Load Testing
```bash
# Performance testing
npm run test:performance
```

## Monitoring & Logging

### Application Logs
- Backend: `/var/log/recruitment-backend-*.log`
- Frontend: `/var/log/recruitment-frontend-*.log`
- AI Service: `/var/log/recruitment-ai-*.log`

### Monitoring Tools
- **PM2** - Process management and monitoring
- **Nginx** - Web server and reverse proxy
- **MySQL** - Database performance monitoring
- **Redis** - Caching and session storage

### Health Checks
- Backend: `GET /health`
- Database: Connection pool monitoring
- AI Service: Processing status endpoints

## Deployment Options

### Development
- Local development with hot reload
- Docker Compose for containerized setup
- Automated setup scripts

### Staging
- Pre-production environment
- Database with sample data
- Performance testing

### Production
- Load-balanced setup
- Database replication
- SSL/TLS encryption
- Monitoring and alerting

## Contributing

### Code Standards
- ESLint for JavaScript/TypeScript
- Prettier for code formatting
- Conventional commits for git messages

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Code review and merge

### Development Guidelines
- Follow existing code patterns
- Write comprehensive tests
- Update documentation
- Consider performance impact

## Support

### 📞 **Developer Contact**
- **Developer**: Hashil Nisam
- **Email**: hashilnizam@gmail.com
- **Portfolio**: https://hashilnizam.github.io/hashilnisam/
- **WhatsApp**: https://wa.me/+917561845352
- **LinkedIn**: https://linkedin.com/in/hashilnisam
- **Discord**: hashilnizam
- **GitHub**: https://github.com/hashilnizam

### 🔧 **Troubleshooting**
- Check [Deployment Guide](./DEPLOYMENT_GUIDE.md) for common issues
- Review [Website Test Report](./WEBSITE_TEST_REPORT.md) for testing status
- Review logs for error details
- Verify environment configurations
- Test API endpoints independently

### 📚 **Getting Help**
- Review documentation thoroughly
- Check existing GitHub issues
- Contact development team
- Join community discussions

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Changelog

### Version 1.0.0 (February 2025)
- Initial release
- Core recruitment features
- AI-powered resume screening
- Candidate ranking system
- Dashboard and analytics
- Complete API documentation
- Deployment guides and setup

---

**Last Updated**: February 2025  
**Version**: 1.0.0  
**Lead Developer**: Hashil Nisam  
**Email**: hashilnizam@gmail.com  
**Portfolio**: https://hashilnizam.github.io/hashilnisam/  
**GitHub**: https://github.com/hashilnizam  
**Documentation Structure**: Organized and centralized in docs/ folder

For the most up-to-date information, please visit our GitHub repository or contact the development team.
