const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const requireRecruiter = authorizeRole('recruiter');

// Test email service
router.post('/test', authenticateToken, requireRecruiter, async (req, res) => {
  try {
    const result = await emailService.testEmail();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error testing email service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email'
    });
  }
});

// Send application status change email
router.post('/application-status', authenticateToken, async (req, res) => {
  try {
    const { candidateEmail, candidateName, applicationData } = req.body;
    
    if (!candidateEmail || !candidateName || !applicationData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: candidateEmail, candidateName, applicationData'
      });
    }

    await emailService.notifyApplicationStatusChange(
      candidateEmail,
      candidateName,
      applicationData
    );

    res.json({
      success: true,
      message: 'Application status email sent successfully'
    });
  } catch (error) {
    console.error('Error sending application status email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send application status email'
    });
  }
});

// Send ranking completion email
router.post('/ranking-completed', authenticateToken, requireRecruiter, async (req, res) => {
  try {
    const { recruiterEmail, recruiterName, jobData } = req.body;
    
    if (!recruiterEmail || !recruiterName || !jobData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: recruiterEmail, recruiterName, jobData'
      });
    }

    await emailService.notifyRankingCompleted(
      recruiterEmail,
      recruiterName,
      jobData
    );

    res.json({
      success: true,
      message: 'Ranking completion email sent successfully'
    });
  } catch (error) {
    console.error('Error sending ranking completion email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send ranking completion email'
    });
  }
});

module.exports = router;
