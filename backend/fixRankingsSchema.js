const db = require('./src/config/database');

async function fixRankingsSchema() {
  try {
    console.log('🔧 Fixing rankings table schema...');
    
    // Make application_id nullable
    await db.query(`
      ALTER TABLE rankings 
      MODIFY COLUMN application_id INT NULL
    `);
    
    console.log('✅ Made application_id nullable');
    
    // Check the updated schema
    const columns = await db.query('DESCRIBE rankings');
    console.log('📋 Updated rankings table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? '(' + col.Key + ')' : ''}`);
    });
    
    console.log('🎉 Schema fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error);
  } finally {
    process.exit();
  }
}

fixRankingsSchema();
