from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import time
import json
from datetime import datetime
import sys
import os

# Add src directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from config.database import db
from services.ai_service import AIService

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000'])

# Initialize AI service
ai_service = AIService()

# Global variable for tracking processing status
processing_status = {}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'AI Service is running',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/test-connection', methods=['GET'])
def test_connection():
    """Test OpenAI API connection"""
    try:
        # Simple test call to OpenAI
        response = ai_service.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=5
        )
        return jsonify({
            'success': True,
            'message': 'OpenAI API connection successful'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'OpenAI API connection failed: {str(e)}'
        }), 500

@app.route('/api/parse-resume', methods=['POST'])
def parse_resume():
    """Parse resume using AI to extract structured data"""
    try:
        data = request.get_json()
        resume_text = data.get('resume_text')
        
        if not resume_text:
            return jsonify({
                'success': False,
                'message': 'Resume text is required'
            }), 400
        
        # Use AI to extract structured data from resume
        extracted_data = ai_service.extract_resume_data(resume_text)
        
        return jsonify({
            'success': True,
            'data': extracted_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to parse resume: {str(e)}'
        }), 500

@app.route('/api/enhance-application-data', methods=['POST'])
def enhance_application_data():
    """Enhance application data using AI"""
    try:
        data = request.get_json()
        resume_data = data.get('resume_data')
        job_requirements = data.get('job_requirements')
        
        if not resume_data:
            return jsonify({
                'success': False,
                'message': 'Resume data is required'
            }), 400
        
        # Use AI to enhance and validate application data
        enhanced_data = ai_service.enhance_application_data(resume_data, job_requirements)
        
        return jsonify({
            'success': True,
            'data': enhanced_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to enhance application data: {str(e)}'
        }), 500

@app.route('/api/rank-candidates', methods=['POST'])
def rank_candidates():
    """Rank candidates for a specific job using AI"""
    try:
        data = request.get_json()
        job_id = data.get('job_id')
        
        if not job_id:
            return jsonify({
                'success': False,
                'message': 'Job ID is required'
            }), 400
        
        # Check if already processing
        if job_id in processing_status and processing_status[job_id]['status'] in ['queued', 'processing']:
            return jsonify({
                'success': False,
                'message': 'Ranking is already in progress for this job'
            }), 400
        
        # Start processing in background (for testing, run synchronously)
        print(f"🧵 Starting ranking process for job {job_id}")
        try:
            process_ranking(job_id)
            print(f"✅ Ranking process completed for job {job_id}")
        except Exception as e:
            print(f"❌ Ranking process failed for job {job_id}: {e}")
            import traceback
            traceback.print_exc()
        
        # thread = threading.Thread(target=process_ranking, args=(job_id,))
        # thread.daemon = True
        # thread.start()
        
        print(f"🧵 Background thread started for job {job_id}")
        
        return jsonify({
            'success': True,
            'message': 'Ranking process started',
            'job_id': job_id
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to start ranking: {str(e)}'
        }), 500

@app.route('/api/ranking-status/<int:job_id>', methods=['GET'])
def get_ranking_status(job_id):
    """Get ranking status for a specific job"""
    try:
        # Get status from database
        query = """
        SELECT status, progress, total_candidates, error_message, started_at, completed_at
        FROM processing_jobs 
        WHERE job_id = %s 
        ORDER BY created_at DESC 
        LIMIT 1
        """
        result = db.execute_query(query, (job_id,))
        
        if result:
            status_data = result[0]
            return jsonify({
                'success': True,
                'data': status_data
            })
        else:
            return jsonify({
                'success': False,
                'message': 'No ranking process found for this job'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get ranking status: {str(e)}'
        }), 500

