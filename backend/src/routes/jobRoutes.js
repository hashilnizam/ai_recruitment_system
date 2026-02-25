const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const requireRecruiter = authorizeRole('recruiter');

// Get all jobs (public endpoint for candidates, recruiter-specific for recruiters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    console.log('Fetching jobs for user:', user.id, user.role);
    
    if (user.role === 'recruiter') {
      // Recruiters see their own jobs
      const recruiterId = user.id;
      const jobs = await db.query(
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

      console.log('Jobs query result:', jobs);
      console.log('Jobs length:', jobs.length);

      res.json({
        success: true,
        data: jobs,
        count: jobs.length
      });
    } else if (user.role === 'candidate') {
      // Candidates see only published jobs
      const jobs = await db.query(
        `SELECT j.*, 
                u.first_name as recruiter_first_name,
                u.last_name as recruiter_last_name,
                u.company_name,
                COUNT(a.id) as application_count
         FROM jobs j 
         LEFT JOIN users u ON j.recruiter_id = u.id
         LEFT JOIN applications a ON j.id = a.job_id 
         WHERE j.status = 'published'
         GROUP BY j.id 
         ORDER BY j.created_at DESC`
      );

      console.log('Published jobs for candidate:', jobs);

      res.json({
        success: true,
        data: jobs,
        count: jobs.length
      });
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
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

    const result = await db.query(
      `INSERT INTO jobs (
        title, description, required_skills, required_education, required_experience,
        recruiter_id, status, location, employment_type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        title,
        description,
        JSON.stringify(requiredSkills),
        JSON.stringify(requiredEducation),
        JSON.stringify(requiredExperience),
        recruiterId,
        'draft',
        location,
        job_type
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

// Get personalized job recommendations for candidate
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const candidateId = req.user.id;
    
    console.log('🎯 Generating job recommendations for candidate:', candidateId);
    
    // Get candidate basic profile
    const candidate = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [candidateId]
    );
    
    if (candidate.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found'
      });
    }
    
    const candidateProfile = candidate[0];
    
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
    
    res.json({
      success: true,
      data: {
        relevantMatches: availableJobs.length,
        jobs: availableJobs
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations'
    });
  }
});

// Get job by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const jobId = req.params.id;
    const user = req.user;
    console.log('🔍 Fetching job details for job:', jobId, 'user:', user.id, 'role:', user.role);

    let job;
    
    if (user.role === 'recruiter') {
      // Recruiters can only see their own jobs
      const jobs = await db.query(
        'SELECT * FROM jobs WHERE id = ? AND recruiter_id = ?',
        [jobId, user.id]
      );
      job = jobs[0];
    } else if (user.role === 'candidate') {
      // Candidates can see any published job
      const jobs = await db.query(
        'SELECT * FROM jobs WHERE id = ? AND status = ?',
        [jobId, 'published']
      );
      job = jobs[0];
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Get applications for this job (only for recruiters)
    let applications = [];
    if (user.role === 'recruiter') {
      applications = await db.query(
        `SELECT a.*, u.first_name, u.last_name, u.email
         FROM applications a
         JOIN users u ON a.candidate_id = u.id
         WHERE a.job_id = ?
         ORDER BY a.applied_at DESC`,
        [jobId]
      );
    }

    // Add applications to job object
    job.applications = applications;

    console.log('✅ Job details fetched successfully:', job.id, job.title);

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
    const jobs = await db.query(
      'SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?',
      [jobId, recruiterId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    await db.query(
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

// Get applications for a specific job
router.get('/:id/applications', authenticateToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const userId = req.user.id;

    // Verify job belongs to recruiter
    const jobCheck = await db.query(
      'SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?',
      [jobId, userId]
    );

    if (!jobCheck[0] || jobCheck[0].length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or access denied'
      });
    }

    // Get applications with candidate details and rankings
    const applications = await db.query(
      `SELECT a.*, 
              u.first_name, u.last_name, u.email,
              r.total_score, r.rank_position,
              r.ai_analysis, r.skill_match,
              a.status as application_status
       FROM applications a
       JOIN users u ON a.candidate_id = u.id
       LEFT JOIN rankings r ON a.id = r.application_id
       WHERE a.job_id = ?
       ORDER BY a.applied_at DESC`,
      [jobId]
    );

    res.json({
      success: true,
      data: applications
    });

  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
});

// Publish job
router.post('/:id/publish', authenticateToken, requireRecruiter, async (req, res) => {
  try {
    const jobId = req.params.id;
    const recruiterId = req.user.id;

    // Check if job belongs to this recruiter
    const jobs = await db.query(
      'SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?',
      [jobId, recruiterId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    await db.query(
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
    console.log('Fetching dashboard stats for recruiter:', recruiterId);

    // Get total jobs
    const totalJobs = await db.query(
      'SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ?',
      [recruiterId]
    );
    console.log('Total jobs result:', totalJobs);

    // Get active jobs
    const activeJobs = await db.query(
      'SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ? AND status = ?',
      [recruiterId, 'published']
    );
    console.log('Active jobs result:', activeJobs);

    // Get total applications
    const totalApplications = await db.query(
      `SELECT COUNT(*) as count 
       FROM applications a 
       JOIN jobs j ON a.job_id = j.id 
       WHERE j.recruiter_id = ?`,
      [recruiterId]
    );
    console.log('Total applications result:', totalApplications);

    // Get pending rankings (applications without AI score)
    const pendingRankings = await db.query(
      `SELECT COUNT(*) as count 
       FROM applications a 
       JOIN jobs j ON a.job_id = j.id 
       WHERE j.recruiter_id = ? AND NOT EXISTS (
         SELECT 1 FROM rankings r WHERE r.application_id = a.id
       )`,
      [recruiterId]
    );
    console.log('Pending rankings result:', pendingRankings);

    res.json({
      success: true,
      data: {
        totalJobs: totalJobs[0]?.count || 0,
        activeJobs: activeJobs[0]?.count || 0,
        totalApplications: totalApplications[0]?.count || 0,
        pendingRankings: pendingRankings[0]?.count || 0
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
