const db = require('./src/config/database');

async function addTestData() {
  try {
    console.log('🧪 Adding Test Data to Verify Dashboard Updates...');
    
    const recruiterId = 19; // Test recruiter ID
    
    // 1. Add a test job
    const jobResult = await db.query(
      `INSERT INTO jobs (recruiter_id, title, description, required_skills, required_education, required_experience, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        recruiterId,
        'Test Software Engineer',
        'Looking for a skilled software engineer to join our team.',
        JSON.stringify(['JavaScript', 'React', 'Node.js']),
        JSON.stringify(['Bachelor in Computer Science']),
        JSON.stringify({ min_years: 2, preferred_roles: ['Software Engineer'] }),
        'published'
      ]
    );
    const jobId = jobResult.insertId;
    console.log(`✅ Added test job: ID ${jobId}`);
    
    // 2. Add a test application
    const applicationResult = await db.query(
      `INSERT INTO applications (job_id, candidate_id, resume_hash, status, applied_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [
        jobId,
        1, // Test candidate ID
        'test_resume_hash_12345',
        'pending'
      ]
    );
    const applicationId = applicationResult.insertId;
    console.log(`✅ Added test application: ID ${applicationId}`);
    
    // 3. Add a test ranking
    await db.query(
      `INSERT INTO rankings (job_id, application_id, skill_score, education_score, experience_score, total_score, rank_position, ranked_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        jobId,
        applicationId,
        85.5,
        90.0,
        88.0,
        87.8,
        1
      ]
    );
    console.log(`✅ Added test ranking`);
    
    console.log('\n🎉 Test data added successfully!');
    console.log('📊 Dashboard should now show:');
    console.log('  • Total Jobs: 1');
    console.log('  • Active Jobs: 1');
    console.log('  • Total Applications: 1');
    console.log('  • Recent Jobs: 1 item');
    console.log('  • Applications graph: 1 for today');
    console.log('  • Rankings graph: 1 for today');
    
    console.log('\n🔄 Please refresh the dashboard to see the changes!');
    console.log('📱 Visit: http://localhost:3000/recruiter/dashboard');
    
  } catch (error) {
    console.error('❌ Error adding test data:', error.message);
  } finally {
    process.exit(0);
  }
}

addTestData();
