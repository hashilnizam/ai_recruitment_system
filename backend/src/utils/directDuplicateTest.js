const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Copy the exact functions from recruiterRoutes.js
function calculateFileHash(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    return hash;
  } catch (error) {
    console.error('Error calculating file hash:', error);
    return null;
  }
}

async function checkDuplicateFile(recruiterId, fileHash) {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || 'root',
      database: process.env.DATABASE_NAME || 'resume_screening',
      port: process.env.DATABASE_PORT || 3306
    });
    
    const [existingFiles] = await connection.query(
      'SELECT id, original_name, uploaded_at FROM recruiter_resumes WHERE recruiter_id = ? AND file_hash = ?',
      [recruiterId, fileHash]
    );
    
    console.log('🔍 Direct DB check result:', {
      recruiterId,
      fileHash: fileHash.substring(0, 16) + '...',
      foundFiles: existingFiles.length
    });
    
    await connection.end();
    return existingFiles;
  } catch (error) {
    console.error('Error checking duplicate file:', error);
    return [];
  }
}

async function directDuplicateTest() {
  try {
    console.log('🧪 DIRECT DUPLICATE TEST - Bypassing all middleware...');
    
    // Get the test duplicate file
    const uploadsDir = path.join(__dirname, '../../uploads/recruiter-resumes');
    const files = fs.readdirSync(uploadsDir);
    const duplicateFile = files.find(f => f.includes('duplicate-test'));
    
    if (!duplicateFile) {
      console.log('❌ Test duplicate file not found');
      console.log('📁 Available files:', files.slice(0, 5));
      return;
    }
    
    const filePath = path.join(uploadsDir, duplicateFile);
    console.log(`📋 Testing with file: ${duplicateFile}`);
    
    // Calculate hash
    const fileHash = calculateFileHash(filePath);
    if (!fileHash) {
      console.log('❌ Failed to calculate hash');
      return;
    }
    
    console.log(`🔍 File hash: ${fileHash.substring(0, 16)}...`);
    
    // Test with recruiter ID 8
    const recruiterId = 8;
    
    // Check for duplicates
    const existingFiles = await checkDuplicateFile(recruiterId, fileHash);
    
    console.log(`📊 Found ${existingFiles.length} existing files with same hash`);
    
    if (existingFiles.length > 0) {
      console.log('🎉 DUPLICATE DETECTION IS WORKING!');
      console.log('📋 Existing files:');
      existingFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.original_name} (ID: ${file.id})`);
      });
      
      console.log('\n✅ CONCLUSION: Duplicate detection logic is PERFECT');
      console.log('🚫 If duplicates are still being uploaded, the issue is:');
      console.log('   1. Authentication middleware not working');
      console.log('   2. Frontend not calling correct endpoint');
      console.log('   3. Route not being hit');
      console.log('   4. Different upload endpoint being used');
      
    } else {
      console.log('❌ No duplicates found - this is unexpected');
    }
    
  } catch (error) {
    console.error('❌ Direct test failed:', error);
  }
}

directDuplicateTest();
