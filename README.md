# 🎯 AI Recruitment System

A comprehensive AI-powered recruitment platform with intelligent candidate ranking and personalized feedback.

👨‍💻 **Lead Developer: Hashil Nisam**  
📧 Email: hashilnizam@gmail.com  
🌐 Portfolio: https://hashilnizam.github.io/hashilnisam/  
💬 WhatsApp: https://wa.me/+917561845352  
🔗 LinkedIn: https://linkedin.com/in/hashilnisam  
🎮 Discord: hashilnizam  
🐙 GitHub: https://github.com/hashilnizam

## 🏗️ Architecture

```
Frontend:  Next.js 14 + TypeScript + Tailwind CSS
Backend:   Node.js + Express + JWT
AI:        Python Flask + OpenAI GPT-4o-mini
Database:  MySQL 8.0
```

## 📁 Project Structure

```
ai-recruitment-system/
├── backend/              # Node.js Express API
├── ai-service/           # Python Flask AI Service
├── frontend/             # Next.js Application
├── database/             # MySQL Schema
├── setup.sh             # Automated Setup Script
└── README.md            # This File
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- MySQL 8.0+
- OpenAI API key

### 1. Automated Setup
```bash
chmod +x setup.sh
./setup.sh
```

### 2. Manual Setup

#### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MySQL credentials
npm run dev
```

#### AI Service
```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your OpenAI API key
python app.py
```

#### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

#### Database
```bash
mysql -u root -p < database/schema.sql
```

## 🌐 Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **AI Service**: http://localhost:5001

## 🔑 Environment Variables

### Backend (.env)
```
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=resume_screening
JWT_SECRET=your_secret_key
PORT=5000
AI_SERVICE_URL=http://localhost:5001
```

### AI Service (.env)
```
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=resume_screening
FLASK_KEY=your_flask_secret_key
OPENAI_API_KEY=sk-your-openai-key
PORT=5001
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 👥 User Roles & Features

### Recruiter
- ✅ Post and manage job openings
- ✅ View and filter applications
- ✅ Trigger AI-powered candidate ranking
- ✅ View ranked candidates with detailed scores
- ✅ Download recruitment reports
- ✅ Real-time processing status

### Candidate
- ✅ Browse and search job openings
- ✅ Submit structured resume applications
- ✅ View AI-generated feedback
- ✅ Track application status
- ✅ Receive personalized improvement suggestions

## 🤖 AI Features

### Hybrid Scoring Algorithm
- **Skills Matching (40%)**: Keyword + semantic similarity using embeddings
- **Education Relevance (30%)**: Degree and field matching
- **Experience Evaluation (30%)**: Years of experience + role relevance

### AI-Powered Feedback
- Personalized strengths analysis
- Missing skills identification
- Actionable improvement suggestions
- Overall fit assessment

### Smart Processing
- Real-time ranking status updates
- Duplicate resume detection
- Background processing with threading
- Error handling and recovery

## 📊 Database Schema

### Core Tables
- `users` - User accounts and roles
- `jobs` - Job postings and requirements
- `applications` - Candidate applications
- `skills` - Applicant skills and proficiency
- `education` - Educational background
- `experience` - Work experience
- `rankings` - AI-generated scores and positions
- `feedback` - AI-generated candidate feedback
- `processing_jobs` - Async ranking status tracking

### Features
- Foreign key relationships
- JSON columns for flexible data
- Indexes for performance
- Views for analytics
- Stored procedures for complex queries
- Triggers for automatic updates

## 🔒 Security Features

- JWT-based authentication with role separation
- Password hashing with bcrypt
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting
- Input validation
- Secure headers with Helmet

## 📈 Performance Optimizations

- Database connection pooling
- Async AI processing
- Background threading
- Database indexing
- Efficient queries with stored procedures
- API response caching ready

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# AI service tests
cd ai-service
pytest

# Frontend tests
cd frontend
npm test
```

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Job Endpoints
- `GET /api/jobs` - List jobs (with filters)
- `POST /api/jobs` - Create job (recruiter only)
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job (recruiter only)
- `DELETE /api/jobs/:id` - Delete job (recruiter only)

### Application Endpoints
- `POST /api/applications` - Submit application (candidate only)
- `GET /api/applications/job/:jobId` - Get job applications (recruiter only)
- `GET /api/applications/my` - Get my applications (candidate only)
- `GET /api/applications/:id` - Get application details

### AI Service Endpoints
- `POST /api/rank-candidates` - Trigger AI ranking
- `GET /api/ranking-status/:jobId` - Get ranking status
- `GET /api/test-connection` - Test OpenAI connection

## 🔧 Default Test Accounts

The database includes sample users for testing:

### Recruiter Accounts
- **Email**: recruiter1@techcorp.com
- **Password**: Password123!
- **Company**: TechCorp Inc

- **Email**: recruiter2@innovate.com
- **Password**: Password123!
- **Company**: Innovate Solutions

### Candidate Accounts
- **Email**: candidate1@email.com
- **Password**: Password123!

- **Email**: candidate2@email.com
- **Password**: Password123!

## 🎨 UI Features

- Beautiful, responsive design with Tailwind CSS
- Modern gradient effects and animations
- Mobile-first responsive layout
- Custom component library
- Dark mode ready
- Accessibility compliant

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check MySQL is running
sudo systemctl status mysql  # Linux
brew services list  # macOS

# Test connection
mysql -u root -p -e "SHOW DATABASES;"
```

#### OpenAI API
```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR-API-KEY"
```

#### Port Conflicts
```bash
# Check what's using ports
lsof -i :5000  # Backend
lsof -i :5001  # AI Service
lsof -i :3000  # Frontend
```

### Environment Issues
- Ensure all `.env` files are created and configured
- Check Python virtual environment is activated
- Verify Node.js dependencies are installed
- Confirm database schema is imported

## 🚀 Deployment

### Docker (Recommended)
```bash
docker-compose up -d
```

### Manual Production
1. Set up production database
2. Configure environment variables
3. Build frontend: `npm run build`
4. Use PM2 for Node.js processes
5. Use Gunicorn for Python Flask
6. Set up reverse proxy (Nginx)
7. Configure SSL certificates

## 📚 Development Workflow

1. **Setup**: Run `./setup.sh` or see [Quick Start Guide](docs/QUICK_START.md)
2. **Development**: Start all services in separate terminals
3. **Testing**: Use provided test accounts (see [Website Test Report](docs/WEBSITE_TEST_REPORT.md))
4. **Debugging**: Check terminal logs and browser console
5. **Deployment**: Use Docker or see [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)

## 📚 Documentation

For detailed information, check the documentation in the `docs/` folder:

- **[Quick Start Guide](docs/QUICK_START.md)** - Step-by-step setup instructions
- **[Project Architecture](docs/PROJECT_ARCHITECTURE.md)** - Technical architecture and design
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete API reference
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[UI Overview](docs/UI_OVERVIEW.md)** - Frontend design and features
- **[Website Test Report](docs/WEBSITE_TEST_REPORT.md)** - Testing results and status

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Code review and merge

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check this README
2. Review troubleshooting section
3. Check terminal logs
4. Create GitHub issue with details

👨‍💻 **Developer Contact:**  
- **Email**: hashilnizam@gmail.com
- **Portfolio**: https://hashilnizam.github.io/hashilnisam/
- **WhatsApp**: https://wa.me/+917561845352
- **LinkedIn**: https://linkedin.com/in/hashilnisam
- **Discord**: hashilnizam
- **GitHub**: https://github.com/hashilnizam

---

**Built with ❤️ by Hashil Nisam using Next.js, Node.js, Flask, and OpenAI**
