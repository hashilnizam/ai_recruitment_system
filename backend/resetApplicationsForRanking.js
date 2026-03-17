const db = require('./src/config/database');

async function resetApplicationsForRanking() {
    try {
        console.log('🔄 RESETTING APPLICATIONS FOR AI RANKING');
        console.log('======================================\n');
        
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
        
        // Reset applications to pending status
        console.log('\n🔄 Resetting Applications to Pending Status');
        for (const job of jobs) {
            const resetQuery = `
            UPDATE applications 
            SET status = 'pending', updated_at = NOW()
            WHERE job_id = ? AND status = 'ranked'
            `;
            const resetResult = await db.execute(resetQuery, [job.id]);
            console.log(`✅ Job ${job.id}: Reset ${resetResult.affectedRows} applications to pending`);
        }
        
        // Clean up old rankings and feedback
        console.log('\n🧹 Cleaning Up Old Rankings and Feedback');
        for (const job of jobs) {
            // Get application IDs for this job
            const appsQuery = 'SELECT id FROM applications WHERE job_id = ?';
            const applications = await db.execute(appsQuery, [job.id]);
            
            if (applications.length > 0) {
                // Delete rankings for each application
                for (const app of applications) {
                    await db.execute('DELETE FROM rankings WHERE application_id = ?', [app.id]);
                    await db.execute('DELETE FROM feedback WHERE application_id = ?', [app.id]);
                }
                
                console.log(`✅ Job ${job.id}: Cleaned up old rankings and feedback for ${applications.length} applications`);
            }
        }
        
        // Clean up processing jobs
        console.log('\n🧹 Cleaning Up Processing Jobs');
        for (const job of jobs) {
            const deleteProcessingQuery = 'DELETE FROM processing_jobs WHERE job_id = ?';
            const deleteResult = await db.execute(deleteProcessingQuery, [job.id]);
            console.log(`✅ Job ${job.id}: Deleted ${deleteResult.affectedRows} processing records`);
        }
        
        // Show final status
        console.log('\n📊 Final Status Check');
        for (const job of jobs) {
            const appsQuery = `
            SELECT a.id, a.candidate_id, a.status, a.applied_at,
                   u.first_name, u.last_name, u.email
            FROM applications a
            JOIN users u ON a.candidate_id = u.id
            WHERE a.job_id = ?
            `;
            const applications = await db.execute(appsQuery, [job.id]);
            
            const pendingApps = applications.filter(app => app.status === 'pending');
            console.log(`📋 Job ${job.id} (${job.title}):`);
            console.log(`   📊 Total: ${applications.length}, Pending: ${pendingApps.length}`);
            
            pendingApps.forEach((app, index) => {
                console.log(`   ${index + 1}. ${app.first_name} ${app.last_name} - ⏳ Pending`);
            });
        }
        
        console.log('\n🎉 RESET COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Applications reset to pending status');
        console.log('✅ Old rankings cleaned up');
        console.log('✅ Processing records cleaned up');
        console.log('✅ Ready for fresh AI ranking');
        
        console.log('\n📱 NOW TEST AI RANKING:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Visit: http://localhost:3000/candidates');
        console.log('2. Login: test@analytics.com / test123');
        console.log('3. Click "AI Ranking" button');
        console.log('4. Watch real AI processing with real data');
        console.log('5. See meaningful scores and rankings');
        
        console.log('\n🎯 EXPECTED BEHAVIOR:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('• Applications will be processed with real skills/education/experience');
        console.log('• AI will calculate meaningful scores');
        console.log('• Candidates will be ranked properly');
        console.log('• Results will show in frontend');
        
    } catch (error) {
        console.error('❌ Reset failed:', error.message);
    } finally {
        process.exit(0);
    }
}

resetApplicationsForRanking();
