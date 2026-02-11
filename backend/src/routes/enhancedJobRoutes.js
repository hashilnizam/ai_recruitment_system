const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const RecommendationEngine = require('../services/recommendationEngine');
const AdvancedScoringAlgorithm = require('../services/scoringAlgorithm');

// Initialize recommendation engine
const recommendationEngine = new RecommendationEngine();
const scoringAlgorithm = new AdvancedScoringAlgorithm();

// Get personalized job recommendations for candidate
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const candidateId = req.user.id;
    
    console.log('🎯 Generating job recommendations for candidate:', candidateId);
    
    // Get candidate profile
    const candidate = await db.query(
      `SELECT u.*, GROUP_CONCAT(DISTINCT s.skill_name) as skills,
              COUNT(DISTINCT e.job_title) as experience_count
       FROM users u
       LEFT JOIN applications a ON u.id = a.candidate_id
       LEFT JOIN skills s ON a.id = s.application_id
       LEFT JOIN experience e ON a.id = e.application_id
       WHERE u.id = ?
       GROUP BY u.id`,
      [candidateId]
    );
    
    if (candidate.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found'
      });
    }
    
    const candidateProfile = candidate[0];
    
    // Get candidate's resume data from latest application
    const latestApplication = await db.query(
      `SELECT resume_data FROM applications 
       WHERE candidate_id = ? 
       ORDER BY applied_at DESC 
       LIMIT 1`,
      [candidateId]
    );
    
    if (latestApplication.length > 0 && latestApplication[0].resume_data) {
      candidateProfile.resumeData = JSON.parse(latestApplication[0].resume_data);
    }
    
    // Get all available jobs
    const jobs = await db.query(
      `SELECT j.*, u.first_name as recruiter_first_name, u.last_name as recruiter_last_name, 
              u.company_name, u.email as recruiter_email,
              (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as application_count
       FROM jobs j
       JOIN users u ON j.recruiter_id = u.id
       WHERE j.status = 'published'
       ORDER BY j.created_at DESC`
    );
    
    // Check which jobs candidate has already applied to
    const applications = await db.query(
      'SELECT job_id FROM applications WHERE candidate_id = ?',
      [candidateId]
    );
    
    const appliedJobIds = applications.map(app => app.job_id);
    
    // Mark jobs with application status
    const availableJobs = jobs.map(job => ({
      ...job,
      applicationStatus: appliedJobIds.includes(job.id) ? 'applied' : null
    }));
    
    // Get user preferences (if any)
    const userPreferences = await db.query(
      'SELECT preferences FROM user_preferences WHERE user_id = ?',
      [candidateId]
    );
    
    const preferences = userPreferences.length > 0 ? 
      JSON.parse(userPreferences[0].preferences) : {};
    
    // Generate recommendations
    const recommendations = await recommendationEngine.generateRecommendations(
      candidateProfile,
      availableJobs,
      preferences
    );
    
    console.log('✅ Generated', recommendations.relevantMatches, 'recommendations');
    
    res.json({
      success: true,
      data: recommendations
    });
    
  } catch (error) {
    console.error('❌ Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations'
    });
  }
});

// Get job insights and analytics
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log('📊 Generating job insights for user:', userId, 'role:', userRole);
    
    let insights = {};
    
    if (userRole === 'candidate') {
      // Candidate insights
      insights = await generateCandidateInsights(userId);
    } else if (userRole === 'recruiter') {
      // Recruiter insights
      insights = await generateRecruiterInsights(userId);
    }
    
    res.json({
      success: true,
      data: insights
    });
    
  } catch (error) {
    console.error('❌ Error generating insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights'
    });
  }
});

// Get skill trends and market analysis
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    console.log('📈 Generating skill trends analysis');
    
    const trends = await generateSkillTrends();
    
    res.json({
      success: true,
      data: trends
    });
    
  } catch (error) {
    console.error('❌ Error generating trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate trends'
    });
  }
});

