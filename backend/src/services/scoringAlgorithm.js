const { SkillDatabase } = require('../data/skillDatabase');

class AdvancedScoringAlgorithm {
  constructor() {
    this.skillDB = new SkillDatabase();
    this.weights = {
      skills: 0.4,        // 40% - Skills relevance and proficiency
      experience: 0.3,    // 30% - Experience level and relevance
      education: 0.15,    // 15% - Education quality and relevance
      projects: 0.1,      // 10% - Project complexity and relevance
      certifications: 0.05 // 5% - Additional qualifications
    };
  }

  async calculateScore(application, jobRequirements, resumeData = null) {
    try {
      console.log('🎯 Calculating advanced score for application:', application.id);
      
      const scores = {
        skills: await this.calculateSkillsScore(application, jobRequirements, resumeData),
        experience: this.calculateExperienceScore(application, jobRequirements, resumeData),
        education: this.calculateEducationScore(application, jobRequirements, resumeData),
        projects: this.calculateProjectsScore(application, jobRequirements, resumeData),
        certifications: this.calculateCertificationsScore(application, jobRequirements, resumeData)
      };

      // Calculate weighted total score
      const totalScore = Object.entries(scores).reduce((total, [key, score]) => {
        return total + (score.score * this.weights[key]);
      }, 0);

      const result = {
        totalScore: Math.round(totalScore * 100) / 100, // Round to 2 decimal places
        maxScore: 100,
        percentage: Math.round((totalScore / 100) * 100),
        breakdown: scores,
        confidence: this.calculateScoreConfidence(scores),
        recommendations: this.generateRecommendations(scores, jobRequirements),
        rankPosition: null // Will be calculated after all applications are scored
      };

      console.log('✅ Score calculation completed:', result.totalScore);
      return result;
    } catch (error) {
      console.error('❌ Error calculating score:', error);
      throw new Error(`Score calculation failed: ${error.message}`);
    }
  }

  async calculateSkillsScore(application, jobRequirements, resumeData) {
    const score = {
      score: 0,
      maxScore: 40,
      details: {
        matchedSkills: [],
        missingSkills: [],
        skillRelevance: 0,
        proficiencyBonus: 0,
        categoryBonus: 0
      }
    };

    try {
      // Get applicant skills
      const applicantSkills = this.extractApplicantSkills(application, resumeData);
      const requiredSkills = this.parseJobSkills(jobRequirements.required_skills);
      
      console.log('🔍 Analyzing skills match...');
      console.log('📋 Applicant skills:', applicantSkills.length);
      console.log('📋 Required skills:', requiredSkills.length);

      // Calculate skill relevance
      const relevance = this.skillDB.calculateSkillRelevance(applicantSkills, requiredSkills);
      score.details.matchedSkills = relevance.matchedSkills;
      score.details.missingSkills = relevance.missingSkills;
      score.details.skillRelevance = relevance.relevancePercentage;

      // Base score from skill relevance
      score.score = (relevance.relevancePercentage / 100) * 30;

      // Proficiency bonus
      score.details.proficiencyBonus = this.calculateProficiencyBonus(relevance.matchedSkills);
      score.score += score.details.proficiencyBonus;

      // Category bonus (prioritize core skills)
      score.details.categoryBonus = this.calculateCategoryBonus(relevance.matchedSkills, jobRequirements);
      score.score += score.details.categoryBonus;

      // Ensure score doesn't exceed max
      score.score = Math.min(score.score, score.maxScore);

      console.log('📊 Skills score:', score.score);
      return score;
    } catch (error) {
      console.error('❌ Error calculating skills score:', error);
      return score;
    }
  }

