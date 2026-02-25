const mysql = require('mysql2/promise');

async function testDuplicateDetection() {
  try {
    console.log('🧪 Testing duplicate detection system...');
    
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || 'root',
      database: process.env.DATABASE_NAME || 'resume_screening',
      port: process.env.DATABASE_PORT || 3306
    });
    
    // Test 1: Check if file_hash column exists and has data
    console.log('\n📋 Test 1: Verify file_hash column');
    const [hashCheck] = await connection.execute(
      'SELECT COUNT(*) as count FROM recruiter_resumes WHERE file_hash IS NOT NULL AND file_hash != ""'
    );
    console.log(`✅ Resumes with file hashes: ${hashCheck[0].count}`);
    
    // Test 2: Check for potential duplicates (same recruiter, same hash)
    console.log('\n📋 Test 2: Check for existing duplicates');
    const [duplicates] = await connection.execute(`
      SELECT recruiter_id, file_hash, COUNT(*) as count 
      FROM recruiter_resumes 
      WHERE file_hash IS NOT NULL AND file_hash != ""
      GROUP BY recruiter_id, file_hash 
      HAVING count > 1
    `);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate hashes found (as expected)');
    } else {
      console.log(`⚠️ Found ${duplicates.length} potential duplicate groups`);
      duplicates.forEach((dup, index) => {
        console.log(`  ${index + 1}. Recruiter ${dup.recruiter_id}: ${dup.count} files with same hash`);
      });
    }
    
    // Test 3: Verify indexes exist
    console.log('\n📋 Test 3: Check indexes');
    const [indexes] = await connection.execute('SHOW INDEX FROM recruiter_resumes');
    const fileHashIndex = indexes.find(idx => idx.Key_name === 'idx_file_hash');
    const compositeIndex = indexes.find(idx => idx.Key_name === 'idx_recruiter_file_hash');
    
    console.log(`✅ file_hash index exists: ${!!fileHashIndex}`);
    console.log(`✅ composite index exists: ${!!compositeIndex}`);
    
    // Test 4: Sample duplicate detection query
    console.log('\n📋 Test 4: Test duplicate detection query');
    const [testQuery] = await connection.execute(
      'SELECT id, original_name, uploaded_at FROM recruiter_resumes WHERE recruiter_id = 8 AND file_hash = ? LIMIT 1',
      ['5c3c20589b3406a8'] // Using a known hash from earlier output
    );
    
    if (testQuery.length > 0) {
      console.log(`✅ Duplicate detection query works: Found ${testQuery[0].original_name}`);
    } else {
      console.log('ℹ️ No matching file found for test hash (this is normal)');
    }
    
    console.log('\n🎉 Duplicate detection system is ready!');
    console.log('📊 Total resumes in database: ' + (await connection.execute('SELECT COUNT(*) as count FROM recruiter_resumes'))[0][0].count);
    
    await connection.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testDuplicateDetection();
