const axios = require('axios');

async function testAPI() {
  try {
    console.log('🔍 Testing recruiter API endpoints...');
    
    // Test GET resumes endpoint (you'll need to provide a valid token)
    console.log('📋 Testing GET /api/recruiter/resumes');
    
    // This would require authentication, so let's test the database query directly
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || 'root',
      database: process.env.DATABASE_NAME || 'resume_screening',
      port: process.env.DATABASE_PORT || 3306
    });
    
    // Test the exact query used in the GET endpoint
    const recruiterId = 8; // Use the recruiter ID from the data we saw
    const resumesResult = await connection.execute(
      'SELECT * FROM recruiter_resumes WHERE recruiter_id = ? ORDER BY uploaded_at DESC',
      [recruiterId]
    );
    
    console.log('📊 Query result structure:', {
      type: typeof resumesResult,
      isArray: Array.isArray(resumesResult),
      length: resumesResult.length,
      firstElement: resumesResult[0] ? {
        type: typeof resumesResult[0],
        isArray: Array.isArray(resumesResult[0]),
        length: resumesResult[0].length,
        firstItem: resumesResult[0][0]
      } : null
    });
    
    const resumes = resumesResult[0] || [];
    console.log('📄 Processed resumes:', resumes);
    console.log('✅ API test completed');
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

testAPI();
