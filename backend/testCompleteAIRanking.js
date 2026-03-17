const axios = require('axios');

async function testCompleteAIRanking() {
    try {
        console.log('🎯 COMPLETE AI RANKING FLOW TEST');
        console.log('=====================================\n');
        
        // Step 1: Test AI Service Health
        console.log('📊 Step 1: Testing AI Service Health');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        try {
            const healthResponse = await axios.get('http://localhost:5001/health', { timeout: 5000 });
            console.log('✅ AI Service Health:', healthResponse.data.message);
        } catch (error) {
            console.log('❌ AI Service not responding:', error.message);
            return;
        }
        
        // Step 2: Test Backend Login
        console.log('\n🔐 Step 2: Testing Backend Login');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        try {
            const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'test@analytics.com',
                password: 'test123'
            });
            
            const token = loginResponse.data.data.token;
            console.log('✅ Backend Login: SUCCESS');
            console.log('✅ Token obtained');
            
            // Step 3: Get Jobs
            console.log('\n📋 Step 3: Getting Jobs for Ranking');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            const jobsResponse = await axios.get('http://localhost:5000/api/jobs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (jobsResponse.data.success && jobsResponse.data.data.length > 0) {
                const latestJob = jobsResponse.data.data[0];
                console.log(`✅ Found job: ${latestJob.title} (ID: ${latestJob.id})`);
                
                // Step 4: Check for Resumes to Rank
                console.log('\n📄 Step 4: Checking for Resumes to Rank');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                const resumesResponse = await axios.get('http://localhost:5000/api/recruiter/resumes', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (resumesResponse.data.success && resumesResponse.data.data.length > 0) {
                    console.log(`✅ Found ${resumesResponse.data.data.length} uploaded resumes`);
                    resumesResponse.data.data.forEach((resume, index) => {
                        console.log(`   📄 ${index + 1}. ${resume.original_name}`);
                    });
                    
                    // Step 5: Trigger AI Ranking
                    console.log('\n🚀 Step 5: Triggering AI Ranking');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    try {
                        const rankingResponse = await axios.post('http://localhost:5000/api/recruiter/trigger-ranking', {}, {
                            headers: { 'Authorization': `Bearer ${token}` },
                            timeout: 30000
                        });
                        
                        console.log('✅ AI Ranking Triggered:');
                        console.log(`   📊 Job ID: ${rankingResponse.data.job_id}`);
                        console.log(`   📈 Applications to rank: ${rankingResponse.data.applications_to_rank}`);
                        console.log(`   💬 Message: ${rankingResponse.data.message}`);
                        
                        // Step 6: Monitor Progress
                        console.log('\n⏱️ Step 6: Monitoring AI Ranking Progress');
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log('⏳ Waiting for AI processing to complete...');
                        
                        // Poll for completion
                        let attempts = 0;
                        const maxAttempts = 30; // 5 minutes max
                        
                        while (attempts < maxAttempts) {
                            attempts++;
                            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
                            
                            try {
                                const statusResponse = await axios.get(`http://localhost:5001/api/ranking-status/${rankingResponse.data.job_id}`, {
                                    timeout: 5000
                                });
                                
                                if (statusResponse.data.success) {
                                    const status = statusResponse.data.data;
                                    console.log(`📊 Attempt ${attempts}: Status=${status.status}, Progress=${status.progress}%, Candidates=${status.total_candidates}`);
                                    
                                    if (status.status === 'completed') {
                                        console.log('✅ AI Ranking Completed!');
                                        break;
                                    } else if (status.status === 'failed') {
                                        console.log('❌ AI Ranking Failed:', status.error_message);
                                        break;
                                    }
                                }
                            } catch (statusError) {
                                console.log(`📊 Attempt ${attempts}: Status check failed, continuing...`);
                            }
                        }
                        
                        if (attempts >= maxAttempts) {
                            console.log('⏱️ Maximum wait time reached, checking results anyway...');
                        }
                        
                        // Step 7: Check Results
                        console.log('\n🎯 Step 7: Checking Ranking Results');
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        const rankingsResponse = await axios.get(`http://localhost:5000/api/rankings/job/${rankingResponse.data.job_id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        
                        if (rankingsResponse.data.success) {
                            console.log(`✅ Found ${rankingsResponse.data.data.length} ranked candidates:`);
                            rankingsResponse.data.data.forEach((candidate, index) => {
                                const score = candidate.total_score || 0;
                                const rank = candidate.rank_position || 'N/A';
                                const name = candidate.first_name + ' ' + (candidate.last_name || '');
                                const type = candidate.is_resume_upload ? '(Resume Upload)' : '(Application)';
                                console.log(`   🏆 Rank ${rank}: ${name} ${type} - Score: ${score}%`);
                            });
                        } else {
                            console.log('❌ No ranking results found');
                        }
                        
                    } catch (rankingError) {
                        console.log('❌ Failed to trigger AI ranking:', rankingError.message);
                        if (rankingError.response) {
                            console.log('   Response:', rankingError.response.data);
                        }
                    }
                } else {
                    console.log('❌ No uploaded resumes found to rank');
                    console.log('💡 Please upload some resumes first using the frontend');
                }
            } else {
                console.log('❌ No jobs found');
                console.log('💡 Please create a job first');
            }
            
        } catch (loginError) {
            console.log('❌ Backend login failed:', loginError.message);
        }
        
        console.log('\n🎉 TEST COMPLETED!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📱 Frontend URL: http://localhost:3000/candidates');
        console.log('🔑 Login: test@analytics.com / test123');
        console.log('📄 Upload resumes, then click "AI Ranking" button');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testCompleteAIRanking();
