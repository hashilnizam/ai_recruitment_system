import sys
sys.path.append('/path/to/your/project')

from app import db

def test_connection():
    """Test database connection"""
    try:
        print("🔍 Testing database connection...")
        
        # Test simple query
        result = db.execute_query("SELECT 1 as test")
        print(f"✅ Database connection successful: {result}")
        
        # Test processing_jobs query
        print("\n📊 Testing processing_jobs query...")
        query = """
        SELECT status, progress, total_candidates, error_message, started_at, completed_at
        FROM processing_jobs 
        WHERE job_id = %s 
        ORDER BY created_at DESC 
        LIMIT 1
        """
        
        result = db.execute_query(query, (23,))
        print(f"✅ Processing jobs query successful: {len(result) if result else 0} records")
        
        if result:
            print(f"📊 Latest record: {result[0]}")
        else:
            print("❌ No processing records found")
            
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    test_connection()
