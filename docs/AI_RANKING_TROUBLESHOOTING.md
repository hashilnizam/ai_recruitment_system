# AI Ranking Troubleshooting Guide

## Overview
This document outlines the steps taken to fix the AI ranking functionality for uploaded resumes in the recruitment system.

---

## Problem Statement

### Initial Issue
- AI ranking was not processing uploaded resumes
- Ranking process would start but show "Processed 0 candidates"
- No ranking results appeared in the frontend
- Database foreign key constraint errors when storing rankings

### Root Cause
The AI service was only querying the `applications` table for candidates, but uploaded resumes are stored in the `recruiter_resumes` table separately.

---

## Solution Steps

### 1. Backend API Updates

#### File: `backend/src/routes/recruiterRoutes.js`

**Changes Made:**
- Modified `/trigger-ranking` endpoint to check for both applications AND uploaded resumes
- Added query to count uploaded resumes from `recruiter_resumes` table
- Updated total candidate count to include both sources

```javascript
// Get uploaded resumes count
const uploadedResumes = await db.query(
  'SELECT COUNT(*) as count FROM recruiter_resumes WHERE recruiter_id = ?',
  [recruiterId]
);

const totalToRank = (pendingApplications[0]?.count || 0) + (uploadedResumes[0]?.count || 0);
```

**Location:** Lines 499-510

---

### 2. AI Service Updates

#### File: `ai-service/app.py`

**Changes Made:**

1. **Updated candidate query** to include uploaded resumes:
   ```python
   # Get all applications for this job
   apps_query = """
   SELECT a.id, a.candidate_id, ...
   FROM applications a
   JOIN users u ON a.candidate_id = u.id
   WHERE a.job_id = %s AND a.status = 'pending'
   """
   applications = db.execute_query(apps_query, (job_id,))
   
   # Also get uploaded resumes for this recruiter
   resumes_query = """
   SELECT r.id, r.recruiter_id, r.original_name, r.file_path,
          CAST(SUBSTRING_INDEX(r.original_name, '.', 1) AS CHAR) as first_name,
          '' as last_name,
          'resume-upload@system.com' as email,
          true as is_resume_upload,
          r.id as candidate_id
   FROM recruiter_resumes r
   WHERE r.recruiter_id = (SELECT recruiter_id FROM jobs WHERE id = %s)
   """
   resumes = db.execute_query(resumes_query, (job_id,))
   
   # Combine applications and resumes
   all_candidates = applications + resumes
   ```

2. **Fixed foreign key constraint** for uploaded resumes:
   ```python
   if application.get('is_resume_upload'):
       # For recruiter resumes - use NULL for application_id
       ranking_query = """
       INSERT INTO rankings 
       (job_id, candidate_id, application_id, ...)
       VALUES (%s, %s, NULL, ...)
       """
   ```

3. **Added debug logging** throughout the process:
   ```python
   print(f"🔍 Received ranking request for job {job_id}")
   print(f"📊 Found {len(all_candidates)} total candidates")
   print(f"📄 Processing resume upload: {resume_name}")
   ```

**Location:** Lines 237-423

---

### 3. Frontend Updates

#### File: `frontend/src/app/candidates/page.tsx`

**Changes Made:**

1. **Fixed polling logic** to properly check for ranked candidates:
   ```typescript
   const rankedCandidates = freshCandidates.filter((c: any) => 
     c.rank_position !== null && c.rank_position !== undefined && c.rank_position > 0
   );
   ```

2. **Added manual "Check Results" button**:
   ```typescript
   const handleCheckResults = async () => {
     setRefreshing(true);
     await fetchData();
     // Check for ranked candidates and show message
   };
   ```

3. **Reduced polling frequency** to avoid rate limiting:
   - Changed from 5 seconds to 10 seconds
   - Reduced max polls from 24 to 12 (1 minute total)

**Location:** Lines 67-117

---

#### File: `frontend/src/app/candidates/ranking-results/page.tsx`

**Created new dedicated results page** with:
- Real-time status monitoring
- Auto-refresh every 10 seconds when processing
- Visual status indicators (Ready, Processing, Complete, Error)
- Detailed statistics and score breakdowns
- Ranked and pending candidates sections

**Location:** New file created

---

### 4. Rate Limiting Fix

#### File: `backend/src/server.js`

**Changes Made:**
- Excluded AI ranking endpoint from rate limiting:
   ```javascript
   const limiter = rateLimit({
     skip: (req) => {
       return req.path === '/api/recruiter/trigger-ranking';
     }
   });
   ```

**Location:** Lines 56-69

---

## Testing Steps

### 1. Verify Services are Running

```bash
# Backend (Port 5000)
cd backend
npm start

# Frontend (Port 3000)
cd frontend
npm run dev

# AI Service (Port 5001)
cd ai-service
python app.py
```

