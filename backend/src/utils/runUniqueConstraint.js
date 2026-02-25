const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runUniqueConstraint() {
  try {
    console.log('🔄 Adding unique constraint for duplicate prevention...');
    
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || 'root',
      database: process.env.DATABASE_NAME || 'resume_screening',
      port: process.env.DATABASE_PORT || 3306
    });
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/add_unique_constraint.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration statements separately
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('🔧 Executing:', statement.substring(0, 50) + '...');
        try {
          await connection.execute(statement);
          console.log('✅ Success');
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            console.log('ℹ️ No duplicates to clean up');
          } else if (error.code === 'ER_DUP_KEYNAME') {
            console.log('ℹ️ Constraint already exists');
          } else {
            console.log('⚠️ Warning:', error.message);
          }
        }
      }
    }
    
    console.log('✅ Unique constraint migration completed!');
    
    // Verify the constraint
    const [constraints] = await connection.execute(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'recruiter_resumes' AND CONSTRAINT_NAME != 'PRIMARY'
    `, [process.env.DATABASE_NAME || 'resume_screening']);
    
    console.log('📋 Current constraints:');
    constraints.forEach((constraint, index) => {
      console.log(`  ${index + 1}. ${constraint.CONSTRAINT_NAME}`);
    });
    
    await connection.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runUniqueConstraint();
