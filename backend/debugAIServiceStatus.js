const db = require('./src/config/database');

async function debugAIServiceStatus() {
    try {
        console.log('🔍 DEBUGGING AI SERVICE STATUS ENDPOINT');
        console.log('=====================================\n');
        
        // Check the processing_jobs table structure
        console.log('📊 Checking processing_jobs table...');
        
        try {
            const tableQuery = 'DESCRIBE processing_jobs';
            const tableStructure = await db.execute(tableQuery);
            console.log('✅ Table structure:');
            tableStructure.forEach((column, index) => {
                console.log(`   ${index + 1}. ${column.Field} - ${column.Type} - ${column.Null} - ${column.Key}`);
            });
        } catch (error) {
            console.log('❌ Table structure check failed:', error.message);
        }
        
        // Check recent processing records
        console.log('\n📊 Checking recent processing records...');
        
        try {
            const recordsQuery = `
            SELECT job_id, status, progress, total_candidates, error_message, started_at, completed_at
            FROM processing_jobs 
            ORDER BY created_at DESC 
            LIMIT 5
            `;
            const records = await db.execute(recordsQuery);
            
            console.log(`✅ Found ${records.length} processing records:`);
            records.forEach((record, index) => {
                console.log(`   ${index + 1}. Job ${record.job_id}: ${record.status} (${record.progress}%) - ${record.total_candidates} candidates`);
                if (record.error_message) {
                    console.log(`      ❌ Error: ${record.error_message}`);
                }
            });
        } catch (error) {
            console.log('❌ Records check failed:', error.message);
        }
        
        // Test the exact query the AI service uses
        console.log('\n📊 Testing AI service query...');
        
        try {
            const testQuery = `
            SELECT status, progress, total_candidates, error_message, started_at, completed_at
            FROM processing_jobs 
            WHERE job_id = 23 
            ORDER BY created_at DESC 
            LIMIT 1
            `;
            const result = await db.execute(testQuery);
            
            console.log('✅ Test query result:', result);
            
            if (result && result.length > 0) {
                console.log('✅ Query works correctly');
            } else {
                console.log('❌ Query returned no results');
            }
        } catch (error) {
            console.log('❌ Test query failed:', error.message);
        }
        
        console.log('\n🎉 DEBUG COMPLETE!');
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    } finally {
        process.exit(0);
    }
}

debugAIServiceStatus();
