const db = require('./src/config/database');

async function checkRankings() {
  try {
    console.log('🔍 Checking AI ranking results...\n');
    
    // Check the latest job and its rankings
    const latestJob = await db.execute('SELECT * FROM jobs ORDER BY id DESC LIMIT 1');
    if (latestJob.length === 0) {
      console.log('❌ No jobs found');
      process.exit(0);
    }
    
    const jobId = latestJob[0].id;
    console.log(`📋 Job: ${latestJob[0].title} (ID: ${jobId})`);
    console.log(`📝 Description: ${latestJob[0].description}`);
    
    // Check applications for this job
    const applications = await db.execute(`
      SELECT a.*, u.first_name, u.last_name, u.email 
      FROM applications a 
      JOIN users u ON a.candidate_id = u.id 
      WHERE a.job_id = ?
    `, [jobId]);
    
    console.log(`\n📄 Applications (${applications.length}):`);
    applications.forEach(app => {
      console.log(`  - ${app.first_name} ${app.last_name} (${app.email}) - Status: ${app.status}`);
    });
    
    // Check rankings
    const rankings = await db.execute(`
      SELECT r.*, u.first_name, u.last_name, u.email 
      FROM rankings r 
      JOIN applications a ON r.application_id = a.id 
      JOIN users u ON a.candidate_id = u.id 
      WHERE r.job_id = ? 
      ORDER BY r.rank_position
    `, [jobId]);
    
    console.log(`\n🏆 AI Rankings (${rankings.length}):`);
    rankings.forEach(r => {
      console.log(`  Rank ${r.rank_position}: ${r.first_name} ${r.last_name}`);
      console.log(`    📊 Total Score: ${typeof r.total_score === 'number' ? r.total_score.toFixed(2) : r.total_score}`);
      console.log(`    🎯 Skills: ${typeof r.skill_score === 'number' ? r.skill_score.toFixed(2) : r.skill_score}`);
      console.log(`    🎓 Education: ${typeof r.education_score === 'number' ? r.education_score.toFixed(2) : r.education_score}`);
      console.log(`    💼 Experience: ${typeof r.experience_score === 'number' ? r.experience_score.toFixed(2) : r.experience_score}`);
      console.log('');
    });
    
    // Check feedback
    const feedback = await db.execute(`
      SELECT f.*, u.first_name, u.last_name 
      FROM feedback f 
      JOIN applications a ON f.application_id = a.id 
      JOIN users u ON a.candidate_id = u.id 
      WHERE a.job_id = ?
    `, [jobId]);
    
    console.log(`📝 AI Feedback (${feedback.length}):`);
    feedback.forEach(f => {
      console.log(`  👤 ${f.first_name} ${f.last_name}:`);
      console.log(`    💪 Strengths: ${f.strengths?.substring(0, 100)}...`);
      console.log(`    ⚠️  Missing Skills: ${f.missing_skills?.substring(0, 100)}...`);
      console.log(`    💡 Suggestions: ${f.suggestions?.substring(0, 100)}...`);
      console.log(`    📋 Assessment: ${f.overall_assessment?.substring(0, 100)}...`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkRankings();
