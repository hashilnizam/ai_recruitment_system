const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { PDFParse } = require('pdf-parse');
const axios = require('axios');
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const requireCandidate = authorizeRole('candidate');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateFileSecurity, generateSecureHash, sanitizeFilename } = require('../utils/fileUtils');

// Import enhanced algorithms
const EnhancedResumeParser = require('../services/resumeParser');
const AdvancedScoringAlgorithm = require('../services/scoringAlgorithm');

// Import WebSocket handler for real-time notifications
const socketHandler = require('../websocket/socketHandler');

// Import email service
const emailService = require('../services/emailService');

// Import rate limiters
const { uploadLimiter, applicationLimiter } = require('../middleware/rateLimiter');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only PDF, DOC, and DOCX files
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Helper function to extract text from PDF
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    
    // Use pdf-parse v2.x API with PDFParse class
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// Helper function to extract text from DOC/DOCX (placeholder)
async function extractTextFromDoc(filePath) {
  // For now, return a placeholder text
  // In production, you would use libraries like mammoth for DOCX
  const fileName = path.basename(filePath);
  return `Resume document: ${fileName}. [Document parsing not implemented in this version]`;
}

// Helper function to parse resume text and extract information
function parseResumeText(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Simple parsing logic - in production, you'd use more sophisticated NLP
  const parsed = {
    skills: [],
    education: [],
    experience: [],
    email: null,
    phone: null,
    name: null
  };

  // Extract email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    parsed.email = emailMatch[0];
  }

  // Extract phone (simple pattern)
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    parsed.phone = phoneMatch[0];
  }

  // Extract common skills
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'TypeScript', 'Angular', 'Vue.js',
    'HTML', 'CSS', 'SQL', 'MongoDB', 'Express', 'Docker', 'AWS', 'Git', 'REST API',
    'GraphQL', 'Machine Learning', 'Data Science', 'TensorFlow', 'PyTorch', 'Kubernetes',
    'CI/CD', 'Agile', 'Scrum', 'Jira', 'Linux', 'Ubuntu', 'Windows', 'macOS'
  ];

  lines.forEach(line => {
    // Check for skills
    commonSkills.forEach(skill => {
      if (line.toLowerCase().includes(skill.toLowerCase())) {
        if (!parsed.skills.includes(skill)) {
          parsed.skills.push(skill);
        }
      }
    });

    // Check for education keywords
    if (line.toLowerCase().includes('bachelor') || line.toLowerCase().includes('master') || 
        line.toLowerCase().includes('phd') || line.toLowerCase().includes('degree')) {
      parsed.education.push(line);
    }

    // Check for experience keywords
    if (line.toLowerCase().includes('experience') || line.toLowerCase().includes('worked') ||
        line.toLowerCase().includes('developer') || line.toLowerCase().includes('engineer')) {
      parsed.experience.push(line);
    }
  });

  return parsed;
}

