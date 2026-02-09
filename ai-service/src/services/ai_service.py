import openai
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client (using v1.3.7 API)
openai.api_key = os.getenv('OPENAI_API_KEY')

class AIService:
    def __init__(self):
        self.model = "gpt-4o-mini"
    
    def generate_embedding(self, text):
        """Generate embedding for given text using OpenAI"""
        try:
            response = openai.Embedding.create(
                model="text-embedding-ada-002",
                input=text
            )
            return np.array(response.data[0].embedding)
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return None
    
    def calculate_skill_match(self, candidate_skills, required_skills):
        """Calculate skill matching score using keyword and semantic similarity"""
        if not candidate_skills or not required_skills:
            return 0.0
        
        # Extract skill names
        candidate_skill_names = [skill.get('skill_name', '').lower() for skill in candidate_skills]
        required_skill_names = [skill.lower() for skill in required_skills]
        
        # Keyword matching (exact matches)
        keyword_matches = len(set(candidate_skill_names) & set(required_skill_names))
        keyword_score = (keyword_matches / len(required_skill_names)) * 100
        
        # Semantic matching using embeddings
        if keyword_matches < len(required_skill_names):
            try:
                candidate_text = ' '.join(candidate_skill_names)
                required_text = ' '.join(required_skill_names)
                
                candidate_embedding = self.generate_embedding(candidate_text)
                required_embedding = self.generate_embedding(required_text)
                
                if candidate_embedding is not None and required_embedding is not None:
                    semantic_similarity = cosine_similarity(
                        candidate_embedding.reshape(1, -1),
                        required_embedding.reshape(1, -1)
                    )[0][0]
                    semantic_score = semantic_similarity * 100
                else:
                    semantic_score = 0
            except:
                semantic_score = 0
        else:
            semantic_score = 100
        
        # Combine scores (70% keyword, 30% semantic)
        final_score = (keyword_score * 0.7) + (semantic_score * 0.3)
        return min(final_score, 100.0)
    
    def calculate_education_match(self, candidate_education, required_education):
        """Calculate education relevance score"""
        if not candidate_education or not required_education:
            return 0.0
        
        score = 0.0
        candidate_degrees = [edu.get('degree', '').lower() for edu in candidate_education]
        candidate_fields = [edu.get('field_of_study', '').lower() for edu in candidate_education]
        
        for req_edu in required_education:
            req_edu_lower = req_edu.lower()
            
            # Check degree match
            for degree in candidate_degrees:
                if req_edu_lower in degree or degree in req_edu_lower:
                    score += 50
                    break
            
            # Check field of study match
            for field in candidate_fields:
                if any(keyword in field for keyword in ['computer science', 'software engineering', 'information technology']):
                    score += 30
                    break
                elif any(keyword in field for keyword in ['engineering', 'science']):
                    score += 20
                    break
        
        return min(score, 100.0)
    
    def calculate_experience_match(self, candidate_experience, required_experience):
        """Calculate experience relevance score"""
        if not candidate_experience or not required_experience:
            return 0.0
        
        total_months = sum(exp.get('duration_months', 0) for exp in candidate_experience)
        min_years = required_experience.get('min_years', 0)
        preferred_roles = required_experience.get('preferred_roles', [])
        
        # Years of experience score
        years_score = min((total_months / 12 / min_years) * 100, 100) if min_years > 0 else 50
        
        # Role relevance score
        role_score = 0.0
        if preferred_roles:
            candidate_titles = [exp.get('job_title', '').lower() for exp in candidate_experience]
            for pref_role in preferred_roles:
                pref_role_lower = pref_role.lower()
                for title in candidate_titles:
                    if any(keyword in title for keyword in pref_role_lower.split()):
                        role_score += 50
                        break
                role_score = min(role_score, 50)
        else:
            role_score = 50
        
        return (years_score * 0.6) + (role_score * 0.4)
    
    def generate_feedback(self, candidate_data, job_data, scores):
        """Generate personalized AI feedback for candidate"""
        try:
            # Extract relevant information
            skills = [skill.get('skill_name', '') for skill in candidate_data.get('skills', [])]
            education = [f"{edu.get('degree', '')} in {edu.get('field_of_study', '')}" 
                         for edu in candidate_data.get('education', [])]
            experience = [f"{exp.get('job_title', '')} at {exp.get('company', '')}" 
                         for exp in candidate_data.get('experience', [])]
            
            required_skills = job_data.get('required_skills', [])
            
            prompt = f"""
            As an expert career counselor, provide constructive feedback for a job applicant.
            
            Candidate Profile:
            - Skills: {', '.join(skills)}
            - Education: {', '.join(education)}
            - Experience: {', '.join(experience)}
            
            Job Requirements:
            - Required Skills: {', '.join(required_skills)}
            
            Scores:
            - Skill Match: {scores.get('skill_score', 0):.1f}%
            - Education Match: {scores.get('education_score', 0):.1f}%
            - Experience Match: {scores.get('experience_score', 0):.1f}%
            - Total Score: {scores.get('total_score', 0):.1f}%
            
            Provide feedback in the following JSON format:
            {{
                "strengths": "List the candidate's key strengths for this role",
                "missing_skills": "Identify important skills that are missing or need improvement",
                "suggestions": "Provide actionable suggestions for improvement",
                "overall_assessment": "Give an overall assessment of fit for this role"
            }}
            
            Be encouraging but realistic. Focus on specific, actionable advice.
            """
            
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert career counselor providing constructive feedback."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            
            feedback_text = response.choices[0].message.content
            try:
                return json.loads(feedback_text)
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return {
                    "strengths": "Your experience shows relevant background",
                    "missing_skills": "Consider developing additional technical skills",
                    "suggestions": "Focus on gaining more hands-on experience",
                    "overall_assessment": "Continue developing your skills for better alignment"
                }
                
        except Exception as e:
            print(f"Error generating feedback: {e}")
            return {
                "strengths": "Your application has been reviewed",
                "missing_skills": "Review the job requirements for skill gaps",
                "suggestions": "Continue learning and gaining experience",
                "overall_assessment": "Thank you for your interest in this position"
            }
