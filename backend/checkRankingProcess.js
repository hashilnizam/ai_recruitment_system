const db = require('./src/config/database');

async function checkRankingProcess() {
    try {
        console.log('🔍 CHECKING RANKING PROCESS');
        console.log('==============================\n');
        
        // Check what candidates are being processed
        console.log('📊 Step 1: Check Applications for Job 23');
        
        try {
            const applicationsQuery = `
            SELECT a.id, a.candidate_id, a.job_id, a.status, u.first_name, u.last_name, u.email
            FROM applications a
            JOIN users u ON a.candidate_id = u.id
            WHERE a.job_id = 23
            `;
            const applications = await db.execute(applicationsQuery);
            
            console.log(`✅ Found ${applications.length} applications for job 23:`);
            applications.forEach((app, index) => {
                console.log(`   ${index + 1}. ID: ${app.id}, Candidate: ${app.first_name} ${app.last_name}, Status: ${app.status}`);
            });
        } catch (error) {
            console.log('❌ Applications check failed:', error.message);
        }
        
        // Check resume uploads
        console.log('\n📊 Step 2: Check Resume Uploads for Recruiter 19');
        
        try {
            const resumesQuery = `
            SELECT id, original_name, uploaded_at
            FROM recruiter_resumes
            WHERE recruiter_id = 19
            `;
            const resumes = await db.execute(resumesQuery);
            
            console.log(`✅ Found ${resumes.length} resume uploads:`);
            resumes.forEach((resume, index) => {
                console.log(`   ${index + 1}. ID: ${resume.id}, Name: ${resume.original_name}`);
            });
        } catch (error) {
            console.log('❌ Resumes check failed:', error.message);
        }
        
        // Check current rankings
        console.log('\n📊 Step 3: Check Current Rankings for Job 23');
        
        try {
            const rankingsQuery = `
            SELECT r.*, 
                   CASE WHEN r.application_id IS NOT NULL THEN 'Application' ELSE 'Resume' END as type,
                   CASE WHEN r.application_id IS NOT NULL THEN a.id ELSE rr.id END as source_id
            FROM rankings r
            LEFT JOIN applications a ON r.application_id = a.id
            LEFT JOIN recruiter_resumes rr ON r.candidate_id = rr.id
            WHERE r.job_id = 23
            ORDER BY r.rank_position ASC
            `;
            const rankings = await db.execute(rankingsQuery);
            
            console.log(`✅ Found ${rankings.length} rankings for job 23:`);
            rankings.forEach((ranking, index) => {
                const source = ranking.type;
                const sourceId = ranking.source_id;
                const rank = ranking.rank_position || 'N/A';
                const score = ranking.total_score || 0;
                console.log(`   ${index + 1}. ${source} ID ${sourceId}: Rank ${rank}, Score ${score}%`);
            });
        } catch (error) {
            console.log('❌ Rankings check failed:', error.message);
        }
        
        // Check processing status
        console.log('\n📊 Step 4: Check Processing Status');
        
        try {
            const processingQuery = `
            SELECT job_id, status, progress, started_at, completed_at, error_message
            FROM processing_jobs
            WHERE job_id = 23
            ORDER BY created_at DESC
            LIMIT 1
            `;
            const processing = await db.execute(processingQuery);
            
            if (processing.length > 0) {
                const proc = processing[0];
                console.log(`✅ Latest Processing Status:`);
                console.log(`   Job: ${proc.job_id}`);
                console.log(`   Status: ${proc.status}`);
                console.log(`   Progress: ${proc.progress}%`);
                console.log(`   Started: ${proc.started_at}`);
                console.log(`   Completed: ${proc.completed_at || 'Still running'}`);
                if (proc.error_message) {
                    console.log(`   Error: ${proc.error_message}`);
                }
            } else {
                console.log('❌ No processing records found for job 23');
            }
        } catch (error) {
            console.log('❌ Processing check failed:', error.message);
        }
        
        console.log('\n🎉 CHECK COMPLETE!');
        
    } catch (error) {
        console.error('❌ Check failed:', error.message);
    } finally {
        process.exit(0);
    }
}

checkRankingProcess();
