const axios = require('axios');

async function testAIServiceDirect() {
    try {
        console.log('🔍 TESTING AI SERVICE DIRECTLY');
        console.log('===============================\n');
        
        // Test the exact same request the backend makes
        console.log('📤 Sending POST to AI service...');
        
        const response = await axios.post('http://localhost:5001/api/rank-candidates', {
            job_id: 23
        }, {
            timeout: 60000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ AI Service Response:', response.status);
        console.log('📊 Response Data:', response.data);
        
        if (response.status === 200) {
            console.log('✅ AI Service is working correctly');
            console.log('📊 Job ID:', response.data.job_id);
            console.log('📊 Message:', response.data.message);
        } else {
            console.log('❌ AI Service Error:', response.status);
            console.log('❌ Error Data:', response.data);
        }
        
        // Also test the status endpoint
        console.log('\n📊 Testing status endpoint...');
        try {
            const statusResponse = await axios.get('http://localhost:5001/api/ranking-status/23');
            console.log('✅ Status Response:', statusResponse.data);
        } catch (error) {
            console.log('❌ Status Error:', error.message);
        }
        
        console.log('\n🎉 TEST COMPLETE!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        process.exit(0);
    }
}

testAIServiceDirect();
