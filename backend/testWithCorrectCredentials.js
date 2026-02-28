const axios = require('axios');

async function testWithCorrectCredentials() {
  try {
    console.log('🔐 Testing with correct recruiter credentials...');
    
    // Login as recruiter with correct credentials
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'ifatnizam123@gmail.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.token;
      console.log('✅ Got fresh token:', token.substring(0, 50) + '...');
      
      // Test resume details with fresh token
      const detailsResponse = await axios.get('http://localhost:5000/api/recruiter/resumes/164/details', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Resume details response status:', detailsResponse.status);
      console.log('✅ Resume details response success:', detailsResponse.data.success);
      if (detailsResponse.data.success) {
        console.log('📄 Resume name:', detailsResponse.data.data.original_name);
        console.log('🏆 Resume score:', detailsResponse.data.data.total_score);
        console.log('💬 Has feedback:', !!detailsResponse.data.data.overall_assessment);
      }
      
    } else {
      console.error('❌ Login failed:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  } finally {
    process.exit();
  }
}

testWithCorrectCredentials();
