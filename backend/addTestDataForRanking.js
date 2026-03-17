const db = require('./src/config/database');

async function addTestDataForRanking() {
    try {
        console.log('🎯 ADDING TEST DATA FOR AI RANKING');
        console.log('===================================\n');
        
        // Get recruiter ID
        const recruiterQuery = 'SELECT id FROM users WHERE email = ? AND role = ?';
        const recruiterResult = await db.execute(recruiterQuery, ['test@analytics.com', 'recruiter']);
        
        if (!recruiterResult || recruiterResult.length === 0) {
            console.log('❌ Recruiter not found');
            return;
        }
        
        const recruiterId = recruiterResult[0].id;
        console.log(`✅ Found recruiter: ID ${recruiterId}`);
        
        // Get a job for testing
        const jobQuery = 'SELECT id, title FROM jobs WHERE recruiter_id = ? ORDER BY created_at DESC LIMIT 1';
        const jobResult = await db.execute(jobQuery, [recruiterId]);
        
        if (!jobResult || jobResult.length === 0) {
            console.log('❌ No jobs found for recruiter');
            return;
        }
        
        const job = jobResult[0];
        console.log(`✅ Using job: ${job.title} (ID: ${job.id})`);
        
        // Add test resume uploads
        console.log('\n📄 Adding Test Resume Uploads...');
        
        const testResumes = [
            {
                recruiter_id: recruiterId,
                original_name: 'John_Developer.pdf',
                filename: 'resume_1.pdf',
                file_path: './uploads/test_resumes/john_resume.pdf',
                file_size: 1024000
            },
            {
                recruiter_id: recruiterId,
                original_name: 'Jane_Engineer.pdf',
                filename: 'resume_2.pdf',
                file_path: './uploads/test_resumes/jane_resume.pdf',
                file_size: 950000
            }
        ];
        
        for (const resume of testResumes) {
            try {
                const insertQuery = `
                INSERT INTO recruiter_resumes (recruiter_id, original_name, filename, file_path, file_size, uploaded_at)
                VALUES (?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE original_name = VALUES(original_name)
                `;
                await db.execute(insertQuery, [
                    resume.recruiter_id,
                    resume.original_name,
                    resume.filename,
                    resume.file_path,
                    resume.file_size
                ]);
                console.log(`✅ Added resume: ${resume.original_name}`);
            } catch (error) {
                console.log(`⚠️ Resume ${resume.original_name} may already exist`);
            }
        }
        
        // Add test applications with candidate data
        console.log('\n👥 Adding Test Applications...');
        
        // First, create test candidates if they don't exist
        const testCandidates = [
            {
                email: 'candidate1@test.com',
                first_name: 'Alice',
                last_name: 'Johnson',
                password_hash: 'hashed_password_1'
            },
            {
                email: 'candidate2@test.com',
                first_name: 'Bob',
                last_name: 'Smith',
                password_hash: 'hashed_password_2'
            }
        ];
        
        const candidateIds = [];
        
        for (const candidate of testCandidates) {
            try {
                const candidateQuery = `
                INSERT INTO users (email, first_name, last_name, password_hash, role, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'candidate', 1, NOW(), NOW())
                ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name)
                `;
                await db.execute(candidateQuery, [
                    candidate.email,
                    candidate.first_name,
                    candidate.last_name,
                    candidate.password_hash
                ]);
                
                // Get candidate ID
                const getCandidateQuery = 'SELECT id FROM users WHERE email = ?';
                const candidateResult = await db.execute(getCandidateQuery, [candidate.email]);
                candidateIds.push(candidateResult[0].id);
                console.log(`✅ Added candidate: ${candidate.first_name} ${candidate.last_name}`);
            } catch (error) {
                console.log(`⚠️ Candidate ${candidate.email} may already exist`);
                // Get existing candidate ID
                const getCandidateQuery = 'SELECT id FROM users WHERE email = ?';
                const candidateResult = await db.execute(getCandidateQuery, [candidate.email]);
                candidateIds.push(candidateResult[0].id);
            }
        }
        
        // Add applications for these candidates
        for (const candidateId of candidateIds) {
            try {
                const applicationQuery = `
                INSERT INTO applications (job_id, candidate_id, status, applied_at, created_at, updated_at)
                VALUES (?, ?, 'pending', NOW(), NOW(), NOW())
                ON DUPLICATE KEY UPDATE status = VALUES(status)
                `;
                await db.execute(applicationQuery, [job.id, candidateId]);
                console.log(`✅ Added application for candidate ID: ${candidateId}`);
            } catch (error) {
                console.log(`⚠️ Application for candidate ${candidateId} may already exist`);
            }
        }
        
        // Add test skills for applications
        console.log('\n🎯 Adding Test Skills...');
        const testSkills = [
            { name: 'JavaScript', level: 'advanced', years: 4 },
            { name: 'Python', level: 'intermediate', years: 2 },
            { name: 'React', level: 'advanced', years: 3 },
            { name: 'Node.js', level: 'intermediate', years: 2 }
        ];
        
        for (const candidateId of candidateIds) {
            // Get application ID for this candidate
            const appQuery = 'SELECT id FROM applications WHERE candidate_id = ? AND job_id = ?';
            const appResult = await db.execute(appQuery, [candidateId, job.id]);
            
            if (appResult && appResult.length > 0) {
                const applicationId = appResult[0].id;
                
                for (const skill of testSkills) {
                    try {
                        const skillQuery = `
                        INSERT INTO skills (application_id, skill_name, proficiency_level, years_of_experience)
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE proficiency_level = VALUES(proficiency_level)
                        `;
                        await db.execute(skillQuery, [applicationId, skill.name, skill.level, skill.years]);
                    } catch (error) {
                        // Skill may already exist
                    }
                }
            }
        }
        
        console.log('\n🎉 TEST DATA ADDED SUCCESSFULLY!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Resume uploads: 2 added');
        console.log('✅ Test candidates: 2 added');
        console.log('✅ Applications: 2 added');
        console.log('✅ Skills: Added for each candidate');
        
        console.log('\n📱 NOW YOU CAN TEST AI RANKING:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Visit: http://localhost:3000/candidates');
        console.log('2. Login: test@analytics.com / test123');
        console.log('3. Click "AI Ranking" button');
        console.log('4. Watch real-time processing');
        console.log('5. View ranked results');
        
        console.log('\n🔍 WHAT TO EXPECT:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('• 2 uploaded resumes will be processed');
        console.log('• 2 applications will be processed');
        console.log('• AI will calculate scores for each candidate');
        console.log('• Results will be displayed with rankings');
        console.log('• Total: 4 candidates to rank');
        
    } catch (error) {
        console.error('❌ Failed to add test data:', error.message);
    } finally {
        process.exit(0);
    }
}

addTestDataForRanking();
