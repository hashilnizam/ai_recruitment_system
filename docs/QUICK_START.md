# 🚀 Quick Start Guide - AI Recruitment System

👨‍💻 **Lead Developer: Hashil Nisam**  
📧 Email: hashilnizam@gmail.com  
🌐 Portfolio: https://hashilnizam.github.io/hashilnisam/  
💬 WhatsApp: https://wa.me/+917561845352  
🔗 LinkedIn: https://linkedin.com/in/hashilnisam  
🎮 Discord: hashilnizam  
🐙 GitHub: https://github.com/hashilnizam

## Step 1: Prerequisites Check

Make sure you have these installed:
- **Node.js 18+** (check: `node --version`)
- **Python 3.11+** (check: `python3 --version`) 
- **MySQL 8.0+** (check: `mysql --version`)

## Step 2: Automated Setup (Recommended)

Run the automated setup script:

```bash
cd ai-recruitment-system
chmod +x setup.sh
./setup.sh
```

This will:
✅ Install all Node.js dependencies
✅ Create Python virtual environment
✅ Install Python packages
✅ Setup database schema
✅ Create environment files

## Step 3: Manual Setup (If automated fails)

### Backend Setup
```bash
cd backend
npm install
```

### AI Service Setup
```bash
cd ai-service
python3 -m venv venv

# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
```

### Database Setup
```bash
# In the main project directory:
mysql -u root -p < database/schema.sql
# Enter your MySQL password when prompted
```

## Step 4: Configure Environment Variables

### Backend (.env)
Already configured with your credentials:
```
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=resume_screening
JWT_SECRET=yD0HZCz7jxQ4zTR63LBPFuZqZHorzjBYukDV6g970iJvQoF46z
```

### AI Service (.env)
Update with your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=resume_screening
FLASK_KEY=yD0HZCz7jxQ4zTR63LBPFuZqZHorzjBYukDV6g970iJvQoF46z
```

### Frontend (.env.local)
Already configured:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Step 5: Start All Services

Open **3 separate terminal windows**:

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
Wait for: "🚀 Server running on port 5000"

### Terminal 2 - AI Service
```bash
cd ai-service
source venv/bin/activate  # Windows: venv\Scripts\activate
python app.py
```
Wait for: "🤖 AI Service starting on port 5001"

### Terminal 3 - Frontend
```bash
cd frontend
npm run dev
```
Wait for: "▲ Next.js ready on http://localhost:3000"

## Step 6: Access the Application

🌐 **Open your browser and go to: http://localhost:3000**

## Test Accounts

Use these accounts to test the system:

### Recruiter
- **Email**: recruiter1@techcorp.com
- **Password**: Password123!

### Candidate  
- **Email**: candidate1@email.com
- **Password**: Password123!

## Troubleshooting

### Port Already in Use?
```bash
# Check what's using the port
lsof -i :5000  # Backend
lsof -i :5001  # AI Service
lsof -i :3000  # Frontend

# Kill the process
kill -9 <PID>
```

### Database Connection Issues
```bash
# Check MySQL is running
sudo systemctl status mysql  # Linux
brew services list  # macOS

# Test connection
mysql -u root -p -e "SHOW DATABASES;"
```

### Python Virtual Environment Issues
```bash
# Delete and recreate
cd ai-service
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Node Modules Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Success Indicators

✅ All 3 services start without errors
✅ You can access http://localhost:3000
✅ Database tables are created
✅ Test accounts can login

## Need Help?

If you encounter issues:
1. Check each terminal for error messages
2. Verify all environment variables are set
3. Ensure MySQL is running
4. Check that ports 3000, 5000, 5001 are available

📚 **Additional Documentation:**
- **[Project Architecture](PROJECT_ARCHITECTURE.md)** - Detailed system design
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment
- **[UI Overview](UI_OVERVIEW.md)** - Frontend features and design
- **[Website Test Report](WEBSITE_TEST_REPORT.md)** - Testing results

👨‍💻 **Developer Support:**  
- **Email**: hashilnizam@gmail.com
- **Portfolio**: https://hashilnizam.github.io/hashilnisam/
- **WhatsApp**: https://wa.me/+917561845352
- **LinkedIn**: https://linkedin.com/in/hashilnisam
- **Discord**: hashilnizam
- **GitHub**: https://github.com/hashilnizam

---

**🎯 Your AI Recruitment System will be running once all services are started!**  
**Built with ❤️ by Hashil Nisam**
