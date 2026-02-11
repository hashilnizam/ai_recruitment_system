require('dotenv').config();

// Required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'DATABASE_HOST',
  'DATABASE_USER',
  'DATABASE_PASSWORD',
  'DATABASE_NAME'
];

// Optional environment variables with defaults
const optionalEnvVars = {
  NODE_ENV: 'development',
  PORT: '5000',
  FRONTEND_URL: 'http://localhost:3000',
  AI_SERVICE_URL: 'http://localhost:5001',
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: '587',
  LOG_LEVEL: 'info',
  MAX_FILE_SIZE: '10485760', // 10MB
  UPLOAD_DIR: './uploads',
  SESSION_SECRET: 'default-session-secret'
};

// Validate environment variables
const validateEnv = () => {
  const missingVars = [];
  
  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      // Allow empty password for local development
      if (varName === 'DATABASE_PASSWORD' && process.env.NODE_ENV === 'development') {
        return;
      }
      missingVars.push(varName);
    }
  });
  
  // Check optional variables and set defaults
  Object.entries(optionalEnvVars).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
      console.log(`⚙️  Using default value for ${key}: ${defaultValue}`);
    }
  });
  
  // Validate specific variable formats
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
    throw new Error('PORT must be a valid number');
  }
  
  if (process.env.DATABASE_PORT && isNaN(parseInt(process.env.DATABASE_PORT))) {
    throw new Error('DATABASE_PORT must be a valid number');
  }
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  console.log('✅ Environment variables validated successfully');
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔑 Database: ${process.env.DATABASE_NAME}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}`);
  console.log(`🚀 Server: ${process.env.PORT}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL}`);
  console.log(`🤖 AI Service: ${process.env.AI_SERVICE_URL}`);
};

// Validate on startup
try {
  validateEnv();
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

module.exports = {
  validateEnv,
  requiredEnvVars,
  optionalEnvVars
};
