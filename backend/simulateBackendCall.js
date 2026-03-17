const axios = require('axios');
const db = require('./src/config/database');

async function simulateBackendCall() {
    try {
        console.log('🎯 SIMULATING EXACT BACKEND CALL');
        console.log('===================================\n');
        
        // Step 1: Get recruiter info (simulate authentication)
        const recruiterId = 8; // From the logs we saw "User 8 (recruiter)"
        console.log(`👤 Simulating recruiter ${recruiterId}`);
        
        // Step 2: Get the most recent job (exact same query as backend)
        console.log('\n📋 Finding job with pending applications or resumes');
        const jobWithPendingApps = await db.query(
            `SELECT j.* FROM jobs j 
             LEFT JOIN applications a ON j.id = a.job_id AND a.status = 'pending'
             LEFT JOIN recruiter_resumes r ON j.recruiter_id = r.recruiter_id
             WHERE j.recruiter_id = ? AND (a.id IS NOT NULL OR r.id IS NOT NULL)
             ORDER BY j.created_at DESC 
             LIMIT 1`,
            [recruiterId]
        );
        
        if (!jobWithPendingApps || jobWithPendingApps.length === 0) {
            console.log('❌ No jobs with pending applications found');
            
            // Check for uploaded resumes (fallback logic)
            console.log('\n📄 Checking for uploaded resumes');
            const resumeCheck = await db.query(
                'SELECT COUNT(*) as count FROM recruiter_resumes WHERE recruiter_id = ?',
                [recruiterId]
            );
            
            if (resumeCheck[0].count === 0) {
                console.log('❌ No uploaded resumes found');
                return;
            }
            
            console.log(`✅ Found ${resumeCheck[0].count} uploaded resumes`);
            
            // Get most recent job
            const recentJob = await db.query(
                'SELECT * FROM jobs WHERE recruiter_id = ? ORDER BY created_at DESC LIMIT 1',
                [recruiterId]
            );
            
            if (!recentJob || recentJob.length === 0) {
                console.log('❌ No jobs found');
                return;
            }
            
            console.log(`✅ Using most recent job: ${recentJob[0].title} (ID: ${recentJob[0].id})`);
            const jobId = recentJob[0].id;
            
            // Call AI service
            console.log('\n🤖 Calling AI service...');
            try {
                const aiResponse = await axios.post('http://localhost:5001/api/rank-candidates', {
                    job_id: jobId
                }, {
                    timeout: 60000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('✅ AI Service Response:', aiResponse.data);
                console.log('✅ Status:', aiResponse.status);
                
            } catch (aiError) {
                console.log('❌ AI Service Error:', aiError.message);
                if (aiError.response) {
                    console.log('   Status:', aiError.response.status);
                    console.log('   Data:', aiError.response.data);
                }
            }
            
        } else {
            console.log(`✅ Found job: ${jobWithPendingApps[0].title} (ID: ${jobWithPendingApps[0].id})`);
            const jobId = jobWithPendingApps[0].id;
            
            // Count pending applications and uploaded resumes
            const pendingApplications = await db.query(
                'SELECT COUNT(*) as count FROM applications WHERE job_id = ? AND status = ?',
                [jobId, 'pending']
            );
            
            const uploadedResumes = await db.query(
                'SELECT COUNT(*) as count FROM recruiter_resumes WHERE recruiter_id = ?',
                [recruiterId]
            );
            
            const totalToRank = (pendingApplications[0]?.count || 0) + (uploadedResumes[0]?.count || 0);
            console.log(`📊 Total to rank: ${totalToRank} (Applications: ${pendingApplications[0]?.count || 0}, Resumes: ${uploadedResumes[0]?.count || 0})`);
            
            // Call AI service
            console.log('\n🤖 Calling AI service...');
            try {
                const aiResponse = await axios.post('http://localhost:5001/api/rank-candidates', {
                    job_id: jobId
                }, {
                    timeout: 60000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('✅ AI Service Response:', aiResponse.data);
                console.log('✅ Status:', aiResponse.status);
                
            } catch (aiError) {
                console.log('❌ AI Service Error:', aiError.message);
                if (aiError.response) {
                    console.log('   Status:', aiError.response.status);
                    console.log('   Data:', aiError.response.data);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Simulation failed:', error.message);
    } finally {
        process.exit(0);
    }
}

simulateBackendCall();
