const db = require('./src/config/database');

async function checkApplications() {
    try {
        console.log('🔍 CHECKING AVAILABLE APPLICATIONS');
        console.log('==================================\n');
        
        // Get recruiter info
        const recruiterQuery = 'SELECT id FROM users WHERE email = ? AND role = ?';
        const recruiterResult = await db.execute(recruiterQuery, ['test@analytics.com', 'recruiter']);
        
        if (!recruiterResult || recruiterResult.length === 0) {
            console.log('❌ Recruiter not found');
            return;
        }
        
        const recruiterId = recruiterResult[0].id;
        console.log(`✅ Recruiter ID: ${recruiterId}`);
        
        // Get jobs for this recruiter
        const jobsQuery = 'SELECT id, title FROM jobs WHERE recruiter_id = ?';
        const jobs = await db.execute(jobsQuery, [recruiterId]);
        console.log(`✅ Found ${jobs.length} jobs:`);
        jobs.forEach((job, index) => {
            console.log(`   📋 ${index + 1}. ${job.title} (ID: ${job.id})`);
        });
        
        if (jobs.length === 0) {
            console.log('❌ No jobs found');
            return;
        }
        
        // Check applications for each job
        for (const job of jobs) {
            console.log(`\n📊 Applications for Job ${job.id} (${job.title}):`);
            
            const appsQuery = `
            SELECT a.id, a.candidate_id, a.status, a.applied_at,
                   u.first_name, u.last_name, u.email
            FROM applications a
            JOIN users u ON a.candidate_id = u.id
            WHERE a.job_id = ?
            `;
            const applications = await db.execute(appsQuery, [job.id]);
            
            console.log(`   📋 Total applications: ${applications.length}`);
            
            const pendingApps = applications.filter(app => app.status === 'pending');
            console.log(`   ⏳ Pending applications: ${pendingApps.length}`);
            
            for (let i = 0; i < applications.length; i++) {
                const app = applications[i];
                const status = app.status === 'pending' ? '⏳ Pending' : '✅ ' + app.status;
                console.log(`   ${i + 1}. ${app.first_name} ${app.last_name} (${app.email}) - ${status}`);
                
                // Check if candidate has skills
                const skillsQuery = 'SELECT COUNT(*) as count FROM skills WHERE application_id = ?';
                const skillsResult = await db.execute(skillsQuery, [app.id]);
                console.log(`      🎯 Skills: ${skillsResult[0].count}`);
                
                // Check if candidate has education
                const eduQuery = 'SELECT COUNT(*) as count FROM education WHERE application_id = ?';
                const eduResult = await db.execute(eduQuery, [app.id]);
                console.log(`      🎓 Education: ${eduResult[0].count}`);
                
                // Check if candidate has experience
                const expQuery = 'SELECT COUNT(*) as count FROM experience WHERE application_id = ?';
                const expResult = await db.execute(expQuery, [app.id]);
                console.log(`      💼 Experience: ${expResult[0].count}`);
            }
        }
        
        // Check recruiter resumes
        console.log('\n📄 Recruiter Resume Uploads:');
        const resumesQuery = `
        SELECT id, original_name, uploaded_at
        FROM recruiter_resumes
        WHERE recruiter_id = ?
        `;
        const resumes = await db.execute(resumesQuery, [recruiterId]);
        console.log(`   📄 Total resume uploads: ${resumes.length}`);
        resumes.forEach((resume, index) => {
            console.log(`   ${index + 1}. ${resume.original_name} (ID: ${resume.id})`);
        });
        
        // Check what the AI ranking query would find
        console.log('\n🤖 AI Ranking Query Simulation:');
        for (const job of jobs) {
            console.log(`\n📊 Job ${job.id} - What AI Service Will Process:`);
            
            // Simulate the AI service query
            const appsQuery = `
            SELECT a.id, a.candidate_id, CAST(u.first_name AS CHAR) as first_name, CAST(u.last_name AS CHAR) as last_name, CAST(u.email AS CHAR) as email, 
                   CASE WHEN u.email LIKE 'resume-%@upload.local' THEN true ELSE false END as is_resume_upload
            FROM applications a
            JOIN users u ON a.candidate_id = u.id
            WHERE a.job_id = ? AND a.status = 'pending'
            `;
            const applications = await db.execute(appsQuery, [job.id]);
            
            const resumesQuery = `
            SELECT r.id, r.recruiter_id, r.original_name, r.file_path,
                   CAST(SUBSTRING_INDEX(r.original_name, '.', 1) AS CHAR) as first_name,
                   '' as last_name,
                   'resume-upload@system.com' as email,
                   true as is_resume_upload,
                   r.id as candidate_id
            FROM recruiter_resumes r
            WHERE r.recruiter_id = (SELECT recruiter_id FROM jobs WHERE id = ?)
            `;
            const resumes = await db.execute(resumesQuery, [job.id]);
            
            const allCandidates = applications.concat(resumes);
            console.log(`   🎯 Total candidates to rank: ${allCandidates.length}`);
            
            allCandidates.forEach((candidate, index) => {
                const type = candidate.is_resume_upload ? '📄 Resume Upload' : '👤 Application';
                const name = candidate.first_name + ' ' + candidate.last_name;
                console.log(`   ${index + 1}. ${name} - ${type}`);
            });
        }
        
        console.log('\n🎉 CHECK COMPLETE!');
        
    } catch (error) {
        console.error('❌ Check failed:', error.message);
    } finally {
        process.exit(0);
    }
}

checkApplications();
