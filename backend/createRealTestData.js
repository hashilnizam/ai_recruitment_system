const db = require('./src/config/database');

async function createRealTestData() {
    try {
        console.log('🎯 CREATING REAL TEST DATA FOR AI RANKING');
        console.log('========================================\n');
        
        // Get recruiter ID
        const recruiterQuery = 'SELECT id FROM users WHERE email = ? AND role = ?';
        const recruiterResult = await db.execute(recruiterQuery, ['test@analytics.com', 'recruiter']);
        
        if (!recruiterResult || recruiterResult.length === 0) {
            console.log('❌ Recruiter not found');
            return;
        }
        
        const recruiterId = recruiterResult[0].id;
        console.log(`✅ Using recruiter: ID ${recruiterId}`);
        
        // Get a job
        const jobQuery = 'SELECT id, title FROM jobs WHERE recruiter_id = ? ORDER BY created_at DESC LIMIT 1';
        const jobResult = await db.execute(jobQuery, [recruiterId]);
        
        if (!jobResult || jobResult.length === 0) {
            console.log('❌ No jobs found');
            return;
        }
        
        const job = jobResult[0];
        console.log(`✅ Using job: ${job.title} (ID: ${job.id})`);
        
        // Add real candidate applications with skills, education, and experience
        console.log('\n👥 Adding Real Candidate Applications');
        
        const realCandidates = [
            {
                email: 'sarah.developer@email.com',
                first_name: 'Sarah',
                last_name: 'Developer',
                skills: [
                    { name: 'JavaScript', proficiency_level: 'advanced', years_of_experience: 5 },
                    { name: 'React', proficiency_level: 'advanced', years_of_experience: 4 },
                    { name: 'Node.js', proficiency_level: 'intermediate', years_of_experience: 3 },
                    { name: 'Python', proficiency_level: 'intermediate', years_of_experience: 2 }
                ],
                education: [
                    { degree: 'Bachelor of Science', field_of_study: 'Computer Science', institution: 'Tech University', graduation_year: 2018, gpa: 3.8 }
                ],
                experience: [
                    { job_title: 'Frontend Developer', company: 'Tech Corp', duration_months: 36, start_date: '2020-01-01', end_date: '2022-12-31', is_current: false, description: 'Developed web applications' },
                    { job_title: 'Full Stack Developer', company: 'Startup Inc', duration_months: 24, start_date: '2023-01-01', end_date: 'Present', is_current: true, description: 'Full stack development' }
                ]
            },
            {
                email: 'michael.engineer@email.com',
                first_name: 'Michael',
                last_name: 'Engineer',
                skills: [
                    { name: 'Python', proficiency_level: 'advanced', years_of_experience: 6 },
                    { name: 'Machine Learning', proficiency_level: 'advanced', years_of_experience: 4 },
                    { name: 'TensorFlow', proficiency_level: 'intermediate', years_of_experience: 3 },
                    { name: 'SQL', proficiency_level: 'advanced', years_of_experience: 5 }
                ],
                education: [
                    { degree: 'Master of Science', field_of_study: 'Data Science', institution: 'Data University', graduation_year: 2019, gpa: 3.9 }
                ],
                experience: [
                    { job_title: 'Data Scientist', company: 'AI Company', duration_months: 48, start_date: '2019-06-01', end_date: '2023-05-31', is_current: false, description: 'Built ML models' },
                    { job_title: 'Senior Data Scientist', company: 'Tech Startup', duration_months: 18, start_date: '2023-06-01', end_date: 'Present', is_current: true, description: 'Lead ML projects' }
                ]
            },
            {
                email: 'jennifer.analyst@email.com',
                first_name: 'Jennifer',
                last_name: 'Analyst',
                skills: [
                    { name: 'Python', proficiency_level: 'intermediate', years_of_experience: 3 },
                    { name: 'R', proficiency_level: 'advanced', years_of_experience: 4 },
                    { name: 'Tableau', proficiency_level: 'advanced', years_of_experience: 3 },
                    { name: 'Statistics', proficiency_level: 'intermediate', years_of_experience: 2 }
                ],
                education: [
                    { degree: 'Bachelor of Arts', field_of_study: 'Economics', institution: 'Business University', graduation_year: 2020, gpa: 3.6 }
                ],
                experience: [
                    { job_title: 'Business Analyst', company: 'Finance Corp', duration_months: 30, start_date: '2021-03-01', end_date: '2023-08-31', is_current: false, description: 'Financial analysis' },
                    { job_title: 'Data Analyst', company: 'Analytics Inc', duration_months: 12, start_date: '2023-09-01', end_date: 'Present', is_current: true, description: 'Data analysis and reporting' }
                ]
            }
        ];
        
        for (const candidate of realCandidates) {
            try {
                // Add candidate user
                const candidateQuery = `
                INSERT IGNORE INTO users (email, first_name, last_name, password_hash, role, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'candidate', 1, NOW(), NOW())
                `;
                await db.execute(candidateQuery, [
                    candidate.email,
                    candidate.first_name,
                    candidate.last_name,
                    'hashed_password'
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
                await db.execute(applicationQuery, [job.id, candidateId]);
                
                // Get application ID
                const getApplicationQuery = 'SELECT id FROM applications WHERE candidate_id = ? AND job_id = ?';
                const applicationResult = await db.execute(getApplicationQuery, [candidateId, job.id]);
                const applicationId = applicationResult[0].id;
                
                // Add skills
                for (const skill of candidate.skills) {
                    const skillQuery = `
                    INSERT IGNORE INTO skills (application_id, skill_name, proficiency_level, years_of_experience)
                    VALUES (?, ?, ?, ?)
                    `;
                    await db.execute(skillQuery, [applicationId, skill.name, skill.proficiency_level, skill.years_of_experience]);
                }
                
                // Add education
                for (const edu of candidate.education) {
                    const eduQuery = `
                    INSERT IGNORE INTO education (application_id, degree, field_of_study, institution, graduation_year, gpa)
                    VALUES (?, ?, ?, ?, ?, ?)
                    `;
                    await db.execute(eduQuery, [applicationId, edu.degree, edu.field_of_study, edu.institution, edu.graduation_year, edu.gpa]);
                }
                
                // Add experience
                for (const exp of candidate.experience) {
                    const expQuery = `
                    INSERT IGNORE INTO experience (application_id, job_title, company, duration_months, start_date, end_date, is_current, description)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    await db.execute(expQuery, [applicationId, exp.job_title, exp.company, exp.duration_months, exp.start_date, exp.end_date, exp.is_current, exp.description]);
                }
                
                console.log(`✅ Added candidate: ${candidate.first_name} ${candidate.last_name}`);
                console.log(`   🎯 Skills: ${candidate.skills.length}, Education: ${candidate.education.length}, Experience: ${candidate.experience.length}`);
                
            } catch (error) {
                console.log(`⚠️ Candidate ${candidate.email} may already exist`);
            }
        }
        
        // Clean up old rankings to ensure fresh results
        console.log('\n🧹 Cleaning up old rankings');
        try {
            await db.execute('DELETE FROM rankings WHERE job_id = ?', [job.id]);
            await db.execute('DELETE FROM feedback WHERE application_id IN (SELECT id FROM applications WHERE job_id = ?)', [job.id]);
            console.log('✅ Old rankings cleaned up');
        } catch (error) {
            console.log('⚠️ Cleanup failed:', error.message);
        }
        
        console.log('\n🎉 REAL TEST DATA CREATED!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Added 3 real candidates with complete profiles');
        console.log('✅ Each candidate has skills, education, and experience');
        console.log('✅ Old rankings cleaned up for fresh results');
        
        console.log('\n📱 NOW TEST AI RANKING:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Visit: http://localhost:3000/candidates');
        console.log('2. Login: test@analytics.com / test123');
        console.log('3. Click "AI Ranking" button');
        console.log('4. Watch real AI processing');
        console.log('5. See meaningful scores and rankings');
        
        console.log('\n🎯 EXPECTED RESULTS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('• Sarah Developer: High JavaScript/React score');
        console.log('• Michael Engineer: High Python/ML score');
        console.log('• Jennifer Analyst: High Data Analysis score');
        console.log('• Real AI-powered ranking based on skills match');
        
    } catch (error) {
        console.error('❌ Failed to create test data:', error.message);
    } finally {
        process.exit(0);
    }
}

createRealTestData();