// Submit application with resume upload
router.post('/submit', authenticateToken, requireCandidate, upload.single('resume'), async (req, res) => {
  try {
    console.log('📝 Application submission started');
    console.log('👤 User ID:', req.user.id);
    console.log('📋 Request body:', req.body);
    console.log('📄 File info:', req.file);
    
    const candidateId = req.user.id;
    const { jobId, skills, education, experience, coverLetter } = req.body;

    if (!jobId) {
      console.log('❌ Missing job ID');
      return res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
    }

    if (!req.file) {
      console.log('❌ Missing resume file');
      return res.status(400).json({
        success: false,
        message: 'Resume file is required'
      });
    }

    console.log('✅ Basic validation passed');
    console.log('📄 Processing resume file:', req.file.originalname);

    // Initialize enhanced algorithms
    const resumeParser = new EnhancedResumeParser();
    const scoringAlgorithm = new AdvancedScoringAlgorithm();

    // Parse resume with enhanced parser
    console.log('🧠 Parsing resume with enhanced algorithm...');
    let resumeBuffer;
    
    // Read file from disk since we're using diskStorage
    if (req.file.path) {
      resumeBuffer = fs.readFileSync(req.file.path);
      console.log('📄 Read file from disk:', req.file.path);
    } else if (req.file.buffer) {
      resumeBuffer = req.file.buffer;
      console.log('📄 Using file buffer directly');
    } else {
      throw new Error('No file data available');
    }
    
    const resumeData = await resumeParser.parseResume(resumeBuffer, req.file.originalname);
    console.log('✅ Resume parsing completed');

    // Check if job exists and is published
    const jobs = await db.query(
      'SELECT * FROM jobs WHERE id = ? AND status = ?',
      [jobId, 'published']
    );

    if (jobs.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Job not found or not available'
      });
    }

    const job = jobs[0];
    console.log('📋 Job found:', job.title);

    // Use AI to enhance the extracted data
    console.log('🤖 Enhancing data with AI...');
    let aiEnhancedData = null;
    try {
      const aiResponse = await axios.post('http://localhost:5001/api/enhance-application-data', {
        resume_data: resumeData,
        job_requirements: {
          required_skills: JSON.parse(job.required_skills || '[]'),
          required_education: JSON.parse(job.required_education || '[]'),
          required_experience: JSON.parse(job.required_experience || '{}')
        }
      }, {
        timeout: 25000 // Increased from 15000 to 25000ms for better AI processing
      });
      
      if (aiResponse.data.success) {
        aiEnhancedData = aiResponse.data.data;
        console.log('✅ AI enhancement completed');
        console.log(`📊 Match score: ${aiEnhancedData.match_score}%`);
      }
    } catch (aiError) {
      console.warn('⚠️ AI enhancement failed, using parsed data:', aiError.message);
      // Use parsed data directly if AI enhancement fails
      aiEnhancedData = {
        match_score: 75, // Default match score
        enhanced_data: resumeData
      };
    }

    // Check for duplicate application
    const existingApplication = await db.query(
      'SELECT id FROM applications WHERE candidate_id = ? AND job_id = ?',
      [candidateId, jobId]
    );

    if (existingApplication.length > 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(409).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    console.log('✅ No duplicate application found');

    // Create hash of resume content for duplicate detection
    const resumeHash = crypto.createHash('sha256').update(resumeBuffer).digest('hex');

    // Create application
    const applicationResult = await db.query(
      `INSERT INTO applications (job_id, candidate_id, status, resume_hash, applied_at, updated_at)
       VALUES (?, ?, 'pending', ?, NOW(), NOW())`,
      [jobId, candidateId, resumeHash]
    );

    const applicationId = applicationResult.insertId;
    console.log('📝 Application created with ID:', applicationId);

    // Insert skills from resume parsing
    const allSkills = [
      ...(resumeData.skills || []).map(skill => ({
        name: skill.name || skill,
        proficiencyLevel: skill.level || 'intermediate',
        yearsOfExperience: null
      })),
      ...(resumeData.softSkills || []).map(skill => ({
        name: skill.name,
        proficiencyLevel: skill.level || 'intermediate',
        yearsOfExperience: null
      }))
    ];

    // Add manually entered skills
    if (skills) {
      try {
        const manualSkills = JSON.parse(skills);
        manualSkills.forEach(skill => {
          if (!allSkills.find(s => s.name.toLowerCase() === skill.name.toLowerCase())) {
            allSkills.push({
              name: skill.name,
              proficiencyLevel: skill.proficiencyLevel || 'intermediate',
              yearsOfExperience: skill.yearsOfExperience || null
            });
          }
        });
      } catch (error) {
        console.error('Error parsing manual skills:', error);
      }
    }

    console.log('📊 Inserting skills:', allSkills.length);
    for (const skill of allSkills) {
      if (skill.name && skill.name.length > 0) {
        await db.query(
          `INSERT INTO skills (application_id, skill_name, proficiency_level, years_of_experience)
           VALUES (?, ?, ?, ?)`,
          [applicationId, skill.name, skill.proficiencyLevel, skill.yearsOfExperience]
        );
      }
    }

    // Insert education from resume parsing
    console.log('📚 Inserting education:', resumeData.education.length);
    for (const edu of resumeData.education) {
      await db.query(
        `INSERT INTO education (application_id, degree, field_of_study, institution, graduation_year, gpa)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [applicationId, edu.degree || '', edu.field || '', edu.institution || '', 
         edu.end_date || null, edu.gpa || null]
      );
    }

    // Insert experience from resume parsing
    console.log('💼 Inserting experience:', resumeData.experience.length);
    for (const exp of resumeData.experience) {
      await db.query(
        `INSERT INTO experience (application_id, job_title, company, duration_months, start_date, end_date, description)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [applicationId, exp.title || exp.position || '', exp.company || '', 
         exp.duration || 0, exp.start_date || null, exp.end_date || null, exp.description || '']
      );
    }

    // Calculate advanced score
    console.log('🎯 Calculating advanced score...');
    const scoreResult = await scoringAlgorithm.calculateScore(
      { id: applicationId, skills: allSkills },
      job,
      resumeData
    );
    console.log('✅ Score calculated:', scoreResult.totalScore);

    // Store scoring results
    await db.query(
      `INSERT INTO rankings (application_id, job_id, skill_score, education_score, experience_score, total_score, rank_position, score_breakdown)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [applicationId, jobId, scoreResult.breakdown.skills.score, scoreResult.breakdown.education.score,
       scoreResult.breakdown.experience.score, scoreResult.totalScore, 1, JSON.stringify(scoreResult)]
    );

    // Store resume data for future reference (skip if column doesn't exist)
    try {
      await db.query(
        `UPDATE applications SET resume_data = ? WHERE id = ?`,
        [JSON.stringify(resumeData), applicationId]
      );
    } catch (error) {
      console.warn('⚠️ Could not store resume_data (column may not exist):', error.message);
    }

    // Generate AI feedback
    const feedback = await generateAIFeedback(resumeData, job, scoreResult);
    console.log('🤖 AI feedback generated');

    // Store feedback
    await db.query(
      `INSERT INTO feedback (application_id, strengths, missing_skills, suggestions, overall_assessment, generated_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [applicationId, JSON.stringify(feedback.strengths), JSON.stringify(feedback.missingSkills),
       JSON.stringify(feedback.suggestions), feedback.overallAssessment]
    );

    // Update job application count
    await db.query(
      'UPDATE jobs SET application_count = application_count + 1 WHERE id = ?',
      [jobId]
    );

    console.log('✅ Application submission completed successfully');

    // Send real-time notification to recruiter
    socketHandler.notifyRecruiter(job.recruiter_id, {
      type: 'new_application',
      data: {
        applicationId,
        jobId,
        candidateName: resumeData.personalInfo.name || 'Candidate',
        jobTitle: job.title,
        score: scoreResult.totalScore,
        submittedAt: new Date().toISOString()
      }
    });

    // Send confirmation email to candidate
    try {
      await emailService.sendApplicationConfirmation(candidateId, job.title, scoreResult.totalScore);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId,
        jobId,
        score: scoreResult.totalScore,
        resumeData: resumeData,
        aiEnhancedData: aiEnhancedData,
        feedback: feedback,
        needsManualFix: aiEnhancedData && (
          aiEnhancedData.missing_critical_fields?.length > 0 ||
          aiEnhancedData.skill_gaps?.length > 0
        ),
        missingFields: aiEnhancedData?.missing_critical_fields || [],
        skillGaps: aiEnhancedData?.skill_gaps || [],
        recommendations: aiEnhancedData?.recommendations || [],
        aiMatchScore: aiEnhancedData?.match_score || null
      }
    });

  } catch (error) {
    console.error('❌ Error submitting application:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Clean up uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit application: ' + error.message
    });
  }
});

