// Comprehensive Skill Database for AI Recruitment System
const TECHNICAL_SKILLS = {
  // Programming Languages
  'javascript': { category: 'programming', level: 'intermediate', synonyms: ['js', 'ecmascript', 'nodejs'] },
  'python': { category: 'programming', level: 'intermediate', synonyms: ['py', 'python3', 'django'] },
  'java': { category: 'programming', level: 'intermediate', synonyms: ['jvm', 'spring', 'maven'] },
  'c++': { category: 'programming', level: 'advanced', synonyms: ['cpp', 'c-plus-plus'] },
  'c#': { category: 'programming', level: 'intermediate', synonyms: ['csharp', '.net'] },
  'ruby': { category: 'programming', level: 'intermediate', synonyms: ['rails', 'sinatra'] },
  'go': { category: 'programming', level: 'intermediate', synonyms: ['golang'] },
  'rust': { category: 'programming', level: 'advanced', synonyms: [] },
  'php': { category: 'programming', level: 'intermediate', synonyms: ['laravel', 'wordpress'] },
  'swift': { category: 'programming', level: 'intermediate', synonyms: ['ios', 'xcode'] },
  'kotlin': { category: 'programming', level: 'intermediate', synonyms: ['android'] },
  'typescript': { category: 'programming', level: 'intermediate', synonyms: ['ts'] },
  
  // Web Technologies
  'react': { category: 'web', level: 'intermediate', synonyms: ['reactjs', 'jsx'] },
  'angular': { category: 'web', level: 'intermediate', synonyms: ['angularjs', 'ng'] },
  'vue': { category: 'web', level: 'intermediate', synonyms: ['vuejs', 'vuex'] },
  'html': { category: 'web', level: 'beginner', synonyms: ['html5', 'markup'] },
  'css': { category: 'web', level: 'beginner', synonyms: ['css3', 'sass', 'scss'] },
  'tailwind': { category: 'web', level: 'intermediate', synonyms: ['tailwindcss'] },
  'bootstrap': { category: 'web', level: 'beginner', synonyms: ['bootstrap4', 'bootstrap5'] },
  'nextjs': { category: 'web', level: 'intermediate', synonyms: ['next'] },
  'gatsby': { category: 'web', level: 'intermediate', synonyms: [] },
  'webpack': { category: 'web', level: 'advanced', synonyms: ['vite', 'parcel'] },
  
  // Backend Technologies
  'node.js': { category: 'backend', level: 'intermediate', synonyms: ['node', 'express'] },
  'express': { category: 'backend', level: 'intermediate', synonyms: ['expressjs'] },
  'django': { category: 'backend', level: 'intermediate', synonyms: ['flask', 'python'] },
  'spring': { category: 'backend', level: 'advanced', synonyms: ['springboot', 'java'] },
  'laravel': { category: 'backend', level: 'intermediate', synonyms: ['php', 'artisan'] },
  'rails': { category: 'backend', level: 'intermediate', synonyms: ['ruby', 'sinatra'] },
  'nest': { category: 'backend', level: 'advanced', synonyms: ['nestjs', 'typescript'] },
  'fastapi': { category: 'backend', level: 'intermediate', synonyms: ['python'] },
  
  // Databases
  'mysql': { category: 'database', level: 'intermediate', synonyms: ['sql', 'mariadb'] },
  'postgresql': { category: 'database', level: 'intermediate', synonyms: ['postgres', 'psql'] },
  'mongodb': { category: 'database', level: 'intermediate', synonyms: ['nosql', 'documentdb'] },
  'redis': { category: 'database', level: 'intermediate', synonyms: ['cache', 'key-value'] },
  'sqlite': { category: 'database', level: 'beginner', synonyms: ['mobile', 'embedded'] },
  'oracle': { category: 'database', level: 'advanced', synonyms: ['plsql'] },
  'sql server': { category: 'database', level: 'intermediate', synonyms: ['mssql', 't-sql'] },
  
  // Cloud & DevOps
  'aws': { category: 'cloud', level: 'intermediate', synonyms: ['amazon', 'ec2', 's3'] },
  'azure': { category: 'cloud', level: 'intermediate', synonyms: ['microsoft', 'cloud'] },
  'gcp': { category: 'cloud', level: 'intermediate', synonyms: ['google', 'cloud'] },
  'docker': { category: 'devops', level: 'intermediate', synonyms: ['container', 'kubernetes'] },
  'kubernetes': { category: 'devops', level: 'advanced', synonyms: ['k8s', 'container'] },
  'jenkins': { category: 'devops', level: 'intermediate', synonyms: ['ci-cd', 'pipeline'] },
  'git': { category: 'devops', level: 'beginner', synonyms: ['github', 'gitlab'] },
  'github': { category: 'devops', level: 'beginner', synonyms: ['git', 'gitlab'] },
  'terraform': { category: 'devops', level: 'advanced', synonyms: ['iac', 'infrastructure'] },
  
  // Data Science & AI
  'machine learning': { category: 'ai', level: 'advanced', synonyms: ['ml', 'artificial intelligence'] },
  'deep learning': { category: 'ai', level: 'advanced', synonyms: ['neural networks', 'tensorflow'] },
  'tensorflow': { category: 'ai', level: 'advanced', synonyms: ['tf', 'keras'] },
  'pytorch': { category: 'ai', level: 'advanced', synonyms: ['torch', 'pytorch'] },
  'scikit-learn': { category: 'ai', level: 'intermediate', synonyms: ['sklearn', 'python'] },
  'pandas': { category: 'data', level: 'intermediate', synonyms: ['python', 'dataframe'] },
  'numpy': { category: 'data', level: 'intermediate', synonyms: ['python', 'array'] },
  'r': { category: 'data', level: 'intermediate', synonyms: ['statistics', 'analytics'] },
  'tableau': { category: 'data', level: 'beginner', synonyms: ['visualization', 'dashboard'] },
  'power bi': { category: 'data', level: 'beginner', synonyms: ['microsoft', 'visualization'] },
  
  // Mobile Development
  'ios': { category: 'mobile', level: 'intermediate', synonyms: ['iphone', 'swift'] },
  'android': { category: 'mobile', level: 'intermediate', synonyms: ['java', 'kotlin'] },
  'react native': { category: 'mobile', level: 'intermediate', synonyms: ['rn', 'cross-platform'] },
  'flutter': { category: 'mobile', level: 'intermediate', synonyms: ['dart', 'cross-platform'] },
  'xamarin': { category: 'mobile', level: 'intermediate', synonyms: ['c#', 'cross-platform'] },
  'cordova': { category: 'mobile', level: 'beginner', synonyms: ['phonegap', 'hybrid'] },
  
  // Testing
  'jest': { category: 'testing', level: 'intermediate', synonyms: ['javascript', 'unit'] },
  'mocha': { category: 'testing', level: 'intermediate', synonyms: ['javascript', 'unit'] },
  'selenium': { category: 'testing', level: 'intermediate', synonyms: ['webdriver', 'automation'] },
  'cypress': { category: 'testing', level: 'intermediate', synonyms: ['e2e', 'automation'] },
  'junit': { category: 'testing', level: 'intermediate', synonyms: ['java', 'unit'] },
  'pytest': { category: 'testing', level: 'intermediate', synonyms: ['python', 'unit'] },
  
  // Design
  'figma': { category: 'design', level: 'intermediate', synonyms: ['ui', 'ux', 'prototype'] },
  'sketch': { category: 'design', level: 'intermediate', synonyms: ['ui', 'ux', 'mac'] },
  'adobe': { category: 'design', level: 'intermediate', synonyms: ['photoshop', 'illustrator'] },
  'photoshop': { category: 'design', level: 'intermediate', synonyms: ['adobe', 'image'] },
  'illustrator': { category: 'design', level: 'intermediate', synonyms: ['adobe', 'vector'] },
  'ui design': { category: 'design', level: 'intermediate', synonyms: ['user interface', 'ux'] },
  'ux design': { category: 'design', level: 'intermediate', synonyms: ['user experience', 'ui'] }
};

