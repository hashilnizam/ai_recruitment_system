const axios = require('axios');

async function testDashboardAPI() {
  try {
    console.log('🧪 Testing dashboard API with detailed logging...');
    
    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@analytics.com',
      password: 'test123'
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Test with detailed error handling
    try {
      const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/recruiter', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('✅ Dashboard API Response:');
      console.log('Status:', dashboardResponse.status);
      console.log('Data:', JSON.stringify(dashboardResponse.data, null, 2));
      
    } catch (axiosError) {
      console.error('❌ Axios Error Details:');
      console.error('Status:', axiosError.response?.status);
      console.error('Status Text:', axiosError.response?.statusText);
      console.error('Data:', axiosError.response?.data);
      console.error('Headers:', axiosError.response?.headers);
      console.error('Config:', axiosError.config);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testDashboardAPI();
