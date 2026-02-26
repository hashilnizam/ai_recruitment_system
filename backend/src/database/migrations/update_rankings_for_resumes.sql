-- Migration: Update rankings table to support recruiter resumes
-- This migration adds a candidate_id field and modifies foreign key constraints

-- Add candidate_id column
ALTER TABLE rankings ADD COLUMN candidate_id INT NULL;

-- Add is_resume_upload flag
ALTER TABLE rankings ADD COLUMN is_resume_upload BOOLEAN DEFAULT FALSE;

-- Update foreign key constraints to be more flexible
ALTER TABLE rankings DROP FOREIGN KEY rankings_ibfk_2;

-- Add new foreign key for candidate_id (for recruiter resumes)
ALTER TABLE rankings ADD CONSTRAINT fk_rankings_candidate 
FOREIGN KEY (candidate_id) REFERENCES recruiter_resumes(id) ON DELETE CASCADE;

-- Update unique key to include the new fields
ALTER TABLE rankings DROP INDEX unique_ranking;
ALTER TABLE rankings ADD UNIQUE KEY unique_ranking (job_id, application_id, candidate_id, is_resume_upload);

-- Add indexes for new fields
ALTER TABLE rankings ADD INDEX idx_candidate (candidate_id);
ALTER TABLE rankings ADD INDEX idx_resume_upload (is_resume_upload);