const SOFT_SKILLS = {
  'communication': { category: 'soft', level: 'intermediate', keywords: ['teamwork', 'presentation', 'writing'] },
  'leadership': { category: 'soft', level: 'advanced', keywords: ['management', 'mentoring', 'strategy'] },
  'problem solving': { category: 'soft', level: 'advanced', keywords: ['analytical', 'critical thinking'] },
  'teamwork': { category: 'soft', level: 'intermediate', keywords: ['collaboration', 'cooperation'] },
  'time management': { category: 'soft', level: 'intermediate', keywords: ['organization', 'planning'] },
  'adaptability': { category: 'soft', level: 'intermediate', keywords: ['flexible', 'versatile'] },
  'creativity': { category: 'soft', level: 'intermediate', keywords: ['innovation', 'ideation'] },
  'attention to detail': { category: 'soft', level: 'intermediate', keywords: ['precision', 'thorough'] },
  'project management': { category: 'soft', level: 'advanced', keywords: ['planning', 'coordination'] }
};

const EDUCATION_LEVELS = {
  'high school': { level: 1, weight: 0.1 },
  'diploma': { level: 2, weight: 0.3 },
  'associate': { level: 3, weight: 0.5 },
  'bachelor': { level: 4, weight: 0.7 },
  'master': { level: 5, weight: 0.9 },
  'phd': { level: 6, weight: 1.0 },
  'mba': { level: 5, weight: 0.8 },
  'bootcamp': { level: 3, weight: 0.4 }
};

