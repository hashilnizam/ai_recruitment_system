const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function createTestDuplicate() {
  try {
    console.log('🧪 Creating test duplicate file...');
    
    // Get an existing file from uploads
    const uploadsDir = path.join(__dirname, '../../uploads/recruiter-resumes');
    const files = fs.readdirSync(uploadsDir);
    
    if (files.length === 0) {
      console.log('❌ No files found in uploads directory');
      return;
    }
    
    const sourceFile = files[0];
    const sourcePath = path.join(uploadsDir, sourceFile);
    
    console.log(`📋 Using source file: ${sourceFile}`);
    
    // Read the source file
    const sourceContent = fs.readFileSync(sourcePath);
    const sourceHash = crypto.createHash('sha256').update(sourceContent).digest('hex');
    
    console.log(`🔍 Source file hash: ${sourceHash.substring(0, 16)}...`);
    
    // Create a duplicate file with different name
    const duplicateName = 'duplicate-test-' + Date.now() + '.pdf';
    const duplicatePath = path.join(uploadsDir, duplicateName);
    
    fs.writeFileSync(duplicatePath, sourceContent);
    
    const duplicateHash = crypto.createHash('sha256').update(fs.readFileSync(duplicatePath)).digest('hex');
    
    console.log(`📝 Created duplicate: ${duplicateName}`);
    console.log(`🔍 Duplicate file hash: ${duplicateHash.substring(0, 16)}...`);
    console.log(`✅ Hashes match: ${sourceHash === duplicateHash}`);
    
    console.log('\n🎯 Test Instructions:');
    console.log('1. Go to frontend and upload the duplicate file');
    console.log(`2. Look for file: ${duplicateName}`);
    console.log('3. Check backend console for duplicate detection logs');
    console.log('4. File should be detected as duplicate and skipped');
    
    console.log('\n🎉 Test duplicate file created!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

createTestDuplicate();
