const axios = require('axios');

async function testDashboard() {
  try {
    console.log('🧪 Testing dashboard API...');
    
    // First, login as a recruiter to get a valid token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@analytics.com',
      password: 'test123'
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, token obtained');
    
    // Test dashboard API
    console.log('📊 Making dashboard API call...');
    const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/recruiter', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Dashboard API Response:');
    console.log(JSON.stringify(dashboardResponse.data, null, 2));
    
    // Verify expected structure
    const data = dashboardResponse.data.data;
    if (data.summary && data.recentJobs && data.applications7Days && data.rankings7Days) {
      console.log('✅ Dashboard API structure is correct');
    } else {
      console.log('❌ Dashboard API structure is incomplete');
    }
    
  } catch (error) {
    console.error('❌ Error testing dashboard:', error.response?.data || error.message);
  }
}

testDashboard();
