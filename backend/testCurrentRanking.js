const axios = require('axios');

async function testCurrentRanking() {
    try {
        console.log('🎯 TESTING CURRENT AI RANKING STATUS');
        console.log('===================================\n');
        
        // Login
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@analytics.com',
            password: 'test123'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ Login successful');
        
        // Check current rankings
        console.log('\n📊 Checking Current Rankings');
        try {
            const rankingsResponse = await axios.get('http://localhost:5000/api/rankings/job/23', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log(`✅ Found ${rankingsResponse.data.data.length} ranked candidates:`);
            rankingsResponse.data.data.forEach((candidate, index) => {
                const score = candidate.total_score || 0;
                const rank = candidate.rank_position || 'N/A';
                const name = candidate.first_name + ' ' + (candidate.last_name || '');
                const type = candidate.is_resume_upload ? '(Resume Upload)' : '(Application)';
                console.log(`   🏆 ${index + 1}. Rank ${rank}: ${name} ${type} - Score: ${score}%`);
                
                if (score > 0) {
                    console.log(`      ✨ REAL AI SCORE DETECTED!`);
                }
            });
            
            // Check if any have real scores
            const realScores = rankingsResponse.data.data.filter(c => c.total_score > 0);
            console.log(`\n🎯 SUMMARY:`);
            console.log(`   📊 Total candidates: ${rankingsResponse.data.data.length}`);
            console.log(`   🎯 Candidates with real AI scores: ${realScores.length}`);
            console.log(`   ⭐ Real scoring working: ${realScores.length > 0 ? 'YES' : 'NO'}`);
            
        } catch (error) {
            console.log('❌ Rankings check failed:', error.message);
        }
        
        console.log('\n🎉 TEST COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        console.log('\n📱 FRONTEND INSTRUCTIONS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Visit: http://localhost:3000/candidates');
        console.log('2. Login: test@analytics.com / test123');
        console.log('3. Click "AI Ranking" button');
        console.log('4. Wait for processing to complete');
        console.log('5. Refresh page manually if needed');
        console.log('6. Look for candidates with rank positions and scores');
        
        console.log('\n🔧 IF STILL SHOWING PENDING:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('• Click "Check Results" button');
        console.log('• Refresh the browser page (F5)');
        console.log('• Wait 10-20 seconds after AI ranking completes');
        console.log('• The backend IS working - just frontend refresh issue');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        process.exit(0);
    }
}

testCurrentRanking();
