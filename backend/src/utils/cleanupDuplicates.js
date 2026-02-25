const mysql = require('mysql2/promise');
const fs = require('fs');

async function cleanupDuplicates() {
  try {
    console.log('🧹 Cleaning up existing duplicates...');
    
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || 'root',
      database: process.env.DATABASE_NAME || 'resume_screening',
      port: process.env.DATABASE_PORT || 3306
    });
    
    // Find all duplicate groups
    const [duplicates] = await connection.execute(`
      SELECT recruiter_id, file_hash, COUNT(*) as count, 
             GROUP_CONCAT(id) as ids, 
             GROUP_CONCAT(original_name) as names,
             MIN(id) as keep_id
      FROM recruiter_resumes 
      WHERE file_hash IS NOT NULL AND file_hash != ""
      GROUP BY recruiter_id, file_hash 
      HAVING count > 1
    `);
    
    console.log(`📋 Found ${duplicates.length} duplicate groups`);
    
    let totalRemoved = 0;
    
    for (const group of duplicates) {
      console.log(`\n🔄 Processing duplicate group (Recruiter ${group.recruiter_id}):`);
      console.log(`  Files: ${group.names}`);
      console.log(`  Count: ${group.count}`);
      console.log(`  Keeping: ID ${group.keep_id}`);
      
      const ids = group.ids.split(',').map(id => parseInt(id.trim()));
      const idsToRemove = ids.filter(id => id !== group.keep_id);
      
      console.log(`  Removing: ${idsToRemove.join(', ')}`);
      
      // Remove duplicates from database and filesystem
      for (const idToRemove of idsToRemove) {
        try {
          // Get file info before deletion
          const [fileInfo] = await connection.execute(
            'SELECT file_path FROM recruiter_resumes WHERE id = ?',
            [idToRemove]
          );
          
          if (fileInfo.length > 0) {
            // Remove from filesystem
            if (fs.existsSync(fileInfo[0].file_path)) {
              fs.unlinkSync(fileInfo[0].file_path);
              console.log(`    🗑️ Deleted file: ${fileInfo[0].file_path}`);
            }
            
            // Remove from database
            await connection.execute('DELETE FROM recruiter_resumes WHERE id = ?', [idToRemove]);
            console.log(`    🗑️ Deleted database record: ID ${idToRemove}`);
            totalRemoved++;
          }
        } catch (error) {
          console.error(`    ❌ Error removing ID ${idToRemove}:`, error.message);
        }
      }
    }
    
    console.log(`\n🎉 Cleanup completed!`);
    console.log(`✅ Total duplicates removed: ${totalRemoved}`);
    
    // Final verification
    const [finalCheck] = await connection.execute(`
      SELECT recruiter_id, file_hash, COUNT(*) as count
      FROM recruiter_resumes 
      WHERE file_hash IS NOT NULL AND file_hash != ""
      GROUP BY recruiter_id, file_hash 
      HAVING count > 1
    `);
    
    console.log(`📊 Remaining duplicate groups: ${finalCheck.length}`);
    
    await connection.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupDuplicates();
