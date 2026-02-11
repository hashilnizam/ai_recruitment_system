const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  initialize() {
    // Only initialize if SMTP credentials are provided
    if (!process.env.SMTP_HOST && !process.env.SMTP_EMAIL) {
      console.log('📧 Email service disabled - no SMTP configuration found');
      this.transporter = null;
      return;
    }

    // Create transporter using environment variables
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD
      }
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.log('📧 Email service connection failed:', error);
        this.transporter = null;
      } else {
        console.log('📧 Email service is ready to send messages');
      }
    });
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      const mailOptions = {
        from: `"${process.env.APP_NAME || 'AI Recruitment System'}" <${process.env.SMTP_EMAIL}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject,
        html: html,
        text: text || this.stripHtml(html)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('📧 Error sending email:', error);
      throw error;
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  // Template for new application notification to recruiter
  async notifyNewApplication(recruiterEmail, recruiterName, applicationData) {
    const subject = `🎉 New Application Received: ${applicationData.job_title}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Application Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .info-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 New Application Received!</h1>
            <p>A candidate has applied to your job posting</p>
          </div>
          
          <div class="content">
            <p>Hi ${recruiterName},</p>
            <p>Great news! You've received a new application for your job position.</p>
            
            <div class="info-box">
              <h3>📋 Application Details</h3>
              <p><strong>Position:</strong> ${applicationData.job_title}</p>
              <p><strong>Candidate:</strong> ${applicationData.candidate_name}</p>
              <p><strong>Email:</strong> ${applicationData.candidate_email}</p>
              <p><strong>Applied:</strong> ${new Date(applicationData.applied_at).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span style="color: #f39c12;">Pending Review</span></p>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs/${applicationData.jobId}/applications" class="btn">
                View Application
              </a>
            </div>
            
            <p>You can review this application and trigger AI ranking to get insights about the candidate's fit for the position.</p>
            
            <div class="footer">
              <p>This is an automated notification from the AI Recruitment System.</p>
              <p>If you don't want to receive these emails, you can update your notification preferences in your account settings.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(recruiterEmail, subject, html);
  }

  // Template for application status change notification to candidate
  async notifyApplicationStatusChange(candidateEmail, candidateName, applicationData) {
    const subject = `📊 Application Status Update: ${applicationData.job_title}`;
    
    const statusColors = {
      pending: '#f39c12',
      ranked: '#3498db',
      reviewed: '#9b59b6',
      shortlisted: '#27ae60',
      rejected: '#e74c3c'
    };

    const statusColor = statusColors[applicationData.status] || '#666';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Application Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .status-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${statusColor}; }
          .score-badge { background: ${statusColor}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Application Status Update</h1>
            <p>Your application status has been updated</p>
          </div>
          
          <div class="content">
            <p>Hi ${candidateName},</p>
            <p>Good news! There's an update on your application for ${applicationData.job_title}.</p>
            
            <div class="status-box">
              <h3>📈 Application Status</h3>
              <p><strong>Position:</strong> ${applicationData.job_title}</p>
              <p><strong>Current Status:</strong></p>
              <div class="score-badge">${applicationData.status.toUpperCase()}</div>
              
              ${applicationData.total_score ? `
                <p><strong>AI Score:</strong> ${applicationData.total_score.toFixed(1)}/100</p>
                <p><strong>Rank:</strong> #${applicationData.rank_position || 'N/A'}</p>
              ` : ''}
              
              <p><strong>Updated:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            ${applicationData.feedback ? `
              <div class="status-box">
                <h3>🤖 AI Feedback</h3>
                <p><strong>Strengths:</strong></p>
                <ul>${applicationData.feedback.strengths?.map(s => `<li>${s}</li>`).join('') || '<li>No specific strengths identified</li>'}</ul>
                
                <p><strong>Areas for Improvement:</strong></p>
                <ul>${applicationData.feedback.missing_skills?.map(s => `<li>${s}</li>`).join('') || '<li>No specific areas identified</li>'}</ul>
                
                <p><strong>Suggestions:</strong></p>
                <ul>${applicationData.feedback.suggestions?.map(s => `<li>${s}</li>`).join('') || '<li>No specific suggestions provided</li>'}</ul>
              </div>
            ` : ''}
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/applications" class="btn">
                View All Applications
              </a>
            </div>
            
            <p>Keep checking your dashboard for more updates on your applications.</p>
            
            <div class="footer">
              <p>This is an automated notification from the AI Recruitment System.</p>
              <p>If you don't want to receive these emails, you can update your notification preferences in your account settings.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(candidateEmail, subject, html);
  }

  // Template for AI ranking completion notification to recruiter
  async notifyRankingCompleted(recruiterEmail, recruiterName, jobData) {
    const subject = `🤖 AI Ranking Completed: ${jobData.job_title}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>AI Ranking Completed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .btn { display: inline-block; padding: 12px 24px; background: #27ae60; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .stats-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27ae60; }
          .stat { display: inline-block; margin: 10px 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤖 AI Ranking Completed!</h1>
            <p>Candidates have been analyzed and ranked</p>
          </div>
          
          <div class="content">
            <p>Hi ${recruiterName},</p>
            <p>Excellent! The AI has completed the ranking process for your job posting.</p>
            
            <div class="stats-box">
              <h3>📊 Ranking Summary</h3>
              <p><strong>Position:</strong> ${jobData.job_title}</p>
              
              <div style="text-align: center; margin: 20px 0;">
                <div class="stat">
                  <h4 style="margin: 0; color: #27ae60;">${jobData.total_candidates || 0}</h4>
                  <p style="margin: 5px 0;">Candidates Ranked</p>
                </div>
                <div class="stat">
                  <h4 style="margin: 0; color: #3498db;">${jobData.avg_score ? jobData.avg_score.toFixed(1) : 'N/A'}</h4>
                  <p style="margin: 5px 0;">Average Score</p>
                </div>
                <div class="stat">
                  <h4 style="margin: 0; color: #9b59b6;">${jobData.processing_time || 'N/A'}</h4>
                  <p style="margin: 5px 0;">Processing Time</p>
                </div>
              </div>
              
              <p>The AI has analyzed each candidate's skills, experience, and education to provide you with comprehensive rankings and insights.</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/rankings/${jobData.jobId}" class="btn">
                View AI Rankings
              </a>
            </div>
            
            <p>You can now review the ranked candidates and make informed decisions about who to shortlist for interviews.</p>
            
            <div class="footer">
              <p>This is an automated notification from the AI Recruitment System.</p>
              <p>If you don't want to receive these emails, you can update your notification preferences in your account settings.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(recruiterEmail, subject, html);
  }

  // Test email service
  async testEmail() {
    try {
      const subject = '🧪 Email Service Test';
      const html = `
        <h1>Email Service Test</h1>
        <p>This is a test email to verify that the email service is working correctly.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `;
      
      await this.sendEmail(process.env.SMTP_EMAIL, subject, html);
      return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new EmailService();
