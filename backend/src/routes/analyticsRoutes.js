const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const db = require('../config/database');

// Get recruiter analytics dashboard data
router.get('/recruiter', authenticateToken, authorizeRole('recruiter'), asyncHandler(async (req, res) => {
  try {
    const recruiterId = req.user.id;
    
    console.log(`📊 Fetching analytics for recruiter ${recruiterId}`);
    
    // 1. Top Summary Cards
    const totalJobs = await db.query(
      'SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ?',
      [recruiterId]
    );
    
    const activeJobs = await db.query(
      'SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ? AND status = ?',
      [recruiterId, 'published']
    );
    
    const totalApplications = await db.query(
      `SELECT COUNT(*) as count 
       FROM applications a 
       JOIN jobs j ON a.job_id = j.id 
       WHERE j.recruiter_id = ?`,
      [recruiterId]
    );
    
    const avgMatchScore = await db.query(
      `SELECT AVG(r.total_score) as avg_score 
       FROM rankings r 
       JOIN applications a ON r.application_id = a.id 
       JOIN jobs j ON a.job_id = j.id 
       WHERE j.recruiter_id = ? AND r.total_score IS NOT NULL`,
      [recruiterId]
    );
    
    const totalJobsCount = totalJobs[0]?.count || 0;
    const activeJobsCount = activeJobs[0]?.count || 0;
    const totalApplicationsCount = totalApplications[0]?.count || 0;
    const avgScore = avgMatchScore[0]?.avg_score || 0;
    const appsPerJob = totalJobsCount > 0 ? (totalApplicationsCount / totalJobsCount).toFixed(1) : 0;
    
    // 2. Application Trends (Monthly Data)
    const monthlyApplications = await db.query(
      `SELECT 
         DATE_FORMAT(a.applied_at, '%Y-%m') as month,
         COUNT(*) as count
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE j.recruiter_id = ? 
         AND a.applied_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(a.applied_at, '%Y-%m')
       ORDER BY month ASC`,
      [recruiterId]
    );
    
    // Fill missing months with 0
    const monthlyTrends = [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthStr = date.toISOString().slice(0, 7); // YYYY-MM format
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const found = monthlyApplications.find(m => m.month === monthStr);
      monthlyTrends.push({
        month: monthName,
        count: found ? found.count : 0
      });
    }
    
    // 3. Score Distribution
    const scoreDistribution = await db.query(
      `SELECT 
         CASE 
           WHEN r.total_score >= 80 THEN 'High'
           WHEN r.total_score >= 60 THEN 'Medium'
           ELSE 'Low'
         END as score_range,
         COUNT(*) as count
       FROM rankings r
       JOIN applications a ON r.application_id = a.id
       JOIN jobs j ON a.job_id = j.id
       WHERE j.recruiter_id = ? AND r.total_score IS NOT NULL
       GROUP BY 
         CASE 
           WHEN r.total_score >= 80 THEN 'High'
           WHEN r.total_score >= 60 THEN 'Medium'
           ELSE 'Low'
         END`,
      [recruiterId]
    );
    
    // Ensure all categories exist
    const highScores = scoreDistribution.find(s => s.score_range === 'High')?.count || 0;
    const mediumScores = scoreDistribution.find(s => s.score_range === 'Medium')?.count || 0;
    const lowScores = scoreDistribution.find(s => s.score_range === 'Low')?.count || 0;
    
    // 4. Top Performing Jobs
    const topJobsByApplications = await db.query(
      `SELECT 
         j.id,
         j.title,
         COUNT(a.id) as application_count,
         AVG(r.total_score) as avg_score
       FROM jobs j
       LEFT JOIN applications a ON j.id = a.job_id
       LEFT JOIN rankings r ON a.id = r.application_id
       WHERE j.recruiter_id = ?
       GROUP BY j.id, j.title
       ORDER BY application_count DESC, avg_score DESC
       LIMIT 5`,
      [recruiterId]
    );
    
    // Transform top jobs data to ensure proper types
    const topJobs = topJobsByApplications.map(job => ({
      ...job,
      avg_score: job.avg_score ? parseFloat(job.avg_score) : null
    }));
    
    // 5. Most Common Skills
    const commonSkills = await db.query(
      `SELECT 
         s.skill_name,
         COUNT(*) as count
       FROM skills s
       JOIN applications a ON s.application_id = a.id
       JOIN jobs j ON a.job_id = j.id
       WHERE j.recruiter_id = ?
       GROUP BY s.skill_name
       ORDER BY count DESC
       LIMIT 10`,
      [recruiterId]
    );
    
    // 6. Success Rate
    const shortlistedCandidates = await db.query(
      `SELECT COUNT(*) as count
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE j.recruiter_id = ? AND a.status = 'shortlisted'`,
      [recruiterId]
    );
    
    const successRate = totalApplicationsCount > 0 
      ? ((shortlistedCandidates[0]?.count || 0) / totalApplicationsCount * 100).toFixed(1)
      : 0;
    
    // 7. Growth (compared to previous month)
    const currentMonthApps = await db.query(
      `SELECT COUNT(*) as count
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE j.recruiter_id = ? 
         AND DATE_FORMAT(a.applied_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')`,
      [recruiterId]
    );
    
    const previousMonthApps = await db.query(
      `SELECT COUNT(*) as count
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE j.recruiter_id = ? 
         AND DATE_FORMAT(a.applied_at, '%Y-%m') = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m')`,
      [recruiterId]
    );
    
    const currentMonthCount = currentMonthApps[0]?.count || 0;
    const previousMonthCount = previousMonthApps[0]?.count || 0;
    const growth = previousMonthCount > 0 
      ? ((currentMonthCount - previousMonthCount) / previousMonthCount * 100).toFixed(1)
      : 0;
    
    // 8. Quick Insights
    const insights = [];
    
    if (avgScore < 50) {
      insights.push({
        type: 'warning',
        message: 'Consider refining job descriptions to attract better-matching candidates'
      });
    }
    
    if (totalApplicationsCount < 10) {
      insights.push({
        type: 'info',
        message: 'Low application volume. Consider improving job visibility and requirements'
      });
    }
    
    if (successRate < 20) {
      insights.push({
        type: 'warning',
        message: 'Low success rate. Review job requirements and screening criteria'
      });
    }
    
    if (growth > 20) {
      insights.push({
        type: 'success',
        message: `Great growth! Applications increased by ${growth}% this month`
      });
    }
    
    const analyticsData = {
      summary: {
        totalJobs: totalJobsCount,
        activeJobs: activeJobsCount,
        totalApplications: totalApplicationsCount,
        avgMatchScore: parseFloat(avgScore).toFixed(1),
        appsPerJob: parseFloat(appsPerJob)
      },
      trends: monthlyTrends,
      scoreDistribution: {
        high: highScores,
        medium: mediumScores,
        low: lowScores
      },
      topJobs: topJobs,
      commonSkills: commonSkills,
      successRate: parseFloat(successRate),
      growth: parseFloat(growth),
      insights
    };
    
    console.log('📊 Analytics data generated:', {
      recruiterId,
      summary: analyticsData.summary,
      trendsCount: analyticsData.trends.length,
      topJobsCount: analyticsData.topJobs.length,
      skillsCount: analyticsData.commonSkills.length
    });
    
    res.json({
      success: true,
      data: analyticsData
    });
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
}));

module.exports = router;
