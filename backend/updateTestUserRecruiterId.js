const db = require('./src/config/database');

async function updateTestUserRecruiterId() {
  try {
    console.log('🔧 Updating test user recruiter ID...');
    
    // Update the test user to have recruiter ID 8 (owner of the resumes)
    await db.query(
      'UPDATE users SET id = 8 WHERE email = ?',
      ['testuser@example.com']
    );
    
    console.log('✅ Updated test user to have recruiter ID 8');
    
    // Verify the update
    const user = await db.query(
      'SELECT id, email, role FROM users WHERE email = ?',
      ['testuser@example.com']
    );
    
    console.log('👤 Updated user:', user[0]);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit();
  }
}

updateTestUserRecruiterId();
