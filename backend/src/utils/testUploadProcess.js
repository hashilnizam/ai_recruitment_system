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
    
    console.log('🔍 Duplicate check result:', {
      recruiterId,
      fileHash: fileHash.substring(0, 16) + '...',
      foundFiles: existingFiles.length
    });
    
    await connection.end();
    return existingFiles; // Return array, not first element
  } catch (error) {
    console.error('Error checking duplicate file:', error);
    return [];
  }
}

async function testUploadProcess() {
  try {
    console.log('🧪 Testing actual upload process...');
    
    // Test 1: Get an existing file from uploads
    const uploadsDir = path.join(__dirname, '../../uploads/recruiter-resumes');
    const files = fs.readdirSync(uploadsDir);
    
    if (files.length === 0) {
      console.log('❌ No files found in uploads directory');
      return;
    }
    
    const testFile = files[0];
    const testFilePath = path.join(uploadsDir, testFile);
    
    console.log(`📋 Testing with file: ${testFile}`);
    
    // Test 2: Calculate hash
    const fileHash = calculateFileHash(testFilePath);
    if (!fileHash) {
      console.log('❌ Failed to calculate file hash');
      return;
    }
    
    console.log(`🔍 File hash: ${fileHash.substring(0, 16)}...`);
    
    // Test 3: Check for duplicates (simulate recruiter ID 8)
    const recruiterId = 8;
    const existingFiles = await checkDuplicateFile(recruiterId, fileHash);
    
    console.log(`📊 Found ${existingFiles.length} existing files with same hash`);
    
    if (existingFiles.length > 0) {
      console.log('✅ DUPLICATE DETECTION WORKING!');
      console.log('📋 Existing files:');
      existingFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.original_name} (ID: ${file.id})`);
      });
      
      console.log('🔄 This file should be skipped during upload');
    } else {
      console.log('✅ No duplicates found - file should be uploaded');
    }
    
    // Test 4: Simulate the upload logic decision
    console.log('\n🎯 Upload Decision:');
    if (existingFiles.length > 0) {
      console.log('❌ REJECT - Duplicate file detected');
      console.log('🗑️ File should be removed from filesystem');
      console.log('📊 Should be added to duplicateFiles array');
    } else {
      console.log('✅ ACCEPT - Unique file');
      console.log('💾 Should be saved to database');
      console.log('📊 Should be added to uploadedResumes array');
    }
    
    console.log('\n🎉 Upload process test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUploadProcess();
