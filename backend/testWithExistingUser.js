const axios = require('axios');

async function testWithExistingUser() {
  try {
    console.log('🔐 Testing with existing user...');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'testuser@example.com',
      password: 'Password123!'
    });
    
    console.log('🔑 Login response:', loginResponse.data);
    
    if (loginResponse.data.success && loginResponse.data.token) {
      const token = loginResponse.data.token;
      console.log('✅ Got valid token:', token.substring(0, 50) + '...');
      
      // Test resume details with valid token
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
      } else {
        console.error('❌ Resume details error:', detailsResponse.data);
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

testWithExistingUser();
