const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool optimized for XAMPP
const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'resume_screening',
  port: process.env.DATABASE_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

// Test database connection with better error handling
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully to XAMPP MySQL');
    console.log(`📊 Database: ${process.env.DATABASE_NAME || 'resume_screening'}`);
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('🔧 Troubleshooting:');
    console.error('   1. Ensure XAMPP MySQL is running');
    console.error('   2. Check database credentials in .env file');
    console.error('   3. Verify database name exists');
    console.error('   4. Check if MySQL port 3306 is available');
    // Don't exit, let the server continue with database errors
  });

module.exports = pool;
