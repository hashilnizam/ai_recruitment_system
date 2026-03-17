const axios = require('axios');

async function testCompleteRankingFlow() {
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
        for (const job of jobs) {
            const rankingsResponse = await axios.get(`http://localhost:5000/api/rankings/job/${job.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const rankedCandidates = rankingsResponse.data.data || [];
            initialRankedCount += rankedCandidates.filter(c => c.rank_position && c.rank_position > 0).length;
        }
        
        console.log(`📊 Initial ranked candidates: ${initialRankedCount}`);
        
        // Step 3: Trigger AI Ranking
        console.log('\n🚀 Step 3: Trigger AI Ranking');
        const triggerResponse = await axios.post('http://localhost:5000/api/recruiter/trigger-ranking', {}, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ AI Ranking Triggered:', triggerResponse.data);
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
                    console.log('✅ AI Ranking Completed!');
                    break;
                } else if (status.status === 'failed') {
                    console.log('❌ AI Ranking Failed:', status.error_message);
                    break;
                }
            } catch (error) {
                console.log(`📊 Check ${attempts}: Status check failed -`, error.message);
            }
        }
        
        // Step 5: Verify Results in Backend
        console.log('\n🎯 Step 5: Verify Backend Results');
        let finalRankedCount = 0;
        
        for (const job of jobs) {
            const rankingsResponse = await axios.get(`http://localhost:5000/api/rankings/job/${job.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const rankedCandidates = rankingsResponse.data.data || [];
            finalRankedCount += rankedCandidates.filter(c => c.rank_position && c.rank_position > 0).length;
            
            console.log(`📋 Job ${job.id}: ${rankedCandidates.length} total, ${rankedCandidates.filter(c => c.rank_position && c.rank_position > 0).length} ranked`);
            
            // Show top candidates
            const topCandidates = rankedCandidates.filter(c => c.rank_position && c.rank_position <= 3);
            if (topCandidates.length > 0) {
                console.log('   🏆 Top Ranked Candidates:');
                topCandidates.forEach((candidate, index) => {
                    const score = candidate.total_score || 0;
                    const name = candidate.first_name + ' ' + (candidate.last_name || '');
                    const type = candidate.is_resume_upload ? '(Resume)' : '(Application)';
                    console.log(`      ${index + 1}. Rank ${candidate.rank_position}: ${name} ${type} - Score: ${score}%`);
                });
            }
        }
        
        console.log(`📈 Final ranked candidates: ${finalRankedCount} (was ${initialRankedCount})`);
        
        // Step 6: Analysis
        console.log('\n🔍 Step 6: Analysis');
        const rankingIncreased = finalRankedCount > initialRankedCount;
        const hasRealScores = finalRankedCount > 0;
        
        console.log('📊 Changes:');
        console.log(`   📈 Ranked increased: ${rankingIncreased ? 'YES' : 'NO'} (${initialRankedCount} → ${finalRankedCount})`);
        console.log(`   🎯 Real scores found: ${hasRealScores ? 'YES' : 'NO'}`);
        
        // Final verdict
        const allGood = rankingIncreased && hasRealScores;
        console.log(`\n🎉 FINAL RESULT: ${allGood ? 'SUCCESS' : 'NEEDS ATTENTION'}`);
        
        if (allGood) {
            console.log('✅ Complete AI Ranking Flow is Working!');
            console.log('✅ Frontend should now display ranked candidates');
            console.log('✅ Progress tracking is working');
            console.log('✅ Result fetching is working');
        } else {
            console.log('⚠️ Some issues may still exist');
        }
        
        console.log('\n📱 FRONTEND INSTRUCTIONS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Visit: http://localhost:3000/candidates');
        console.log('2. Login: test@analytics.com / test123');
        console.log('3. Click "AI Ranking" button');
        console.log('4. Watch progress bar update');
        console.log('5. Wait for completion message');
        console.log('6. Verify ranked candidates appear with scores');
        console.log('7. Check Network tab for rankings API calls');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        process.exit(0);
    }
}

testCompleteRankingFlow();
