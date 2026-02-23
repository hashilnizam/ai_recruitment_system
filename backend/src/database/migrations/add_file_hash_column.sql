-- Add file_hash column to recruiter_resumes table for duplicate detection
ALTER TABLE recruiter_resumes 
ADD COLUMN file_hash VARCHAR(64) DEFAULT NULL AFTER mime_type;

-- Add index on file_hash for faster duplicate checking
CREATE INDEX idx_file_hash ON recruiter_resumes(file_hash);

-- Add composite index for recruiter_id and file_hash for unique constraint checking
CREATE INDEX idx_recruiter_file_hash ON recruiter_resumes(recruiter_id, file_hash);
