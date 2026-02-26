const db = require('./src/config/database');

async function runMigration() {
  try {
    console.log('🔄 Running migration to update rankings table for recruiter resumes...');
    
    // Add candidate_id column
    await db.query(`
      ALTER TABLE rankings ADD COLUMN candidate_id INT NULL
    `);
    console.log('✅ Added candidate_id column');
    
    // Add is_resume_upload flag
    await db.query(`
      ALTER TABLE rankings ADD COLUMN is_resume_upload BOOLEAN DEFAULT FALSE
    `);
    console.log('✅ Added is_resume_upload column');
    
    // Update existing records to set is_resume_upload = false
    await db.query(`
      UPDATE rankings SET is_resume_upload = FALSE WHERE is_resume_upload IS NULL
    `);
    console.log('✅ Updated existing records');
    
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
