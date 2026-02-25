const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testDuplicateEndpoint() {
  try {
    console.log('🧪 Testing duplicate detection endpoint...');
    
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
      console.log('🔄 Sending test request to /api/recruiter/test-duplicate...');
      const response = await axios.post('http://localhost:5000/api/recruiter/test-duplicate', form, {
        headers: {
          ...form.getHeaders()
        }
      });
      
      console.log('✅ Test endpoint response:', response.data);
      
      if (response.data.isDuplicate) {
        console.log('🎉 DUPLICATE DETECTION IS WORKING!');
        console.log('📋 Existing files found:', response.data.existingFiles.length);
      } else {
        console.log('⚠️ No duplicate detected (unexpected)');
      }
      
    } catch (error) {
      console.error('❌ Test endpoint error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDuplicateEndpoint();
