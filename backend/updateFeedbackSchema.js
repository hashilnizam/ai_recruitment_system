const db = require('./src/config/database');

async function updateFeedbackSchema() {
  try {
    console.log('🔧 Updating feedback table schema...');
    
    // Add candidate_id column
    await db.query(`
      ALTER TABLE feedback 
      ADD COLUMN candidate_id INT NULL,
      ADD INDEX idx_candidate_id (candidate_id)
    `);
    
    console.log('✅ Added candidate_id column to feedback table');
    
    // Check the updated schema
    const columns = await db.query('DESCRIBE feedback');
    console.log('📋 Updated feedback table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? '(' + col.Key + ')' : ''}`);
    });
    
    console.log('🎉 Feedback schema updated successfully!');
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ candidate_id column already exists');
    } else {
      console.error('❌ Error updating schema:', error);
    }
  } finally {
    process.exit();
  }
}

updateFeedbackSchema();
