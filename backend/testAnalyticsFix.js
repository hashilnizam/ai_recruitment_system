const axios = require('axios');

async function testAnalyticsFix() {
  try {
    console.log('🧪 Testing Analytics API Fix...');
    
    // 1. Test login
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
    
    // 2. Test the CORRECT analytics API path (with /api/ prefix)
    console.log('📊 Testing correct API path: /api/analytics/recruiter');
    const analyticsResponse = await axios.get('http://localhost:5000/api/analytics/recruiter', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (analyticsResponse.data.success) {
      console.log('✅ Analytics API working with correct path!');
      console.log('📈 Data received:', Object.keys(analyticsResponse.data.data));
    } else {
      console.error('❌ Analytics API failed:', analyticsResponse.data.message);
    }
    
    // 3. Test the INCORRECT path (to show the original error)
    console.log('\n❌ Testing incorrect path: /analytics/recruiter (should fail)');
    try {
      const incorrectResponse = await axios.get('http://localhost:5000/analytics/recruiter', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('⚠️ Unexpected: Incorrect path worked');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Confirmed: Incorrect path returns 404 (as expected)');
      } else {
        console.log('⚠️ Unexpected error for incorrect path:', error.response?.status);
      }
    }
    
    // 4. Test dashboard API as well
    console.log('\n📊 Testing dashboard API: /api/dashboard/recruiter');
    const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/recruiter', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (dashboardResponse.data.success) {
      console.log('✅ Dashboard API working!');
      console.log('📈 Data received:', Object.keys(dashboardResponse.data.data));
    } else {
      console.error('❌ Dashboard API failed:', dashboardResponse.data.message);
    }
    
    console.log('\n🎉 API Fix Test Complete!');
    console.log('📱 Frontend should now work correctly');
    console.log('🔗 Visit: http://localhost:3000/recruiter/analytics');
    console.log('🔗 Visit: http://localhost:3000/recruiter/dashboard');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAnalyticsFix();
