const db = require('./src/config/database');

async function checkProcessingStatus() {
    try {
        console.log('🔍 CHECKING PROCESSING STATUS');
        console.log('===============================\n');
        
        // Check current processing status
        console.log('📊 Current processing status:');
        
        try {
            const processingQuery = `
            SELECT job_id, status, progress, total_candidates, error_message, started_at, completed_at
            FROM processing_jobs 
            ORDER BY created_at DESC 
            LIMIT 5
            `;
            const processingRecords = await db.execute(processingQuery);
            
            console.log(`✅ Found ${processingRecords.length} processing records:`);
            processingRecords.forEach((record, index) => {
                console.log(`   ${index + 1}. Job ${record.job_id}: ${record.status} (${record.progress}%)`);
                if (record.error_message) {
                    console.log(`      ❌ Error: ${record.error_message}`);
                }
                console.log(`      📅 Started: ${record.started_at}`);
                console.log(`      📅 Completed: ${record.completed_at || 'Still running'}`);
            });
            
            // Check for stuck processes
            const stuckProcesses = processingRecords.filter(record => 
                record.status === 'processing' && 
                new Date() - new Date(record.started_at) > 300000 // 5 minutes
            );
            
            if (stuckProcesses.length > 0) {
                console.log('\n⚠️ STUCK PROCESSES FOUND:');
                stuckProcesses.forEach(process => {
                    console.log(`   🚨 Job ${process.job_id}: Stuck in 'processing' status`);
                });
                
                console.log('\n🔧 CLEANING UP STUCK PROCESSES...');
                for (const process of stuckProcesses) {
                    await db.execute(`
                        UPDATE processing_jobs 
                        SET status = 'failed', error_message = 'Process timed out', completed_at = NOW()
                        WHERE job_id = ?
                    `, [process.job_id]);
                    console.log(`   ✅ Marked job ${process.job_id} as failed`);
                }
            }
            
        } catch (error) {
            console.log('❌ Processing status check failed:', error.message);
        }
        
        // Clear any stuck processes for job 23 specifically
        console.log('\n🔧 CHECKING JOB 23 SPECIFICALLY:');
        try {
            const job23Query = `
            SELECT job_id, status, progress, started_at 
            FROM processing_jobs 
            WHERE job_id = 23 
            ORDER BY created_at DESC 
            LIMIT 1
            `;
            const job23Records = await db.execute(job23Query);
            
            console.log(`✅ Job 23 records: ${job23Records.length}`);
            job23Records.forEach((record, index) => {
                console.log(`   ${index + 1}. Status: ${record.status}, Progress: ${record.progress}%, Started: ${record.started_at}`);
            });
            
            // If job 23 is stuck in processing, mark it as failed
            const stuckJob23 = job23Records.find(record => 
                record.status === 'processing' && 
                new Date() - new Date(record.started_at) > 180000 // 3 minutes
            );
            
            if (stuckJob23) {
                console.log('⚠️ Job 23 is stuck, cleaning up...');
                await db.execute(`
                    UPDATE processing_jobs 
                    SET status = 'failed', error_message = 'Process was stuck', completed_at = NOW()
                    WHERE job_id = 23 AND status = 'processing'
                `);
                console.log('✅ Job 23 marked as failed - ready for new ranking');
            }
            
        } catch (error) {
            console.log('❌ Job 23 check failed:', error.message);
        }
        
        console.log('\n🎉 CLEANUP COMPLETE!');
        console.log('Now you can try triggering AI ranking again.');
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
    } finally {
        process.exit(0);
    }
}

checkProcessingStatus();
