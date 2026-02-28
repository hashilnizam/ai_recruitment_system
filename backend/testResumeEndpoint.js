const express = require('express');
const db = require('./src/config/database');

// Create a test app
const app = express();

// Test resume details endpoint without auth
app.get('/test-resume-details/:id', async (req, res) => {
  try {
    const resumeId = req.params.id;
    console.log('🧪 Testing resume details without auth for ID:', resumeId);
    
    // Get resume info
    const resume = await db.query(
      'SELECT * FROM recruiter_resumes WHERE id = ?',
      [resumeId]
    );
    
    if (!resume || resume.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }
    
    const resumeInfo = resume[0];
    
    // Get ranking information
    const ranking = await db.query(
      'SELECT * FROM rankings WHERE candidate_id = ? ORDER BY ranked_at DESC LIMIT 1',
      [resumeId]
    );
    
    // Get feedback information
    const feedback = await db.query(
      'SELECT * FROM feedback WHERE candidate_id = ? ORDER BY generated_at DESC LIMIT 1',
      [resumeId]
    );
    
    // Construct candidate-like response
    const candidateData = {
      id: resumeInfo.id,
      first_name: resumeInfo.original_name.replace('.pdf', ''),
      last_name: '',
      email: 'resume-upload@system.com',
      role: 'candidate',
      phone: '',
      company_name: '',
      isResumeUpload: true,
      uploaded_at: resumeInfo.uploaded_at,
      file_size: resumeInfo.file_size,
      filename: resumeInfo.filename,
      original_name: resumeInfo.original_name,
      
      // Add ranking data if available
      ...(ranking.length > 0 && {
        total_score: ranking[0].total_score,
        rank_position: ranking[0].rank_position,
        skill_score: ranking[0].skill_score,
        education_score: ranking[0].education_score,
        experience_score: ranking[0].experience_score,
        score_breakdown: ranking[0].score_breakdown,
        ranked_at: ranking[0].ranked_at
      }),
      
      // Add feedback data if available
      ...(feedback.length > 0 && {
        strengths: feedback[0].strengths,
        missing_skills: feedback[0].missing_skills,
        suggestions: feedback[0].suggestions,
        overall_assessment: feedback[0].overall_assessment,
        feedback_created_at: feedback[0].generated_at
      }),
      
      // Empty arrays for compatibility
      applications: [],
      skills: [],
      education: [],
      experience: [],
      stats: {
        totalApplications: 0,
        pendingApplications: 0,
        rankedApplications: ranking.length > 0 ? 1 : 0,
        shortlistedApplications: 0,
        averageScore: ranking.length > 0 ? ranking[0].total_score : 0,
        highestRank: ranking.length > 0 ? ranking[0].rank_position : null,
        totalSkills: 0,
        uniqueSkills: 0
      },
      statusBreakdown: {},
      skillProficiency: {}
    };
    
    res.json({
      success: true,
      data: candidateData
    });
    
  } catch (error) {
    console.error('Error fetching resume details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume details'
    });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🧪 Test server running on port ${PORT}`);
  console.log(`Test URL: http://localhost:${PORT}/test-resume-details/164`);
});
