const axios = require('axios');

async function debugRankingError() {
    try {
        console.log('🔍 DEBUGGING AI RANKING ERROR');
        console.log('================================\n');
        
        // Step 1: Login to get token
        console.log('🔐 Step 1: Login');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@analytics.com',
            password: 'test123'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ Login successful');
        
        // Step 2: Test AI Service directly
        console.log('\n🤖 Step 2: Test AI Service Directly');
        try {
            const aiResponse = await axios.post('http://localhost:5001/api/rank-candidates', {
                job_id: 23  // Use a known job ID
            }, {
                timeout: 10000,
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('✅ AI Service Response:', aiResponse.data);
        } catch (aiError) {
            console.log('❌ AI Service Error:', aiError.message);
            if (aiError.response) {
                console.log('   Status:', aiError.response.status);
                console.log('   Data:', aiError.response.data);
            }
            return;
        }
        
        // Step 3: Test Backend Trigger Endpoint
        console.log('\n🚀 Step 3: Test Backend Trigger Endpoint');
        try {
            const triggerResponse = await axios.post('http://localhost:5000/api/recruiter/trigger-ranking', {}, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            console.log('✅ Backend Trigger Response:', triggerResponse.data);
        } catch (triggerError) {
            console.log('❌ Backend Trigger Error:', triggerError.message);
            if (triggerError.response) {
                console.log('   Status:', triggerError.response.status);
                console.log('   Data:', triggerError.response.data);
            }
        }
        
        // Step 4: Check if there are any resumes to rank
        console.log('\n📄 Step 4: Check Available Resumes');
        try {
            const resumesResponse = await axios.get('http://localhost:5000/api/recruiter/resumes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Available Resumes:', resumesResponse.data.data.length);
            if (resumesResponse.data.data.length > 0) {
                resumesResponse.data.data.forEach((resume, index) => {
                    console.log(`   📄 ${index + 1}. ${resume.original_name}`);
                });
            }
        } catch (resumeError) {
            console.log('❌ Resume Check Error:', resumeError.message);
        }
        
        // Step 5: Check available jobs
        console.log('\n📋 Step 5: Check Available Jobs');
        try {
            const jobsResponse = await axios.get('http://localhost:5000/api/jobs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Available Jobs:', jobsResponse.data.data.length);
            if (jobsResponse.data.data.length > 0) {
                jobsResponse.data.data.forEach((job, index) => {
                    console.log(`   📋 ${index + 1}. ${job.title} (ID: ${job.id})`);
                });
            }
        } catch (jobsError) {
            console.log('❌ Jobs Check Error:', jobsError.message);
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugRankingError();
