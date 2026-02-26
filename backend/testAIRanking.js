const axios = require('axios');

async function testRanking() {
  try {
    console.log('🚀 Testing AI ranking trigger...');
    
    // Get auth token (you'll need to log in first)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwicm9sZSI6InJlY3J1aXRlciIsImVtYWlsIjoicmVjcnVpdGVyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzM3OTY0MzI3LCJleHAiOjE3Mzg1NjkxMjd9.test'; // Replace with actual token
    
    const response = await axios.post('http://localhost:5000/api/recruiter/trigger-ranking', {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ AI ranking triggered successfully:', response.data);
    
    // Poll for results
    console.log('⏳ Polling for ranking results...');
    let attempts = 0;
    const maxAttempts = 12; // 2 minutes max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      try {
        const rankingsResponse = await axios.get('http://localhost:5000/api/rankings/job/14', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`📊 Rankings check ${attempts + 1}:`, rankingsResponse.data);
        
        if (rankingsResponse.data.data && rankingsResponse.data.data.length > 0) {
          console.log('🎉 Rankings found! Results:');
          rankingsResponse.data.data.forEach((ranking, index) => {
            console.log(`  ${index + 1}. ${ranking.first_name} - Score: ${ranking.total_score}% - Rank: #${ranking.rank_position}`);
          });
          break;
        }
      } catch (error) {
        console.log('No rankings yet, checking again...');
      }
      
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      console.log('⏰ Timeout: No rankings found after 2 minutes');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testRanking();
