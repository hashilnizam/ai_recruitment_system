const db = require('./src/config/database');
const axios = require('axios');

async function debugRankingFlow() {
    try {
        console.log('🔍 DEBUGGING COMPLETE AI RANKING FLOW');
        console.log('====================================\n');
        
        // Step 1: Check current applications status
        console.log('📊 Step 1: Checking Applications Status');
        const appsQuery = `
        SELECT a.id, a.candidate_id, a.status as app_status, a.job_id,
               u.first_name, u.last_name, u.email,
               r.rank_position, r.total_score, r.skill_score, r.education_score, r.experience_score
        FROM applications a
        JOIN users u ON a.candidate_id = u.id
        LEFT JOIN rankings r ON a.id = r.application_id
        WHERE a.job_id IN (SELECT id FROM jobs WHERE recruiter_id = 8)
        ORDER BY a.job_id, a.id
        `;
        const applications = await db.execute(appsQuery);
        
        console.log(`✅ Found ${applications.length} applications:`);
        applications.forEach((app, index) => {
            const score = app.total_score || 0;
            const rank = app.rank_position || 'N/A';
            console.log(`   ${index + 1}. ${app.first_name} ${app.last_name} - Status: ${app.app_status}, Rank: ${rank}, Score: ${score}%`);
        });
        
        // Step 2: Check rankings table
        console.log('\n🏆 Step 2: Checking Rankings Table');
        const rankingsQuery = `
        SELECT r.*, a.job_id, u.first_name, u.last_name
        FROM rankings r
        LEFT JOIN applications a ON r.application_id = a.id
        LEFT JOIN users u ON r.candidate_id = u.id
        WHERE r.job_id IN (SELECT id FROM jobs WHERE recruiter_id = 8)
        ORDER BY r.job_id, r.rank_position
        `;
        const rankings = await db.execute(rankingsQuery);
        
        console.log(`✅ Found ${rankings.length} rankings:`);
        rankings.forEach((ranking, index) => {
            const score = ranking.total_score || 0;
            const rank = ranking.rank_position || 'N/A';
            const appId = ranking.application_id || 'NULL';
            const type = ranking.is_resume_upload ? '(Resume)' : '(Application)';
            console.log(`   ${index + 1}. ${ranking.first_name} ${ranking.last_name} ${type} - AppID: ${appId}, Rank: ${rank}, Score: ${score}%`);
        });
        
        // Step 3: Check recruiter resumes with rankings
        console.log('\n📄 Step 3: Checking Resume Uploads with Rankings');
        const resumesQuery = `
        SELECT rr.id, rr.original_name, rr.uploaded_at,
               r.rank_position, r.total_score, r.skill_score, r.education_score, r.experience_score
        FROM recruiter_resumes rr
        LEFT JOIN rankings r ON rr.id = r.candidate_id AND r.application_id IS NULL
        WHERE rr.recruiter_id = 8
        ORDER BY rr.uploaded_at
        `;
        const resumes = await db.execute(resumesQuery);
        
        console.log(`✅ Found ${resumes.length} resume uploads:`);
        resumes.forEach((resume, index) => {
            const score = resume.total_score || 0;
            const rank = resume.rank_position || 'N/A';
            console.log(`   ${index + 1}. ${resume.original_name} - Rank: ${rank}, Score: ${score}%`);
        });
        
        // Step 4: Test API response
        console.log('\n🌐 Step 4: Testing API Response');
        try {
            const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'test@analytics.com',
                password: 'test123'
            });
            const token = loginResponse.data.data.token;
            
            const rankingsResponse = await axios.get('http://localhost:5000/api/rankings/job/23', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log(`✅ API returned ${rankingsResponse.data.data.length} candidates:`);
            rankingsResponse.data.data.forEach((candidate, index) => {
                const score = candidate.total_score || 0;
                const rank = candidate.rank_position || 'N/A';
                const type = candidate.is_resume_upload ? '(Resume)' : '(Application)';
                console.log(`   ${index + 1}. ${candidate.first_name} ${candidate.last_name} ${type} - Rank: ${rank}, Score: ${score}%`);
            });
            
            // Check for real scores
            const realScores = rankingsResponse.data.data.filter(c => c.total_score > 0);
            console.log(`\n🎯 REAL SCORES: ${realScores.length} candidates have scores > 0`);
            
        } catch (error) {
            console.log('❌ API test failed:', error.message);
        }
        
        // Step 5: Analyze the issue
        console.log('\n🔍 Step 5: Issue Analysis');
        const pendingApps = applications.filter(app => app.app_status === 'pending');
        const rankedApps = applications.filter(app => app.rank_position !== null);
        const realScores = rankings.filter(r => r.total_score > 0);
        
        console.log(`📊 Applications Status:`);
        console.log(`   ⏳ Pending: ${pendingApps.length}`);
        console.log(`   🏆 Ranked: ${rankedApps.length}`);
        console.log(`   🎯 Real Scores: ${realScores.length}`);
        
        if (pendingApps.length > 0 && rankedApps.length > 0) {
            console.log(`\n⚠️ ISSUE: Applications have rankings but status not updated to 'ranked'`);
        }
        
        if (realScores.length === 0) {
            console.log(`\n⚠️ ISSUE: No real AI scores found`);
        }
        
        console.log('\n🎉 DEBUG COMPLETE!');
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    } finally {
        process.exit(0);
    }
}

debugRankingFlow();
