import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from config.database import db

def test_ranking_insertion():
    try:
        print("🧪 Testing ranking insertion...")
        
        # Test inserting a ranking for a resume upload
        ranking_query = """
        INSERT INTO rankings 
        (job_id, candidate_id, application_id, skill_score, education_score, experience_score, total_score, rank_position, score_breakdown, is_resume_upload)
        VALUES (%s, %s, NULL, %s, %s, %s, %s, %s, %s, %s)
        """
        
        result = db.execute_query(ranking_query, (
            14,  # job_id
            162, # candidate_id (resume upload)
            85.5, # skill_score
            80.0, # education_score
            75.0, # experience_score
            80.0, # total_score
            1,    # rank_position
            '{"test": "data"}', # score_breakdown
            True  # is_resume_upload
        ))
        
        print(f"✅ Ranking inserted successfully: {result}")
        
        # Check if it was inserted
        rankings = db.execute_query("SELECT * FROM rankings WHERE job_id = 14 AND candidate_id = 162")
        print(f"📊 Found {len(rankings)} rankings")
        if rankings:
            print("🏆 Ranking data:", rankings[0])
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_ranking_insertion()
