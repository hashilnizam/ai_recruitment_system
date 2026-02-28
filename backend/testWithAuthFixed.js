const axios = require('axios');

async function testWithAuthEndpoint() {
  try {
    console.log('🧪 Testing with auth endpoint...');
    
    const response = await axios.get('http://localhost:5002/test-auth-resume/164');
    
    console.log('✅ Response status:', response.status);
    console.log('✅ Response success:', response.data.success);
    if (response.data.success) {
      console.log('📄 Resume name:', response.data.data.original_name);
      console.log('🏆 Resume score:', response.data.data.total_score);
      console.log('💬 Has feedback:', !!response.data.data.overall_assessment);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
  } finally {
    process.exit();
  }
}

testWithAuthEndpoint();
