const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const db = require('../config/database');

// Helper function to calculate file hash
function calculateFileHash(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    return hash;
  } catch (error) {
    console.error('Error calculating file hash:', error);
    return null;
  }
}

// Helper function to check for duplicate files
async function checkDuplicateFile(recruiterId, fileHash) {
  try {
    const [existingFiles] = await db.query(
      'SELECT id, original_name, uploaded_at FROM recruiter_resumes WHERE recruiter_id = ? AND file_hash = ?',
      [recruiterId, fileHash]
    );
    
    console.log('🔍 Duplicate check result:', {
      recruiterId,
      fileHash: fileHash.substring(0, 16) + '...',
      foundFiles: existingFiles.length
    });
    
    return existingFiles; // Return the array, not the first element
  } catch (error) {
    console.error('Error checking duplicate file:', error);
    return [];
  }
}

// Configure multer for multiple file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/recruiter-resumes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `recruiter-${req.user.id}-${uniqueSuffix}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
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
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 25 // Maximum 25 files
  }
});

// Get recruiter's uploaded resumes
router.get('/resumes', authenticateToken, authorizeRole('recruiter'), asyncHandler(async (req, res) => {
  try {
    const recruiterId = req.user.id;
    
    // Add cache-busting headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Get uploaded resumes count
    const resumesResult = await db.query(
      'SELECT * FROM recruiter_resumes WHERE recruiter_id = ? ORDER BY uploaded_at DESC',
      [recruiterId]
    );
    
    const resumes = resumesResult || [];
    
    console.log(`📊 Retrieved ${resumes.length} resumes for recruiter ${recruiterId}`);
    
    res.json({
      success: true,
      data: resumes,
      count: resumes.length,
      limit: 25
    });
  } catch (error) {
    console.error('Error fetching recruiter resumes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resumes'
    });
  }
}));

