const axios = require('axios');

async function checkAllServices() {
  console.log('🔍 CHECKING ALL SERVICES STATUS');
  console.log('================================\n');
  
  const services = [
    { name: 'Backend API', url: 'http://localhost:5000/health' },
    { name: 'AI Service', url: 'http://localhost:5001/' },
    { name: 'Frontend', url: 'http://localhost:3000/' }
  ];
  
  for (const service of services) {
    try {
      const response = await axios.get(service.url, { timeout: 3000 });
      console.log(`✅ ${service.name}: RUNNING (${response.status})`);
    } catch (error) {
      console.log(`❌ ${service.name}: NOT RUNNING`);
    }
  }
  
  console.log('\n📊 Testing Dashboard API...');
  try {
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@analytics.com',
      password: 'test123'
    });
    
    const token = loginResponse.data.data.token;
    const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/recruiter', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (dashboardResponse.data.success) {
      console.log('✅ Dashboard API: WORKING');
      console.log(`   Total Jobs: ${dashboardResponse.data.data.summary.totalJobs}`);
      console.log(`   Active Jobs: ${dashboardResponse.data.data.summary.activeJobs}`);
      console.log(`   Applications: ${dashboardResponse.data.data.summary.totalApplications}`);
    }
  } catch (error) {
    console.log('❌ Dashboard API: NOT WORKING');
  }
  
  console.log('\n🔗 Access Information:');
  console.log('📱 Dashboard: http://localhost:3000/recruiter/dashboard');
  console.log('🔑 Login: test@analytics.com / test123');
}

checkAllServices();
