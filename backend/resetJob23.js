const db = require('./src/config/database');

async function resetJob23() {
    try {
        console.log('🔄 RESETTING JOB 23 FOR FRESH RANKING');
        console.log('====================================\n');
        
        // Remove all processing records for job 23
        console.log('🗑️ Removing processing records for job 23...');
        
        try {
            const result = await db.execute(`
                DELETE FROM processing_jobs WHERE job_id = 23
            `);
            
            console.log(`✅ Deleted ${result.affectedRows} processing records for job 23`);
        } catch (error) {
            console.log('❌ Delete failed:', error.message);
        }
        
        // Also clean up any old rankings for job 23 to start fresh
        console.log('\n🗑️ Cleaning up old rankings for job 23...');
        
        try {
            const rankingResult = await db.execute(`
                DELETE FROM rankings WHERE job_id = 23
            `);
            
            console.log(`✅ Deleted ${rankingResult.affectedRows} ranking records for job 23`);
        } catch (error) {
            console.log('❌ Rankings cleanup failed:', error.message);
        }
        
        // Verify cleanup
        console.log('\n📊 Verifying cleanup...');
        
        try {
            const processingResult = await db.execute(`
                SELECT COUNT(*) as count FROM processing_jobs WHERE job_id = 23
            `);
            
            const rankingResult2 = await db.execute(`
                SELECT COUNT(*) as count FROM rankings WHERE job_id = 23
            `);
            
            console.log(`✅ Processing records for job 23: ${processingResult[0].count}`);
            console.log(`✅ Ranking records for job 23: ${rankingResult2[0].count}`);
            
            if (processingResult[0].count === 0 && rankingResult2[0].count === 0) {
                console.log('✅ Job 23 is completely clean and ready for fresh ranking!');
            }
            
        } catch (error) {
            console.log('❌ Verification failed:', error.message);
        }
        
        console.log('\n🎉 RESET COMPLETE!');
        console.log('Job 23 is now ready for fresh AI ranking.');
        
    } catch (error) {
        console.error('❌ Reset failed:', error.message);
    } finally {
        process.exit(0);
    }
}

resetJob23();
