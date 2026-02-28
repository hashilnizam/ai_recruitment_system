const db = require('./src/config/database');

Promise.all([
  db.query('SELECT * FROM processing_jobs WHERE job_id = 14 ORDER BY started_at DESC LIMIT 1'),
  db.query('SELECT COUNT(*) as count FROM rankings WHERE job_id = 14'),
  db.query('SELECT * FROM rankings WHERE job_id = 14 ORDER BY total_score DESC')
]).then(([jobs, rankingsCount, allRankings]) => {
  console.log('⚙️ Processing status:', jobs[0]?.status, 'Progress:', jobs[0]?.progress);
  console.log('📊 Total rankings:', rankingsCount[0].count);
  console.log('🏆 All rankings:');
  allRankings.forEach((r, i) => {
    console.log(`  ${i+1}. Candidate ${r.candidate_id}: ${r.total_score}% (Position: ${r.rank_position})`);
  });
}).catch(console.error).finally(() => process.exit());