### 2. Test AI Service Health

```bash
# Health check
curl http://localhost:5001/health

# OpenAI connection test
curl http://localhost:5001/api/test-connection
```

### 3. Upload Resumes

1. Navigate to `http://localhost:3000/candidates`
2. Click "Upload Resumes"
3. Upload 2-3 PDF resumes
4. Verify they appear in the candidates list

### 4. Trigger AI Ranking

**Option A: From Main Candidates Page**
1. Click "AI Ranking" button
2. Wait for success message
3. Click "Check Results" button
4. Verify rankings appear

**Option B: From Results Page**
1. Click "View Results" button
2. Click "Start AI Ranking"
3. Monitor status card for progress
4. Results should appear automatically

### 5. Verify Database

Check if rankings were created:
```sql
SELECT * FROM rankings WHERE job_id = [your_job_id];
```

---

## Known Issues & Limitations

### Current Issues

1. **AI Service Logs Not Showing**
   - The ranking process appears to start but doesn't show processing logs
   - May be related to Flask debug mode or output buffering
   - **Workaround:** Check database directly for rankings

2. **Polling May Not Detect Rankings**
   - Frontend polling checks `candidates` state which may be stale
   - **Workaround:** Use manual "Check Results" button

3. **PDF Parsing May Fail**
   - Some PDF formats may not parse correctly
   - **Workaround:** Ensure PDFs are text-based, not scanned images

### Limitations

1. **Single Job Ranking**
   - Currently ranks candidates for the most recent job only
   - Multiple jobs require separate ranking processes

2. **No Progress Indicator**
   - Long AI processing times have no visual progress
   - User must wait or manually refresh

3. **OpenAI API Rate Limits**
   - Large batches may hit OpenAI rate limits
   - Consider adding delays between candidates

---

## Architecture Overview

### Data Flow

```
1. User uploads resumes → recruiter_resumes table
2. User clicks "AI Ranking" → Backend /trigger-ranking endpoint
3. Backend checks for candidates → Queries both applications + recruiter_resumes
4. Backend calls AI service → POST /api/rank-candidates
5. AI service processes:
   - Reads PDF files
   - Extracts data using OpenAI
   - Calculates scores
   - Stores in rankings table
6. Frontend polls for results → Fetches rankings data
7. Display ranked candidates → Shows scores and positions
```

### Database Schema

**Key Tables:**
- `recruiter_resumes` - Uploaded resume files
- `applications` - Traditional job applications
- `rankings` - AI-generated candidate rankings
- `jobs` - Job postings
- `processing_jobs` - Ranking process status

**Important Relationships:**
- `rankings.application_id` can be NULL for uploaded resumes
- `rankings.candidate_id` references `recruiter_resumes.id` for uploads
- `rankings.job_id` references `jobs.id`

---

## Future Improvements

### Short Term
1. Add real-time WebSocket updates for ranking progress
2. Improve error handling and user feedback
3. Add retry mechanism for failed rankings
4. Better logging and monitoring

### Long Term
1. Batch processing for large resume sets
2. Background job queue (Redis/Bull)
3. Caching for frequently accessed data
4. Support for multiple file formats (DOCX, TXT)
5. AI model fine-tuning for better accuracy

---

## Debugging Commands

### Check Database Connections
```bash
# Backend
cd backend
node -e "const db = require('./src/config/database'); db.query('SELECT 1', (err, res) => console.log(err || 'Connected'));"

# AI Service
cd ai-service
python -c "from src.config.database import db; print('Connected' if db else 'Failed')"
```

### Check Resume Files
```bash
# List uploaded resumes
ls backend/uploads/recruiter-resumes/

# Check file permissions
ls -la backend/uploads/recruiter-resumes/
```

### Monitor Logs
```bash
# Backend logs
cd backend
npm start | grep "ranking"

# AI Service logs
cd ai-service
python app.py | grep "🚀\|📊\|✅\|❌"
```

---

## Contact & Support

For issues or questions:
1. Check this troubleshooting guide first
2. Review the error logs in console
3. Check database for data consistency
4. Verify all services are running on correct ports

---

## Changelog

### 2026-03-01
- Initial documentation created
- Fixed AI service to query recruiter_resumes table
- Fixed foreign key constraints for uploaded resumes
- Added dedicated ranking results page
- Improved frontend polling and error handling
- Fixed rate limiting issues

---

## Appendix

### Environment Variables

```env
# Backend
PORT=5000
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=resume_screening

# AI Service
OPENAI_API_KEY=your_key_here
FLASK_ENV=development
FLASK_DEBUG=1

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Required Dependencies

**Backend:**
- express
- mysql2
- multer
- express-rate-limit

**AI Service:**
- flask
- flask-cors
- openai
- PyPDF2
- pymysql

**Frontend:**
- next
- react
- axios
- lucide-react
