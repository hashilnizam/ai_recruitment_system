const db = require('./src/config/database');

async function updateResumeRecruiterId() {
  try {
    console.log('🔧 Updating resume recruiter ID...');
    
    // Update resume 164 to belong to recruiter ID 12 (test user)
    await db.query(
      'UPDATE recruiter_resumes SET recruiter_id = 12 WHERE id = 164',
      []
    );
    
    console.log('✅ Updated resume 164 to belong to recruiter ID 12');
    
    // Verify the update
    const resume = await db.query(
      'SELECT id, original_name, recruiter_id FROM recruiter_resumes WHERE id = 164',
      []
    );
    
    console.log('📄 Updated resume:', resume[0]);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit();
  }
}

updateResumeRecruiterId();
