const fs = require('fs');
const path = require('path');

// Function to fix database calls in a file
function fixDatabaseCalls(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace db.execute with db.query and remove array destructuring
    const fixedContent = content
      .replace(/const \[([^\]]+)\] = await db\.execute\(/g, 'const $1 = await db.query(')
      .replace(/await db\.execute\(/g, 'await db.query(');
    
    // Write back the fixed content
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log(`✅ Fixed database calls in ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Files to fix
const filesToFix = [
  'src/routes/jobRoutes.js',
  'src/routes/candidateRoutes.js',
  'src/routes/applicationRoutes.js'
];

// Fix all files
console.log('🔧 Fixing database calls...');
let fixedCount = 0;

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fixDatabaseCalls(filePath)) {
    fixedCount++;
  }
});

console.log(`✅ Fixed ${fixedCount}/${filesToFix.length} files`);
