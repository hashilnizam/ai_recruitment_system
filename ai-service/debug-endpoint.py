import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db

def test_rank_endpoint():
    """Test the rank-candidates endpoint directly"""
    try:
        print("🔍 TESTING RANK-CANDIDATES ENDPOINT DIRECTLY")
        print("==========================================")
        
        # Test the exact request the backend makes
        test_data = {
            "job_id": 23
        }
        
        print(f"📤 Sending request: {test_data}")
        
        # Create a test request context
        with app.test_client() as client:
            response = client.post('/api/rank-candidates', 
                               json=test_data,
                               content_type='application/json')
            
            print(f"✅ Response Status: {response.status_code}")
            print(f"✅ Response Data: {response.get_json()}")
            
            if response.status_code == 200:
                print("✅ Endpoint is working correctly!")
            else:
                print(f"❌ Endpoint returned error: {response.status_code}")
                print(f"❌ Error details: {response.get_json()}")
                
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_rank_endpoint()
