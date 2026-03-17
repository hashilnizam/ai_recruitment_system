const axios = require('axios');

async function debugCompleteRankingFlow() {
    try {
        console.log('🔍 DEBUGGING COMPLETE AI RANKING FLOW');
        console.log('========================================\n');
        
        // Step 1: Login
        console.log('🔐 Step 1: Authentication');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@analytics.com',
            password: 'test123'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ Login successful');
        
        // Step 2: Check initial state
        console.log('\n📊 Step 2: Initial State Check');
        const jobsResponse = await axios.get('http://localhost:5000/api/jobs?recruiterId=19', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const jobs = jobsResponse.data.data;
        
        let initialRankedCount = 0;
        let initialPendingCount = 0;
        
        for (const job of jobs) {
            const rankingsResponse = await axios.get(`http://localhost:5000/api/rankings/job/${job.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const rankedCandidates = rankingsResponse.data.data || [];
            
            initialRankedCount += rankedCandidates.filter(c => c.rank_position && c.rank_position > 0).length;
            initialPendingCount += rankedCandidates.filter(c => !c.rank_position || c.rank_position === 0).length;
        }
        
        console.log(`📊 Initial: ${initialRankedCount} ranked, ${initialPendingCount} pending`);
        
        // Step 3: Trigger AI Ranking
        console.log('\n🚀 Step 3: Trigger AI Ranking');
        const triggerResponse = await axios.post('http://localhost:5000/api/recruiter/trigger-ranking', {}, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Trigger Response:', triggerResponse.data);
        
        if (!triggerResponse.data.success) {
            console.log('❌ Trigger failed:', triggerResponse.data);
            return;
        }
        
        const jobId = triggerResponse.data.job_id;
        
        // Step 4: Monitor AI Service Progress
        console.log('\n⏱️ Step 4: Monitor AI Service Progress');
        let attempts = 0;
        const maxAttempts = 6;
        
        while (attempts < maxAttempts) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            
            try {
                const statusResponse = await axios.get(`http://localhost:5001/api/ranking-status/${jobId}`);
                const status = statusResponse.data.data;
                
                console.log(`📊 Check ${attempts}: Status=${status.status}, Progress=${status.progress}%`);
                
                if (status.status === 'completed') {
                    console.log('✅ AI Service Completed!');
                    break;
                } else if (status.status === 'failed') {
                    console.log('❌ AI Service Failed:', status.error_message);
                    break;
                }
            } catch (error) {
                console.log(`📊 Check ${attempts}: Status check failed -`, error.message);
            }
        }
        
        // Step 5: Check Database State
        console.log('\n💾 Step 5: Check Database State');
        const db = require('./src/config/database');
        
        try {
            const rankingsQuery = `
            SELECT r.*, a.first_name, a.last_name, a.email, j.title as job_title
            FROM rankings r
            LEFT JOIN applications a ON r.application_id = a.id
            LEFT JOIN jobs j ON r.job_id = j.id
            WHERE r.job_id = ?
            ORDER BY r.rank_position ASC
            `;
            const dbRankings = await db.execute(rankingsQuery, [jobId]);
            
            console.log(`📊 Database Rankings for Job ${jobId}:`);
            console.log(`   Total: ${dbRankings.length}`);
            
            dbRankings.forEach((ranking, index) => {
                const status = ranking.rank_position > 0 ? 'RANKED' : 'PENDING';
                const score = ranking.total_score || 0;
                const name = ranking.first_name + ' ' + (ranking.last_name || '');
                console.log(`   ${index + 1}. ${name} - Status: ${status}, Rank: ${ranking.rank_position}, Score: ${score}%`);
            });
            
            // Check if applications table is updated
            const applicationsQuery = `
            SELECT a.id, a.status, a.first_name, a.last_name
            FROM applications a
            WHERE a.job_id = ?
            `;
            const applications = await db.execute(applicationsQuery, [jobId]);
            
            console.log(`📊 Applications Status for Job ${jobId}:`);
            applications.forEach((app, index) => {
                console.log(`   ${index + 1}. ${app.first_name} ${app.last_name} - Status: ${app.status}`);
            });
            
        } catch (dbError) {
            console.log('❌ Database check failed:', dbError.message);
        }
        
        // Step 6: Check Rankings API Response
        console.log('\n🔍 Step 6: Check Rankings API Response');
        try {
            const finalRankingsResponse = await axios.get(`http://localhost:5000/api/rankings/job/${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const finalRankings = finalRankingsResponse.data.data || [];
            
            console.log(`📊 Rankings API Response for Job ${jobId}:`);
            console.log(`   Total: ${finalRankings.length}`);
            console.log(`   Success: ${finalRankingsResponse.data.success}`);
            
            finalRankings.forEach((candidate, index) => {
                const status = candidate.rank_position > 0 ? 'RANKED' : 'PENDING';
                const score = candidate.total_score || 0;
                const name = candidate.first_name + ' ' + (candidate.last_name || '');
                const type = candidate.is_resume_upload ? '(Resume)' : '(Application)';
                console.log(`   ${index + 1}. ${name} ${type} - Status: ${status}, Rank: ${candidate.rank_position}, Score: ${score}%`);
            });
            
        } catch (apiError) {
            console.log('❌ Rankings API check failed:', apiError.message);
        }
        
        console.log('\n🎉 DEBUG COMPLETE!');
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    } finally {
        process.exit(0);
    }
}

debugCompleteRankingFlow();
