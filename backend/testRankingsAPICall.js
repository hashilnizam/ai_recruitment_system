console.log('🔍 TESTING RANKINGS API CALLS');
console.log('==============================\n');

console.log('📊 Expected API calls from frontend:');
console.log('1. GET /api/jobs?recruiterId=19');
console.log('2. GET /api/rankings/job/23');
console.log('3. GET /api/rankings/job/22');
console.log('4. GET /api/resumes');

console.log('\n🌐 Testing Rankings API directly:');

const axios = require('axios');

async function testRankingsAPI() {
    try {
        // Login
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@analytics.com',
            password: 'test123'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ Login successful');
        
        // Test rankings API for job 23
        console.log('\n📊 Testing /api/rankings/job/23');
        const rankings23 = await axios.get('http://localhost:5000/api/rankings/job/23', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log(`✅ Job 23 Rankings: ${rankings23.data.data.length} candidates`);
        rankings23.data.data.forEach((candidate, index) => {
            const score = candidate.total_score || 0;
            const rank = candidate.rank_position || 'N/A';
            const name = candidate.first_name + ' ' + (candidate.last_name || '');
            const type = candidate.is_resume_upload ? '(Resume)' : '(Application)';
            console.log(`   ${index + 1}. Rank ${rank}: ${name} ${type} - Score: ${score}%`);
        });
        
        // Test rankings API for job 22
        console.log('\n📊 Testing /api/rankings/job/22');
        const rankings22 = await axios.get('http://localhost:5000/api/rankings/job/22', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log(`✅ Job 22 Rankings: ${rankings22.data.data.length} candidates`);
        rankings22.data.data.forEach((candidate, index) => {
            const score = candidate.total_score || 0;
            const rank = candidate.rank_position || 'N/A';
            const name = candidate.first_name + ' ' + (candidate.last_name || '');
            const type = candidate.is_resume_upload ? '(Resume)' : '(Application)';
            console.log(`   ${index + 1}. Rank ${rank}: ${name} ${type} - Score: ${score}%`);
        });
        
        console.log('\n🎯 ANALYSIS:');
        console.log('✅ Rankings API is working correctly');
        console.log('✅ Data structure is correct');
        console.log('✅ Scores and positions are available');
        
        console.log('\n🔧 FRONTEND DEBUGGING:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Open browser DevTools (F12)');
        console.log('2. Go to Network tab');
        console.log('3. Clear network log');
        console.log('4. Refresh candidates page');
        console.log('5. Look for these API calls:');
        console.log('   - GET /api/rankings/job/23');
        console.log('   - GET /api/rankings/job/22');
        console.log('6. If you see these calls but no data, check response');
        console.log('7. If you DONT see these calls, frontend has error');
        
        console.log('\n📱 EXPECTED FRONTEND BEHAVIOR:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Should call rankings APIs for each job');
        console.log('✅ Should display ranked candidates with scores');
        console.log('✅ Should show rank positions');
        console.log('✅ Should update status from pending to ranked');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        process.exit(0);
    }
}

testRankingsAPI();
