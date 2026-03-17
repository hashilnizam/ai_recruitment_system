const axios = require('axios');

async function testFinalRanking() {
    try {
        console.log('🎯 TESTING FINAL AI RANKING AFTER CLEANUP');
        console.log('==========================================\n');
        
        // Step 1: Login
        console.log('🔐 Step 1: Authentication');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@analytics.com',
            password: 'test123'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ Login successful');
        
        // Step 2: Trigger AI Ranking
        console.log('\n🚀 Step 2: Trigger AI Ranking');
        const triggerResponse = await axios.post('http://localhost:5000/api/recruiter/trigger-ranking', {}, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Backend Trigger Response:', triggerResponse.data);
        console.log('✅ Backend Trigger Status:', triggerResponse.status);
        
        if (triggerResponse.data.success) {
            const jobId = triggerResponse.data.job_id;
            console.log(`📊 Job ${jobId} ranking started successfully!`);
            
            // Step 3: Monitor Progress
            console.log('\n⏱️ Step 3: Monitor Progress');
            let attempts = 0;
            const maxAttempts = 4;
            
            while (attempts < maxAttempts) {
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds
                
                try {
                    const statusResponse = await axios.get(`http://localhost:5001/api/ranking-status/${jobId}`);
                    const status = statusResponse.data.data;
                    
                    console.log(`📊 Check ${attempts}: Status=${status.status}, Progress=${status.progress}%`);
                    
                    if (status.status === 'completed') {
                        console.log('✅ AI Ranking Completed!');
                        
                        // Step 4: Check Results
                        console.log('\n🎯 Step 4: Check Results');
                        
                        const rankingsResponse = await axios.get(`http://localhost:5000/api/rankings/job/${jobId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        
                        const rankedCandidates = rankingsResponse.data.data || [];
                        console.log(`📊 Found ${rankedCandidates.length} ranked candidates:`);
                        
                        rankedCandidates.forEach((candidate, index) => {
                            const score = candidate.total_score || 0;
                            const rank = candidate.rank_position || 'N/A';
                            const name = candidate.first_name + ' ' + (candidate.last_name || '');
                            const type = candidate.is_resume_upload ? '(Resume)' : '(Application)';
                            console.log(`   🏆 ${index + 1}. Rank ${rank}: ${name} ${type} - Score: ${score}%`);
                        });
                        
                        break;
                    } else if (status.status === 'failed') {
                        console.log('❌ AI Ranking Failed:', status.error_message);
                        break;
                    }
                } catch (error) {
                    console.log(`📊 Check ${attempts}: Status check failed -`, error.message);
                }
            }
            
        } else {
            console.log('❌ AI Ranking Trigger Failed:', triggerResponse.data);
        }
        
        console.log('\n🎉 TEST COMPLETE!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        process.exit(0);
    }
}

testFinalRanking();
