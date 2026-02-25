const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function backfillFileHashes() {
  try {
    console.log('🔄 Backfilling file hashes for existing resumes...');
    
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || 'root',
      database: process.env.DATABASE_NAME || 'resume_screening',
      port: process.env.DATABASE_PORT || 3306
    });
    
    // Get all resumes without file hashes
    const [resumes] = await connection.execute(
      'SELECT id, file_path, original_name FROM recruiter_resumes WHERE file_hash IS NULL OR file_hash = ""'
    );
    
    console.log(`📋 Found ${resumes.length} resumes without file hashes`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const resume of resumes) {
      try {
        // Check if file exists
        if (!fs.existsSync(resume.file_path)) {
          console.log(`⚠️ File not found: ${resume.original_name} (${resume.file_path})`);
          errorCount++;
          continue;
        }
        
        // Calculate file hash
        const fileBuffer = fs.readFileSync(resume.file_path);
        const hash = require('crypto').createHash('sha256').update(fileBuffer).digest('hex');
        
        // Update database
        await connection.execute(
          'UPDATE recruiter_resumes SET file_hash = ? WHERE id = ?',
          [hash, resume.id]
        );
        
        console.log(`✅ Updated hash for: ${resume.original_name}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing ${resume.original_name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`🎉 Backfill completed!`);
    console.log(`✅ Successfully updated: ${updatedCount} resumes`);
    console.log(`❌ Errors: ${errorCount} resumes`);
    
    await connection.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  }
}

backfillFileHashes();
