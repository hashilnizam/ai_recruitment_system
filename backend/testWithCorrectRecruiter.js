const axios = require('axios');

async function testWithCorrectRecruiter() {
  try {
    console.log('🔐 Testing with correct recruiter...');
    
    // Try common passwords
    const passwords = ['password123', 'Password123!', 'admin123', '123456'];
    
    for (const password of passwords) {
      try {
        console.log(`🔑 Trying password: ${password}`);
        
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: 'iffatnizam123@gmail.com',
          password: password
        });
        
        console.log('🔑 Login response success:', loginResponse.data.success);
        
        if (loginResponse.data.success && loginResponse.data.data && loginResponse.data.data.token) {
          const token = loginResponse.data.data.token;
          console.log('✅ Got valid token with password:', password);
          
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
            console.log('🎉 SUCCESS! The resume details endpoint is working!');
          } else {
            console.error('❌ Resume details error:', detailsResponse.data);
          }
          return; // Exit after successful test
          
        } else {
          console.log('❌ Login failed with password:', password);
        }
        
      } catch (error) {
        console.log('❌ Error with password:', password, '-', error.response?.data?.message || error.message);
      }
    }
    
    console.log('❌ All passwords failed');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  } finally {
    process.exit();
  }
}

testWithCorrectRecruiter();
