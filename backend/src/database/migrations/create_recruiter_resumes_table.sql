-- Create table for recruiter uploaded resumes
CREATE TABLE IF NOT EXISTS recruiter_resumes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recruiter_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_recruiter_id (recruiter_id),
  INDEX idx_uploaded_at (uploaded_at)
);

-- Add constraint to ensure recruiter can't have more than 25 resumes
-- This will be enforced at the application level
