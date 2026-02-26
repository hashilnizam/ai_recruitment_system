const axios = require('axios');

async function testDirectAI() {
  try {
    console.log('🚀 Testing AI service directly...');
    
    // Test AI service directly
    const aiResponse = await axios.post('http://localhost:5001/api/rank-candidates', {
      job_id: 14
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ AI service response:', aiResponse.data);
    
  } catch (error) {
    console.error('❌ AI service error:', error.response?.data || error.message);
  }
}

testDirectAI();
