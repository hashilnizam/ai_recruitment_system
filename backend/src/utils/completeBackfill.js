const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function completeBackfill() {
  try {
    console.log('🔄 Completing file hash backfill for remaining resumes...');
    
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || 'root',
      database: process.env.DATABASE_NAME || 'resume_screening',
      port: process.env.DATABASE_PORT || 3306
    });
    
    // Get resumes without file hashes
    const [resumes] = await connection.execute(
      'SELECT id, file_path, original_name FROM recruiter_resumes WHERE file_hash IS NULL OR file_hash = ""'
    );
    
    console.log(`📋 Found ${resumes.length} resumes without file hashes`);
    
    if (resumes.length === 0) {
      console.log('✅ All resumes already have file hashes!');
      await connection.end();
      process.exit(0);
    }
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const resume of resumes) {
      try {
        console.log(`🔄 Processing: ${resume.original_name}`);
        
        // Check if file exists
        if (!fs.existsSync(resume.file_path)) {
          console.log(`⚠️ File not found: ${resume.original_name} (${resume.file_path})`);
          
          // Try to find the file in the uploads directory
          const uploadsDir = path.join(__dirname, '../../uploads/recruiter-resumes');
          const files = fs.readdirSync(uploadsDir);
          const matchingFile = files.find(file => file.includes(resume.original_name));
          
          if (matchingFile) {
            const newPath = path.join(uploadsDir, matchingFile);
            console.log(`🔍 Found file at: ${newPath}`);
            
            // Update file path in database
            await connection.execute(
              'UPDATE recruiter_resumes SET file_path = ? WHERE id = ?',
              [newPath, resume.id]
            );
            
            // Calculate hash
            const fileBuffer = fs.readFileSync(newPath);
            const hash = require('crypto').createHash('sha256').update(fileBuffer).digest('hex');
            
            // Update hash
            await connection.execute(
              'UPDATE recruiter_resumes SET file_hash = ? WHERE id = ?',
              [hash, resume.id]
            );
            
            console.log(`✅ Updated hash and path for: ${resume.original_name}`);
            updatedCount++;
          } else {
            console.log(`❌ Could not find file for: ${resume.original_name}`);
            errorCount++;
          }
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
    
    console.log(`\n🎉 Backfill completed!`);
    console.log(`✅ Successfully updated: ${updatedCount} resumes`);
    console.log(`❌ Errors: ${errorCount} resumes`);
    
    // Final verification
    const [finalCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM recruiter_resumes WHERE file_hash IS NULL OR file_hash = ""'
    );
    console.log(`📊 Remaining resumes without file hash: ${finalCount[0].count}`);
    
    await connection.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  }
}

completeBackfill();
