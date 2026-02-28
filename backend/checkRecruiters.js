const db = require('./src/config/database');

async function checkRecruiters() {
  try {
    console.log('👥 Checking recruiter accounts...');
    
    const recruiters = await db.query(
      'SELECT id, email, first_name, last_name FROM users WHERE role = ? LIMIT 5',
      ['recruiter']
    );
    
    console.log('📋 Found recruiters:', recruiters.length);
    recruiters.forEach((recruiter, index) => {
      console.log(`  ${index + 1}. ${recruiter.email} (ID: ${recruiter.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit();
  }
}

checkRecruiters();
