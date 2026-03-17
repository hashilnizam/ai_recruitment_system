const axios = require('axios');

async function debugResumesAPI() {
    try {
        console.log('🔍 DEBUGGING RESUMES API');
        console.log('========================\n');
        
        // Login
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@analytics.com',
            password: 'test123'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ Login successful');
        
        // Check recruiter resumes API
        console.log('\n📄 Testing Recruiter Resumes API');
        try {
            const resumesResponse = await axios.get('http://localhost:5000/api/recruiter/resumes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Resumes API Response:', resumesResponse.data);
            console.log('   Count:', resumesResponse.data.data.length);
        } catch (error) {
            console.log('❌ Resumes API Error:', error.message);
            if (error.response) {
                console.log('   Status:', error.response.status);
                console.log('   Data:', error.response.data);
            }
        }
        
        // Check applications API
        console.log('\n📋 Testing Applications API');
        try {
            const appsResponse = await axios.get('http://localhost:5000/api/applications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Applications API Response:', appsResponse.data);
            console.log('   Count:', appsResponse.data.data.length);
            
            const pendingApps = appsResponse.data.data.filter(app => app.status === 'pending');
            console.log('   Pending:', pendingApps.length);
        } catch (error) {
            console.log('❌ Applications API Error:', error.message);
            if (error.response) {
                console.log('   Status:', error.response.status);
                console.log('   Data:', error.response.data);
            }
        }
        
        // Check database directly
        console.log('\n🗄️ Checking Database Directly');
        const db = require('./src/config/database');
        
        try {
            const resumesQuery = 'SELECT * FROM recruiter_resumes WHERE recruiter_id = ?';
            const resumesResult = await db.execute(resumesQuery, [19]); // Recruiter ID from earlier
            console.log('✅ Database Resumes:', resumesResult.length);
            resumesResult.forEach((resume, index) => {
                console.log(`   📄 ${index + 1}. ${resume.original_name} (ID: ${resume.id})`);
            });
        } catch (error) {
            console.log('❌ Database Resume Check Error:', error.message);
        }
        
        try {
            const appsQuery = 'SELECT a.*, u.first_name, u.last_name FROM applications a JOIN users u ON a.candidate_id = u.id WHERE a.status = ?';
            const appsResult = await db.execute(appsQuery, ['pending']);
            console.log('✅ Database Applications:', appsResult.length);
            appsResult.forEach((app, index) => {
                console.log(`   📋 ${index + 1}. ${app.first_name} ${app.last_name} - Status: ${app.status}`);
            });
        } catch (error) {
            console.log('❌ Database Applications Check Error:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    } finally {
        process.exit(0);
    }
}

debugResumesAPI();
