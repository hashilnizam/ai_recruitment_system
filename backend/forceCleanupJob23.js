const db = require('./src/config/database');

async function forceCleanupJob23() {
    try {
        console.log('🔧 FORCE CLEANING JOB 23');
        console.log('==========================\n');
        
        // Check current processing status
        console.log('📊 Checking current processing status...');
        
        try {
            const currentStatus = await db.execute(`
                SELECT job_id, status, progress, started_at, error_message 
                FROM processing_jobs 
                WHERE job_id = 23 
                ORDER BY created_at DESC 
                LIMIT 5
            `);
            
            console.log(`✅ Found ${currentStatus.length} processing records for job 23:`);
            currentStatus.forEach((record, index) => {
                console.log(`   ${index + 1}. Status: ${record.status}, Progress: ${record.progress}%, Started: ${record.started_at}`);
                if (record.error_message) {
                    console.log(`      Error: ${record.error_message}`);
                }
            });
            
            // Force delete ALL processing records for job 23
            console.log('\n🗑️ Force deleting ALL processing records for job 23...');
            
            const deleteResult = await db.execute(`
                DELETE FROM processing_jobs WHERE job_id = 23
            `);
            
            console.log(`✅ Deleted ${deleteResult.affectedRows} processing records`);
            
            // Also delete any stuck rankings
            console.log('\n🗑️ Deleting rankings for job 23...');
            
            const rankingDeleteResult = await db.execute(`
                DELETE FROM rankings WHERE job_id = 23
            `);
            
            console.log(`✅ Deleted ${rankingDeleteResult.affectedRows} ranking records`);
            
            // Verify cleanup
            console.log('\n📊 Verifying force cleanup...');
            
            const processingCheck = await db.execute(`
                SELECT COUNT(*) as count FROM processing_jobs WHERE job_id = 23
            `);
            
            const rankingCheck = await db.execute(`
                SELECT COUNT(*) as count FROM rankings WHERE job_id = 23
            `);
            
            console.log(`✅ Processing records: ${processingCheck[0].count}`);
            console.log(`✅ Ranking records: ${rankingCheck[0].count}`);
            
            if (processingCheck[0].count === 0 && rankingCheck[0].count === 0) {
                console.log('✅ Job 23 is completely clean!');
                console.log('🚀 Ready for fresh AI ranking attempt!');
            }
            
        } catch (error) {
            console.log('❌ Cleanup failed:', error.message);
        }
        
        console.log('\n🎉 FORCE CLEANUP COMPLETE!');
        
    } catch (error) {
        console.error('❌ Force cleanup failed:', error.message);
    } finally {
        process.exit(0);
    }
}

forceCleanupJob23();
