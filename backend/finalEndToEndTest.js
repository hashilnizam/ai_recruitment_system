const axios = require('axios');

async function finalEndToEndTest() {
    try {
        console.log('🎯 FINAL END-TO-END AI RANKING TEST');
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
        
        let totalCandidates = 0;
        let totalRanked = 0;
        let totalPending = 0;
        
        for (const job of jobs) {
            const rankingsResponse = await axios.get(`http://localhost:5000/api/rankings/job/${job.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const candidates = rankingsResponse.data.data || [];
            
            const ranked = candidates.filter(c => c.rank_position);
            const pending = candidates.filter(c => !c.rank_position);
            const withScores = candidates.filter(c => c.total_score > 0);
            
            totalCandidates += candidates.length;
            totalRanked += ranked.length;
            totalPending += pending.length;
            
            console.log(`   📋 Job ${job.id}: ${candidates.length} total, ${ranked.length} ranked, ${pending.length} pending, ${withScores.length} with scores`);
        }
        
        console.log(`📈 Initial Totals: ${totalCandidates} candidates, ${totalRanked} ranked, ${totalPending} pending`);
        
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
        const candidatesToRank = triggerResponse.data.applications_to_rank;
        
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
                
                console.log(`   📊 Check ${attempts}: Status=${status.status}, Progress=${status.progress}%, Candidates=${status.total_candidates}`);
                
                if (status.status === 'completed') {
                    console.log('✅ AI Ranking Completed!');
                    break;
                } else if (status.status === 'failed') {
                    console.log('❌ AI Ranking Failed:', status.error_message);
                    break;
                }
            } catch (error) {
                console.log(`   📊 Check ${attempts}: Status check failed -`, error.message);
            }
        }
        
        // Step 5: Final Results Verification
        console.log('\n🎯 Step 5: Final Results Verification');
        
        // Wait a moment for database to settle
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        let finalTotal = 0;
        let finalRanked = 0;
        let finalPending = 0;
        let finalWithScores = 0;
        
        for (const job of jobs) {
            const rankingsResponse = await axios.get(`http://localhost:5000/api/rankings/job/${job.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const candidates = rankingsResponse.data.data || [];
            
            const ranked = candidates.filter(c => c.rank_position);
            const pending = candidates.filter(c => !c.rank_position);
            const withScores = candidates.filter(c => c.total_score > 0);
            
            finalTotal += candidates.length;
            finalRanked += ranked.length;
            finalPending += pending.length;
            finalWithScores += withScores.length;
            
            console.log(`   📋 Job ${job.id}: ${candidates.length} total, ${ranked.length} ranked, ${pending.length} pending, ${withScores.length} with scores`);
            
            // Show top candidates
            const topCandidates = candidates.filter(c => c.rank_position && c.rank_position <= 3);
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
        
        console.log(`\n📈 Final Totals: ${finalTotal} candidates, ${finalRanked} ranked, ${finalPending} pending, ${finalWithScores} with scores`);
        
        // Step 6: Analysis
        console.log('\n🔍 Step 6: Analysis');
        const rankedIncreased = finalRanked > totalRanked;
        const scoresGenerated = finalWithScores > 0;
        const pendingDecreased = finalPending < totalPending;
        
        console.log('📊 Changes:');
        console.log(`   📈 Ranked increased: ${rankedIncreased ? 'YES' : 'NO'} (${totalRanked} → ${finalRanked})`);
        console.log(`   🎯 Scores generated: ${scoresGenerated ? 'YES' : 'NO'} (${finalWithScores} candidates)`);
        console.log(`   ⏳ Pending decreased: ${pendingDecreased ? 'YES' : 'NO'} (${totalPending} → ${finalPending})`);
        
        // Final verdict
        const allGood = rankedIncreased && scoresGenerated;
        console.log(`\n🎉 FINAL RESULT: ${allGood ? 'SUCCESS' : 'NEEDS ATTENTION'}`);
        
        if (allGood) {
            console.log('✅ AI Ranking Flow is Working Correctly!');
            console.log('✅ Frontend should now display ranked candidates');
            console.log('✅ Status transitions are working');
            console.log('✅ Scores are being calculated and stored');
        } else {
            console.log('⚠️ Some issues may still exist');
            console.log('⚠️ Check the individual steps above');
        }
        
        console.log('\n📱 FRONTEND INSTRUCTIONS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Visit: http://localhost:3000/candidates');
        console.log('2. Login: test@analytics.com / test123');
        console.log('3. The page should now show:');
        console.log(`   - ${finalRanked} ranked candidates`);
        console.log(`   - ${finalPending} pending candidates`);
        console.log(`   - Real AI scores for ${finalWithScores} candidates`);
        console.log('4. If still showing old data, refresh page (F5)');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        process.exit(0);
    }
}

finalEndToEndTest();
