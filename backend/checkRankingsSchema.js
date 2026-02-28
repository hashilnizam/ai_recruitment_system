const db = require('./src/config/database');

db.query('DESCRIBE rankings').then(columns => {
  console.log('📋 Rankings table structure:');
  columns.forEach(col => {
    console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? '(' + col.Key + ')' : ''}`);
  });
}).catch(console.error).finally(() => process.exit());
