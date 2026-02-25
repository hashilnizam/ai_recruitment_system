const mysql = require('mysql2/promise');

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection and table...');
    
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || 'root',
      database: process.env.DATABASE_NAME || 'resume_screening',
      port: process.env.DATABASE_PORT || 3306
    });
    
    console.log('✅ Database connected successfully');
    
    // Check if table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'recruiter_resumes'");
    console.log('📋 Tables found:', tables);
    
    if (tables.length === 0) {
      console.log('❌ Table recruiter_resumes does not exist');
      
      // Create table
      const createTableSQL = `
        CREATE TABLE recruiter_resumes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          recruiter_id INT NOT NULL,
          filename VARCHAR(255) NOT NULL,
          original_name VARCHAR(255) NOT NULL,
          file_path VARCHAR(500) NOT NULL,
          file_size BIGINT NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
          
          INDEX idx_recruiter_id (recruiter_id),
          INDEX idx_uploaded_at (uploaded_at)
        )
      `;
      
      await connection.execute(createTableSQL);
      console.log('✅ Table recruiter_resumes created successfully');
    } else {
      console.log('✅ Table recruiter_resumes exists');
      
      // Show table structure
      const [structure] = await connection.execute("DESCRIBE recruiter_resumes");
      console.log('📊 Table structure:', structure);
      
      // Show current data
      const [data] = await connection.execute("SELECT * FROM recruiter_resumes LIMIT 5");
      console.log('📄 Current data:', data);
    }
    
    await connection.end();
    console.log('🎉 Database test completed');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase();
