const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Trigger AI ranking for a job
router.post('/trigger', authenticateToken, authorizeRole('recruiter'), asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.body;
    const recruiterId = req.user.id;

    // Verify job belongs to recruiter
    const jobCheck = await db.query(
      'SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?',
      [jobId, recruiterId]
    );

    if (!jobCheck[0] || jobCheck[0].length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or access denied'
      });
    }

    console.log('🚀 Triggering AI ranking for job:', jobId);

    // Call AI service to start ranking
    try {
      const aiResponse = await axios.post('http://localhost:5001/api/rank-candidates', {
        job_id: jobId
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ AI ranking started:', aiResponse.data);

      res.json({
        success: true,
        message: 'AI ranking process started',
        data: aiResponse.data
      });

    } catch (aiError) {
      console.error('❌ Failed to trigger AI ranking:', aiError.message);
      res.status(500).json({
        success: false,
        message: 'Failed to start AI ranking process'
      });
    }

  } catch (error) {
    console.error('Error triggering ranking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger ranking'
    });
  }
}));

// Get ranking status for a job
router.get('/status/:jobId', authenticateToken, authorizeRole('recruiter'), asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.params;
    const recruiterId = req.user.id;

    // Verify job belongs to recruiter
    const jobCheck = await db.query(
      'SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?',
      [jobId, recruiterId]
    );

    if (!jobCheck[0] || jobCheck[0].length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or access denied'
      });
    }

    console.log('📊 Getting ranking status for job:', jobId);

    // Call AI service to get status
    try {
      const aiResponse = await axios.get(`http://localhost:5001/api/ranking-status/${jobId}`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Ranking status retrieved:', aiResponse.data);

      res.json({
        success: true,
        message: 'Ranking status retrieved successfully',
        data: aiResponse.data
      });

    } catch (aiError) {
      console.error('❌ Failed to get ranking status:', aiError.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get ranking status'
      });
    }

  } catch (error) {
    console.error('Error getting ranking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ranking status'
    });
  }
}));

// Get rankings for a specific job
router.get('/job/:jobId', authenticateToken, authorizeRole('recruiter'), asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.params;
    const recruiterId = req.user.id;

    // Verify job belongs to recruiter
    const jobCheck = await db.query(
      'SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?',
      [jobId, recruiterId]
    );

    if (!jobCheck[0] || jobCheck[0].length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or access denied'
      });
    }

    console.log('📊 Getting rankings for job:', jobId);

    // Get applications with rankings for this job
    const rankingsQuery = `
      SELECT 
        a.id as application_id,
        a.candidate_id,
        u.first_name,
        u.last_name,
        u.email,
        r.total_score,
        r.rank_position,
        r.skill_score,
        r.education_score,
        r.experience_score,
        r.score_breakdown,
        a.status as application_status,
        a.applied_at,
        f.strengths,
        f.missing_skills,
        f.suggestions,
        f.overall_assessment
      FROM applications a
      JOIN users u ON a.candidate_id = u.id
      LEFT JOIN rankings r ON a.id = r.application_id
      LEFT JOIN feedback f ON a.id = f.application_id
      WHERE a.job_id = ?
      ORDER BY r.total_score DESC, a.applied_at DESC
    `;

    const rankings = await db.query(rankingsQuery, [jobId]);

    console.log(`✅ Retrieved ${rankings.length} rankings for job ${jobId}`);

    res.json({
      success: true,
      message: 'Rankings retrieved successfully',
      data: rankings,
      count: rankings.length
    });

  } catch (error) {
    console.error('Error getting rankings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rankings'
    });
  }
}));

module.exports = router;