// Generate AI feedback
async function generateAIFeedback(resumeData, job, scoreResult) {
  const feedback = {
    strengths: [],
    missingSkills: [],
    suggestions: [],
    overallAssessment: ''
  };

  // Analyze strengths
  if (scoreResult.breakdown.skills.score > 30) {
    feedback.strengths.push('Strong technical skills alignment with job requirements');
  }
  
  if (scoreResult.breakdown.experience.score > 20) {
    feedback.strengths.push('Relevant experience level for this position');
  }
  
  if (scoreResult.breakdown.education.score > 10) {
    feedback.strengths.push('Educational background meets requirements');
  }

  // Identify missing skills
  scoreResult.breakdown.skills.details.missingSkills.forEach(skill => {
    feedback.missingSkills.push(`Consider developing ${skill} to improve your profile`);
  });

  // Generate suggestions
  if (scoreResult.totalScore < 70) {
    feedback.suggestions.push('Focus on developing key skills mentioned in the job description');
  }
  
  if (resumeData.experience.length < 2) {
    feedback.suggestions.push('Consider gaining more diverse experience to strengthen your profile');
  }

  // Overall assessment
  if (scoreResult.totalScore >= 80) {
    feedback.overallAssessment = 'Excellent match! Your profile strongly aligns with this position.';
  } else if (scoreResult.totalScore >= 60) {
    feedback.overallAssessment = 'Good match! You have relevant skills and experience for this role.';
  } else if (scoreResult.totalScore >= 40) {
    feedback.overallAssessment = 'Fair match. Consider developing additional skills to improve your candidacy.';
  } else {
    feedback.overallAssessment = 'Limited match. Significant skill development may be needed for this position.';
  }

  return feedback;
}

