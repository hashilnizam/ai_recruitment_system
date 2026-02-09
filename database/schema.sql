-- AI Recruitment System Database Schema
-- MySQL 8.0+

-- Create database
CREATE DATABASE IF NOT EXISTS resume_screening CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE resume_screening;

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('recruiter', 'candidate') NOT NULL,
    company_name VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Jobs Table
-- ============================================
CREATE TABLE jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recruiter_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    required_skills JSON NOT NULL,
    required_education JSON NOT NULL,
    required_experience JSON NOT NULL,
    status ENUM('draft', 'published', 'closed') DEFAULT 'draft',
    location VARCHAR(255) NULL,
    salary_range VARCHAR(100) NULL,
    employment_type ENUM('full-time', 'part-time', 'contract', 'internship') DEFAULT 'full-time',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_recruiter (recruiter_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    FULLTEXT idx_title_desc (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Applications Table
-- ============================================
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    candidate_id INT NOT NULL,
    status ENUM('pending', 'ranked', 'reviewed', 'rejected', 'shortlisted') DEFAULT 'pending',
    resume_hash VARCHAR(64) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_application (job_id, candidate_id),
    INDEX idx_job (job_id),
    INDEX idx_candidate (candidate_id),
    INDEX idx_status (status),
    INDEX idx_hash (resume_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Skills Table
-- ============================================
CREATE TABLE skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
    years_of_experience DECIMAL(4,1) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_application (application_id),
    INDEX idx_skill_name (skill_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Education Table
-- ============================================
CREATE TABLE education (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    degree VARCHAR(100) NOT NULL,
    field_of_study VARCHAR(100) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    graduation_year INT NOT NULL,
    gpa DECIMAL(3,2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_application (application_id),
    INDEX idx_degree (degree),
    INDEX idx_institution (institution)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Experience Table
-- ============================================
CREATE TABLE experience (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    job_title VARCHAR(150) NOT NULL,
    company VARCHAR(255) NOT NULL,
    duration_months INT NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_application (application_id),
    INDEX idx_company (company),
    INDEX idx_job_title (job_title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Rankings Table
-- ============================================
CREATE TABLE rankings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    application_id INT NOT NULL,
    skill_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    education_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    experience_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    total_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    rank_position INT NOT NULL,
    score_breakdown JSON NULL,
    ranked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    UNIQUE KEY unique_ranking (job_id, application_id),
    INDEX idx_job (job_id),
    INDEX idx_total_score (total_score DESC),
    INDEX idx_rank_position (rank_position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Feedback Table
-- ============================================
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    strengths TEXT NULL,
    missing_skills TEXT NULL,
    suggestions TEXT NULL,
    overall_assessment TEXT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    UNIQUE KEY unique_feedback (application_id),
    INDEX idx_application (application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Processing Jobs Table (for async ranking)
-- ============================================
CREATE TABLE processing_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    status ENUM('queued', 'processing', 'completed', 'failed') DEFAULT 'queued',
    progress INT DEFAULT 0,
    total_candidates INT DEFAULT 0,
    error_message TEXT NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    INDEX idx_job (job_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert Sample Data
-- ============================================

-- Sample Recruiters (password: Password123!)
INSERT INTO users (email, password_hash, first_name, last_name, role, company_name) VALUES
('recruiter1@techcorp.com', '$2b$10$rQ8vqJ5kH9YvX4K9GfHqZeZvJxJc8mXqE1Y3X4K9GfHqZeZvJxJc8m', 'John', 'Doe', 'recruiter', 'TechCorp Inc'),
('recruiter2@innovate.com', '$2b$10$rQ8vqJ5kH9YvX4K9GfHqZeZvJxJc8mXqE1Y3X4K9GfHqZeZvJxJc8m', 'Jane', 'Smith', 'recruiter', 'Innovate Solutions');

-- Sample Candidates
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('candidate1@email.com', '$2b$10$rQ8vqJ5kH9YvX4K9GfHqZeZvJxJc8mXqE1Y3X4K9GfHqZeZvJxJc8m', 'Alice', 'Johnson', 'candidate'),
('candidate2@email.com', '$2b$10$rQ8vqJ5kH9YvX4K9GfHqZeZvJxJc8mXqE1Y3X4K9GfHqZeZvJxJc8m', 'Bob', 'Williams', 'candidate');

-- Sample Jobs
INSERT INTO jobs (recruiter_id, title, description, required_skills, required_education, required_experience, status) VALUES
(1, 'Senior Full Stack Developer', 
 'We are looking for an experienced Full Stack Developer to join our team.',
 '["React", "Node.js", "TypeScript", "MongoDB", "Docker"]',
 '["Bachelor in Computer Science", "Master in Software Engineering"]',
 '{"min_years": 5, "preferred_roles": ["Full Stack Developer", "Software Engineer"]}',
 'published'),
(1, 'Machine Learning Engineer',
 'Seeking ML Engineer with strong Python and AI experience.',
 '["Python", "TensorFlow", "PyTorch", "Machine Learning", "Deep Learning"]',
 '["Bachelor in Computer Science", "Master in AI/ML"]',
 '{"min_years": 3, "preferred_roles": ["ML Engineer", "Data Scientist"]}',
 'published');

-- ============================================
-- Create Views for Analytics
-- ============================================

-- View: Job Statistics
CREATE VIEW job_statistics AS
SELECT 
    j.id,
    j.title,
    j.status,
    COUNT(DISTINCT a.id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'ranked' THEN a.id END) as ranked_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'shortlisted' THEN a.id END) as shortlisted_applications,
    j.created_at,
    j.published_at
FROM jobs j
LEFT JOIN applications a ON j.id = a.job_id
GROUP BY j.id;

-- View: Candidate Application Summary
CREATE VIEW candidate_applications_summary AS
SELECT 
    u.id as candidate_id,
    CONCAT(u.first_name, ' ', u.last_name) as candidate_name,
    COUNT(a.id) as total_applications,
    COUNT(CASE WHEN a.status = 'ranked' THEN 1 END) as ranked_count,
    COUNT(CASE WHEN a.status = 'shortlisted' THEN 1 END) as shortlisted_count,
    AVG(r.total_score) as avg_score
FROM users u
LEFT JOIN applications a ON u.id = a.candidate_id
LEFT JOIN rankings r ON a.id = r.application_id
WHERE u.role = 'candidate'
GROUP BY u.id;

-- ============================================
-- Create Stored Procedures
-- ============================================

DELIMITER //

-- Procedure: Get Top Candidates for Job
CREATE PROCEDURE GetTopCandidates(IN job_id_param INT, IN limit_param INT)
BEGIN
    SELECT 
        r.rank_position,
        r.total_score,
        r.skill_score,
        r.education_score,
        r.experience_score,
        u.id as candidate_id,
        u.first_name,
        u.last_name,
        u.email,
        a.id as application_id,
        a.applied_at
    FROM rankings r
    JOIN applications a ON r.application_id = a.id
    JOIN users u ON a.candidate_id = u.id
    WHERE r.job_id = job_id_param
    ORDER BY r.rank_position ASC
    LIMIT limit_param;
END //

-- Procedure: Calculate Application Statistics
CREATE PROCEDURE GetApplicationStats(IN job_id_param INT)
BEGIN
    SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'ranked' THEN 1 END) as ranked,
        COUNT(CASE WHEN status = 'shortlisted' THEN 1 END) as shortlisted,
        AVG(CASE WHEN r.total_score IS NOT NULL THEN r.total_score END) as avg_score,
        MAX(r.total_score) as max_score,
        MIN(r.total_score) as min_score
    FROM applications a
    LEFT JOIN rankings r ON a.id = r.application_id
    WHERE a.job_id = job_id_param;
END //

DELIMITER ;

-- ============================================
-- Create Triggers
-- ============================================

DELIMITER //

-- Trigger: Update job published_at timestamp
CREATE TRIGGER update_job_published_at
BEFORE UPDATE ON jobs
FOR EACH ROW
BEGIN
    IF NEW.status = 'published' AND OLD.status != 'published' THEN
        SET NEW.published_at = CURRENT_TIMESTAMP;
    END IF;
END //

-- Trigger: Update job closed_at timestamp
CREATE TRIGGER update_job_closed_at
BEFORE UPDATE ON jobs
FOR EACH ROW
BEGIN
    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
        SET NEW.closed_at = CURRENT_TIMESTAMP;
    END IF;
END //

DELIMITER ;

-- ============================================
-- Database Setup Complete
-- ============================================

SELECT 'Database schema created successfully!' as message;