  calculateExperienceScore(application, jobRequirements, resumeData) {
    const score = {
      score: 0,
      maxScore: 30,
      details: {
        yearsOfExperience: 0,
        relevanceScore: 0,
        levelMatch: 0,
        growthBonus: 0
      }
    };

    try {
      // Extract experience from resume or application
      const experience = this.extractExperience(application, resumeData);
      
      // Parse required experience from job
      const requiredExperience = this.parseJobExperience(jobRequirements.required_experience);
      
      console.log('💼 Analyzing experience match...');
      console.log('📊 Applicant experience:', experience.years, 'years');
      console.log('📊 Required experience:', requiredExperience.minYears, 'years');

      // Years of experience score
      const yearsScore = this.calculateYearsScore(experience.years, requiredExperience.minYears);
      score.details.yearsOfExperience = yearsScore;

      // Relevance score (how relevant the experience is to the job)
      score.details.relevanceScore = this.calculateExperienceRelevance(experience, jobRequirements);

      // Level match score
      score.details.levelMatch = this.calculateLevelMatch(experience.level, requiredExperience.level);

      // Growth bonus (career progression)
      score.details.growthBonus = this.calculateGrowthBonus(experience);

      // Calculate total experience score
      score.score = yearsScore + score.details.relevanceScore + score.details.levelMatch + score.details.growthBonus;
      score.score = Math.min(score.score, score.maxScore);

      console.log('📊 Experience score:', score.score);
      return score;
    } catch (error) {
      console.error('❌ Error calculating experience score:', error);
      return score;
    }
  }

  calculateEducationScore(application, jobRequirements, resumeData) {
    const score = {
      score: 0,
      maxScore: 15,
      details: {
        educationLevel: 0,
        fieldRelevance: 0,
        institutionQuality: 0,
        additionalBonus: 0
      }
    };

    try {
      // Extract education from resume or application
      const education = this.extractEducation(application, resumeData);
      
      // Parse required education from job
      const requiredEducation = this.parseJobEducation(jobRequirements.required_education);
      
      console.log('🎓 Analyzing education match...');
      console.log('📚 Applicant education:', education);
      console.log('📚 Required education:', requiredEducation);

      // Education level score
      score.details.educationLevel = this.calculateEducationLevelScore(education, requiredEducation);

      // Field relevance score
      score.details.fieldRelevance = this.calculateFieldRelevance(education, jobRequirements);

      // Institution quality score (if available)
      score.details.institutionQuality = this.calculateInstitutionQuality(education);

      // Additional bonus (GPA, honors, etc.)
      score.details.additionalBonus = this.calculateEducationBonus(education);

      // Calculate total education score
      score.score = score.details.educationLevel + score.details.fieldRelevance + 
                   score.details.institutionQuality + score.details.additionalBonus;
      score.score = Math.min(score.score, score.maxScore);

      console.log('📊 Education score:', score.score);
      return score;
    } catch (error) {
      console.error('❌ Error calculating education score:', error);
      return score;
    }
  }

  calculateProjectsScore(application, jobRequirements, resumeData) {
    const score = {
      score: 0,
      maxScore: 10,
      details: {
        projectCount: 0,
        complexityScore: 0,
        relevanceScore: 0,
        techAlignment: 0
      }
    };

    try {
      // Extract projects from resume
      const projects = this.extractProjects(application, resumeData);
      
      console.log('🚀 Analyzing projects...');
      console.log('📊 Project count:', projects.length);

      if (projects.length === 0) {
        return score;
      }

      // Project count score
      score.details.projectCount = Math.min(projects.length * 0.5, 2);

      // Complexity score
      score.details.complexityScore = this.calculateProjectComplexity(projects);

      // Relevance score
      score.details.relevanceScore = this.calculateProjectRelevance(projects, jobRequirements);

      // Tech alignment score
      score.details.techAlignment = this.calculateTechAlignment(projects, jobRequirements);

      // Calculate total projects score
      score.score = score.details.projectCount + score.details.complexityScore + 
                   score.details.relevanceScore + score.details.techAlignment;
      score.score = Math.min(score.score, score.maxScore);

      console.log('📊 Projects score:', score.score);
      return score;
    } catch (error) {
      console.error('❌ Error calculating projects score:', error);
      return score;
    }
  }

