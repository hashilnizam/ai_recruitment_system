const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const db = require('../config/database');

const router = express.Router();

/**
 * Get recruiter dashboard data
 * GET /api/dashboard/recruiter
 */
router.get('/recruiter', 
  authenticateToken,
  authorizeRole('recruiter'),
  asyncHandler(async (req, res) => {
    const recruiterId = req.user.id;
    
    try {
      console.log('🔍 Dashboard API called for recruiter ID:', recruiterId);
      
      // Get current date and previous month dates
      const currentDate = new Date();
      const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
      
      // Get last 7 days for graphs
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Convert dates to SQL format
      const currentMonthStartStr = currentMonthStart.toISOString().slice(0, 19).replace('T', ' ');
      const previousMonthStartStr = previousMonthStart.toISOString().slice(0, 19).replace('T', ' ');
      const previousMonthEndStr = previousMonthEnd.toISOString().slice(0, 19).replace('T', ' ');
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 19).replace('T', ' ');
      
      console.log('📅 Date ranges:', {
        currentMonthStart: currentMonthStartStr,
        previousMonthStart: previousMonthStartStr,
        previousMonthEnd: previousMonthEndStr,
        sevenDaysAgo: sevenDaysAgoStr
      });
      
      // 1. Top Summary Cards
      // Total Jobs Posted
      const totalJobsResult = await db.query(
        'SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ?',
        [recruiterId]
      );
      const totalJobs = totalJobsResult[0]?.count || 0;
      
      // Active Jobs
      const activeJobsResult = await db.query(
        'SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ? AND status = ?',
        [recruiterId, 'published']
      );
      const activeJobs = activeJobsResult[0]?.count || 0;
      
      // Total Applications
      const totalApplicationsResult = await db.query(
        `SELECT COUNT(*) as count FROM applications a 
         JOIN jobs j ON a.job_id = j.id 
         WHERE j.recruiter_id = ?`,
        [recruiterId]
      );
      const totalApplications = totalApplicationsResult[0]?.count || 0;
      
      // Pending Rankings
      const pendingRankingsResult = await db.query(
        `SELECT COUNT(*) as count FROM applications a 
         JOIN jobs j ON a.job_id = j.id 
         WHERE j.recruiter_id = ? AND a.status = ?`,
        [recruiterId, 'pending']
      );
      const pendingRankings = pendingRankingsResult[0]?.count || 0;
      
      // Calculate percentage changes (current month vs previous month)
      // Current month jobs
      const currentMonthJobsResult = await db.query(
        'SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ? AND created_at >= ?',
        [recruiterId, currentMonthStartStr]
      );
      const currentMonthJobs = currentMonthJobsResult[0]?.count || 0;
      
      // Previous month jobs
      const previousMonthJobsResult = await db.query(
        'SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ? AND created_at >= ? AND created_at <= ?',
        [recruiterId, previousMonthStartStr, previousMonthEndStr]
      );
      const previousMonthJobs = previousMonthJobsResult[0]?.count || 0;
      
      // Current month active jobs
      const currentMonthActiveJobsResult = await db.query(
        'SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ? AND status = ? AND created_at >= ?',
        [recruiterId, 'published', currentMonthStartStr]
      );
      const currentMonthActiveJobs = currentMonthActiveJobsResult[0]?.count || 0;
      
      // Previous month active jobs
      const previousMonthActiveJobsResult = await db.query(
        'SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ? AND status = ? AND created_at >= ? AND created_at <= ?',
        [recruiterId, 'published', previousMonthStartStr, previousMonthEndStr]
      );
      const previousMonthActiveJobs = previousMonthActiveJobsResult[0]?.count || 0;
      
      // Current month applications
      const currentMonthApplicationsResult = await db.query(
        `SELECT COUNT(*) as count FROM applications a 
         JOIN jobs j ON a.job_id = j.id 
         WHERE j.recruiter_id = ? AND a.applied_at >= ?`,
        [recruiterId, currentMonthStartStr]
      );
      const currentMonthApplications = currentMonthApplicationsResult[0]?.count || 0;
      
      // Previous month applications
      const previousMonthApplicationsResult = await db.query(
        `SELECT COUNT(*) as count FROM applications a 
         JOIN jobs j ON a.job_id = j.id 
         WHERE j.recruiter_id = ? AND a.applied_at >= ? AND a.applied_at <= ?`,
        [recruiterId, previousMonthStartStr, previousMonthEndStr]
      );
      const previousMonthApplications = previousMonthApplicationsResult[0]?.count || 0;
      
      // Calculate percentage changes
      const jobsChange = previousMonthJobs > 0 
        ? ((currentMonthJobs - previousMonthJobs) / previousMonthJobs * 100).toFixed(1)
        : (currentMonthJobs > 0 ? '100.0' : '0.0');
      
      const activeJobsChange = previousMonthActiveJobs > 0
        ? ((currentMonthActiveJobs - previousMonthActiveJobs) / previousMonthActiveJobs * 100).toFixed(1)
        : (currentMonthActiveJobs > 0 ? '100.0' : '0.0');
      
      const applicationsChange = previousMonthApplications > 0
        ? ((currentMonthApplications - previousMonthApplications) / previousMonthApplications * 100).toFixed(1)
        : (currentMonthApplications > 0 ? '100.0' : '0.0');
      
      // For pending rankings, compare with previous week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekAgoStr = oneWeekAgo.toISOString().slice(0, 19).replace('T', ' ');
      
      const currentPendingResult = await db.query(
        `SELECT COUNT(*) as count FROM applications a 
         JOIN jobs j ON a.job_id = j.id 
         WHERE j.recruiter_id = ? AND a.status = ?`,
        [recruiterId, 'pending']
      );
      const currentPending = currentPendingResult[0]?.count || 0;
      
      const previousPendingResult = await db.query(
        `SELECT COUNT(*) as count FROM applications a 
         JOIN jobs j ON a.job_id = j.id 
         WHERE j.recruiter_id = ? AND a.status = ? AND a.applied_at < ?`,
        [recruiterId, 'pending', oneWeekAgoStr]
      );
      console.log('🔍 Previous pending query result:', previousPendingResult);
      const previousPending = previousPendingResult[0]?.count || 0;
      
      const pendingChange = previousPending > 0
        ? ((currentPending - previousPending) / previousPending * 100).toFixed(1)
        : (currentPending > 0 ? '100.0' : '0.0');
      
      // 2. Recent Job Postings
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
      
      // 3. Applications Received (Last 7 Days)
      const applications7DaysResult = await db.query(
        `SELECT DATE(a.applied_at) as date, COUNT(*) as count
         FROM applications a 
         JOIN jobs j ON a.job_id = j.id 
         WHERE j.recruiter_id = ? AND a.applied_at >= ?
         GROUP BY DATE(a.applied_at)
         ORDER BY date ASC`,
        [recruiterId, sevenDaysAgoStr]
      );
      
      // Fill missing dates with 0
      const applications7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayData = applications7DaysResult.find(d => d.date.toISOString().split('T')[0] === dateStr);
        applications7Days.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: dayData ? dayData.count : 0
        });
      }
      
      const totalApplications7Days = applications7Days.reduce((sum, day) => sum + day.count, 0);
      const avgApplications7Days = (totalApplications7Days / 7).toFixed(1);
      
      // 4. AI Rankings Completed (Last 7 Days)
      const rankings7DaysResult = await db.query(
        `SELECT DATE(r.ranked_at) as date, COUNT(*) as count
         FROM rankings r 
         JOIN applications a ON r.application_id = a.id 
         JOIN jobs j ON a.job_id = j.id 
         WHERE j.recruiter_id = ? AND r.ranked_at >= ?
         GROUP BY DATE(r.ranked_at)
         ORDER BY date ASC`,
        [recruiterId, sevenDaysAgoStr]
      );
      
      // Fill missing dates with 0
      const rankings7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayData = rankings7DaysResult.find(d => d.date.toISOString().split('T')[0] === dateStr);
        rankings7Days.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: dayData ? dayData.count : 0
        });
      }
      
      const totalRankings7Days = rankings7Days.reduce((sum, day) => sum + day.count, 0);
      const avgRankings7Days = (totalRankings7Days / 7).toFixed(1);
      
      res.json({
        success: true,
        data: {
          summary: {
            totalJobs,
            activeJobs,
            totalApplications,
            pendingRankings,
            changes: {
              jobsChange: parseFloat(jobsChange),
              activeJobsChange: parseFloat(activeJobsChange),
              applicationsChange: parseFloat(applicationsChange),
              pendingChange: parseFloat(pendingChange)
            }
          },
          recentJobs: recentJobsResult.map(job => ({
            ...job,
            application_count: job.application_count || 0
          })),
          applications7Days: {
            data: applications7Days,
            total: totalApplications7Days,
            average: parseFloat(avgApplications7Days)
          },
          rankings7Days: {
            data: rankings7Days,
            total: totalRankings7Days,
            average: parseFloat(avgRankings7Days)
          }
        }
      });
    } catch (error) {
      console.error('Dashboard API error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data'
      });
    }
  })
);

module.exports = router;
