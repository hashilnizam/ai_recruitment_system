const axios = require('axios');

async function testDashboardEndToEnd() {
  try {
    console.log('🧪 Testing Dashboard End-to-End...');
    
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
    
    // 2. Test dashboard API
    const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/recruiter', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!dashboardResponse.data.success) {
      console.error('❌ Dashboard API failed:', dashboardResponse.data.message);
      return;
    }
    
    console.log('✅ Dashboard API successful!');
    console.log('📊 Dashboard Data Structure:');
    
    const data = dashboardResponse.data.data;
    console.log('- Summary:', {
      totalJobs: data.summary.totalJobs,
      activeJobs: data.summary.activeJobs,
      totalApplications: data.summary.totalApplications,
      pendingRankings: data.summary.pendingRankings,
      hasChanges: !!data.summary.changes
    });
    
    console.log('- Recent Jobs:', data.recentJobs.length, 'jobs');
    console.log('- Applications 7 Days:', data.applications7Days.data.length, 'days of data');
    console.log('- Rankings 7 Days:', data.rankings7Days.data.length, 'days of data');
    
    // 3. Test frontend accessibility
    try {
      const frontendResponse = await axios.get('http://localhost:3000/recruiter/dashboard', {
        headers: {
          'Cookie': `token=${token}` // Simulate browser cookie
        }
      });
      console.log('✅ Frontend accessible:', frontendResponse.status === 200);
    } catch (frontendError) {
      console.log('⚠️ Frontend test failed (expected in CLI):', frontendError.code);
    }
    
    console.log('🎉 Dashboard End-to-End Test Complete!');
    console.log('📱 Visit: http://localhost:3000/recruiter/dashboard');
    console.log('🔑 Login with: test@analytics.com / test123');
    
  } catch (error) {
    console.error('❌ End-to-end test failed:', error.message);
  }
}

testDashboardEndToEnd();
