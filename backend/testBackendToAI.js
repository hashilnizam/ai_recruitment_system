const axios = require('axios');

async function testBackendToAI() {
    try {
        console.log('🔍 TESTING BACKEND TO AI SERVICE CALL');
        console.log('====================================\n');
        
        // Test 1: Direct AI service call (same as backend)
        console.log('📤 Test 1: Direct AI Service Call');
        try {
            const response = await axios.post('http://localhost:5001/api/rank-candidates', {
                job_id: 23
            }, {
                timeout: 60000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ Direct Call Status:', response.status);
            console.log('✅ Direct Call Data:', response.data);
        } catch (error) {
            console.log('❌ Direct Call Failed:', error.message);
            if (error.response) {
                console.log('❌ Direct Call Error:', error.response.status, error.response.data);
            }
        }
        
        // Test 2: Through backend (auth + trigger)
        console.log('\n🚀 Test 2: Through Backend');
        try {
            // Login first
            const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'test@analytics.com',
                password: 'test123'
            });
            
            const token = loginResponse.data.data.token;
            console.log('✅ Backend login successful');
            
            // Call backend trigger endpoint
            const triggerResponse = await axios.post('http://localhost:5000/api/recruiter/trigger-ranking', {}, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ Backend Trigger Status:', triggerResponse.status);
            console.log('✅ Backend Trigger Data:', triggerResponse.data);
            
            if (triggerResponse.status === 500) {
                console.log('❌ Backend returned 500 - checking AI service logs...');
                
                // Check AI service status
                try {
                    const statusResponse = await axios.get('http://localhost:5001/api/ranking-status/23');
                    console.log('📊 AI Service Status:', statusResponse.data);
                } catch (statusError) {
                    console.log('❌ Could not check AI service status:', statusError.message);
                }
            }
            
        } catch (error) {
            console.log('❌ Backend Trigger Failed:', error.message);
            if (error.response) {
                console.log('❌ Backend Error:', error.response.status, error.response.data);
            }
        }
        
        // Test 3: Check if AI service is still processing job 23
        console.log('\n📊 Test 3: Check AI Service Processing Status');
        try {
            const statusResponse = await axios.get('http://localhost:5001/api/ranking-status/23');
            const status = statusResponse.data.data;
            
            console.log('📊 Current AI Service Status:', status);
            
            if (status.status === 'processing') {
                console.log('⚠️ AI Service is still processing job 23');
                console.log('⚠️ This would cause a 400 error on new requests');
            } else if (status.status === 'completed') {
                console.log('✅ AI Service completed job 23');
            } else {
                console.log('📊 AI Service status:', status.status);
            }
            
        } catch (error) {
            console.log('❌ Status check failed:', error.message);
        }
        
        console.log('\n🎉 TEST COMPLETE!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        process.exit(0);
    }
}

testBackendToAI();
