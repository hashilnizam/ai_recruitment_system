-- Add unique constraint to prevent duplicates at database level
-- This ensures no duplicate file_hash for the same recruiter_id

-- First, remove any existing duplicates
DELETE r1 FROM recruiter_resumes r1
INNER JOIN recruiter_resumes r2 
WHERE r1.id > r2.id 
AND r1.recruiter_id = r2.recruiter_id 
AND r1.file_hash = r2.file_hash;

-- Add unique constraint
ALTER TABLE recruiter_resumes 
ADD CONSTRAINT unique_recruiter_file_hash 
UNIQUE (recruiter_id, file_hash);

-- Add index for the constraint if not exists
CREATE INDEX IF NOT EXISTS idx_unique_recruiter_hash 
ON recruiter_resumes(recruiter_id, file_hash);
