const axios = require('axios');

async function getFreshToken() {
  try {
    console.log('🔐 Getting fresh token...');
    
    // Login as recruiter
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'recruiter@example.com',
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
      console.log('✅ Resume details response:', detailsResponse.data);
      
    } else {
      console.error('❌ Login failed:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  } finally {
    process.exit();
  }
}

getFreshToken();
