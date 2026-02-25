const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runProcessingJobsMigration() {
  try {
    console.log('🔄 Creating processing_jobs table...');
    
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || 'root',
      database: process.env.DATABASE_NAME || 'resume_screening',
      port: process.env.DATABASE_PORT || 3306
    });
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/create_processing_jobs_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await connection.execute(migrationSQL);
    
    console.log('✅ processing_jobs table created successfully');
    
    await connection.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runProcessingJobsMigration();
