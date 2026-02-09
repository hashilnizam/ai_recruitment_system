#!/bin/bash

echo "🚀 Setting up AI Recruitment System..."
echo "👨‍💻 Lead Developer: Hashil Nisam"
echo "📧 Email: hashilnizam@gmail.com"
echo "🌐 Portfolio: https://hashilnizam.github.io/hashilnisam/"
echo "💬 WhatsApp: https://wa.me/+917561845352"
echo "🔗 LinkedIn: https://linkedin.com/in/hashilnisam"
echo "🎮 Discord: hashilnizam"
echo "🐙 GitHub: https://github.com/hashilnizam"
echo ""

# Function to detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)     OS=Linux;;
        Darwin*)    OS=Mac;;
        CYGWIN*|MINGW*|MSYS*) OS=Windows;;
        *)          OS="Unknown";;
    esac
    echo "🖥️  Detected OS: $OS"
}

detect_os

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

missing_prereqs=()

if ! command_exists node; then
    missing_prereqs+=("Node.js 18+")
fi

if ! command_exists npm; then
    missing_prereqs+=("npm")
fi

if ! command_exists python3; then
    missing_prereqs+=("Python 3.11+")
fi

if ! command_exists pip3 && ! command_exists pip; then
    missing_prereqs+=("pip")
fi

if ! command_exists mysql; then
    missing_prereqs+=("MySQL 8.0+")
fi

if [ ${#missing_prereqs[@]} -gt 0 ]; then
    echo "❌ Missing prerequisites:"
    for prereq in "${missing_prereqs[@]}"; do
        echo "   - $prereq"
    done
    echo ""
    echo "Please install the missing prerequisites and run this script again."
    exit 1
fi

echo "✅ All prerequisites found!"

# Setup Backend
echo "📦 Setting up Backend..."
cd backend || { echo "❌ Failed to enter backend directory"; exit 1; }

# Install Node.js dependencies
echo "📥 Installing Node.js dependencies..."
if ! npm install; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "📝 Created backend/.env from example - Please update with your MySQL credentials"
    else
        echo "📝 Creating backend/.env with default values..."
        cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ai_recruitment

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# AI Service Configuration
AI_SERVICE_URL=http://localhost:8000

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS Configuration
FRONTEND_URL=http://localhost:3000
EOF
        echo "📝 Created backend/.env - Please update with your MySQL credentials"
    fi
else
    echo "ℹ️  backend/.env already exists"
fi

cd .. || { echo "❌ Failed to return to project root"; exit 1; }

# Setup AI Service
echo "🤖 Setting up AI Service..."
cd ai-service || { echo "❌ Failed to enter ai-service directory"; exit 1; }

# Create Python virtual environment
if [ ! -d "venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    if ! python3 -m venv venv; then
        echo "❌ Failed to create virtual environment"
        exit 1
    fi
else
    echo "ℹ️  Virtual environment already exists"
fi

# Activate virtual environment and install dependencies
echo "🔧 Activating virtual environment and installing dependencies..."
if [ "$OS" = "Windows" ]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

if ! pip install -r requirements.txt; then
    echo "❌ Failed to install AI service dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "📝 Created ai-service/.env from example - Please update with your OpenAI API key"
    else
        echo "📝 Creating ai-service/.env with default values..."
        cat > .env << EOF
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
PORT=8000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ai_recruitment

# Backend Service Configuration
BACKEND_URL=http://localhost:5000

# CORS Configuration
FRONTEND_URL=http://localhost:3000
EOF
        echo "📝 Created ai-service/.env - Please update with your OpenAI API key"
    fi
else
    echo "ℹ️  ai-service/.env already exists"
fi

cd .. || { echo "❌ Failed to return to project root"; exit 1; }

# Setup Frontend
echo "🎨 Setting up Frontend..."
cd frontend || { echo "❌ Failed to enter frontend directory"; exit 1; }

# Install Node.js dependencies
echo "📥 Installing Node.js dependencies..."
if ! npm install; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Create .env.local file if it doesn't exist
if [ ! -f .env.local ]; then
    if [ -f .env.local.example ]; then
        cp .env.local.example .env.local
        echo "📝 Created frontend/.env.local from example"
    else
        echo "📝 Creating frontend/.env.local with default values..."
        cat > .env.local << EOF
# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000

# Application Configuration
NEXT_PUBLIC_APP_NAME=AI Recruitment System
NEXT_PUBLIC_APP_VERSION=1.0.0

# Development Configuration
NODE_ENV=development
EOF
        echo "📝 Created frontend/.env.local"
    fi
else
    echo "ℹ️  frontend/.env.local already exists"
fi

cd .. || { echo "❌ Failed to return to project root"; exit 1; }

# Setup Database
echo "🗄️ Setting up Database..."
if [ ! -f database/schema.sql ]; then
    echo "❌ Database schema file not found: database/schema.sql"
    exit 1
fi

echo "Please enter your MySQL root password (or press Enter if no password):"
read -s mysql_password
echo ""

if [ -z "$mysql_password" ]; then
    if mysql -u root < database/schema.sql; then
        echo "✅ Database schema created successfully!"
    else
        echo "❌ Failed to create database schema. Please check your MySQL credentials."
        exit 1
    fi
else
    if mysql -u root -p"$mysql_password" < database/schema.sql; then
        echo "✅ Database schema created successfully!"
    else
        echo "❌ Failed to create database schema. Please check your MySQL credentials."
        exit 1
    fi
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Update environment variables:"
echo "   - backend/.env (MySQL credentials & JWT secret)"
echo "   - ai-service/.env (OpenAI API key)"
echo ""
echo "2. Start the services:"
if [ "$OS" = "Windows" ]; then
    echo "   Terminal 1: cd backend && npm run dev"
    echo "   Terminal 2: cd ai-service && venv\\Scripts\\activate && python app.py"
    echo "   Terminal 3: cd frontend && npm run dev"
else
    echo "   Terminal 1: cd backend && npm run dev"
    echo "   Terminal 2: cd ai-service && source venv/bin/activate && python app.py"
    echo "   Terminal 3: cd frontend && npm run dev"
fi
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "🔑 Default test accounts:"
echo "   Recruiter: recruiter1@techcorp.com / Password123!"
echo "   Candidate: candidate1@email.com / Password123!"
echo ""
echo "🏗️ Project Architecture:"
echo "   Frontend:  Next.js 14 + TypeScript + Tailwind CSS"
echo "   Backend:   Node.js + Express + JWT"
echo "   AI:        Python Flask + OpenAI GPT-4o-mini"
echo "   Database:  MySQL 8.0"
echo ""
echo "🤖 AI Features:"
echo "   • Hybrid Scoring Algorithm (Skills 40%, Education 30%, Experience 30%)"
echo "   • AI-Powered candidate feedback and improvement suggestions"
echo "   • Real-time ranking status updates"
echo "   • Duplicate resume detection"
echo ""
echo "📚 For more information, check the README.md file"
echo ""
echo "💡 Tip: If you're on Windows, you can also use the quick-start.bat file"
echo ""
echo "👨‍💻 Support & Contact:"
echo "   Developer: Hashil Nisam"
echo "   Email: hashilnizam@gmail.com"
echo "   Portfolio: https://hashilnizam.github.io/hashilnisam/"
echo "   GitHub: https://github.com/hashilnizam"
echo ""
echo "🎯 Thank you for setting up the AI Recruitment System!"