  calculateCertificationsScore(application, jobRequirements, resumeData) {
    const score = {
      score: 0,
      maxScore: 5,
      details: {
        certificationCount: 0,
        relevanceScore: 0,
        issuerQuality: 0
      }
    };

    try {
      // Extract certifications from resume
      const certifications = this.extractCertifications(application, resumeData);
      
      console.log('🏆 Analyzing certifications...');
      console.log('📊 Certification count:', certifications.length);

      if (certifications.length === 0) {
        return score;
      }

      // Certification count score
      score.details.certificationCount = Math.min(certifications.length * 0.5, 1);

      // Relevance score
      score.details.relevanceScore = this.calculateCertificationRelevance(certifications, jobRequirements);

      // Issuer quality score
      score.details.issuerQuality = this.calculateIssuerQuality(certifications);

      // Calculate total certifications score
      score.score = score.details.certificationCount + score.details.relevanceScore + score.details.issuerQuality;
      score.score = Math.min(score.score, score.maxScore);

      console.log('📊 Certifications score:', score.score);
      return score;
    } catch (error) {
      console.error('❌ Error calculating certifications score:', error);
      return score;
    }
  }

  // Helper methods
  extractApplicantSkills(application, resumeData) {
    let skills = [];
    
    // Extract from application skills
    if (application.skills) {
      try {
        const appSkills = typeof application.skills === 'string' ? 
          JSON.parse(application.skills) : application.skills;
        
        if (Array.isArray(appSkills)) {
          skills = appSkills.map(skill => ({
            name: skill.name || skill,
            level: skill.level || 'intermediate',
            confidence: 0.8
          }));
        }
      } catch (error) {
        console.error('Error parsing application skills:', error);
      }
    }
    
    // Extract from resume data if available
    if (resumeData && resumeData.skills) {
      const resumeSkills = [
        ...resumeData.skills.technical,
        ...resumeData.skills.soft
      ];
      
      // Merge and deduplicate
      resumeSkills.forEach(resumeSkill => {
        if (!skills.find(s => s.name.toLowerCase() === resumeSkill.name.toLowerCase())) {
          skills.push({
            name: resumeSkill.name,
            level: resumeSkill.level || 'intermediate',
            confidence: resumeSkill.confidence || 0.7
          });
        }
      });
    }
    
    return skills;
  }

  parseJobSkills(requiredSkills) {
    try {
      if (typeof requiredSkills === 'string') {
        return JSON.parse(requiredSkills);
      }
      return requiredSkills || [];
    } catch (error) {
      console.error('Error parsing job skills:', error);
      return [];
    }
  }

  parseJobExperience(requiredExperience) {
    try {
      if (typeof requiredExperience === 'string') {
        return JSON.parse(requiredExperience);
      }
      return requiredExperience || { minYears: 0, preferredRoles: [] };
    } catch (error) {
      console.error('Error parsing job experience:', error);
      return { minYears: 0, preferredRoles: [] };
    }
  }

  parseJobEducation(requiredEducation) {
    try {
      if (typeof requiredEducation === 'string') {
        return JSON.parse(requiredEducation);
      }
      return requiredEducation || [];
    } catch (error) {
      console.error('Error parsing job education:', error);
      return [];
    }
  }

  calculateProficiencyBonus(matchedSkills) {
    let bonus = 0;
    
    matchedSkills.forEach(skill => {
      const skillData = this.skillDB.findSkill(skill.name);
      if (skillData) {
        // Higher level skills get more bonus
        if (skillData.level === 'advanced') bonus += 0.5;
        else if (skillData.level === 'intermediate') bonus += 0.3;
        else if (skillData.level === 'beginner') bonus += 0.1;
      }
    });
    
    return Math.min(bonus, 5);
  }

