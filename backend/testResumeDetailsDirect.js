const db = require('./src/config/database');

async function testResumeDetailsDirect() {
  try {
    console.log('🧪 Testing resume details directly...');
    
    // Test with resume ID 164
    const resumeId = 164;
    const recruiterId = 8; // Known recruiter ID
    
    // Get resume info
    const resume = await db.query(
      'SELECT * FROM recruiter_resumes WHERE id = ? AND recruiter_id = ?',
      [resumeId, recruiterId]
    );
    
    console.log('📄 Resume query result:', resume.length, 'records');
    if (resume.length > 0) {
      console.log('📄 Resume data:', {
        id: resume[0].id,
        original_name: resume[0].original_name,
        recruiter_id: resume[0].recruiter_id
      });
    }
    
    // Get ranking information
    const ranking = await db.query(
      'SELECT * FROM rankings WHERE candidate_id = ? ORDER BY ranked_at DESC LIMIT 1',
      [resumeId]
    );
    
    console.log('🏆 Ranking query result:', ranking.length, 'records');
    if (ranking.length > 0) {
      console.log('🏆 Ranking data:', {
        total_score: ranking[0].total_score,
        rank_position: ranking[0].rank_position
      });
    }
    
    // Get feedback information
    const feedback = await db.query(
      'SELECT * FROM feedback WHERE candidate_id = ? ORDER BY created_at DESC LIMIT 1',
      [resumeId]
    );
    
    console.log('💬 Feedback query result:', feedback.length, 'records');
    if (feedback.length > 0) {
      console.log('💬 Feedback data:', {
        has_strengths: !!feedback[0].strengths,
        has_suggestions: !!feedback[0].suggestions
      });
    }
    
    console.log('✅ All queries completed successfully!');
    
  } catch (error) {
    console.error('❌ Database error:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
  } finally {
    process.exit();
  }
}

testResumeDetailsDirect();
