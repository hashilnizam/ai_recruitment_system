const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const emailRoutes = require('./routes/emailRoutes');
const enhancedJobRoutes = require('./routes/enhancedJobRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const rankingRoutes = require('./routes/rankingRoutes');

// Import middleware
const { notFound, errorHandler } = require('./middleware/errorHandler');
const securityHeaders = require('./middleware/securityHeaders');
const performanceMonitor = require('./middleware/performanceMonitor');
const { validateEnv } = require('./config/envValidator');
const { checkDatabase } = require('./utils/databaseCheck');

// Validate environment on startup
validateEnv();

// Check and setup database
checkDatabase();

// Import WebSocket handler
const socketHandler = require('./websocket/socketHandler');

// Create Express app
const app = express();

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Initialize WebSocket
socketHandler.initialize(server);

// Security middleware
app.use(securityHeaders);

// Performance monitoring (temporarily disabled for debugging)
// app.use(performanceMonitor);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/jobs', enhancedJobRoutes); // Enhanced job routes
app.use('/api/recruiter', recruiterRoutes); // Recruiter routes
app.use('/api/rankings', require('./routes/rankingRoutes')); // Ranking routes

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`🔑 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
