const db = require('./src/config/database');

async function checkPassword() {
  try {
    console.log('🔍 Checking recruiter passwords...');
    
    const recruiters = await db.query(
      'SELECT id, email, first_name, last_name, password_hash FROM users WHERE role = ?',
      ['recruiter']
    );
    
    console.log('📋 Found recruiters:');
    recruiters.forEach(user => {
      console.log(`  ID: ${user.id}, Email: ${user.email}, Name: ${user.first_name} ${user.last_name}`);
      console.log(`  Password Hash: ${user.password_hash.substring(0, 20)}...`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkPassword();
