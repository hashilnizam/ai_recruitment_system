const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Enhanced file security validation
 */
function validateFileSecurity(filePath, originalName) {
  const stats = fs.statSync(filePath);
  
  // Check file size (additional validation)
  if (stats.size > 10 * 1024 * 1024) { // 10MB
    fs.unlinkSync(filePath);
    throw new Error('File size exceeds limit');
  }
  
  // Check file signature (magic bytes)
  const buffer = fs.readFileSync(filePath, { encoding: null, start: 0, end: 8 });
  const hex = buffer.toString('hex');
  
  const fileSignatures = {
    'pdf': '255044462d', // PDF
    'doc': 'd0cf11e0a1b11ae1', // DOC
    'docx': '504b030414000600' // DOCX
  };
  
  const ext = path.extname(originalName).toLowerCase().substring(1);
  const expectedSignature = fileSignatures[ext];
  
  if (!expectedSignature || !hex.startsWith(expectedSignature)) {
    fs.unlinkSync(filePath);
    throw new Error('Invalid file type or corrupted file');
  }
  
  return true;
}

/**
 * Generate secure file hash
 */
function generateSecureHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

/**
 * Sanitize filename to prevent path traversal
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

module.exports = {
  validateFileSecurity,
  generateSecureHash,
  sanitizeFilename
};