const EXPERIENCE_LEVELS = {
  'entry': { years: [0, 1], level: 1, weight: 0.2 },
  'junior': { years: [1, 3], level: 2, weight: 0.4 },
  'mid': { years: [3, 5], level: 3, weight: 0.6 },
  'senior': { years: [5, 8], level: 4, weight: 0.8 },
  'lead': { years: [8, 12], level: 5, weight: 0.9 },
  'principal': { years: [12, 999], level: 6, weight: 1.0 }
};

class SkillDatabase {
  constructor() {
    this.skills = TECHNICAL_SKILLS;
    this.softSkills = SOFT_SKILLS;
    this.educationLevels = EDUCATION_LEVELS;
    this.experienceLevels = EXPERIENCE_LEVELS;
  }

  findSkill(skillName) {
    const normalized = skillName.toLowerCase().trim();
    
    // Direct match
    if (this.skills[normalized]) {
      return { ...this.skills[normalized], name: normalized, type: 'technical' };
    }
    
    // Check synonyms
    for (const [skill, data] of Object.entries(this.skills)) {
      if (data.synonyms.includes(normalized)) {
        return { ...data, name: skill, type: 'technical' };
      }
    }
    
    // Check soft skills
    if (this.softSkills[normalized]) {
      return { ...this.softSkills[normalized], name: normalized, type: 'soft' };
    }
    
    return null;
  }

  getAllSkills() {
    return {
      technical: Object.keys(this.skills),
      soft: Object.keys(this.softSkills)
    };
  }

  getSkillsByCategory(category) {
    const result = {};
    for (const [skill, data] of Object.entries(this.skills)) {
      if (data.category === category) {
        result[skill] = data;
      }
    }
    return result;
  }

  calculateSkillRelevance(skills, jobRequirements) {
    let relevanceScore = 0;
    let matchedSkills = [];
    let missingSkills = [];

    jobRequirements.forEach(requiredSkill => {
      const found = skills.find(skill => 
        skill.name.toLowerCase() === requiredSkill.toLowerCase() ||
        (this.skills[skill.name] && this.skills[skill.name].synonyms.includes(requiredSkill.toLowerCase()))
      );
      
      if (found) {
        relevanceScore += 1;
        matchedSkills.push(found);
      } else {
        missingSkills.push(requiredSkill);
      }
    });

    return {
      relevanceScore,
      relevancePercentage: (relevanceScore / jobRequirements.length) * 100,
      matchedSkills,
      missingSkills
    };
  }
}

module.exports = {
  SkillDatabase,
  TECHNICAL_SKILLS,
  SOFT_SKILLS,
  EDUCATION_LEVELS,
  EXPERIENCE_LEVELS
};
