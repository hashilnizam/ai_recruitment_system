import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from services.ai_service import AIService

def test_ai_service():
    try:
        print("🧪 Testing AI Service...")
        ai_service = AIService()
        
        # Test embedding generation
        test_text = "JavaScript React Node.js Python"
        print(f"📝 Testing embedding for: {test_text}")
        embedding = ai_service.generate_embedding(test_text)
        print(f"✅ Embedding generated: {len(embedding)} dimensions")
        
        # Test resume parsing
        resume_text = """
        John Doe
        Email: john@example.com
        
        Skills:
        - JavaScript (5 years)
        - React (3 years)
        - Python (2 years)
        
        Experience:
        Software Engineer at Tech Corp (2020-2023)
        
        Education:
        B.Tech Computer Science
        """
        
        print("📄 Testing resume parsing...")
        parsed = ai_service.extract_resume_data(resume_text)
        print(f"✅ Resume parsed successfully")
        print(f"   Skills found: {len(parsed.get('skills', []))}")
        print(f"   Experience found: {len(parsed.get('experience', []))}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_ai_service()
