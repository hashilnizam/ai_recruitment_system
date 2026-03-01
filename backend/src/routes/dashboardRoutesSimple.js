const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const db = require('../config/database');

const router = express.Router();

/**
 * Get recruiter dashboard data - Simplified version
 * GET /api/dashboard/recruiter
 */
router.get('/recruiter', 
  authenticateToken,
  authorizeRole('recruiter'),
  asyncHandler(async (req, res) => {
    const recruiterId = req.user.id;
    
    try {
      console.log('🔍 Simple Dashboard API called for recruiter ID:', recruiterId);
      
      // 1. Basic stats
      const totalJobsResult = await db.query(
        'SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ?',
        [recruiterId]
      );
      const totalJobs = totalJobsResult[0]?.count || 0;
      
      const activeJobsResult = await db.query(
        'SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ? AND status = ?',
        [recruiterId, 'published']
      );
      const activeJobs = activeJobsResult[0]?.count || 0;
      
      const totalApplicationsResult = await db.query(
        `SELECT COUNT(*) as count FROM applications a 
         JOIN jobs j ON a.job_id = j.id 
         WHERE j.recruiter_id = ?`,
        [recruiterId]
      );
      const totalApplications = totalApplicationsResult[0]?.count || 0;
      
      const pendingRankingsResult = await db.query(
        `SELECT COUNT(*) as count FROM applications a 
         JOIN jobs j ON a.job_id = j.id 
         WHERE j.recruiter_id = ? AND a.status = ?`,
        [recruiterId, 'pending']
      );
      const pendingRankings = pendingRankingsResult[0]?.count || 0;
      
      // 2. Recent jobs
      const recentJobsResult = await db.query(
        `SELECT j.id, j.title, j.status, j.created_at, j.location,
                COUNT(a.id) as application_count
         FROM jobs j 
         LEFT JOIN applications a ON j.id = a.job_id 
         WHERE j.recruiter_id = ? 
         GROUP BY j.id, j.title, j.status, j.created_at, j.location
         ORDER BY j.created_at DESC 
         LIMIT 5`,
        [recruiterId]
      );
      
      // 3. Last 7 days data (simplified)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 19).replace('T', ' ');
      
      const applications7DaysResult = await db.query(
        `SELECT COUNT(*) as count FROM applications a 
         JOIN jobs j ON a.job_id = j.id 
         WHERE j.recruiter_id = ? AND a.applied_at >= ?`,
        [recruiterId, sevenDaysAgoStr]
      );
      const applications7DaysTotal = applications7DaysResult[0]?.count || 0;
      
      const rankings7DaysResult = await db.query(
        `SELECT COUNT(*) as count FROM rankings r 
         JOIN applications a ON r.application_id = a.id 
         JOIN jobs j ON a.job_id = j.id 
         WHERE j.recruiter_id = ? AND r.ranked_at >= ?`,
        [recruiterId, sevenDaysAgoStr]
      );
      const rankings7DaysTotal = rankings7DaysResult[0]?.count || 0;
      
      // Create simple 7-day data
      const applications7Days = [];
      const rankings7Days = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        applications7Days.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: Math.floor(Math.random() * 3) // Mock data for now
        });
        rankings7Days.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: Math.floor(Math.random() * 2) // Mock data for now
        });
      }
      
      console.log('✅ Simple dashboard data calculated successfully');
      
      res.json({
        success: true,
        data: {
          summary: {
            totalJobs,
            activeJobs,
            totalApplications,
            pendingRankings,
            changes: {
              jobsChange: 0,
              applicationsChange: 0,
              pendingChange: 0
            }
          },
          recentJobs: recentJobsResult.map(job => ({
            ...job,
            application_count: job.application_count || 0
          })),
          applications7Days: {
            data: applications7Days,
            total: applications7DaysTotal,
            average: parseFloat((applications7DaysTotal / 7).toFixed(1))
          },
          rankings7Days: {
            data: rankings7Days,
            total: rankings7DaysTotal,
            average: parseFloat((rankings7DaysTotal / 7).toFixed(1))
          }
        }
      });
    } catch (error) {
      console.error('❌ Simple Dashboard API error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data'
      });
    }
  })
);

module.exports = router;
