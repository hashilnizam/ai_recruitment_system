const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get candidate profile details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const candidateId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check access permissions
    let accessCheck = '';
    if (userRole === 'candidate') {
      accessCheck = 'AND u.id = ?';
    } else if (userRole === 'recruiter') {
      // Recruiters can view candidates who have applied to their jobs
      accessCheck = 'AND EXISTS (SELECT 1 FROM applications a JOIN jobs j ON a.job_id = j.id WHERE a.candidate_id = u.id AND j.recruiter_id = ?)';
    }

    const candidates = await db.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.company_name, u.phone, u.created_at
       FROM users u
       WHERE u.id = ? AND u.role = 'candidate' ${accessCheck}`,
      [candidateId, userId]
    );

    if (candidates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found or access denied'
      });
    }

    const candidate = candidates[0];

    // Get candidate's applications
    const applications = await db.query(
      `SELECT a.id, a.status, a.applied_at, a.updated_at,
              j.title as job_title, j.location, j.employment_type,
              r.total_score, r.rank_position, r.skill_score, r.education_score, r.experience_score,
              f.strengths, f.missing_skills, f.suggestions
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       LEFT JOIN rankings r ON a.id = r.application_id
       LEFT JOIN feedback f ON a.id = f.application_id
       WHERE a.candidate_id = ?
       ORDER BY a.applied_at DESC`,
      [candidateId]
    );

    // Get all skills across applications
    const skills = await db.query(
      `SELECT DISTINCT s.skill_name, s.proficiency_level, COUNT(*) as usage_count
       FROM skills s
       JOIN applications a ON s.application_id = a.id
       WHERE a.candidate_id = ?
       GROUP BY s.skill_name, s.proficiency_level
       ORDER BY usage_count DESC, skill_name`,
      [candidateId]
    );

    // Get education history
    const education = await db.query(
      `SELECT e.degree, e.field_of_study, e.institution, e.graduation_year, e.gpa
       FROM education e
       JOIN applications a ON e.application_id = a.id
       WHERE a.candidate_id = ?
       GROUP BY e.degree, e.field_of_study, e.institution, e.graduation_year, e.gpa
       ORDER BY e.graduation_year DESC`,
      [candidateId]
    );

    // Get work experience
    const experience = await db.query(
      `SELECT e.job_title, e.company, e.duration_months, e.description
       FROM experience e
       JOIN applications a ON e.application_id = a.id
       WHERE a.candidate_id = ?
       GROUP BY e.job_title, e.company, e.duration_months, e.description
       ORDER BY e.duration_months DESC`,
      [candidateId]
    );

    // Calculate statistics
    const stats = {
      totalApplications: applications.length,
      pendingApplications: applications.filter(a => a.status === 'pending').length,
      rankedApplications: applications.filter(a => a.status === 'ranked').length,
      shortlistedApplications: applications.filter(a => a.status === 'shortlisted').length,
      averageScore: applications.reduce((sum, a) => sum + (a.total_score || 0), 0) / applications.filter(a => a.total_score).length || 0,
      highestRank: Math.min(...applications.filter(a => a.rank_position).map(a => a.rank_position)) || null,
      totalSkills: skills.length,
      uniqueSkills: [...new Set(skills.map(s => s.skill_name))].length
    };

    // Get application status breakdown
    const statusBreakdown = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    // Get skill proficiency distribution
    const skillProficiency = skills.reduce((acc, skill) => {
      acc[skill.proficiency_level] = (acc[skill.proficiency_level] || 0) + 1;
      return acc;
    }, {});

    candidate.applications = applications;
    candidate.skills = skills;
    candidate.education = education;
    candidate.experience = experience;
    candidate.stats = stats;
    candidate.statusBreakdown = statusBreakdown;
    candidate.skillProficiency = skillProficiency;

    res.json({
      success: true,
      data: candidate
    });

  } catch (error) {
    console.error('Error fetching candidate profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch candidate profile'
    });
  }
});

// Update candidate profile
router.put('/profile', authenticateToken, authorizeRole('candidate'), async (req, res) => {
  try {
    const candidateId = req.user.id;
    const { first_name, last_name, phone, bio } = req.body;

    await db.query(
      `UPDATE users SET 
        first_name = ?, last_name = ?, phone = ?, updated_at = NOW()
       WHERE id = ?`,
      [first_name, last_name, phone, candidateId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Get candidate's job recommendations
router.get('/recommendations/jobs', authenticateToken, authorizeRole('candidate'), async (req, res) => {
  try {
    const candidateId = req.user.id;

    // Get candidate's skills from previous applications
    const candidateSkills = await db.query(
      `SELECT DISTINCT s.skill_name, s.proficiency_level
       FROM skills s
       JOIN applications a ON s.application_id = a.id
       WHERE a.candidate_id = ?`,
      [candidateId]
    );

    // Get published jobs that candidate hasn't applied to
    const availableJobs = await db.query(
      `SELECT j.*, 
              (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as application_count
       FROM jobs j
       WHERE j.status = 'published' 
       AND j.id NOT IN (
         SELECT a.job_id FROM applications a WHERE a.candidate_id = ?
       )
       ORDER BY j.created_at DESC
       LIMIT 10`,
      [candidateId]
    );

    // Calculate match scores based on skills
    const jobsWithScores = availableJobs.map(job => {
      const jobSkills = JSON.parse(job.required_skills || '[]');
      const candidateSkillNames = candidateSkills.map(s => s.skill_name.toLowerCase());
      
      const matchingSkills = jobSkills.filter(skill => 
        candidateSkillNames.includes(skill.toLowerCase())
      );

      const matchScore = jobSkills.length > 0 
        ? (matchingSkills.length / jobSkills.length) * 100 
        : 0;

      return {
        ...job,
        matchScore: Math.round(matchScore),
        matchingSkills,
        totalRequiredSkills: jobSkills.length
      };
    });

    // Sort by match score
    jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      data: jobsWithScores
    });

  } catch (error) {
    console.error('Error fetching job recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job recommendations'
    });
  }
});

module.exports = router;
