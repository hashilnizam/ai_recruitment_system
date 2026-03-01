const db = require('./src/config/database');

async function debugDashboard() {
  try {
    console.log('🔍 Debugging dashboard API...');
    
    const recruiterId = 19; // Test recruiter ID
    
    // Test basic query
    const totalJobsResult = await db.query(
      'SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ?',
      [recruiterId]
    );
    console.log('✅ Total jobs result:', totalJobsResult);
    
    // Test recent jobs query
    const recentJobsResult = await db.query(
      `SELECT j.id, j.title, j.status, j.created_at, j.location,
              COUNT(a.id) as application_count
       FROM jobs j 
       LEFT JOIN applications a ON j.id = a.job_id 
       WHERE j.recruiter_id = ? 
       GROUP BY j.id, j.title, j.status, j.created_at, j.location
       ORDER BY j.created_at DESC 
       LIMIT 5`,
      [recruiterId]
    );
    console.log('✅ Recent jobs result:', recentJobsResult);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Debug error:', error);
    process.exit(1);
  }
}

debugDashboard();
