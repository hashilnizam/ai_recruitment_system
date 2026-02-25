const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testMainUpload() {
  try {
    console.log('🧪 TESTING MAIN UPLOAD ENDPOINT...');
    
    // Get the test duplicate file
    const uploadsDir = path.join(__dirname, '../../uploads/recruiter-resumes');
    const duplicateFile = fs.readdirSync(uploadsDir).find(f => f.includes('duplicate-test'));
    
    if (!duplicateFile) {
      console.log('❌ Test duplicate file not found');
      return;
    }
    
    const filePath = path.join(uploadsDir, duplicateFile);
    console.log(`📋 Testing with file: ${duplicateFile}`);
    
    // Create FormData for upload
    const form = new FormData();
    form.append('resumes', fs.createReadStream(filePath), duplicateFile);
    
    try {
      console.log('🔄 Sending request to MAIN upload endpoint...');
      console.log('🎯 URL: http://localhost:5000/api/recruiter/resumes');
      
      const response = await axios.post('http://localhost:5000/api/recruiter/resumes', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': 'Bearer test-token' // This will fail but should show route exists
        },
        timeout: 10000
      });
      
      console.log('✅ Main upload response:', response.data);
      console.log('📊 Status:', response.status);
      
      if (response.status === 403) {
        console.log('✅ Main upload endpoint exists (auth error expected)');
      } else if (response.status === 404) {
        console.log('❌ Main upload endpoint NOT FOUND');
      } else if (response.status === 200 || response.status === 201) {
        console.log('✅ Main upload endpoint working');
        if (response.data.duplicate_files > 0) {
          console.log('🎉 DUPLICATE DETECTION IS WORKING IN MAIN ENDPOINT!');
        } else {
          console.log('📊 Upload processed without duplicates');
        }
      }
      
    } catch (error) {
      console.log('📊 Upload error response:', error.response?.data);
      console.log('📊 Status code:', error.response?.status);
      
      if (error.response?.status === 403) {
        console.log('✅ Main upload endpoint exists (auth error expected)');
      } else if (error.response?.status === 404) {
        console.log('❌ Main upload endpoint NOT FOUND - ROUTE ISSUE!');
      } else {
        console.log('📊 Other error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMainUpload();
