# Deployment Guide - AI Recruitment System

👨‍💻 **Lead Developer: Hashil Nisam**  
📧 Email: hashilnizam@gmail.com  
🌐 Portfolio: https://hashilnizam.github.io/hashilnisam/  
💬 WhatsApp: https://wa.me/+917561845352  
🔗 LinkedIn: https://linkedin.com/in/hashilnisam  
🎮 Discord: hashilnizam  
🐙 GitHub: https://github.com/hashilnizam

## Overview

This guide covers the deployment process for the AI Recruitment System across different environments, including development, staging, and production.

📚 **Related Documentation:**
- **[Quick Start Guide](QUICK_START.md)** - Development setup
- **[Project Architecture](PROJECT_ARCHITECTURE.md)** - System architecture details
- **[API Documentation](API_DOCUMENTATION.md)** - API reference for integration
- **[Website Test Report](WEBSITE_TEST_REPORT.md)** - Testing verification

## System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+

### Recommended Requirements (Production)
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Network**: 1Gbps
- **Load Balancer**: Nginx/HAProxy

## Environment Setup

### Development Environment

#### Prerequisites
```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python 3.11+
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip

# MySQL 8.0+
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# Git
sudo apt install git
```

#### Clone and Setup
```bash
# Clone repository
git clone <repository-url>
cd ai-recruitment-system

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials

# Frontend setup
cd ../frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your configurations

# AI Service setup
cd ../ai-service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your OpenAI API key
```

#### Database Setup
```bash
# Create database and user
sudo mysql -u root -p
CREATE DATABASE resume_screening;
CREATE USER 'recruitment_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON resume_screening.* TO 'recruitment_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema
mysql -u recruitment_user -p resume_screening < database/schema.sql
```

### Production Environment

#### Server Configuration
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx mysql-server redis-server certbot python3-certbot-nginx

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip
```

#### Firewall Configuration
```bash
# Configure UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5000/tcp  # Backend API
sudo ufw allow 5001/tcp  # AI Service
sudo ufw enable
```

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_HOST=localhost
DATABASE_USER=recruitment_user
DATABASE_PASSWORD=secure_password
DATABASE_NAME=resume_screening

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# File Upload
UPLOAD_PATH=/var/www/uploads
MAX_FILE_SIZE=10485760  # 10MB

# Redis (for sessions)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
NEXT_PUBLIC_APP_NAME=AI Recruitment System
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### AI Service (.env)
```env
# OpenAI
OPENAI_API_KEY=sk-proj-your-openai-api-key
OPENAI_MODEL=gpt-4-turbo

# Database
DATABASE_HOST=localhost
DATABASE_USER=recruitment_user
DATABASE_PASSWORD=secure_password
DATABASE_NAME=resume_screening

# Flask
FLASK_KEY=your-flask-secret-key
FLASK_ENV=production

# Processing
MAX_CONCURRENT_JOBS=5
PROCESSING_TIMEOUT=300
```

## Deployment Process

### Using PM2 (Recommended)

#### Backend Deployment
```bash
cd /path/to/ai-recruitment-system/backend

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'recruitment-backend',
    script: 'src/server.js',
    cwd: '/path/to/ai-recruitment-system/backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/recruitment-backend-error.log',
    out_file: '/var/log/recruitment-backend-out.log',
    log_file: '/var/log/recruitment-backend-combined.log',
    time: true
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### AI Service Deployment
```bash
cd /path/to/ai-recruitment-system/ai-service

# Create PM2 config
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'recruitment-ai',
    script: 'app.py',
    cwd: '/path/to/ai-recruitment-system/ai-service',
    interpreter: '/usr/bin/python3',
    interpreter_args: '-m venv venv && source venv/bin/activate',
    instances: 2,
    env: {
      FLASK_ENV: 'production',
      PORT: 5001
    },
    error_file: '/var/log/recruitment-ai-error.log',
    out_file: '/var/log/recruitment-ai-out.log',
    log_file: '/var/log/recruitment-ai-combined.log',
    time: true
  }]
};
EOF

# Start AI service
pm2 start ecosystem.config.js
pm2 save
```

#### Frontend Deployment
```bash
cd /path/to/ai-recruitment-system/frontend

# Build for production
npm run build

# Serve with PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'recruitment-frontend',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/path/to/ai-recruitment-system/frontend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/recruitment-frontend-error.log',
    out_file: '/var/log/recruitment-frontend-out.log',
    log_file: '/var/log/recruitment-frontend-combined.log',
    time: true
  }]
};
EOF

pm2 start ecosystem.config.js
pm2 save
```

### Nginx Configuration

#### Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/recruitment-system
```

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # API specific settings
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # AI Service
    location /api/ai/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # AI processing timeout
        proxy_read_timeout 600s;
        proxy_connect_timeout 75s;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # File uploads
    location /uploads/ {
        alias /var/www/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
```

#### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/recruitment-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate Setup
```bash
# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Setup auto-renewal
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Database Optimization

### MySQL Configuration
```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

```ini
[mysqld]
# General
bind-address = 127.0.0.1
max_connections = 200
query_cache_size = 64M
query_cache_type = 1

# InnoDB
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Slow Query Log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

```bash
sudo systemctl restart mysql
```

### Database Backup
```bash
# Create backup script
sudo nano /usr/local/bin/backup-database.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="resume_screening"
DB_USER="recruitment_user"
DB_PASS="secure_password"

mkdir -p $BACKUP_DIR

# Create backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/$DB_NAME_$DATE.sql.gz

# Remove old backups (keep last 7 days)
find $BACKUP_DIR -name "$DB_NAME_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: $BACKUP_DIR/$DB_NAME_$DATE.sql.gz"
```

```bash
sudo chmod +x /usr/local/bin/backup-database.sh

# Schedule daily backup at 2 AM
sudo crontab -e
# Add:
0 2 * * * /usr/local/bin/backup-database.sh
```

## Monitoring and Logging

### Log Rotation
```bash
sudo nano /etc/logrotate.d/recruitment-system
```

```
/var/log/recruitment-*-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload all
    endscript
}
```

### Monitoring with PM2
```bash
# Monitor applications
pm2 monit

# View logs
pm2 logs

# Check status
pm2 status

# Restart application
pm2 restart recruitment-backend

# View metrics
pm2 show recruitment-backend
```

### System Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Monitor system resources
htop
iotop
nethogs

# Monitor disk space
df -h
du -sh /var/log/
```

## Security Hardening

### System Security
```bash
# Update system regularly
sudo apt update && sudo apt upgrade -y

# Configure automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart ssh

# Configure firewall
sudo ufw enable
sudo ufw status
```

### Application Security
```bash
# Set proper file permissions
sudo chown -R www-data:www-data /var/www/uploads
sudo chmod -R 755 /var/www/uploads

# Secure environment files
sudo chmod 600 /path/to/ai-recruitment-system/backend/.env
sudo chmod 600 /path/to/ai-recruitment-system/ai-service/.env
sudo chmod 600 /path/to/ai-recruitment-system/frontend/.env.local

# Setup fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Performance Optimization

### Caching Strategy
```bash
# Install Redis for caching
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: maxmemory 256mb
# Set: maxmemory-policy allkeys-lru

sudo systemctl restart redis-server
```

### CDN Setup (Optional)
```bash
# Use CloudFlare or AWS CloudFront for static assets
# Configure CDN to cache:
# - Static files (CSS, JS, images)
# - API responses (where appropriate)
# - Uploaded resumes
```

## Scaling Considerations

### Horizontal Scaling
```bash
# Load balancer configuration
# Use multiple backend instances behind Nginx

upstream backend {
    server localhost:5000;
    server localhost:5001;
    server localhost:5002;
}

# Database replication
# Setup MySQL master-slave replication
# Use read replicas for read-heavy operations
```

### Microservices Migration
```bash
# Consider containerization with Docker
# Use Docker Compose for development
# Use Kubernetes for production orchestration
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
pm2 logs recruitment-backend

# Check port availability
sudo netstat -tlnp | grep :5000

# Check environment variables
pm2 env 0
```

#### Database Connection Issues
```bash
# Test database connection
mysql -u recruitment_user -p resume_screening

# Check MySQL status
sudo systemctl status mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

#### High Memory Usage
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Restart services if needed
pm2 restart all
```

### Performance Issues
```bash
# Check slow queries
sudo tail -f /var/log/mysql/slow.log

# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/health

# Check system load
uptime
iostat -x 1
```

## Maintenance

### Regular Tasks
```bash
# Weekly maintenance script
sudo nano /usr/local/bin/weekly-maintenance.sh
```

```bash
#!/bin/bash
echo "Starting weekly maintenance..."

# Update system
sudo apt update && sudo apt upgrade -y

# Clean logs
sudo find /var/log -name "*.log" -mtime +30 -delete

# Optimize database
mysql -u recruitment_user -psecure_password -e "OPTIMIZE TABLE resume_screening.jobs, resume_screening.applications, resume_screening.rankings;"

# Restart services
pm2 restart all

echo "Weekly maintenance completed"
```

```bash
sudo chmod +x /usr/local/bin/weekly-maintenance.sh

# Schedule weekly maintenance (Sunday 3 AM)
sudo crontab -e
# Add:
0 3 * * 0 /usr/local/bin/weekly-maintenance.sh
```

---

**Last Updated**: February 2025  
**Version**: 1.0.0  
**Lead Developer**: Hashil Nisam  
**Email**: hashilnizam@gmail.com  
**Portfolio**: https://hashilnizam.github.io/hashilnisam/  
**GitHub**: https://github.com/hashilnizam  
**Environment**: Production