def process_ranking(job_id):
    """Process ranking for all candidates of a job"""
    from datetime import datetime
    
    try:
        print(f"🚀 Starting ranking process for job {job_id}")
        
        # Update processing status to processing
        processing_status[job_id] = {
            'status': 'processing',
            'progress': 0,
            'total_candidates': 0,
            'started_at': datetime.now()
        }
        
        print(f"📊 Inserting initial processing record for job {job_id}")
        
        # Update database
        try:
            db.execute_query("""
                INSERT INTO processing_jobs (job_id, status, started_at)
                VALUES (%s, 'processing', %s)
                ON DUPLICATE KEY UPDATE 
                status = 'processing', 
                started_at = %s,
                progress = 0
            """, (job_id, datetime.now(), datetime.now()))
            print(f"✅ Processing record created for job {job_id}")
        except Exception as db_error:
            print(f"❌ Database error creating processing record: {db_error}")
            raise db_error
        
        # Get job details
        job_query = """
        SELECT title, required_skills, required_education, required_experience
        FROM jobs WHERE id = %s
        """
        job_result = db.execute_query(job_query, (job_id,))
        
        if not job_result:
            raise Exception('Job not found')
        
        job_data = job_result[0]
        job_data['required_skills'] = json.loads(job_data['required_skills'])
        job_data['required_education'] = json.loads(job_data['required_education'])
        job_data['required_experience'] = json.loads(job_data['required_experience'])
        
        # Get all applications for this job
        apps_query = """
        SELECT a.id, a.candidate_id, CAST(u.first_name AS CHAR) as first_name, CAST(u.last_name AS CHAR) as last_name, CAST(u.email AS CHAR) as email, 
               CASE WHEN u.email LIKE 'resume-%@upload.local' THEN true ELSE false END as is_resume_upload
        FROM applications a
        JOIN users u ON a.candidate_id = u.id
        WHERE a.job_id = %s AND a.status = 'pending'
        """
        applications = db.execute_query(apps_query, (job_id,))
        
        total_candidates = len(applications)
        
        # Update total candidates
        db.execute_query("""
            UPDATE processing_jobs 
            SET total_candidates = %s 
            WHERE job_id = %s AND status = 'processing'
        """, (total_candidates, job_id))
        
        rankings = []
        
        for i, application in enumerate(applications):
            try:
                # Get candidate details
                candidate_data = get_candidate_data(application['id'], application.get('is_resume_upload', False))
                
                # Handle resume uploads differently
                if candidate_data.get('is_resume_upload'):
                    print(f"📄 Processing resume upload: {candidate_data['resume_name']}")
                    
                    # Parse resume using AI
                    try:
                        import PyPDF2
                        import io
                        
                        # Read PDF file
                        with open(candidate_data['resume_file'], 'rb') as file:
                            pdf_reader = PyPDF2.PdfReader(file)
                            resume_text = ""
                            for page in pdf_reader.pages:
                                resume_text += page.extract_text()
                        
                        # Use AI to extract structured data
                        extracted_data = ai_service.extract_resume_data(resume_text)
                        
                        # Map the extracted data to the expected format
                        skills = extracted_data.get('skills', [])
                        education = extracted_data.get('education', [])
                        experience = extracted_data.get('experience', [])
                        
                        # Convert skills format: name -> skill_name
                        mapped_skills = []
                        for skill in skills:
                            mapped_skills.append({
                                'skill_name': skill.get('name', ''),
                                'proficiency_level': skill.get('level', 'intermediate'),
                                'years_of_experience': skill.get('experience_years', 0)
                            })
                        
                        # Convert education format: field -> field_of_study, end_date -> graduation_year
                        mapped_education = []
                        for edu in education:
                            mapped_education.append({
                                'degree': edu.get('degree', ''),
                                'field_of_study': edu.get('field', ''),
                                'institution': edu.get('institution', ''),
                                'graduation_year': int(edu.get('end_date', '2023')) if edu.get('end_date') else None,
                                'gpa': edu.get('gpa')
                            })
                        
                        # Convert experience format: start_date, end_date to duration_months
                        mapped_experience = []
                        for exp in experience:
                            start_date = exp.get('start_date', '')
                            end_date = exp.get('end_date', 'Present')
                            
                            # Calculate duration in months (simplified)
                            duration_months = 12  # Default to 1 year
                            if start_date:
                                try:
                                    start_year = int(start_date.split('-')[0])
                                    if end_date != 'Present':
                                        end_year = int(end_date.split('-')[0])
                                        duration_months = (end_year - start_year) * 12
                                    else:
                                        from datetime import datetime
                                        current_year = datetime.now().year
                                        duration_months = (current_year - start_year) * 12
                                except:
                                    duration_months = 12
                            
                            mapped_experience.append({
                                'job_title': exp.get('title', ''),
                                'company': exp.get('company', ''),
                                'duration_months': duration_months,
                                'start_date': exp.get('start_date'),
                                'end_date': exp.get('end_date'),
                                'is_current': exp.get('end_date') == 'Present',
                                'description': exp.get('description', '')
                            })
                        
                        # Update candidate data with mapped information
                        candidate_data['skills'] = mapped_skills
                        candidate_data['education'] = mapped_education
                        candidate_data['experience'] = mapped_experience
                        
                        print(f"✅ Resume parsed and mapped successfully for {candidate_data['resume_name']}")
                        print(f"   🎯 Mapped {len(mapped_skills)} skills")
                        print(f"   🎓 Mapped {len(mapped_education)} education entries")
                        print(f"   💼 Mapped {len(mapped_experience)} experience entries")
                        
                    except Exception as parse_error:
                        print(f"❌ Error parsing resume {candidate_data['resume_name']}: {parse_error}")
                        # Use default values if parsing fails
                        candidate_data['skills'] = []
                        candidate_data['education'] = []
                        candidate_data['experience'] = []
                
                # Calculate scores
                skill_score = ai_service.calculate_skill_match(
                    candidate_data['skills'], 
                    job_data['required_skills']
                )
                
                education_score = ai_service.calculate_education_match(
                    candidate_data['education'], 
                    job_data['required_education']
                )
                
                experience_score = ai_service.calculate_experience_match(
                    candidate_data['experience'], 
                    job_data['required_experience']
                )
                
                # Calculate total score (40% skills, 30% education, 30% experience)
                total_score = (skill_score * 0.4) + (education_score * 0.3) + (experience_score * 0.3)
                
                scores = {
                    'skill_score': skill_score,
                    'education_score': education_score,
                    'experience_score': experience_score,
                    'total_score': total_score
                }
                
                # Generate AI feedback
                feedback = ai_service.generate_feedback(candidate_data, job_data, scores)
                
                # Store ranking
                if application.get('is_resume_upload'):
                    # For recruiter resumes - use the actual application_id
                    ranking_query = """
                    INSERT INTO rankings 
                    (job_id, candidate_id, application_id, skill_score, education_score, experience_score, total_score, rank_position, score_breakdown)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                    skill_score = VALUES(skill_score),
                    education_score = VALUES(education_score),
                    experience_score = VALUES(experience_score),
                    total_score = VALUES(total_score),
                    score_breakdown = VALUES(score_breakdown)
                    """
                    db.execute_query(ranking_query, (
                        job_id, 
                        application['candidate_id'], 
                        application['id'],  # Use actual application_id
                        skill_score, 
                        education_score, 
                        experience_score, 
                        total_score, 
                        0,  # rank_position will be updated later
                        json.dumps(scores)
                    ))
                else:
                    # For regular applications
                    ranking_query = """
                    INSERT INTO rankings 
                    (job_id, application_id, candidate_id, skill_score, education_score, experience_score, total_score, rank_position, score_breakdown)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                    skill_score = VALUES(skill_score),
                    education_score = VALUES(education_score),
                    experience_score = VALUES(experience_score),
                    total_score = VALUES(total_score),
                    score_breakdown = VALUES(score_breakdown)
                    """
                    db.execute_query(ranking_query, (
                        job_id, 
                        application['id'], 
                        application['candidate_id'], 
                        skill_score, 
                        education_score, 
                        experience_score, 
                        total_score, 
                        0,  # Will be updated after sorting
                        json.dumps(scores)
                    ))
                
                # Store feedback
                # For both resume uploads and regular applications, use application_id
                feedback_query = """
                INSERT INTO feedback 
                (application_id, strengths, missing_skills, suggestions, overall_assessment)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                strengths = VALUES(strengths),
                missing_skills = VALUES(missing_skills),
                suggestions = VALUES(suggestions),
                overall_assessment = VALUES(overall_assessment)
                """
                db.execute_query(feedback_query, (
                    application['id'],
                    feedback['strengths'],
                    feedback['missing_skills'],
                    feedback['suggestions'],
                    feedback['overall_assessment']
                ))
                
                rankings.append({
                    'application_id': application['id'],
                    'total_score': total_score
                })
                
                # Update progress
                progress = int(((i + 1) / total_candidates) * 100)
                db.execute_query("""
                    UPDATE processing_jobs 
                    SET progress = %s 
                    WHERE job_id = %s AND status = 'processing'
                """, (progress, job_id))
                
                # Small delay to prevent overwhelming the API
                time.sleep(0.5)
                
            except Exception as e:
                print(f"Error processing application {application['id']}: {e}")
                continue
        
        # Update rankings with positions
        rankings.sort(key=lambda x: x['total_score'], reverse=True)
        for position, ranking in enumerate(rankings, 1):
            # Update ranking position using application_id
            db.execute_query("""
                UPDATE rankings 
                SET rank_position = %s 
                WHERE job_id = %s AND application_id = %s
            """, (position, job_id, ranking['application_id']))
        
        # Update application statuses
        db.execute_query("""
            UPDATE applications 
            SET status = 'ranked' 
            WHERE job_id = %s AND status = 'pending'
        """, (job_id,))
        
        # Mark processing as completed
        db.execute_query("""
            UPDATE processing_jobs 
            SET status = 'completed', completed_at = %s, progress = 100
            WHERE job_id = %s AND status = 'processing'
        """, (datetime.now(), job_id))
        
        processing_status[job_id] = {
            'status': 'completed',
            'progress': 100,
            'total_candidates': total_candidates,
            'completed_at': datetime.now()
        }
        
        print(f"✅ Ranking completed for job {job_id}. Processed {total_candidates} candidates.")
        
    except Exception as e:
        print(f"❌ Ranking failed for job {job_id}: {e}")
        
        # Mark processing as failed
        db.execute_query("""
            UPDATE processing_jobs 
            SET status = 'failed', error_message = %s, completed_at = %s
            WHERE job_id = %s AND status = 'processing'
        """, (str(e), datetime.now(), job_id))
        
        processing_status[job_id] = {
            'status': 'failed',
            'error_message': str(e),
            'completed_at': datetime.now()
        }

