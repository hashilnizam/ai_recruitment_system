const mysql = require('mysql2/promise');

async function debugDatabase() {
  try {
    console.log('🔍 Debugging database state...');
    
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || 'root',
      database: process.env.DATABASE_NAME || 'resume_screening',
      port: process.env.DATABASE_PORT || 3306
    });
    
    // Check table structure
    console.log('\n📊 Table Structure:');
    const [structure] = await connection.execute('DESCRIBE recruiter_resumes');
    structure.forEach((col, index) => {
      console.log(`${index + 1}. ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key}`);
    });
    
    // Check file_hash column specifically
    const hasFileHash = structure.some(col => col.Field === 'file_hash');
    console.log(`\n🔍 file_hash column exists: ${hasFileHash}`);
    
    if (hasFileHash) {
      // Check file_hash data
      console.log('\n📋 File Hash Data:');
      const [hashData] = await connection.execute(
        'SELECT id, original_name, file_hash FROM recruiter_resumes LIMIT 5'
      );
      
      hashData.forEach((row, index) => {
        console.log(`${index + 1}. ${row.original_name} - ${row.file_hash ? row.file_hash.substring(0, 16) + '...' : 'NULL'}`);
      });
      
      // Count null hashes
      const [nullCount] = await connection.execute(
        'SELECT COUNT(*) as count FROM recruiter_resumes WHERE file_hash IS NULL OR file_hash = ""'
      );
      console.log(`\n📊 Resumes without file hash: ${nullCount[0].count}`);
      
      // Count total resumes
      const [totalCount] = await connection.execute(
        'SELECT COUNT(*) as count FROM recruiter_resumes'
      );
      console.log(`📊 Total resumes: ${totalCount[0].count}`);
    }
    
    await connection.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
}

debugDatabase();