  calculateCategoryBonus(matchedSkills, jobRequirements) {
    let bonus = 0;
    
    // Prioritize core categories for the job
    const jobTitle = jobRequirements.title.toLowerCase();
    
    if (jobTitle.includes('frontend') || jobTitle.includes('react') || jobTitle.includes('ui')) {
      matchedSkills.forEach(skill => {
        const skillData = this.skillDB.findSkill(skill.name);
        if (skillData && (skillData.category === 'web' || skillData.category === 'programming')) {
          bonus += 0.3;
        }
      });
    } else if (jobTitle.includes('backend') || jobTitle.includes('api') || jobTitle.includes('database')) {
      matchedSkills.forEach(skill => {
        const skillData = this.skillDB.findSkill(skill.name);
        if (skillData && (skillData.category === 'backend' || skillData.category === 'database')) {
          bonus += 0.3;
        }
      });
    } else if (jobTitle.includes('machine learning') || jobTitle.includes('ai') || jobTitle.includes('data')) {
      matchedSkills.forEach(skill => {
        const skillData = this.skillDB.findSkill(skill.name);
        if (skillData && (skillData.category === 'ai' || skillData.category === 'data')) {
          bonus += 0.3;
        }
      });
    }
    
    return Math.min(bonus, 5);
  }

  calculateYearsScore(applicantYears, requiredYears) {
    if (applicantYears >= requiredYears) {
      return 10; // Full score for meeting requirements
    } else if (applicantYears >= requiredYears * 0.8) {
      return 8; // Good score for close to requirements
    } else if (applicantYears >= requiredYears * 0.6) {
      return 6; // Moderate score
    } else if (applicantYears >= requiredYears * 0.4) {
      return 4; // Low score
    } else {
      return 2; // Very low score
    }
  }

  calculateExperienceRelevance(experience, jobRequirements) {
    let relevanceScore = 0;
    
    experience.positions.forEach(position => {
      const positionText = (position.position + ' ' + position.description).toLowerCase();
      const jobTitle = jobRequirements.title.toLowerCase();
      
      // Check for relevant keywords
      if (positionText.includes(jobTitle)) {
        relevanceScore += 3;
      }
      
      // Check for preferred roles
      jobRequirements.required_experience.preferred_roles.forEach(role => {
        if (positionText.includes(role.toLowerCase())) {
          relevanceScore += 2;
        }
      });
    });
    
    return Math.min(relevanceScore, 5);
  }

  calculateLevelMatch(applicantLevel, requiredLevel) {
    const levels = { 'entry': 1, 'junior': 2, 'mid': 3, 'senior': 4, 'lead': 5, 'principal': 6 };
    
    const applicantLevelNum = levels[applicantLevel] || 1;
    const requiredLevelNum = levels[requiredLevel] || 1;
    
    if (applicantLevelNum >= requiredLevelNum) {
      return 5; // Full score for meeting or exceeding level
    } else if (applicantLevelNum === requiredLevelNum - 1) {
      return 3; // Good score for close level
    } else {
      return 1; // Low score for level mismatch
    }
  }

  calculateGrowthBonus(experience) {
    let bonus = 0;
    
    // Check for career progression
    if (experience.positions.length > 1) {
      const sortedPositions = experience.positions.sort((a, b) => {
        const aLevel = this.getPositionLevel(a.position);
        const bLevel = this.getPositionLevel(b.position);
        return aLevel - bLevel;
      });
      
      // Check if there's progression
      for (let i = 1; i < sortedPositions.length; i++) {
        if (this.getPositionLevel(sortedPositions[i].position) > 
            this.getPositionLevel(sortedPositions[i-1].position)) {
          bonus += 1;
        }
      }
    }
    
    return Math.min(bonus, 3);
  }

  getPositionLevel(position) {
    const positionLower = position.toLowerCase();
    
    if (positionLower.includes('senior') || positionLower.includes('lead') || positionLower.includes('principal')) {
      return 4;
    } else if (positionLower.includes('mid') || positionLower.includes('experienced')) {
      return 3;
    } else if (positionLower.includes('junior') || positionLower.includes('associate')) {
      return 2;
    } else {
      return 1;
    }
  }