// Helper functions
async function generateCandidateInsights(candidateId) {
  const insights = {
    profileStrength: 0,
    skillGaps: [],
    recommendedSkills: [],
    marketPosition: '',
    applicationStats: {},
    salaryInsights: {},
    careerAdvice: []
  };
  
  try {
    // Get candidate's applications and scores
    const applications = await db.query(
      `SELECT a.*, j.title as job_title, j.salary_range, j.required_skills,
              r.total_score, r.rank_position, r.score_breakdown
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       LEFT JOIN rankings r ON a.id = r.application_id
       WHERE a.candidate_id = ?
       ORDER BY a.applied_at DESC`,
      [candidateId]
    );
    
    insights.applicationStats = {
      totalApplications: applications.length,
      averageScore: applications.length > 0 ? 
        applications.reduce((sum, app) => sum + (app.total_score || 0), 0) / applications.length : 0,
      interviewRate: 0, // Would be calculated from application status updates
      offerRate: 0
    };
    
    // Analyze skills from applications
    const allSkills = new Set();
    applications.forEach(app => {
      if (app.required_skills) {
        try {
          const skills = JSON.parse(app.required_skills);
          skills.forEach(skill => allSkills.add(skill));
        } catch (error) {
          console.error('Error parsing skills:', error);
        }
      }
    });
    
    insights.profileStrength = Math.min(insights.applicationStats.averageScore, 100);
    
    // Generate career advice based on performance
    if (insights.applicationStats.averageScore >= 80) {
      insights.careerAdvice.push('Your profile is strong. Consider applying for senior positions.');
    } else if (insights.applicationStats.averageScore >= 60) {
      insights.careerAdvice.push('Good progress! Focus on developing key skills for your target roles.');
    } else {
      insights.careerAdvice.push('Consider gaining more experience or additional certifications.');
    }
    
    return insights;
  } catch (error) {
    console.error('Error generating candidate insights:', error);
    return insights;
  }
}

async function generateRecruiterInsights(recruiterId) {
  const insights = {
    postedJobs: 0,
    totalApplications: 0,
    averageApplicationScore: 0,
    topPerformingJobs: [],
    skillDemand: {},
    hiringFunnel: {},
    recommendations: []
  };
  
  try {
    // Get recruiter's jobs
    const jobs = await db.query(
      `SELECT j.*, COUNT(a.id) as application_count,
              AVG(r.total_score) as avg_score
       FROM jobs j
       LEFT JOIN applications a ON j.id = a.job_id
       LEFT JOIN rankings r ON a.id = r.application_id
       WHERE j.recruiter_id = ?
       GROUP BY j.id
       ORDER BY j.created_at DESC`,
      [recruiterId]
    );
    
    insights.postedJobs = jobs.length;
    insights.totalApplications = jobs.reduce((sum, job) => sum + job.application_count, 0);
    insights.averageApplicationScore = jobs.length > 0 ? 
      jobs.reduce((sum, job) => sum + (job.avg_score || 0), 0) / jobs.length : 0;
    
    // Top performing jobs
    insights.topPerformingJobs = jobs
      .filter(job => job.application_count > 0)
      .sort((a, b) => b.avg_score - a.avg_score)
      .slice(0, 5)
      .map(job => ({
        id: job.id,
        title: job.title,
        applicationCount: job.application_count,
        averageScore: Math.round(job.avg_score || 0)
      }));
    
    // Generate recommendations
    if (insights.averageApplicationScore < 60) {
      insights.recommendations.push('Consider adjusting job requirements to attract more qualified candidates.');
    }
    
    if (insights.totalApplications < insights.postedJobs * 5) {
      insights.recommendations.push('Your job postings may need better visibility or more attractive descriptions.');
    }
    
    return insights;
  } catch (error) {
    console.error('Error generating recruiter insights:', error);
    return insights;
  }
}

async function generateSkillTrends() {
  const trends = {
    topSkills: [],
    growingSkills: [],
    decliningSkills: [],
    industryTrends: {},
    salaryTrends: {},
    demandByLocation: {}
  };
  
  try {
    // Get skill frequency from recent applications
    const skillFrequency = await db.query(
      `SELECT s.skill_name, COUNT(*) as frequency,
              AVG(r.total_score) as avg_score
       FROM skills s
       JOIN applications a ON s.application_id = a.id
       LEFT JOIN rankings r ON a.id = r.application_id
       WHERE a.applied_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY s.skill_name
       ORDER BY frequency DESC
       LIMIT 20`
    );
    
    trends.topSkills = skillFrequency.map(skill => ({
      name: skill.skill_name,
      frequency: skill.frequency,
      averageScore: Math.round(skill.avg_score || 0)
    }));
    
    // Get salary trends by skill
    const salaryBySkill = await db.query(
      `SELECT s.skill_name, AVG(j.salary_range) as avg_salary
       FROM skills s
       JOIN applications a ON s.application_id = a.id
       JOIN jobs j ON a.job_id = j.id
       WHERE j.salary_range IS NOT NULL
         AND a.applied_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY s.skill_name
       ORDER BY avg_salary DESC
       LIMIT 10`
    );
    
    trends.salaryTrends = salaryBySkill.map(skill => ({
      skill: skill.skill_name,
      averageSalary: skill.avg_salary
    }));
    
    return trends;
  } catch (error) {
    console.error('Error generating skill trends:', error);
    return trends;
  }
}

module.exports = router;
