const db = require('./src/config/database');

db.query('DESCRIBE feedback').then(columns => {
  console.log('📋 Feedback table structure:');
  columns.forEach(col => {
    console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
  });
}).catch(console.error).finally(() => process.exit());