// Upload multiple resumes
router.post('/resumes', authenticateToken, authorizeRole('recruiter'), upload.array('resumes', 25), asyncHandler(async (req, res) => {
  try {
    console.log('🔄 Resume upload request received');
    console.log('👤 Recruiter ID:', req.user?.id);
    console.log('📁 Files count:', req.files?.length || 0);
    console.log('📁 Files:', req.files?.map(f => f.originalname) || []);
    
    const recruiterId = req.user.id;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    // Check current resume count
    const existingResumesResult = await db.query(
      'SELECT COUNT(*) as count FROM recruiter_resumes WHERE recruiter_id = ?',
      [recruiterId]
    );
    
    const existingResumes = existingResumesResult[0] || [];
    const currentCount = existingResumes[0]?.count || 0;
    const newTotalCount = currentCount + files.length;
    
    if (newTotalCount > 25) {
      // Clean up uploaded files
      files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      
      return res.status(400).json({
        success: false,
        message: `Cannot upload ${files.length} files. You have ${currentCount} resumes and can only have a maximum of 25 resumes.`
      });
    }
    
    // Check for duplicates and save valid files
    const uploadedResumes = [];
    const duplicateFiles = [];
    const skippedFiles = [];
    
    console.log(`🔄 Starting duplicate detection for ${files.length} files`);
    
    for (const file of files) {
      console.log('🔍 Processing file:', file.originalname);
      console.log('📁 File path:', file.path);
      
      // Calculate file hash for duplicate detection
      const fileHash = calculateFileHash(file.path);
      
      if (!fileHash) {
        console.error('❌ Failed to calculate hash for:', file.originalname);
        skippedFiles.push({
          filename: file.originalname,
          reason: 'Failed to calculate file hash'
        });
        continue;
      }
      
      console.log('🔍 Calculated hash:', fileHash.substring(0, 16) + '...');
      
      // PRE-INSERTION DUPLICATE CHECK - This is the primary duplicate prevention
      const existingFiles = await checkDuplicateFile(recruiterId, fileHash);
      
      console.log('📊 PRE-INSERTION Duplicate check result:', {
        filename: file.originalname,
        fileHash: fileHash.substring(0, 16) + '...',
        existingCount: existingFiles.length,
        isDuplicate: existingFiles.length > 0,
        recruiterId: recruiterId
      });
      
      if (existingFiles.length > 0) {
        console.log('🔄 PRE-INSERTION Duplicate detected:', file.originalname);
        console.log('📋 Existing file details:', existingFiles[0]);
        console.log('🚫 BLOCKING: File will NOT be inserted into database');
        
        duplicateFiles.push({
          filename: file.originalname,
          existingFile: existingFiles[0],
          uploadedAt: existingFiles[0].uploaded_at,
          reason: 'Pre-insertion duplicate detection',
          blocked: true
        });
        
        // Remove the duplicate file from filesystem
        try {
          fs.unlinkSync(file.path);
          console.log('🗑️ Removed duplicate file (PRE-INSERTION):', file.originalname);
        } catch (cleanupError) {
          console.error('Error cleaning up duplicate file:', cleanupError);
        }
        
        continue; // Skip database insertion completely
      }
      
      console.log('✅ No duplicates found - proceeding with database insertion for:', file.originalname);
      
      console.log('💾 Saving unique file to database:', file.originalname);
      console.log('📊 File data:', {
        recruiterId,
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimeType: file.mimetype,
        fileHash: fileHash.substring(0, 16) + '...' // Show first 16 chars of hash
      });
      
      try {
        const result = await db.query(
          `INSERT INTO recruiter_resumes (recruiter_id, filename, original_name, file_path, file_size, mime_type, file_hash) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            recruiterId,
            file.filename,
            file.originalname,
            file.path,
            file.size,
            file.mimetype,
            fileHash
          ]
        );
        
        console.log('✅ Database insert result:', result);
        console.log('🆔 Insert ID:', result.insertId);
        
        uploadedResumes.push({
          id: result.insertId,
          filename: file.filename,
          original_name: file.originalname,
          file_size: file.size,
          file_hash: fileHash,
          uploaded_at: new Date()
        });
      } catch (dbError) {
        console.error('❌ Database insert error:', dbError);
        
        // Check if it's a duplicate constraint violation
        if (dbError.code === 'ER_DUP_ENTRY') {
          console.log('🔄 Database-level duplicate detected:', file.originalname);
          
          duplicateFiles.push({
            filename: file.originalname,
            reason: 'Database constraint violation (duplicate file)',
            error: 'Duplicate file detected at database level'
          });
          
          // Remove the duplicate file from filesystem
          try {
            fs.unlinkSync(file.path);
            console.log('🗑️ Removed duplicate file (DB constraint):', file.originalname);
          } catch (cleanupError) {
            console.error('Error cleaning up duplicate file:', cleanupError);
          }
          
          continue; // Skip to next file
        }
        
        // Clean up file on other database errors
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file after DB error:', cleanupError);
        }
        
        throw dbError;
      }
    }
    
    // Prepare response message
    let responseMessage = `Successfully uploaded ${uploadedResumes.length} resume(s)`;
    
    if (duplicateFiles.length > 0) {
      responseMessage += `. ${duplicateFiles.length} duplicate(s) were automatically skipped.`;
    }
    
    if (skippedFiles.length > 0) {
      responseMessage += ` ${skippedFiles.length} file(s) were skipped due to errors.`;
    }
    
    // Trigger AI ranking for uploaded resumes
    if (uploadedResumes.length > 0) {
      try {
        console.log('🤖 Triggering AI ranking for uploaded resumes...');
        
        // Create a dummy job entry for ranking uploaded resumes
        const dummyJobResult = await db.query(
          'INSERT INTO jobs (recruiter_id, title, description, status, created_at) VALUES (?, ?, ?, ?, ?)',
          [recruiterId, 'Direct Resume Upload', 'Uploaded resumes for ranking', 'published']
        );
        
        const dummyJobId = dummyJobResult.insertId;
        console.log(`📋 Created dummy job ${dummyJobId} for resume ranking`);
        
        // Create applications for uploaded resumes
        for (const resume of uploadedResumes) {
          await db.query(
            'INSERT INTO applications (job_id, candidate_id, status, applied_at) VALUES (?, ?, ?, ?)',
            [dummyJobId, resume.id, 'pending']
          );
        }
        
        console.log(`📝 Created ${uploadedResumes.length} applications for job ${dummyJobId}`);
        
        // Trigger AI ranking
        try {
          const aiResponse = await axios.post('http://localhost:5001/api/rank-candidates', {
            job_id: dummyJobId
          }, {
            timeout: 30000,
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          console.log('✅ AI ranking triggered successfully:', aiResponse.data);
        } catch (aiError) {
          console.error('❌ Failed to trigger AI ranking:', aiError.message);
        }
        
      } catch (rankingError) {
        console.error('❌ Error setting up AI ranking:', rankingError);
      }
    }

    res.status(201).json({
      success: true,
      message: responseMessage,
      data: uploadedResumes,
      duplicates: duplicateFiles,
      skipped: skippedFiles,
      total_count: newTotalCount,
      processed_files: files.length,
      uploaded_files: uploadedResumes.length,
      duplicate_files: duplicateFiles.length,
      skipped_files: skippedFiles.length
    });
    
  } catch (error) {
    console.error('❌ Error uploading resumes:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload resumes: ' + error.message
    });
  }
}));

// Delete a resume
router.delete('/resumes/:id', authenticateToken, authorizeRole('recruiter'), asyncHandler(async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const resumeId = req.params.id;
    
    // Get resume info
    const resumeResult = await db.query(
      'SELECT * FROM recruiter_resumes WHERE id = ? AND recruiter_id = ?',
      [resumeId, recruiterId]
    );
    
    const resume = resumeResult[0] || [];
    
    if (!resume || resume.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }
    
    const resumeInfo = resume[0];
    
    // Delete file from filesystem
    try {
      fs.unlinkSync(resumeInfo.file_path);
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
    }
    
    // Delete from database
    await db.query('DELETE FROM recruiter_resumes WHERE id = ? AND recruiter_id = ?', [resumeId, recruiterId]);
    
    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resume'
    });
  }
}));

module.exports = router;
