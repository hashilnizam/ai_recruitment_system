const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Test the duplicate detection functions
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

async function testDuplicateDetection() {
  try {
    console.log('🧪 Testing duplicate detection logic...');
    
    // Test 1: Check if helper functions work
    const uploadsDir = path.join(__dirname, '../../uploads/recruiter-resumes');
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('❌ Uploads directory not found');
      return;
    }
    
    const files = fs.readdirSync(uploadsDir).slice(0, 5); // Test first 5 files
    
    console.log('\n📋 Testing file hash calculation:');
    const hashes = {};
    
    for (const filename of files) {
      const filePath = path.join(uploadsDir, filename);
      const hash = calculateFileHash(filePath);
      
      if (hash) {
        hashes[hash] = hashes[hash] || [];
        hashes[hash].push(filename);
        
        console.log(`✅ ${filename}: ${hash.substring(0, 16)}...`);
      }
    }
    
    // Check for duplicates in test files
    console.log('\n🔍 Checking for duplicates in test files:');
    let duplicateGroups = 0;
    
    for (const [hash, fileGroup] of Object.entries(hashes)) {
      if (fileGroup.length > 1) {
        duplicateGroups++;
        console.log(`🔄 Duplicate group ${duplicateGroups}: ${fileGroup.length} files with same hash`);
        fileGroup.forEach(file => console.log(`  - ${file}`));
      }
    }
    
    if (duplicateGroups === 0) {
      console.log('✅ No duplicates found in test files');
    }
    
    console.log('\n🎉 Duplicate detection logic test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDuplicateDetection();