def get_candidate_data(application_id, is_resume_upload=False):
    """Get complete candidate data for an application"""
    
    if is_resume_upload:
        # This is a recruiter resume upload
        resume_query = """
        SELECT rr.filename, rr.original_name, rr.file_path, rr.file_size
        FROM recruiter_resumes rr
        WHERE rr.id = %s
        """
        resume_result = db.execute_query(resume_query, (application_id,))
        
        if not resume_result:
            raise Exception(f"Resume {application_id} not found")
        
        resume = resume_result[0]
        print(f"📄 Processing resume upload: {resume['original_name']}")
        return {
            'skills': [],
            'education': [],
            'experience': [],
            'resume_file': resume['file_path'],
            'resume_name': resume['original_name'],
            'is_resume_upload': True
        }
    
    # Regular application processing
    app_query = """
    SELECT a.candidate_id, u.first_name, u.last_name, u.email
    FROM applications a
    JOIN users u ON a.candidate_id = u.id
    WHERE a.id = %s
    """
    app_result = db.execute_query(app_query, (application_id,))
    
    if not app_result:
        raise Exception(f"Application {application_id} not found")
    
    candidate_info = app_result[0]
    candidate_id = candidate_info['candidate_id']
    
    # Get skills for regular applications
    skills_query = """
    SELECT skill_name, proficiency_level, years_of_experience
    FROM skills WHERE application_id = %s
    """
    skills = db.execute_query(skills_query, (application_id,))
    
    # Get education
    education_query = """
    SELECT degree, field_of_study, institution, graduation_year, gpa
    FROM education WHERE application_id = %s
    """
    education = db.execute_query(education_query, (application_id,))
    
    # Get experience
    experience_query = """
    SELECT job_title, company, duration_months, start_date, end_date, is_current, description
    FROM experience WHERE application_id = %s
    """
    experience = db.execute_query(experience_query, (application_id,))
    
    print(f"📊 Found regular application for {candidate_info['first_name']} {candidate_info['last_name']}: {len(skills)} skills, {len(education)} education, {len(experience)} experience")
    
    return {
        'skills': skills,
        'education': education,
        'experience': experience,
        'is_resume_upload': False
    }

if __name__ == '__main__':
    print("🤖 AI Service starting on port 5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
