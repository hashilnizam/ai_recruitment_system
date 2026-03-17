const axios = require('axios');

async function testBackendRequest() {
    try {
        console.log('🔍 TESTING BACKEND TO AI SERVICE REQUEST');
        console.log('==========================================\n');
        
        // Test the exact same way the backend does
        console.log('🤖 Testing AI Service with Backend-style Request');
        try {
            const aiResponse = await axios.post('http://localhost:5001/api/rank-candidates', {
                job_id: 23
            }, {
                timeout: 60000, // Same as backend
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
                console.log('   Headers:', aiError.response.headers);
            }
        }
        
        // Test with different job_id to see if it's job-specific
        console.log('\n🤖 Testing with Job ID 22');
        try {
            const aiResponse2 = await axios.post('http://localhost:5001/api/rank-candidates', {
                job_id: 22
            }, {
                timeout: 60000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ AI Service Response for Job 22:', aiResponse2.data);
        } catch (aiError2) {
            console.log('❌ AI Service Error for Job 22:', aiError2.message);
            if (aiError2.response) {
                console.log('   Status:', aiError2.response.status);
                console.log('   Data:', aiError2.response.data);
            }
        }
        
        // Test AI service health
        console.log('\n🏥 Testing AI Service Health');
        try {
            const healthResponse = await axios.get('http://localhost:5001/health');
            console.log('✅ Health Response:', healthResponse.data);
        } catch (healthError) {
            console.log('❌ Health Error:', healthError.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testBackendRequest();
