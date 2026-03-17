const db = require('./src/config/database');

async function fixRankingData() {
    try {
        console.log('🔧 FIXING RANKING DATA');
        console.log('========================\n');
        
        // Step 1: Reset application statuses to pending
        console.log('📊 Step 1: Reset Application Statuses');
        
        try {
            const resetAppsResult = await db.execute(`
                UPDATE applications 
                SET status = 'pending' 
                WHERE job_id = 23 AND status = 'ranked'
            `);
            
            console.log(`✅ Reset ${resetAppsResult.affectedRows} applications to pending`);
        } catch (error) {
            console.log('❌ Reset applications failed:', error.message);
        }
        
        // Step 2: Clean up duplicate rankings
        console.log('\n🗑️ Step 2: Clean Up Duplicate Rankings');
        
        try {
            // First, let's see current rankings
            const currentRankings = await db.execute(`
                SELECT id, application_id, candidate_id, rank_position, total_score
                FROM rankings 
                WHERE job_id = 23
                ORDER BY id
            `);
            
            console.log(`✅ Current rankings for job 23: ${currentRankings.length}`);
            currentRankings.forEach((r, index) => {
                const source = r.application_id ? `App ${r.application_id}` : `Resume ${r.candidate_id}`;
                console.log(`   ${index + 1}. ${source}: Rank ${r.rank_position}, Score ${r.total_score}%`);
            });
            
            // Remove all rankings for job 23 to start fresh
            const deleteResult = await db.execute(`
                DELETE FROM rankings WHERE job_id = 23
            `);
            
            console.log(`✅ Deleted ${deleteResult.affectedRows} rankings for job 23`);
        } catch (error) {
            console.log('❌ Delete rankings failed:', error.message);
        }
        
        // Step 3: Clean up processing records
        console.log('\n🗑️ Step 3: Clean Up Processing Records');
        
        try {
            const deleteProcessingResult = await db.execute(`
                DELETE FROM processing_jobs WHERE job_id = 23
            `);
            
            console.log(`✅ Deleted ${deleteProcessingResult.affectedRows} processing records`);
        } catch (error) {
            console.log('❌ Delete processing failed:', error.message);
        }
        
        // Step 4: Verify cleanup
        console.log('\n📊 Step 4: Verify Cleanup');
        
        try {
            const appCount = await db.execute(`
                SELECT COUNT(*) as count FROM applications WHERE job_id = 23 AND status = 'pending'
            `);
            
            const rankingCount = await db.execute(`
                SELECT COUNT(*) as count FROM rankings WHERE job_id = 23
            `);
            
            const processingCount = await db.execute(`
                SELECT COUNT(*) as count FROM processing_jobs WHERE job_id = 23
            `);
            
            console.log(`✅ Verification Results:`);
            console.log(`   Pending Applications: ${appCount[0].count}`);
            console.log(`   Rankings: ${rankingCount[0].count}`);
            console.log(`   Processing Records: ${processingCount[0].count}`);
            
            if (appCount[0].count === 2 && rankingCount[0].count === 0 && processingCount[0].count === 0) {
                console.log('✅ Job 23 is ready for fresh AI ranking!');
            } else {
                console.log('⚠️ Cleanup may not be complete');
            }
            
        } catch (error) {
            console.log('❌ Verification failed:', error.message);
        }
        
        console.log('\n🎉 FIX COMPLETE!');
        console.log('Job 23 is now ready for fresh AI ranking.');
        console.log('Applications are reset to pending status.');
        console.log('All old rankings and processing records are cleaned up.');
        
    } catch (error) {
        console.error('❌ Fix failed:', error.message);
    } finally {
        process.exit(0);
    }
}

fixRankingData();
