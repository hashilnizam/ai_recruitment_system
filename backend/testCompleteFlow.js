const axios = require('axios');

async function testCompleteFlow() {
    try {
        console.log('🎯 TESTING COMPLETE AI RANKING FLOW');
        console.log('====================================\n');
        
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
        
        // Step 4: Monitor Progress
        console.log('\n⏱️ Step 4: Monitor Progress');
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
        
        // Step 5: Check Final Results
        console.log('\n🎯 Step 5: Check Final Results');
        
        try {
            const finalRankingsResponse = await axios.get(`http://localhost:5000/api/rankings/job/${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const finalRankings = finalRankingsResponse.data.data || [];
            
            console.log(`📊 Final Rankings API Response:`);
            console.log(`   Total: ${finalRankings.length}`);
            console.log(`   Success: ${finalRankingsResponse.data.success}`);
            
            let finalRankedCount = 0;
            let finalPendingCount = 0;
            
            finalRankings.forEach((candidate, index) => {
                const isRanked = candidate.rank_position && candidate.rank_position > 0;
                const status = isRanked ? 'RANKED' : 'PENDING';
                const score = candidate.total_score || 0;
                const name = candidate.first_name + ' ' + (candidate.last_name || '');
                const type = candidate.is_resume_upload ? '(Resume)' : '(Application)';
                
                if (isRanked) {
                    finalRankedCount++;
                } else {
                    finalPendingCount++;
                }
                
                console.log(`   ${index + 1}. ${name} ${type} - Status: ${status}, Rank: ${candidate.rank_position}, Score: ${score}%`);
            });
            
            console.log(`\n📊 Final Results: ${finalRankedCount} ranked, ${finalPendingCount} pending`);
            
            // Compare with initial
            const rankedIncrease = finalRankedCount - initialRankedCount;
            const pendingDecrease = initialPendingCount - finalPendingCount;
            
            console.log(`\n📈 Changes:`);
            console.log(`   Ranked increased: ${rankedIncrease > 0 ? '+' : ''}${rankedIncrease}`);
            console.log(`   Pending decreased: ${pendingDecrease > 0 ? '-' : ''}${pendingDecrease}`);
            
            if (rankedIncrease > 0) {
                console.log('\n🎉 SUCCESS: AI ranking is working!');
                console.log('✅ Candidates are being ranked properly');
                console.log('✅ Status transitions are working');
                console.log('✅ Frontend should show ranked candidates');
            } else {
                console.log('\n⚠️ ISSUE: No ranking improvement detected');
                console.log('❌ Candidates are not being ranked properly');
            }
            
        } catch (apiError) {
            console.log('❌ Final rankings check failed:', apiError.message);
        }
        
        console.log('\n🎉 TEST COMPLETE!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        process.exit(0);
    }
}

testCompleteFlow();
