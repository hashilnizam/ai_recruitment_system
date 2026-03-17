// Simple test to verify rankings API integration
// Replace the entire fetchData function with this version

const fetchData = async () => {
    try {
        setLoading(true);
        
        console.log('🔍 SIMPLE FETCH TEST - Starting');
        
        // Get token
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No token found');
            return;
        }
        
        // Test rankings API directly
        console.log('📊 Testing rankings API calls...');
        
        try {
            const response23 = await fetch('/api/rankings/job/23', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📊 Job 23 Response:', {
                status: response23.status,
                ok: response23.ok,
                url: response23.url
            });
            
            if (response23.ok) {
                const data23 = await response23.json();
                console.log('✅ Job 23 Data:', data23);
                console.log(`📊 Found ${data23.data?.length || 0} candidates`);
                
                // Show ranked candidates
                data23.data?.forEach((candidate, index) => {
                    const score = candidate.total_score || 0;
                    const rank = candidate.rank_position || 'N/A';
                    const name = candidate.first_name + ' ' + (candidate.last_name || '');
                    console.log(`   🏆 ${index + 1}. Rank ${rank}: ${name} - Score: ${score}%`);
                });
            } else {
                console.error('❌ Job 23 failed:', response23.statusText);
            }
            
        } catch (error) {
            console.error('❌ Job 23 error:', error);
        }
        
        try {
            const response22 = await fetch('/api/rankings/job/22', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📊 Job 22 Response:', {
                status: response22.status,
                ok: response22.ok,
                url: response22.url
            });
            
            if (response22.ok) {
                const data22 = await response22.json();
                console.log('✅ Job 22 Data:', data22);
                console.log(`📊 Found ${data22.data?.length || 0} candidates`);
            } else {
                console.error('❌ Job 22 failed:', response22.statusText);
            }
            
        } catch (error) {
            console.error('❌ Job 22 error:', error);
        }
        
        console.log('🎉 SIMPLE TEST COMPLETE!');
        console.log('If you see this in browser console, rankings API is working');
        
    } catch (error) {
        console.error('❌ Fetch error:', error);
    } finally {
        setLoading(false);
    }
};

// Export to use in page
export { fetchData };