  calculateEducationLevelScore(education, requiredEducation) {
    let score = 0;
    
    education.forEach(edu => {
      const level = this.getEducationLevel(edu.degree);
      
      // Check if education meets requirements
      if (requiredEducation.some(req => req.toLowerCase().includes(edu.field.toLowerCase()))) {
        score += level * 2;
      } else {
        score += level;
      }
    });
    
    return Math.min(score, 8);
  }

  getEducationLevel(degree) {
    const degreeLower = degree.toLowerCase();
    
    if (degreeLower.includes('phd') || degreeLower.includes('doctorate')) {
      return 6;
    } else if (degreeLower.includes('master') || degreeLower.includes('mba')) {
      return 5;
    } else if (degreeLower.includes('bachelor')) {
      return 4;
    } else if (degreeLower.includes('associate')) {
      return 3;
    } else if (degreeLower.includes('diploma') || degreeLower.includes('certificate')) {
      return 2;
    } else {
      return 1;
    }
  }

  calculateFieldRelevance(education, jobRequirements) {
    let relevanceScore = 0;
    
    education.forEach(edu => {
      const field = edu.field.toLowerCase();
      const jobTitle = jobRequirements.title.toLowerCase();
      
      // Check for relevant fields
      if (field.includes('computer') || field.includes('software') || field.includes('information')) {
        relevanceScore += 2;
      }
      
      if (field.includes('engineering') && jobTitle.includes('developer')) {
        relevanceScore += 2;
      }
      
      if (field.includes('data') && jobTitle.includes('data')) {
        relevanceScore += 2;
      }
    });
    
    return Math.min(relevanceScore, 4);
  }

  calculateInstitutionQuality(education) {
    let qualityScore = 0;
    
    education.forEach(edu => {
      const institution = edu.institution.toLowerCase();
      
      // Top-tier institutions
      if (institution.includes('mit') || institution.includes('stanford') || 
          institution.includes('harvard') || institution.includes('berkeley') ||
          institution.includes('carnegie') || institution.includes('caltech')) {
        qualityScore += 2;
      }
      // Good institutions
      else if (institution.includes('university') || institution.includes('college')) {
        qualityScore += 1;
      }
    });
    
    return Math.min(qualityScore, 2);
  }

  calculateEducationBonus(education) {
    let bonus = 0;
    
    education.forEach(edu => {
      // GPA bonus
      if (edu.gpa && parseFloat(edu.gpa) >= 3.5) {
        bonus += 0.5;
      }
      
      // Honors bonus
      if (edu.achievements && edu.achievements.some(a => 
          a.toLowerCase().includes('honor') || a.toLowerCase().includes('dean'))) {
        bonus += 0.5;
      }
    });
    
    return Math.min(bonus, 1);
  }

  extractExperience(application, resumeData) {
    let experience = {
      years: 0,
      level: 'entry',
      positions: []
    };
    
    // Extract from resume data if available
    if (resumeData && resumeData.experience) {
      experience.positions = resumeData.experience;
      
      // Calculate total years
      resumeData.experience.forEach(exp => {
        if (exp.startDate && exp.endDate) {
          const start = new Date(exp.startDate);
          const end = exp.endDate === 'Current' ? new Date() : new Date(exp.endDate);
          const years = (end - start) / (365.25 * 24 * 60 * 60 * 1000);
          experience.years += years;
        }
      });
      
      // Determine level
      if (experience.years >= 8) experience.level = 'principal';
      else if (experience.years >= 5) experience.level = 'lead';
      else if (experience.years >= 3) experience.level = 'senior';
      else if (experience.years >= 1) experience.level = 'mid';
      else experience.level = 'junior';
    }
    
    return experience;
  }

  extractEducation(application, resumeData) {
    if (resumeData && resumeData.education) {
      return resumeData.education;
    }
    
    return [];
  }

  extractProjects(application, resumeData) {
    if (resumeData && resumeData.projects) {
      return resumeData.projects;
    }
    
    return [];
  }

  extractCertifications(application, resumeData) {
    if (resumeData && resumeData.certifications) {
      return resumeData.certifications;
    }
    
    return [];
  }

