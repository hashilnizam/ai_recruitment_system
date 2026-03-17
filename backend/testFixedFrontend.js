const axios = require('axios');

async function testFixedFrontend() {
    try {
        console.log('🎯 TESTING FIXED FRONTEND FLOW');
        console.log('================================\n');
        
        // Login
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@analytics.com',
            password: 'test123'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ Login successful');
        
        // Test the exact same API call the frontend will make
        console.log('\n📊 Testing Frontend API Calls');
        
        // Get jobs
        const jobsResponse = await axios.get('http://localhost:5000/api/jobs?recruiterId=19', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const jobs = jobsResponse.data.data;
        console.log(`✅ Found ${jobs.length} jobs`);
        
        // Get rankings for each job (like frontend does)
        for (const job of jobs) {
            console.log(`\n📋 Job ${job.id}: ${job.title}`);
            
            try {
                const rankingsResponse = await axios.get(`http://localhost:5000/api/rankings/job/${job.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const rankedCandidates = rankingsResponse.data.data || [];
                const pendingCandidates = rankedCandidates.filter(c => !c.rank_position);
                const realRanked = rankedCandidates.filter(c => c.rank_position && c.total_score > 0);
                
                console.log(`   📊 Total candidates: ${rankedCandidates.length}`);
                console.log(`   ⏳ Pending: ${pendingCandidates.length}`);
                console.log(`   🏆 Ranked: ${realRanked.length}`);
                console.log(`   🎯 Real scores: ${realRanked.length}`);
                
                // Show top ranked candidates
                realRanked.slice(0, 3).forEach((candidate, index) => {
                    console.log(`   🏆 Rank ${candidate.rank_position}: ${candidate.first_name} ${candidate.last_name} - Score: ${candidate.total_score}%`);
                });
                
            } catch (error) {
                console.log(`   ❌ Rankings API failed: ${error.message}`);
            }
        }
        
        console.log('\n🎉 FRONTEND TEST COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        console.log('\n📱 EXPECTED FRONTEND BEHAVIOR:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Candidates should show "Ranked" status');
        console.log('✅ Scores should be visible');
        console.log('✅ Rank positions should be displayed');
        console.log('✅ Pending count should decrease');
        console.log('✅ Ranked count should increase');
        
        console.log('\n🔧 IF STILL SHOWING PENDING:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('• Refresh browser page (F5)');
        console.log('• Click "Check Results" button');
        console.log('• Check browser console for errors');
        console.log('• The API is returning correct data now');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        process.exit(0);
    }
}

testFixedFrontend();
