from src.config.database import db

# Check uploaded resumes
result = db.execute_query('SELECT id, original_name, recruiter_id FROM recruiter_resumes WHERE recruiter_id = 6')
print(f'Found {len(result)} uploaded resumes:')
for resume in result:
    print(f'  - ID: {resume["id"]}, Name: {resume["original_name"]}')

# Check jobs for recruiter 6
jobs = db.execute_query('SELECT id, title FROM jobs WHERE recruiter_id = 6 ORDER BY created_at DESC')
print(f'\nFound {len(jobs)} jobs:')
for job in jobs:
    print(f'  - ID: {job["id"]}, Title: {job["title"]}')

# Check existing rankings
rankings = db.execute_query('SELECT COUNT(*) as count FROM rankings WHERE job_id = (SELECT id FROM jobs WHERE recruiter_id = 6 ORDER BY created_at DESC LIMIT 1)')
print(f'\nExisting rankings: {rankings[0]["count"]}')
