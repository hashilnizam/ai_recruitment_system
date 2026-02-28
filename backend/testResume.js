const db = require('./src/config/database');

async function checkResume() {
  try {
    const result = await db.query('SELECT * FROM recruiter_resumes WHERE id = ?', [165]);
    console.log('Resume 165:', result);
    if (result.length > 0) {
      console.log('File path:', result[0].file_path);
      console.log('File exists:', require('fs').existsSync(result[0].file_path));
    }
  } catch (error) {
    console.error('Database error:', error);
  }
}

checkResume();
