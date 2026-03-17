const axios = require('axios');

async function debugAIServiceConnection() {
    try {
        console.log('🔍 DEBUGGING AI SERVICE CONNECTION');
        console.log('===================================\n');
        
        // Test 1: Check if AI service is running
        console.log('📡 Test 1: AI Service Health Check');
        try {
            const healthResponse = await axios.get('http://localhost:5001/', {
                timeout: 5000
            });
            console.log('✅ AI Service is running:', healthResponse.status);
        } catch (error) {
            console.log('❌ AI Service not running:', error.message);
            return;
        }
        
        // Test 2: Test exact same request that backend makes
        console.log('\n📤 Test 2: Exact Backend Request');
        try {
            const response = await axios.post('http://localhost:5001/api/rank-candidates', {
                job_id: 23
            }, {
                timeout: 60000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ AI Service Response Status:', response.status);
            console.log('✅ AI Service Response Data:', response.data);
            
            if (response.status === 200) {
                console.log('✅ AI Service is working correctly');
            } else {
                console.log('❌ AI Service returned error:', response.status, response.data);
            }
            
        } catch (error) {
            console.log('❌ AI Service Request Failed:', error.message);
            
            if (error.response) {
                console.log('❌ Error Status:', error.response.status);
                console.log('❌ Error Data:', error.response.data);
            }
        }
        
        // Test 3: Check AI service logs
        console.log('\n📊 Test 3: Check AI Service Status');
        try {
            const statusResponse = await axios.get('http://localhost:5001/api/ranking-status/23');
            console.log('✅ Status Response:', statusResponse.data);
        } catch (error) {
            console.log('❌ Status check failed:', error.message);
        }
        
        // Test 4: Test backend trigger endpoint
        console.log('\n🚀 Test 4: Backend Trigger Endpoint');
        try {
            // Login first
            const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'test@analytics.com',
                password: 'test123'
            });
            
            const token = loginResponse.data.data.token;
            console.log('✅ Backend login successful');
            
            // Test trigger endpoint
            const triggerResponse = await axios.post('http://localhost:5000/api/recruiter/trigger-ranking', {}, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ Backend Trigger Response:', triggerResponse.data);
            console.log('✅ Backend Trigger Status:', triggerResponse.status);
            
        } catch (error) {
            console.log('❌ Backend trigger failed:', error.message);
            
            if (error.response) {
                console.log('❌ Error Status:', error.response.status);
                console.log('❌ Error Data:', error.response.data);
            }
        }
        
        console.log('\n🎉 DEBUG COMPLETE!');
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    } finally {
        process.exit(0);
    }
}

debugAIServiceConnection();
