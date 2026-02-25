const axios = require('axios');

async function testRecruiterAPI() {
  try {
    console.log('🔍 Testing recruiter API endpoint directly...');
    
    // Create a test request (without auth for now to see the structure)
    const response = await axios.get('http://localhost:5000/api/recruiter/resumes', {
      headers: {
        'Authorization': 'Bearer test-token' // This will fail but show us the error structure
      }
    }).catch(error => {
      console.log('📊 Auth error (expected):', error.response?.status, error.response?.data);
      return error.response;
    });
    
    console.log('📋 Response structure:', response);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRecruiterAPI();
