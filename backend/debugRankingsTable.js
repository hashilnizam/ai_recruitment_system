const db = require('./src/config/database');

async function debugRankingsTable() {
    try {
        console.log('🔍 Debugging rankings table structure...');
        
        // Get rankings table structure
        const structureQuery = `
        DESCRIBE rankings
        `;
        const structure = await db.execute(structureQuery);
        
        console.log('📊 Rankings Table Structure:');
        console.table(structure);
        
        // Check if application_id column has a default value
        const appIdColumn = structure.find(col => col.Field === 'application_id');
        if (appIdColumn) {
            console.log(`\n🔍 application_id column details:`);
            console.log(`  Type: ${appIdColumn.Type}`);
            console.log(`  Null: ${appIdColumn.Null}`);
            console.log(`  Default: ${appIdColumn.Default}`);
            console.log(`  Extra: ${appIdColumn.Extra}`);
        }
        
        // Check candidate_id column as well
        const candIdColumn = structure.find(col => col.Field === 'candidate_id');
        if (candIdColumn) {
            console.log(`\n🔍 candidate_id column details:`);
            console.log(`  Type: ${candIdColumn.Type}`);
            console.log(`  Null: ${candIdColumn.Null}`);
            console.log(`  Default: ${candIdColumn.Default}`);
            console.log(`  Extra: ${candIdColumn.Extra}`);
        }
        
        // Test inserting a record with NULL application_id
        console.log('\n🧪 Testing insert with NULL application_id...');
        try {
            const testInsert = `
            INSERT INTO rankings (job_id, candidate_id, application_id, skill_score, education_score, experience_score, total_score, rank_position, score_breakdown)
            VALUES (999, 999, NULL, 85.5, 90.0, 80.0, 85.17, 1, '{"test": "data"}')
            `;
            await db.execute(testInsert);
            console.log('✅ Insert with NULL application_id successful');
            
            // Clean up test record
            await db.execute('DELETE FROM rankings WHERE job_id = 999');
            console.log('🧹 Test record cleaned up');
        } catch (error) {
            console.log('❌ Insert with NULL application_id failed:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    } finally {
        process.exit(0);
    }
}

debugRankingsTable();
