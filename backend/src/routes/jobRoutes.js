const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const requireRecruiter = authorizeRole('recruiter');

// Get all jobs for the logged-in recruiter
router.get('/', authenticateToken, requireRecruiter, async (req, res) => {
  try {
    const recruiterId = req.user.id;
    
    // Get jobs posted by this recruiter
    const [jobs] = await db.execute(
      `SELECT j.*, 
              COUNT(a.id) as application_count,
              COUNT(CASE WHEN r.total_score IS NOT NULL THEN 1 END) as ranked_count
       FROM jobs j 
       LEFT JOIN applications a ON j.id = a.job_id 
       LEFT JOIN rankings r ON a.id = r.application_id
       WHERE j.recruiter_id = ? 
       GROUP BY j.id 
       ORDER BY j.created_at DESC`,
      [recruiterId]
    );

    res.json({
      success: true,
      data: jobs,
      count: jobs.length
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs'
    });
  }
});

// Create a new job
router.post('/', authenticateToken, requireRecruiter, async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const {
      title,
      description,
      requirements,
      location,
      job_type,
      salary_min,
      salary_max,
      experience_level,
      skills
    } = req.body;

    // Validate required fields
    if (!title || !description || !requirements) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and requirements are required'
      });
    }

    // Prepare JSON fields for database
    const requiredSkills = Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []);
    const requiredEducation = [];
    const requiredExperience = { min_years: experience_level === 'entry' ? 0 : experience_level === 'mid' ? 3 : experience_level === 'senior' ? 5 : 8 };

    const [result] = await db.execute(
      `INSERT INTO jobs (
        title, description, required_skills, required_education, required_experience,
        recruiter_id, status, location, employment_type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, NOW(), NOW())`,
      [
        title, description, 
        JSON.stringify(requiredSkills), 
        JSON.stringify(requiredEducation), 
        JSON.stringify(requiredExperience),
        recruiterId, location, job_type
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: {
        id: result.insertId,
        title,
        status: 'draft'
      }
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job'
    });
  }
});

// Get job by ID
router.get('/:id', authenticateToken, requireRecruiter, async (req, res) => {
  try {
    const jobId = req.params.id;
    const recruiterId = req.user.id;

    const [jobs] = await db.execute(
      'SELECT * FROM jobs WHERE id = ? AND recruiter_id = ?',
      [jobId, recruiterId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Get applications for this job
    const [applications] = await db.execute(
      `SELECT a.*, u.first_name, u.last_name, u.email
       FROM applications a
       JOIN users u ON a.candidate_id = u.id
       WHERE a.job_id = ?
       ORDER BY a.ai_score DESC, a.created_at DESC`,
      [jobId]
    );

    const job = jobs[0];
    job.applications = applications;

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job'
    });
  }
});

// Update job
router.put('/:id', authenticateToken, requireRecruiter, async (req, res) => {
  try {
    const jobId = req.params.id;
    const recruiterId = req.user.id;
    const {
      title,
      description,
      requirements,
      location,
      job_type,
      salary_min,
      salary_max,
      experience_level,
      skills,
      status
    } = req.body;

    // Check if job belongs to this recruiter
    const [jobs] = await db.execute(
      'SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?',
      [jobId, recruiterId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    await db.execute(
      `UPDATE jobs SET 
        title = ?, description = ?, requirements = ?, location = ?,
        job_type = ?, salary_min = ?, salary_max = ?, experience_level = ?,
        skills = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        title, description, requirements, location, job_type,
        salary_min, salary_max, experience_level,
        Array.isArray(skills) ? skills.join(',') : skills,
        status, jobId
      ]
    );

    res.json({
      success: true,
      message: 'Job updated successfully'
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job'
    });
  }
});

// Delete job
router.delete('/:id', authenticateToken, requireRecruiter, async (req, res) => {
  try {
    const jobId = req.params.id;
    const recruiterId = req.user.id;

    // Check if job belongs to this recruiter
    const [jobs] = await db.execute(
      'SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?',
      [jobId, recruiterId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Delete applications first
    await db.execute('DELETE FROM applications WHERE job_id = ?', [jobId]);
    
    // Delete job
    await db.execute('DELETE FROM jobs WHERE id = ?', [jobId]);

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job'
    });
  }
});

// Publish job
router.post('/:id/publish', authenticateToken, requireRecruiter, async (req, res) => {
  try {
    const jobId = req.params.id;
    const recruiterId = req.user.id;

    // Check if job belongs to this recruiter
    const [jobs] = await db.execute(
      'SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?',
      [jobId, recruiterId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    await db.execute(
      'UPDATE jobs SET status = ?, published_at = NOW(), updated_at = NOW() WHERE id = ?',
      ['published', jobId]
    );

    res.json({
      success: true,
      message: 'Job published successfully'
    });
  } catch (error) {
    console.error('Error publishing job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish job'
    });
  }
});

// Get dashboard stats
router.get('/stats/dashboard', authenticateToken, requireRecruiter, async (req, res) => {
  try {
    const recruiterId = req.user.id;

    // Get total jobs
    const [totalJobs] = await db.execute(
      'SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ?',
      [recruiterId]
    );

    // Get active jobs
    const [activeJobs] = await db.execute(
      'SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ? AND status = ?',
      [recruiterId, 'published']
    );

    // Get total applications
    const [totalApplications] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM applications a 
       JOIN jobs j ON a.job_id = j.id 
       WHERE j.recruiter_id = ?`,
      [recruiterId]
    );

    // Get pending rankings (applications without AI score)
    const [pendingRankings] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM applications a 
       JOIN jobs j ON a.job_id = j.id 
       WHERE j.recruiter_id = ? AND NOT EXISTS (
         SELECT 1 FROM rankings r WHERE r.application_id = a.id
       )`,
      [recruiterId]
    );

    res.json({
      success: true,
      data: {
        totalJobs: totalJobs[0].count,
        activeJobs: activeJobs[0].count,
        totalApplications: totalApplications[0].count,
        pendingRankings: pendingRankings[0].count
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
});

module.exports = router;