// Get candidate's applications
router.get('/my', authenticateToken, requireCandidate, async (req, res) => {
  try {
    const candidateId = req.user.id;

    const applications = await db.query(
      `SELECT a.*, j.title as job_title, j.location, j.status as job_status, j.salary_range,
              u.first_name as recruiter_first_name, u.last_name as recruiter_last_name, u.company_name,
              r.total_score, r.rank_position, r.skill_score, r.education_score, r.experience_score,
              f.strengths, f.missing_skills, f.suggestions
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN users u ON j.recruiter_id = u.id
       LEFT JOIN rankings r ON a.id = r.application_id
       LEFT JOIN feedback f ON a.id = f.application_id
       WHERE a.candidate_id = ?
       ORDER BY a.applied_at DESC`,
      [candidateId]
    );

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
});

// Get application details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT a.*, j.title as job_title, j.description as job_description, j.required_skills,
             u.first_name, u.last_name, u.email as candidate_email,
             r.total_score, r.rank_position, r.skill_score, r.education_score, r.experience_score,
             f.strengths, f.missing_skills, f.suggestions
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON a.candidate_id = u.id
      LEFT JOIN rankings r ON a.id = r.application_id
      LEFT JOIN feedback f ON a.id = f.application_id
      WHERE a.id = ?
    `;

    const params = [applicationId];

    // Add role-based filtering
    if (userRole === 'candidate') {
      query += ' AND a.candidate_id = ?';
      params.push(userId);
    } else if (userRole === 'recruiter') {
      query += ' AND j.recruiter_id = ?';
      params.push(userId);
    }

    const applications = await db.query(query, params);

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Get skills, education, and experience for this application
    const skills = await db.query(
      'SELECT * FROM skills WHERE application_id = ?',
      [applicationId]
    );

    const education = await db.query(
      'SELECT * FROM education WHERE application_id = ?',
      [applicationId]
    );

    const experience = await db.query(
      'SELECT * FROM experience WHERE application_id = ?',
      [applicationId]
    );

    const application = applications[0];
    application.skills = skills;
    application.education = education;
    application.experience = experience;

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application'
    });
  }
});

// Download resume file
router.get('/:id/resume', authenticateToken, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if user has access to this application
    let query = 'SELECT a.resume_hash FROM applications a WHERE a.id = ?';
    const params = [applicationId];

    if (userRole === 'candidate') {
      query += ' AND a.candidate_id = ?';
      params.push(userId);
    } else if (userRole === 'recruiter') {
      query += ' AND EXISTS (SELECT 1 FROM jobs j WHERE j.id = a.job_id AND j.recruiter_id = ?)';
      params.push(userId);
    }

    const applications = await db.query(query, params);

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or access denied'
      });
    }

    // Find the resume file using the hash
    const uploadDir = path.join(__dirname, '../../uploads');
    const files = fs.readdirSync(uploadDir);
    const resumeFile = files.find(file => file.includes('.pdf') || file.includes('.doc') || file.includes('.docx'));

    if (!resumeFile) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found'
      });
    }

    const filePath = path.join(uploadDir, resumeFile);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found'
      });
    }

    // Send file
    res.download(filePath, `resume_${applicationId}.pdf`);

  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download resume'
    });
  }
});

// Resume extraction endpoint
router.post('/extract-resume', 
  authenticateToken, 
  requireCandidate,
  upload.single('resume'),
  uploadLimiter,
  asyncHandler(async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No resume file uploaded'
        });
      }

      console.log('🤖 Starting AI resume extraction for:', req.file.originalname);
      
      // Read the file buffer
      const resumeBuffer = fs.readFileSync(req.file.path);
      
      // Use the enhanced resume parser with AI service
      const resumeParser = new EnhancedResumeParser();
      const extractedData = await resumeParser.parseResume(resumeBuffer, req.file.originalname);
      
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
      
      console.log('✅ Resume extraction completed successfully');
      
      res.json({
        success: true,
        data: extractedData,
        message: 'Resume data extracted successfully'
      });

    } catch (error) {
      console.error('❌ Resume extraction error:', error);
      
      // Clean up the uploaded file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        message: `Resume extraction failed: ${error.message}`
      });
    }
  })
);

// Cancel application
router.post('/:id/cancel', authenticateToken, requireCandidate, asyncHandler(async (req, res) => {
  try {
    const applicationId = req.params.id;
    const candidateId = req.user.id;

    // Check if application belongs to candidate
    const application = await db.query(
      'SELECT id FROM applications WHERE id = ? AND candidate_id = ?',
      [applicationId, candidateId]
    );

    if (application.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update application status to cancelled
    await db.query(
      'UPDATE applications SET status = ?, updated_at = NOW() WHERE id = ?',
      ['cancelled', applicationId]
    );

    res.json({
      success: true,
      message: 'Application cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel application'
    });
  }
}));

module.exports = router;
