const db = require('./src/config/database');

async function updateRankPositions() {
  try {
    console.log('🔄 Updating rank positions...');
    
    // Get all rankings for job 14, ordered by score (highest first)
    const rankings = await db.query(`
      SELECT * FROM rankings 
      WHERE job_id = 14 
      ORDER BY total_score DESC
    `);
    
    console.log(`📊 Found ${rankings.length} rankings to update`);
    
    // Update positions
    for (let i = 0; i < rankings.length; i++) {
      const ranking = rankings[i];
      const position = i + 1;
      
      await db.query(`
        UPDATE rankings 
        SET rank_position = ? 
        WHERE id = ?
      `, [position, ranking.id]);
      
      console.log(`✅ Updated candidate ${ranking.candidate_id} to position ${position} (${ranking.total_score}%)`);
    }
    
    // Check final results
    const finalRankings = await db.query(`
      SELECT * FROM rankings 
      WHERE job_id = 14 
      ORDER BY rank_position ASC
    `);
    
    console.log('🏆 Final rankings:');
    finalRankings.forEach(r => {
      console.log(`  Position ${r.rank_position}: Candidate ${r.candidate_id} - ${r.total_score}%`);
    });
    
  } catch (error) {
    console.error('❌ Error updating positions:', error);
  } finally {
    process.exit();
  }
}

updateRankPositions();
