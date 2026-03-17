const db = require('./src/config/database');

async function checkResumesTable() {
    try {
        console.log('🔍 CHECKING RECRUITER_RESUMES TABLE');
        console.log('===================================\n');
        
        // Get table structure
        const structureQuery = 'DESCRIBE recruiter_resumes';
        const structure = await db.execute(structureQuery);
        
        console.log('📊 Table Structure:');
        console.table(structure);
        
        // Find mime_type column
        const mimeTypeColumn = structure.find(col => col.Field === 'mime_type');
        if (mimeTypeColumn) {
            console.log(`\n🔍 mime_type column details:`);
            console.log(`  Type: ${mimeTypeColumn.Type}`);
            console.log(`  Null: ${mimeTypeColumn.Null}`);
            console.log(`  Default: ${mimeTypeColumn.Default}`);
            console.log(`  Extra: ${mimeTypeColumn.Extra}`);
        }
        
        // Add test resumes with all required fields
        console.log('\n📄 Adding test resumes with all fields...');
        
        const recruiterQuery = 'SELECT id FROM users WHERE email = ? AND role = ?';
        const recruiterResult = await db.execute(recruiterQuery, ['test@analytics.com', 'recruiter']);
        
        if (!recruiterResult || recruiterResult.length === 0) {
            console.log('❌ Recruiter not found');
            return;
        }
        
        const recruiterId = recruiterResult[0].id;
        console.log(`✅ Using recruiter ID: ${recruiterId}`);
        
        const testResumes = [
            {
                recruiter_id: recruiterId,
                original_name: 'John_Developer.pdf',
                filename: 'resume_1.pdf',
                file_path: './uploads/test_resumes/john_resume.pdf',
                file_size: 1024000,
                mime_type: 'application/pdf'
            },
            {
                recruiter_id: recruiterId,
                original_name: 'Jane_Engineer.pdf',
                filename: 'resume_2.pdf',
                file_path: './uploads/test_resumes/jane_resume.pdf',
                file_size: 950000,
                mime_type: 'application/pdf'
            }
        ];
        
        for (const resume of testResumes) {
            try {
                const insertQuery = `
                INSERT INTO recruiter_resumes (recruiter_id, original_name, filename, file_path, file_size, mime_type, uploaded_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
                `;
                await db.execute(insertQuery, [
                    resume.recruiter_id,
                    resume.original_name,
                    resume.filename,
                    resume.file_path,
                    resume.file_size,
                    resume.mime_type
                ]);
                console.log(`✅ Added resume: ${resume.original_name}`);
            } catch (error) {
                console.log(`⚠️ Resume ${resume.original_name} may already exist:`, error.message);
            }
        }
        
        // Check final count
        const finalResumesQuery = 'SELECT * FROM recruiter_resumes WHERE recruiter_id = ?';
        const finalResumes = await db.execute(finalResumesQuery, [recruiterId]);
        console.log(`\n📄 Final resume count: ${finalResumes.length}`);
        finalResumes.forEach((resume, index) => {
            console.log(`   📄 ${index + 1}. ${resume.original_name} (ID: ${resume.id})`);
        });
        
    } catch (error) {
        console.error('❌ Check failed:', error.message);
    } finally {
        process.exit(0);
    }
}

checkResumesTable();
