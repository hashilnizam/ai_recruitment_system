const db = require('./src/config/database');

async function testRealJob() {
    try {
        console.log('🔍 Finding a real job for testing...');
        
        // Get a real job
        const jobQuery = 'SELECT id FROM jobs ORDER BY id DESC LIMIT 1';
        const jobs = await db.execute(jobQuery);
        
        if (jobs.length === 0) {
            console.log('❌ No jobs found in database');
            return;
        }
        
        const jobId = jobs[0].id;
        console.log(`✅ Found job ID: ${jobId}`);
        
        // Test inserting with real job_id
        console.log('\n🧪 Testing insert with real job_id...');
        try {
            const testInsert = `
            INSERT INTO rankings (job_id, candidate_id, application_id, skill_score, education_score, experience_score, total_score, rank_position, score_breakdown, is_resume_upload)
            VALUES (?, ?, NULL, 85.5, 90.0, 80.0, 85.17, 1, '{"test": "data"}', 1)
            `;
            await db.execute(testInsert, [jobId, 999]);
            console.log('✅ Insert with NULL application_id successful for resume upload');
            
            // Clean up test record
            await db.execute('DELETE FROM rankings WHERE job_id = ? AND candidate_id = 999', [jobId]);
            console.log('🧹 Test record cleaned up');
        } catch (error) {
            console.log('❌ Insert failed:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        process.exit(0);
    }
}

testRealJob();
