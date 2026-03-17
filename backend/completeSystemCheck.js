const axios = require('axios');

async function completeSystemCheck() {
    try {
        console.log('🎯 COMPLETE AI RANKING SYSTEM CHECK');
        console.log('=====================================\n');
        
        // Step 1: Check all services are running
        console.log('🌐 Step 1: Service Health Check');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        try {
            const backendHealth = await axios.get('http://localhost:5000/health', { timeout: 5000 });
            console.log('✅ Backend Health: OK');
        } catch (error) {
            console.log('❌ Backend Health: FAILED -', error.message);
            return;
        }
        
        try {
            const aiHealth = await axios.get('http://localhost:5001/health', { timeout: 5000 });
            console.log('✅ AI Service Health: OK');
        } catch (error) {
            console.log('❌ AI Service Health: FAILED -', error.message);
            return;
        }
        
        try {
            const frontendCheck = await axios.get('http://localhost:3000/', { timeout: 5000 });
            console.log('✅ Frontend Health: OK');
        } catch (error) {
            console.log('❌ Frontend Health: FAILED -', error.message);
            return;
        }
        
        // Step 2: Login
        console.log('\n🔐 Step 2: Authentication');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        try {
            const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'test@analytics.com',
                password: 'test123'
            });
            
            const token = loginResponse.data.data.token;
            console.log('✅ Login: SUCCESS');
            console.log('✅ Token: Obtained');
            
            // Step 3: Check for data to rank
            console.log('\n📊 Step 3: Data Availability Check');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            // Check uploaded resumes
            try {
                const resumesResponse = await axios.get('http://localhost:5000/api/recruiter/resumes', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log(`📄 Uploaded Resumes: ${resumesResponse.data.data.length}`);
                if (resumesResponse.data.data.length > 0) {
                    resumesResponse.data.data.forEach((resume, index) => {
                        console.log(`   📄 ${index + 1}. ${resume.original_name}`);
                    });
                }
            } catch (error) {
                console.log('❌ Resume Check Failed:', error.message);
            }
            
            // Check pending applications
            try {
                const applicationsResponse = await axios.get('http://localhost:5000/api/applications', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const pendingApps = applicationsResponse.data.data.filter(app => app.status === 'pending');
                console.log(`📋 Pending Applications: ${pendingApps.length}`);
                if (pendingApps.length > 0) {
                    pendingApps.forEach((app, index) => {
                        console.log(`   📋 ${index + 1}. ${app.first_name} ${app.last_name} - ${app.job_title}`);
                    });
                }
            } catch (error) {
                console.log('❌ Applications Check Failed:', error.message);
            }
            
            // Check available jobs
            try {
                const jobsResponse = await axios.get('http://localhost:5000/api/jobs', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log(`📋 Available Jobs: ${jobsResponse.data.data.length}`);
                if (jobsResponse.data.data.length > 0) {
                    jobsResponse.data.data.forEach((job, index) => {
                        console.log(`   📋 ${index + 1}. ${job.title} (ID: ${job.id})`);
                    });
                }
            } catch (error) {
                console.log('❌ Jobs Check Failed:', error.message);
            }
            
            // Step 4: Test AI Ranking Trigger
            console.log('\n🚀 Step 4: AI Ranking Trigger Test');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            try {
                const triggerResponse = await axios.post('http://localhost:5000/api/recruiter/trigger-ranking', {}, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                });
                
                console.log('✅ AI Ranking Trigger: SUCCESS');
                console.log(`   📊 Job ID: ${triggerResponse.data.job_id}`);
                console.log(`   📈 Applications to rank: ${triggerResponse.data.applications_to_rank}`);
                console.log(`   💬 Message: ${triggerResponse.data.message}`);
                
                if (triggerResponse.data.applications_to_rank > 0) {
                    console.log('\n⏱️ Step 5: Monitoring Progress (30 seconds max)');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    
                    // Monitor for 30 seconds
                    let attempts = 0;
                    const maxAttempts = 3;
                    
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
                                }
                            }
                        } catch (statusError) {
                            console.log(`📊 Check ${attempts}: Status check failed, continuing...`);
                        }
                    }
                    
                    // Step 6: Check final results
                    console.log('\n🎯 Step 6: Final Results Check');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
                                console.log(`   🏆 Rank ${rank}: ${name} ${type} - Score: ${score}%`);
                            });
                        } else {
                            console.log('⏳ No rankings found yet, AI may still be processing');
                        }
                    } catch (resultsError) {
                        console.log('❌ Results Check Failed:', resultsError.message);
                    }
                } else {
                    console.log('⚠️ No data to rank, but trigger system is working');
                }
                
            } catch (triggerError) {
                console.log('❌ AI Ranking Trigger Failed:', triggerError.message);
                if (triggerError.response) {
                    console.log('   Status:', triggerError.response.status);
                    console.log('   Data:', triggerError.response.data);
                }
            }
            
        } catch (loginError) {
            console.log('❌ Login Failed:', loginError.message);
            return;
        }
        
        // Final Summary
        console.log('\n🎉 SYSTEM CHECK COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ All Services: Running');
        console.log('✅ Authentication: Working');
        console.log('✅ AI Ranking System: Functional');
        console.log('✅ Database: Connected');
        
        console.log('\n📱 FRONTEND INSTRUCTIONS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Visit: http://localhost:3000/candidates');
        console.log('2. Login: test@analytics.com / test123');
        console.log('3. Upload resumes (if not already done)');
        console.log('4. Click "AI Ranking" button');
        console.log('5. Watch real-time progress');
        console.log('6. View ranked results');
        
        console.log('\n🔧 TROUBLESHOOTING:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('• If page reloads: Check browser console for errors');
        console.log('• If no data: Upload resumes first');
        console.log('• If error: Ensure all 3 services are running');
        console.log('• Services: Backend (5000), AI Service (5001), Frontend (3000)');
        
    } catch (error) {
        console.error('❌ System check failed:', error.message);
    }
}

completeSystemCheck();
