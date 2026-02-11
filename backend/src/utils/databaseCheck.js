const db = require('../config/database');

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Test basic connection
    const connection = await db.pool.getConnection();
    console.log('✅ Database connection successful');
    
    // Check if users table exists
    const [tables] = await connection.query('SHOW TABLES LIKE \'users\'');
    console.log('📋 Tables found:', tables.map(t => t[`Tables_in_resume_screening`]));
    
    if (tables.length === 0) {
      console.log('❌ Users table does not exist');
      await createUsersTable(connection);
    } else {
      // Check table structure
      const [columns] = await connection.query('DESCRIBE users');
      console.log('📋 Users table columns:', columns.map(c => c.Field));
      
      // Check if is_active column exists
      const hasIsActiveColumn = columns.some(col => col.Field === 'is_active');
      if (!hasIsActiveColumn) {
        console.log('❌ is_active column missing, adding it...');
        await addIsActiveColumn(connection);
      }
    }
    
    // Check if sample data exists
    const [sampleUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log('👥 Sample users count:', sampleUsers[0].count);
    
    if (sampleUsers[0].count === 0) {
      console.log('❌ No sample users found, creating sample data...');
      await createSampleUsers(connection);
    }
    
    connection.release();
    console.log('✅ Database check completed');
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    throw error;
  }
}

async function createUsersTable(connection) {
  console.log('📝 Creating users table...');
  await connection.query(`
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      role ENUM('recruiter', 'candidate') NOT NULL,
      company_name VARCHAR(255) NULL,
      phone VARCHAR(20) NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_role (role),
      INDEX idx_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Users table created');
}

async function addIsActiveColumn(connection) {
  console.log('📝 Adding is_active column...');
  await connection.query('ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE');
  console.log('✅ is_active column added');
}

async function createSampleUsers(connection) {
  console.log('📝 Creating sample users...');
  
  // Sample users (password: Password123!)
  const sampleUsers = [
    {
      email: 'recruiter1@techcorp.com',
      password_hash: '$2b$10$rQ8vqJ5kH9YvX4K9GfHqZeZvJxJc8mXqE1Y3X4K9GfHqZeZvJxJc8m',
      first_name: 'John',
      last_name: 'Doe',
      role: 'recruiter',
      company_name: 'TechCorp Inc'
    },
    {
      email: 'recruiter2@innovate.com',
      password_hash: '$2b$10$rQ8vqJ5kH9YvX4K9GfHqZeZvJxJc8mXqE1Y3X4K9GfHqZeZvJxJc8m',
      first_name: 'Jane',
      last_name: 'Smith',
      role: 'recruiter',
      company_name: 'Innovate Solutions'
    },
    {
      email: 'candidate1@email.com',
      password_hash: '$2b$10$rQ8vqJ5kH9YvX4K9GfHqZeZvJxJc8mXqE1Y3X4K9GfHqZeZvJxJc8m',
      first_name: 'Alice',
      last_name: 'Johnson',
      role: 'candidate'
    },
    {
      email: 'candidate2@email.com',
      password_hash: '$2b$10$rQ8vqJ5kH9YvX4K9GfHqZeZvJxJc8mXqE1Y3X4K9GfHqZeZvJxJc8m',
      first_name: 'Bob',
      last_name: 'Williams',
      role: 'candidate'
    }
  ];

  for (const user of sampleUsers) {
    await connection.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role, company_name, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user.email, user.password_hash, user.first_name, user.last_name, user.role, user.company_name, user.phone || null]
    );
  }
  
  console.log('✅ Sample users created');
}

module.exports = { checkDatabase };
