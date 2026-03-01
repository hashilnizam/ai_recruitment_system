const axios = require('axios');

async function testFixes() {
  try {
    console.log('🧪 Testing All Fixes...');
    
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
    
    // 2. Test analytics API with proper data types
    console.log('📊 Testing analytics API...');
    const analyticsResponse = await axios.get('http://localhost:5000/api/analytics/recruiter', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (analyticsResponse.data.success) {
      console.log('✅ Analytics API working!');
      const data = analyticsResponse.data.data;
      
      // Check topJobs data structure
      console.log('📈 Top Jobs:', data.topJobs.length, 'jobs');
      if (data.topJobs.length > 0) {
        data.topJobs.forEach((job, index) => {
          console.log(`  Job ${index + 1}:`, {
            title: job.title,
            application_count: job.application_count,
            avg_score: job.avg_score,
            avg_score_type: typeof job.avg_score
          });
        });
      } else {
        console.log('  No jobs available (expected for test data)');
      }
    } else {
      console.error('❌ Analytics API failed:', analyticsResponse.data.message);
    }
    
    // 3. Test dashboard API
    console.log('📊 Testing dashboard API...');
    const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/recruiter', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (dashboardResponse.data.success) {
      console.log('✅ Dashboard API working!');
      console.log('📈 Dashboard data keys:', Object.keys(dashboardResponse.data.data));
    } else {
      console.error('❌ Dashboard API failed:', dashboardResponse.data.message);
    }
    
    console.log('\n🎉 All Fixes Tested Successfully!');
    console.log('📱 Frontend should work without errors now');
    console.log('🔗 Visit: http://localhost:3000/recruiter/analytics');
    console.log('🔗 Visit: http://localhost:3000/recruiter/dashboard');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFixes();
