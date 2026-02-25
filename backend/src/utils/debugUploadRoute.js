const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function debugUploadRoute() {
  try {
    console.log('🧪 Debugging upload route directly...');
    
    // Get the test duplicate file
    const uploadsDir = path.join(__dirname, '../../uploads/recruiter-resumes');
    const files = fs.readdirSync(uploadsDir);
    const duplicateFile = files.find(f => f.includes('duplicate-test'));
    
    if (!duplicateFile) {
      console.log('❌ Test duplicate file not found');
      return;
    }
    
    const filePath = path.join(uploadsDir, duplicateFile);
    console.log(`📋 Testing with file: ${duplicateFile}`);
    
    // Create FormData for upload
    const FormData = require('form-data');
    const form = new FormData();
    form.append('resumes', fs.createReadStream(filePath), duplicateFile);
    
    try {
      console.log('🔄 Sending upload request...');
      const response = await axios.post('http://localhost:5000/api/recruiter/resumes', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': 'Bearer test-token' // This will fail but show us the route
        }
      });
      
      console.log('✅ Upload response:', response.data);
    } catch (error) {
      console.log('📊 Upload error response:', error.response?.data);
      console.log('📊 Status code:', error.response?.status);
      
      if (error.response?.status === 403) {
        console.log('✅ Route is accessible (auth error expected)');
      } else if (error.response?.status === 404) {
        console.log('❌ Route not found - check route registration');
      } else {
        console.log('📊 Other error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugUploadRoute();
