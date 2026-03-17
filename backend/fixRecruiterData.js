const db = require('./src/config/database');

async function fixRecruiterData() {
    try {
        console.log('🔧 FIXING RECRUITER DATA');
        console.log('========================\n');
        
        // Get the correct recruiter ID
        const recruiterQuery = 'SELECT id, email FROM users WHERE role = ? AND email = ?';
        const recruiterResult = await db.execute(recruiterQuery, ['recruiter', 'test@analytics.com']);
        
        if (!recruiterResult || recruiterResult.length === 0) {
            console.log('❌ Recruiter not found');
            return;
        }
        
        const recruiter = recruiterResult[0];
        console.log(`✅ Found recruiter: ${recruiter.email} (ID: ${recruiter.id})`);
        
        // Check existing resumes for this recruiter
        const existingResumesQuery = 'SELECT * FROM recruiter_resumes WHERE recruiter_id = ?';
        const existingResumes = await db.execute(existingResumesQuery, [recruiter.id]);
        console.log(`📄 Existing resumes for recruiter ${recruiter.id}: ${existingResumes.length}`);
        
        // Add test resumes for this recruiter
        if (existingResumes.length === 0) {
            console.log('📄 Adding test resumes...');
            
            const testResumes = [
                {
                    recruiter_id: recruiter.id,
                    original_name: 'John_Developer.pdf',
                    filename: 'resume_1.pdf',
                    file_path: './uploads/test_resumes/john_resume.pdf',
                    file_size: 1024000
                },
                {
                    recruiter_id: recruiter.id,
                    original_name: 'Jane_Engineer.pdf',
                    filename: 'resume_2.pdf',
                    file_path: './uploads/test_resumes/jane_resume.pdf',
                    file_size: 950000
                }
            ];
            
            for (const resume of testResumes) {
                const insertQuery = `
                INSERT INTO recruiter_resumes (recruiter_id, original_name, filename, file_path, file_size, uploaded_at)
                VALUES (?, ?, ?, ?, ?, NOW())
                `;
                await db.execute(insertQuery, [
                    resume.recruiter_id,
                    resume.original_name,
                    resume.filename,
                    resume.file_path,
                    resume.file_size
                ]);
                console.log(`✅ Added resume: ${resume.original_name}`);
            }
        } else {
            existingResumes.forEach((resume, index) => {
                console.log(`   📄 ${index + 1}. ${resume.original_name} (ID: ${resume.id})`);
            });
        }
        
        // Check existing applications for this recruiter's jobs
        const jobsQuery = 'SELECT id FROM jobs WHERE recruiter_id = ?';
        const jobs = await db.execute(jobsQuery, [recruiter.id]);
        console.log(`📋 Jobs for recruiter ${recruiter.id}: ${jobs.length}`);
        
        if (jobs.length > 0) {
            const jobId = jobs[0].id;
            
            const existingAppsQuery = 'SELECT COUNT(*) as count FROM applications WHERE job_id = ? AND status = ?';
            const existingApps = await db.execute(existingAppsQuery, [jobId, 'pending']);
            console.log(`📋 Pending applications for job ${jobId}: ${existingApps[0].count}`);
            
            if (existingApps[0].count === 0) {
                console.log('👥 Adding test applications...');
                
                // Add test candidates
                const testCandidates = [
                    {
                        email: 'alice.candidate@test.com',
                        first_name: 'Alice',
                        last_name: 'Candidate',
                        password_hash: 'hashed_password_1'
                    },
                    {
                        email: 'bob.candidate@test.com',
                        first_name: 'Bob',
                        last_name: 'Candidate',
                        password_hash: 'hashed_password_2'
                    }
                ];
                
                for (const candidate of testCandidates) {
                    // Add candidate
                    const candidateQuery = `
                    INSERT IGNORE INTO users (email, first_name, last_name, password_hash, role, is_active, created_at, updated_at)
                    VALUES (?, ?, ?, ?, 'candidate', 1, NOW(), NOW())
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
                    const candidateId = candidateResult[0].id;
                    
                    // Add application
                    const applicationQuery = `
                    INSERT IGNORE INTO applications (job_id, candidate_id, status, applied_at, created_at, updated_at)
                    VALUES (?, ?, 'pending', NOW(), NOW(), NOW())
                    `;
                    await db.execute(applicationQuery, [jobId, candidateId]);
                    console.log(`✅ Added application: ${candidate.first_name} ${candidate.last_name}`);
                }
            }
        }
        
        // Final check
        console.log('\n🔍 FINAL DATA CHECK:');
        
        const finalResumes = await db.execute(existingResumesQuery, [recruiter.id]);
        console.log(`📄 Total resumes: ${finalResumes.length}`);
        
        if (jobs.length > 0) {
            const finalApps = await db.execute(existingAppsQuery, [jobs[0].id, 'pending']);
            console.log(`📋 Total pending applications: ${finalApps[0].count}`);
        }
        
        console.log('\n🎉 DATA FIX COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Recruiter data fixed');
        console.log('✅ Test resumes added');
        console.log('✅ Test applications added');
        
        console.log('\n📱 NOW TEST AI RANKING:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Visit: http://localhost:3000/candidates');
        console.log('2. Login: test@analytics.com / test123');
        console.log('3. Click "AI Ranking" button');
        console.log('4. Watch real-time processing');
        console.log('5. View ranked results');
        
    } catch (error) {
        console.error('❌ Fix failed:', error.message);
    } finally {
        process.exit(0);
    }
}

fixRecruiterData();
