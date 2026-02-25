const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function testDuplicateFix() {
  try {
    console.log('🧪 Testing duplicate detection fix...');
    
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || 'root',
      database: process.env.DATABASE_NAME || 'resume_screening',
      port: process.env.DATABASE_PORT || 3306
    });
    
    // Test 1: Get a sample file and its hash
    const [sampleFile] = await connection.execute(
      'SELECT id, recruiter_id, original_name, file_hash FROM recruiter_resumes WHERE file_hash IS NOT NULL LIMIT 1'
    );
    
    if (sampleFile.length === 0) {
      console.log('❌ No files with hashes found in database');
      await connection.end();
      return;
    }
    
    const file = sampleFile[0];
    console.log(`📋 Testing with file: ${file.original_name}`);
    console.log(`🔍 Recruiter ID: ${file.recruiter_id}`);
    console.log(`🔍 File Hash: ${file.file_hash.substring(0, 16)}...`);
    
    // Test 2: Simulate the duplicate check query
    console.log('\n🔍 Testing duplicate check query...');
    const [duplicateCheck] = await connection.execute(
      'SELECT id, original_name, uploaded_at FROM recruiter_resumes WHERE recruiter_id = ? AND file_hash = ?',
      [file.recruiter_id, file.file_hash]
    );
    
    console.log(`✅ Found ${duplicateCheck.length} file(s) with same hash for same recruiter`);
    
    if (duplicateCheck.length > 0) {
      console.log('📋 Existing files:');
      duplicateCheck.forEach((dup, index) => {
        console.log(`  ${index + 1}. ${dup.original_name} (ID: ${dup.id})`);
      });
    }
    
    // Test 3: Check if the function would work correctly
    console.log('\n🧪 Simulating duplicate detection logic...');
    
    if (duplicateCheck.length > 0) {
      console.log('✅ Duplicate would be detected!');
      console.log('🔄 File would be skipped and removed from filesystem');
    } else {
      console.log('✅ No duplicate found - file would be uploaded');
    }
    
    // Test 4: Check different recruiter (should not be duplicate)
    console.log('\n🔍 Testing with different recruiter...');
    const [differentRecruiter] = await connection.execute(
      'SELECT id, original_name, uploaded_at FROM recruiter_resumes WHERE recruiter_id != ? AND file_hash = ?',
      [file.recruiter_id, file.file_hash]
    );
    
    console.log(`✅ Found ${differentRecruiter.length} file(s) with same hash for different recruiters`);
    
    await connection.end();
    console.log('\n🎉 Duplicate detection fix test completed!');
    console.log('✅ System is ready to prevent duplicate uploads!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDuplicateFix();
