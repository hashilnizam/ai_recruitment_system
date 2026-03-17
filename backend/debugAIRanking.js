const axios = require('axios');

async function debugAIRanking() {
    try {
        console.log('🔍 DEBUGGING AI RANKING PROCESS');
        console.log('================================\n');
        
        // Step 1: Login
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@analytics.com',
            password: 'test123'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ Login successful');
        
        // Step 2: Trigger fresh AI ranking
        console.log('\n🚀 Triggering Fresh AI Ranking');
        const triggerResponse = await axios.post('http://localhost:5000/api/recruiter/trigger-ranking', {}, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        
        console.log('✅ AI Ranking Triggered:');
        console.log(`   📊 Job ID: ${triggerResponse.data.job_id}`);
        console.log(`   📈 Applications to rank: ${triggerResponse.data.applications_to_rank}`);
        
        // Step 3: Monitor AI service processing in detail
        console.log('\n🤖 Monitoring AI Service Processing');
        let attempts = 0;
        const maxAttempts = 6; // 1 minute max
        
        while (attempts < maxAttempts) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            
            try {
                const statusResponse = await axios.get(`http://localhost:5001/api/ranking-status/${triggerResponse.data.job_id}`, {
                    timeout: 5000
                });
                
                if (statusResponse.data.success) {
                    const status = statusResponse.data.data;
                    console.log(`📊 Check ${attempts}: Status=${status.status}, Progress=${status.progress}%, Candidates=${status.total_candidates}`);
                    
                    if (status.status === 'completed') {
                        console.log('✅ AI Ranking Completed!');
                        break;
                    } else if (status.status === 'failed') {
                        console.log('❌ AI Ranking Failed:', status.error_message);
                        break;
                    } else if (status.status === 'processing') {
                        console.log(`   ⏳ Still processing...`);
                    }
                }
            } catch (statusError) {
                console.log(`📊 Check ${attempts}: Status check failed -`, statusError.message);
            }
        }
        
        // Step 4: Check detailed results
        console.log('\n🎯 Checking Detailed Results');
        try {
            const rankingsResponse = await axios.get(`http://localhost:5000/api/rankings/job/${triggerResponse.data.job_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (rankingsResponse.data.success && rankingsResponse.data.data.length > 0) {
                console.log(`✅ Found ${rankingsResponse.data.data.length} ranked candidates:`);
                rankingsResponse.data.data.forEach((candidate, index) => {
                    const score = candidate.total_score || 0;
                    const rank = candidate.rank_position || 'N/A';
                    const name = candidate.first_name + ' ' + (candidate.last_name || '');
                    const type = candidate.is_resume_upload ? '(Resume Upload)' : '(Application)';
                    console.log(`   🏆 ${index + 1}. Rank ${rank}: ${name} ${type} - Score: ${score}%`);
                    
                    // Show score breakdown if available
                    if (candidate.score_breakdown) {
                        try {
                            const breakdown = JSON.parse(candidate.score_breakdown);
                            console.log(`      📊 Skills: ${breakdown.skill_score || 0}%, Education: ${breakdown.education_score || 0}%, Experience: ${breakdown.experience_score || 0}%`);
                        } catch (e) {
                            // Score breakdown not parseable
                        }
                    }
                });
            } else {
                console.log('❌ No ranking results found');
            }
        } catch (resultsError) {
            console.log('❌ Results check failed:', resultsError.message);
        }
        
        // Step 5: Check database directly for processing records
        console.log('\n🗄️ Checking Processing Records');
        const db = require('./src/config/database');
        
        try {
            const processingQuery = 'SELECT * FROM processing_jobs ORDER BY created_at DESC LIMIT 5';
            const processingRecords = await db.execute(processingQuery);
            console.log(`✅ Processing Records: ${processingRecords.length} found`);
            processingRecords.forEach((record, index) => {
                console.log(`   📋 ${index + 1}. Job ${record.job_id}: ${record.status} (Progress: ${record.progress}%, Candidates: ${record.total_candidates})`);
                if (record.error_message) {
                    console.log(`      ❌ Error: ${record.error_message}`);
                }
            });
        } catch (error) {
            console.log('❌ Processing records check failed:', error.message);
        }
        
        console.log('\n🎉 DEBUG COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (rankingsResponse && rankingsResponse.data && rankingsResponse.data.data.length > 0) {
            console.log('✅ AI Ranking is working!');
            console.log('✅ Results are being generated');
            console.log('✅ Check the frontend for ranked candidates');
        } else {
            console.log('⚠️ AI Ranking may need attention');
            console.log('⚠️ Check AI service logs for errors');
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    } finally {
        process.exit(0);
    }
}

debugAIRanking();
