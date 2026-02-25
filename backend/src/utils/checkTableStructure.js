const mysql = require('mysql2/promise');

async function checkTableStructure() {
  try {
    console.log('🔍 Checking recruiter_resumes table structure...');
    
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || 'root',
      database: process.env.DATABASE_NAME || 'resume_screening',
      port: process.env.DATABASE_PORT || 3306
    });
    
    const [structure] = await connection.execute('DESCRIBE recruiter_resumes');
    console.log('📊 Current table structure:');
    structure.forEach((column, index) => {
      console.log(`${index + 1}. ${column.Field} - ${column.Type} - ${column.Null} - ${column.Key}`);
    });
    
    // Check if file_hash column exists
    const hasFileHash = structure.some(col => col.Field === 'file_hash');
    console.log(`🔍 file_hash column exists: ${hasFileHash}`);
    
    if (!hasFileHash) {
      console.log('➕ Adding file_hash column...');
      await connection.execute('ALTER TABLE recruiter_resumes ADD COLUMN file_hash VARCHAR(64) DEFAULT NULL AFTER mime_type');
      console.log('✅ file_hash column added successfully');
      
      // Add index
      await connection.execute('CREATE INDEX idx_file_hash ON recruiter_resumes(file_hash)');
      console.log('✅ file_hash index added');
      
      // Add composite index
      await connection.execute('CREATE INDEX idx_recruiter_file_hash ON recruiter_resumes(recruiter_id, file_hash)');
      console.log('✅ composite index added');
    }
    
    await connection.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTableStructure();
