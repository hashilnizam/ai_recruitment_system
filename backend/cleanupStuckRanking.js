const db = require('./src/config/database');

async function cleanupStuckRanking() {
    try {
        console.log('🧹 CLEANING UP STUCK RANKING');
        console.log('===============================\n');
        
        // Clean up any stuck or failed processing records for job 23
        console.log('🔧 Cleaning up job 23...');
        
        try {
            const result = await db.execute(`
                UPDATE processing_jobs 
                SET status = 'failed', error_message = 'Cleaned up for new ranking attempt', completed_at = NOW()
                WHERE job_id = 23 AND status IN ('processing', 'queued')
            `);
            
            console.log(`✅ Updated ${result.affectedRows} records for job 23`);
        } catch (error) {
            console.log('❌ Cleanup failed:', error.message);
        }
        
        // Also clean up any other stuck processes older than 10 minutes
        console.log('\n🔧 Cleaning up other stuck processes...');
        
        try {
            const oldResult = await db.execute(`
                UPDATE processing_jobs 
                SET status = 'failed', error_message = 'Process timed out', completed_at = NOW()
                WHERE status = 'processing' AND started_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE)
            `);
            
            console.log(`✅ Cleaned up ${oldResult.affectedRows} old stuck processes`);
        } catch (error) {
            console.log('❌ Old cleanup failed:', error.message);
        }
        
        // Verify cleanup
        console.log('\n📊 Verifying cleanup...');
        
        try {
            const verifyResult = await db.execute(`
                SELECT job_id, status, started_at 
                FROM processing_jobs 
                WHERE job_id = 23 
                ORDER BY created_at DESC 
                LIMIT 1
            `);
            
            console.log('✅ Job 23 status after cleanup:');
            verifyResult.forEach((record, index) => {
                console.log(`   ${index + 1}. Status: ${record.status}, Started: ${record.started_at}`);
            });
            
        } catch (error) {
            console.log('❌ Verification failed:', error.message);
        }
        
        console.log('\n🎉 CLEANUP COMPLETE!');
        console.log('Job 23 is now ready for new ranking attempts.');
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
    } finally {
        process.exit(0);
    }
}

cleanupStuckRanking();
