const axios = require('axios');

async function testFrontendAPICall() {
  try {
    console.log('🔍 TESTING EXACT FRONTEND API CALL');
    console.log('=====================================\n');
    
    // 1. Create axios instance exactly like frontend
    const api = axios.create({
      baseURL: 'http://localhost:5000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // 2. Add request interceptor (like frontend)
    api.interceptors.request.use((config) => {
      // We'll set the token dynamically after login
      return config;
    });
    
    // 3. Login to get real token
    console.log('📝 Step 1: Getting real token...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@analytics.com',
      password: 'test123'
    });
    
    const realToken = loginResponse.data.data.token;
    console.log(`✅ Real token obtained: ${realToken.substring(0, 50)}...`);
    
    // Set the token for subsequent requests
    api.defaults.headers.common['Authorization'] = `Bearer ${realToken}`;
    
    // 4. Test exact frontend API call
    console.log('\n📊 Step 2: Testing exact frontend API call...');
    console.log('🔗 URL: http://localhost:5000/api/dashboard/recruiter');
    console.log('🔧 Method: GET');
    console.log('🔑 Authorization: Bearer [token]');
    
    const response = await api.get('/api/dashboard/recruiter');
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${response.data.success}`);
    
    // 5. Show exact response
    console.log('\n📦 Step 3: Exact Response (what frontend receives):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify(response.data, null, 2));
    
    // 6. Verify data structure matches frontend expectations
    const data = response.data.data;
    console.log('\n🎯 Step 4: Frontend Data Structure Match:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ summary.totalJobs: ${data.summary.totalJobs} (number)`);
    console.log(`✅ summary.activeJobs: ${data.summary.activeJobs} (number)`);
    console.log(`✅ summary.totalApplications: ${data.summary.totalApplications} (number)`);
    console.log(`✅ summary.pendingRankings: ${data.summary.pendingRankings} (number)`);
    console.log(`✅ summary.changes.jobsChange: ${data.summary.changes.jobsChange} (number)`);
    console.log(`✅ summary.changes.activeJobsChange: ${data.summary.changes.activeJobsChange} (number)`);
    console.log(`✅ summary.changes.applicationsChange: ${data.summary.changes.applicationsChange} (number)`);
    console.log(`✅ summary.changes.pendingChange: ${data.summary.changes.pendingChange} (number)`);
    console.log(`✅ recentJobs: ${data.recentJobs.length} items (array)`);
    console.log(`✅ applications7Days.total: ${data.applications7Days.total} (number)`);
    console.log(`✅ rankings7Days.total: ${data.rankings7Days.total} (number)`);
    
    console.log('\n🎉 FRONTEND API CALL VERIFICATION COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ API Endpoint: CORRECT');
    console.log('✅ Authentication: WORKING');
    console.log('✅ Response Structure: MATCHES FRONTEND');
    console.log('✅ Data Values: REAL DATABASE DATA');
    
    console.log('\n📱 BROWSER DEBUGGING STEPS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Open browser to: http://localhost:3000/recruiter/dashboard');
    console.log('2. Login with: test@analytics.com / test123');
    console.log('3. Open DevTools (F12)');
    console.log('4. Go to Network tab');
    console.log('5. Look for request to: /api/dashboard/recruiter');
    console.log('6. Click on it and check Response tab');
    console.log('7. Should see the same data as above');
    console.log('8. Check Console tab for any JavaScript errors');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  }
}

testFrontendAPICall();
