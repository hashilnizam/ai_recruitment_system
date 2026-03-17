// Add this to the beginning of fetchData() function in candidates/page.tsx
// to debug why rankings API is not being called

console.log('🔍 DEBUGGING FRONTEND API CALLS');
console.log('================================');

console.log('📊 User ID:', user?.id);
console.log('📊 Token available:', !!localStorage.getItem('token'));
console.log('📊 Jobs count:', jobsList?.length);

jobsList?.forEach((job, index) => {
    console.log(`📋 Job ${index + 1}: ${job.title} (ID: ${job.id})`);
});

console.log('\n🌐 Starting API calls...');
console.log('Watch for these calls in browser Network tab:');
console.log('1. GET /api/rankings/job/23');
console.log('2. GET /api/rankings/job/22'); 
console.log('3. GET /api/resumes');

// Add this inside the for loop before rankings API call
console.log(`📊 About to call rankings API for job ${job.id}...`);

// Add this after rankings API call
console.log(`✅ Rankings API response for job ${job.id}:`, {
    status: rankingsResponse.status,
    ok: rankingsResponse.ok,
    dataLength: rankingsData.data?.length || 0
});

// Add error handling
if (!rankingsResponse.ok) {
    console.error(`❌ Rankings API Error:`, {
        status: rankingsResponse.status,
        statusText: rankingsResponse.statusText,
        url: `/api/rankings/job/${job.id}`
    });
}
