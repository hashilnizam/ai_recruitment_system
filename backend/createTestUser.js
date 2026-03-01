const bcrypt = require('bcrypt');
const db = require('./src/config/database');

async function createTestUser() {
  try {
    console.log('🔧 Creating test recruiter user...');
    
    // Hash the password
    const password = 'test123';
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('🔐 Password hash created');
    
    // Insert the user
    const result = await db.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['test@analytics.com', passwordHash, 'Test', 'Analytics', 'recruiter', new Date()]
    );
    
    console.log(`✅ Created test recruiter with ID: ${result.insertId}`);
    console.log(`📧 Email: test@analytics.com`);
    console.log(`🔑 Password: test123`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestUser();