  calculateProjectComplexity(projects) {
    let complexityScore = 0;
    
    projects.forEach(project => {
      // Complexity based on technologies used
      if (project.technologies) {
        const techCount = project.technologies.length;
        if (techCount >= 5) complexityScore += 2;
        else if (techCount >= 3) complexityScore += 1;
      }
      
      // Complexity based on description length
      if (project.description && project.description.length > 200) {
        complexityScore += 1;
      }
    });
    
    return Math.min(complexityScore, 3);
  }

  calculateProjectRelevance(projects, jobRequirements) {
    let relevanceScore = 0;
    
    projects.forEach(project => {
      const projectText = (project.name + ' ' + project.description).toLowerCase();
      const jobTitle = jobRequirements.title.toLowerCase();
      
      // Check for relevant keywords
      if (projectText.includes(jobTitle)) {
        relevanceScore += 2;
      }
      
      // Check for technology alignment
      if (project.technologies) {
        project.technologies.forEach(tech => {
          if (jobRequirements.title.toLowerCase().includes(tech.toLowerCase())) {
            relevanceScore += 1;
          }
        });
      }
    });
    
    return Math.min(relevanceScore, 3);
  }

  calculateTechAlignment(projects, jobRequirements) {
    let alignmentScore = 0;
    
    projects.forEach(project => {
      if (project.technologies) {
        project.technologies.forEach(tech => {
          const skillData = this.skillDB.findSkill(tech);
          if (skillData) {
            alignmentScore += 0.5;
          }
        });
      }
    });
    
    return Math.min(alignmentScore, 2);
  }

  calculateCertificationRelevance(certifications, jobRequirements) {
    let relevanceScore = 0;
    
    certifications.forEach(cert => {
      const certName = cert.name.toLowerCase();
      const jobTitle = jobRequirements.title.toLowerCase();
      
      // Check for relevant certifications
      if (certName.includes('aws') && jobTitle.includes('cloud')) {
        relevanceScore += 2;
      }
      
      if (certName.includes('pmp') && jobTitle.includes('manager')) {
        relevanceScore += 2;
      }
      
      if (certName.includes('scrum') || certName.includes('agile')) {
        relevanceScore += 1;
      }
    });
    
    return Math.min(relevanceScore, 2);
  }

  calculateIssuerQuality(certifications) {
    let qualityScore = 0;
    
    certifications.forEach(cert => {
      const issuer = cert.issuer.toLowerCase();
      
      // Top-tier certification providers
      if (issuer.includes('aws') || issuer.includes('google') || 
          issuer.includes('microsoft') || issuer.includes('oracle')) {
        qualityScore += 1;
      }
    });
    
    return Math.min(qualityScore, 2);
  }

  calculateScoreConfidence(scores) {
    let totalConfidence = 0;
    let factorCount = 0;
    
    Object.values(scores).forEach(score => {
      if (score.score > 0) {
        totalConfidence += 1;
        factorCount++;
      }
    });
    
    return factorCount > 0 ? totalConfidence / factorCount : 0;
  }

  generateRecommendations(scores, jobRequirements) {
    const recommendations = [];
    
    // Skills recommendations
    if (scores.skills.details.missingSkills.length > 0) {
      recommendations.push({
        type: 'skills',
        priority: 'high',
        message: `Consider learning these missing skills: ${scores.skills.details.missingSkills.join(', ')}`,
        action: 'Focus on developing these skills to improve your match'
      });
    }
    
    // Experience recommendations
    if (scores.experience.score < 20) {
      recommendations.push({
        type: 'experience',
        priority: 'medium',
        message: 'Your experience level could be stronger for this role',
        action: 'Consider gaining more relevant experience or highlighting transferable skills'
      });
    }
    
    // Education recommendations
    if (scores.education.score < 10) {
      recommendations.push({
        type: 'education',
        priority: 'low',
        message: 'Additional education could strengthen your application',
        action: 'Consider certifications or courses in relevant fields'
      });
    }
    
    return recommendations;
  }
}

module.exports = AdvancedScoringAlgorithm;
