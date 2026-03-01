const axios = require('axios');

async function testAnalytics() {
  try {
    console.log('🧪 Testing analytics API...');
    
    // First, login as a recruiter to get a valid token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@analytics.com',
      password: 'test123'
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    console.log('📋 Login response:', JSON.stringify(loginResponse.data, null, 2));
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, token obtained');
    console.log('🔑 Token (first 50 chars):', token ? token.substring(0, 50) + '...' : 'NO TOKEN');
    
    // Test analytics API
    console.log('📊 Making analytics API call...');
    const analyticsResponse = await axios.get('http://localhost:5000/api/analytics/recruiter', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Analytics API Response:');
    console.log(JSON.stringify(analyticsResponse.data, null, 2));
    
    // Verify expected structure
    const data = analyticsResponse.data.data;
    if (data.summary && data.trends && data.scoreDistribution && data.topJobs && data.commonSkills && data.insights) {
      console.log('✅ Analytics API structure is correct');
    } else {
      console.log('❌ Analytics API structure is incomplete');
    }
    
  } catch (error) {
    console.error('❌ Error testing analytics:', error.response?.data || error.message);
  }
}

testAnalytics();
