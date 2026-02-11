const { SkillDatabase } = require('../data/skillDatabase');

class RecommendationEngine {
  constructor() {
    this.skillDB = new SkillDatabase();
    this.weights = {
      skillMatch: 0.4,        // 40% - Skills relevance
      experienceMatch: 0.25,   // 25% - Experience level
      educationMatch: 0.15,    // 15% - Education relevance
      locationMatch: 0.1,      // 10% - Location preference
      salaryMatch: 0.05,       // 5% - Salary expectations
      companyMatch: 0.05       // 5% - Company culture fit
    };
  }

  async generateRecommendations(candidateProfile, availableJobs, userPreferences = {}) {
    try {
      console.log('🎯 Generating job recommendations for candidate:', candidateProfile.id);
      console.log('📊 Available jobs:', availableJobs.length);
      
      const recommendations = [];
      
      for (const job of availableJobs) {
        const score = await this.calculateJobMatchScore(candidateProfile, job, userPreferences);
        
        if (score.totalScore > 30) { // Only include relevant matches
          recommendations.push({
            jobId: job.id,
            jobTitle: job.title,
            company: job.company_name || 'Company',
            location: job.location || 'Remote',
            salaryRange: job.salary_range,
            employmentType: job.employment_type,
            matchScore: score.totalScore,
            matchPercentage: score.percentage,
            breakdown: score.breakdown,
            reasons: score.reasons,
            missingSkills: score.missingSkills,
            applicationStatus: job.applicationStatus || null,
            recommendedAt: new Date().toISOString()
          });
        }
      }
      
      // Sort by match score (highest first)
      recommendations.sort((a, b) => b.matchScore - a.matchScore);
      
      // Limit to top recommendations
      const topRecommendations = recommendations.slice(0, 20);
      
      console.log('✅ Generated', topRecommendations.length, 'recommendations');
      
      return {
        recommendations: topRecommendations,
        totalJobs: availableJobs.length,
        relevantMatches: topRecommendations.length,
        averageMatchScore: topRecommendations.length > 0 ? 
          topRecommendations.reduce((sum, rec) => sum + rec.matchScore, 0) / topRecommendations.length : 0,
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      throw new Error(`Recommendation generation failed: ${error.message}`);
    }
  }

  async calculateJobMatchScore(candidateProfile, job, userPreferences) {
    const score = {
      totalScore: 0,
      maxScore: 100,
      percentage: 0,
      breakdown: {
        skills: 0,
        experience: 0,
        education: 0,
        location: 0,
        salary: 0,
        company: 0
      },
      reasons: [],
      missingSkills: []
    };

    try {
      // Skills match (40%)
      const skillsScore = this.calculateSkillsMatch(candidateProfile, job);
      score.breakdown.skills = skillsScore.score;
      score.totalScore += skillsScore.score * this.weights.skillMatch;
      
      if (skillsScore.matchedSkills.length > 0) {
        score.reasons.push(`Strong match on ${skillsScore.matchedSkills.length} key skills`);
      }
      
      if (skillsScore.missingSkills.length > 0) {
        score.missingSkills = skillsScore.missingSkills;
      }

      // Experience match (25%)
      const experienceScore = this.calculateExperienceMatch(candidateProfile, job);
      score.breakdown.experience = experienceScore.score;
      score.totalScore += experienceScore.score * this.weights.experienceMatch;
      
      if (experienceScore.levelMatch) {
        score.reasons.push('Experience level aligns with job requirements');
      }

      // Education match (15%)
      const educationScore = this.calculateEducationMatch(candidateProfile, job);
      score.breakdown.education = educationScore.score;
      score.totalScore += educationScore.score * this.weights.educationMatch;
      
      if (educationScore.fieldMatch) {
        score.reasons.push('Educational background is relevant');
      }

      // Location match (10%)
      const locationScore = this.calculateLocationMatch(candidateProfile, job, userPreferences);
      score.breakdown.location = locationScore.score;
      score.totalScore += locationScore.score * this.weights.locationMatch;
      
      if (locationScore.perfectMatch) {
        score.reasons.push('Location preference matches perfectly');
      }

      // Salary match (5%)
      const salaryScore = this.calculateSalaryMatch(candidateProfile, job, userPreferences);
      score.breakdown.salary = salaryScore.score;
      score.totalScore += salaryScore.score * this.weights.salaryMatch;
      
      if (salaryScore.withinRange) {
        score.reasons.push('Salary expectations align with job offer');
      }

      // Company culture match (5%)
      const companyScore = this.calculateCompanyMatch(candidateProfile, job, userPreferences);
      score.breakdown.company = companyScore.score;
      score.totalScore += companyScore.score * this.weights.companyMatch;
      
      if (companyScore.goodFit) {
        score.reasons.push('Company culture appears to be a good fit');
      }

      // Calculate percentage
      score.percentage = Math.round((score.totalScore / score.maxScore) * 100);

      return score;
    } catch (error) {
      console.error('❌ Error calculating match score:', error);
      return score;
    }
  }

  calculateSkillsMatch(candidateProfile, job) {
    const score = {
      score: 0,
      maxScore: 40,
      matchedSkills: [],
      missingSkills: [],
      skillLevelBonus: 0
    };

    try {
      // Get candidate skills
      const candidateSkills = this.extractCandidateSkills(candidateProfile);
      const requiredSkills = this.parseJobSkills(job.required_skills);
      
      // Calculate skill relevance
      const relevance = this.skillDB.calculateSkillRelevance(candidateSkills, requiredSkills);
      score.matchedSkills = relevance.matchedSkills;
      score.missingSkills = relevance.missingSkills;
      
      // Base score from skill relevance
      score.score = (relevance.relevancePercentage / 100) * 30;
      
      // Skill level bonus
      score.skillLevelBonus = this.calculateSkillLevelBonus(relevance.matchedSkills, job);
      score.score += score.skillLevelBonus;
      
      // Ensure score doesn't exceed max
      score.score = Math.min(score.score, score.maxScore);
      
      return score;
    } catch (error) {
      console.error('❌ Error calculating skills match:', error);
      return score;
    }
  }

  calculateExperienceMatch(candidateProfile, job) {
    const score = {
      score: 0,
      maxScore: 25,
      levelMatch: false,
      yearsMatch: false,
      relevanceBonus: 0
    };

    try {
      // Extract candidate experience
      const candidateExperience = this.extractCandidateExperience(candidateProfile);
      const requiredExperience = this.parseJobExperience(job.required_experience);
      
      // Years of experience match
      if (candidateExperience.years >= requiredExperience.minYears) {
        score.yearsMatch = true;
        score.score += 15;
      } else if (candidateExperience.years >= requiredExperience.minYears * 0.8) {
        score.score += 10;
      } else if (candidateExperience.years >= requiredExperience.minYears * 0.6) {
        score.score += 5;
      }
      
      // Level match
      const candidateLevel = this.getExperienceLevel(candidateExperience.years);
      const requiredLevel = this.getExperienceLevel(requiredExperience.minYears);
      
      if (candidateLevel >= requiredLevel) {
        score.levelMatch = true;
        score.score += 10;
      } else if (candidateLevel === requiredLevel - 1) {
        score.score += 5;
      }
      
      // Relevance bonus
      score.relevanceBonus = this.calculateExperienceRelevance(candidateExperience, job);
      score.score += score.relevanceBonus;
      
      // Ensure score doesn't exceed max
      score.score = Math.min(score.score, score.maxScore);
      
      return score;
    } catch (error) {
      console.error('❌ Error calculating experience match:', error);
      return score;
    }
  }

  calculateEducationMatch(candidateProfile, job) {
    const score = {
      score: 0,
      maxScore: 15,
      fieldMatch: false,
      levelMatch: false,
      institutionBonus: 0
    };

    try {
      // Extract candidate education
      const candidateEducation = this.extractCandidateEducation(candidateProfile);
      const requiredEducation = this.parseJobEducation(job.required_education);
      
      // Level match
      const highestLevel = this.getHighestEducationLevel(candidateEducation);
      const requiredLevel = this.getRequiredEducationLevel(requiredEducation);
      
      if (highestLevel >= requiredLevel) {
        score.levelMatch = true;
        score.score += 10;
      } else if (highestLevel === requiredLevel - 1) {
        score.score += 5;
      }
      
      // Field match
      const fieldMatch = this.calculateFieldMatch(candidateEducation, job);
      if (fieldMatch) {
        score.fieldMatch = true;
        score.score += 5;
      }
      
      // Institution bonus
      score.institutionBonus = this.calculateInstitutionBonus(candidateEducation);
      score.score += score.institutionBonus;
      
      // Ensure score doesn't exceed max
      score.score = Math.min(score.score, score.maxScore);
      
      return score;
    } catch (error) {
      console.error('❌ Error calculating education match:', error);
      return score;
    }
  }

  calculateLocationMatch(candidateProfile, job, userPreferences) {
    const score = {
      score: 0,
      maxScore: 10,
      perfectMatch: false,
      partialMatch: false
    };

    try {
      const candidateLocation = candidateProfile.location || userPreferences.location;
      const jobLocation = job.location;
      
      if (!jobLocation || jobLocation.toLowerCase() === 'remote') {
        score.perfectMatch = true;
        score.score = 10; // Remote jobs always match
      } else if (candidateLocation) {
        const candidateLower = candidateLocation.toLowerCase();
        const jobLower = jobLocation.toLowerCase();
        
        if (candidateLower === jobLower) {
          score.perfectMatch = true;
          score.score = 10;
        } else if (candidateLower.includes(jobLower) || jobLower.includes(candidateLower)) {
          score.partialMatch = true;
          score.score = 7;
        } else if (this.isNearbyLocation(candidateLower, jobLower)) {
          score.partialMatch = true;
          score.score = 5;
        }
      }
      
      return score;
    } catch (error) {
      console.error('❌ Error calculating location match:', error);
      return score;
    }
  }

  calculateSalaryMatch(candidateProfile, job, userPreferences) {
    const score = {
      score: 0,
      maxScore: 5,
      withinRange: false,
      aboveRange: false
    };

    try {
      const candidateSalary = userPreferences.expectedSalary || candidateProfile.expectedSalary;
      const jobSalary = job.salary_range;
      
      if (!candidateSalary || !jobSalary) {
        return score; // No salary information available
      }
      
      // Parse salary ranges
      const jobRange = this.parseSalaryRange(jobSalary);
      const candidateRange = this.parseSalaryRange(candidateSalary);
      
      if (candidateRange.min >= jobRange.min && candidateRange.min <= jobRange.max) {
        score.withinRange = true;
        score.score = 5;
      } else if (candidateRange.min > jobRange.max) {
        score.aboveRange = true;
        score.score = 3; // Candidate expects more, but still a match
      } else if (candidateRange.min >= jobRange.min * 0.8) {
        score.score = 2; // Close to range
      }
      
      return score;
    } catch (error) {
      console.error('❌ Error calculating salary match:', error);
      return score;
    }
  }

  calculateCompanyMatch(candidateProfile, job, userPreferences) {
    const score = {
      score: 0,
      maxScore: 5,
      goodFit: false,
      industryMatch: false
    };

    try {
      // Company size preference
      const companySize = userPreferences.companySize || 'medium';
      const jobCompany = job.company_name || '';
      
      // Industry match
      const candidateIndustry = candidateProfile.industry || userPreferences.industry;
      if (candidateIndustry && this.isIndustryMatch(candidateIndustry, jobCompany)) {
        score.industryMatch = true;
        score.score += 3;
      }
      
      // Company culture factors
      if (this.isTechCompany(jobCompany) && candidateProfile.preferTech) {
        score.goodFit = true;
        score.score += 2;
      }
      
      return score;
    } catch (error) {
      console.error('❌ Error calculating company match:', error);
      return score;
    }
  }

  // Helper methods
  extractCandidateSkills(candidateProfile) {
    let skills = [];
    
    // From resume data
    if (candidateProfile.resumeData && candidateProfile.resumeData.skills) {
      skills = [
        ...candidateProfile.resumeData.skills.technical,
        ...candidateProfile.resumeData.skills.soft
      ];
    }
    
    // From applications
    if (candidateProfile.applications) {
      candidateProfile.applications.forEach(app => {
        if (app.skills) {
          const appSkills = typeof app.skills === 'string' ? 
            JSON.parse(app.skills) : app.skills;
          
          appSkills.forEach(skill => {
            if (!skills.find(s => s.name.toLowerCase() === skill.name.toLowerCase())) {
              skills.push({
                name: skill.name,
                level: skill.level || 'intermediate',
                confidence: 0.8
              });
            }
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

  calculateSkillLevelBonus(matchedSkills, job) {
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

  extractCandidateExperience(candidateProfile) {
    let experience = {
      years: 0,
      positions: []
    };
    
    if (candidateProfile.resumeData && candidateProfile.resumeData.experience) {
      experience.positions = candidateProfile.resumeData.experience;
      
      // Calculate total years
      candidateProfile.resumeData.experience.forEach(exp => {
        if (exp.startDate && exp.endDate) {
          const start = new Date(exp.startDate);
          const end = exp.endDate === 'Current' ? new Date() : new Date(exp.endDate);
          const years = (end - start) / (365.25 * 24 * 60 * 60 * 1000);
          experience.years += years;
        }
      });
    }
    
    return experience;
  }

  getExperienceLevel(years) {
    if (years >= 8) return 'principal';
    else if (years >= 5) return 'lead';
    else if (years >= 3) return 'senior';
    else if (years >= 1) return 'mid';
    else return 'junior';
  }

  calculateExperienceRelevance(experience, job) {
    let relevanceScore = 0;
    
    experience.positions.forEach(position => {
      const positionText = (position.position + ' ' + position.description).toLowerCase();
      const jobTitle = job.title.toLowerCase();
      
      // Check for relevant keywords
      if (positionText.includes(jobTitle)) {
        relevanceScore += 3;
      }
      
      // Check for preferred roles
      const requiredExperience = this.parseJobExperience(job.required_experience);
      requiredExperience.preferred_roles.forEach(role => {
        if (positionText.includes(role.toLowerCase())) {
          relevanceScore += 2;
        }
      });
    });
    
    return Math.min(relevanceScore, 5);
  }

  extractCandidateEducation(candidateProfile) {
    if (candidateProfile.resumeData && candidateProfile.resumeData.education) {
      return candidateProfile.resumeData.education;
    }
    
    return [];
  }

  getHighestEducationLevel(education) {
    let highestLevel = 0;
    
    education.forEach(edu => {
      const level = this.getEducationLevel(edu.degree);
      if (level > highestLevel) {
        highestLevel = level;
      }
    });
    
    return highestLevel;
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

  getRequiredEducationLevel(requiredEducation) {
    let highestLevel = 0;
    
    requiredEducation.forEach(req => {
      const level = this.getEducationLevel(req);
      if (level > highestLevel) {
        highestLevel = level;
      }
    });
    
    return highestLevel;
  }

  calculateFieldMatch(education, job) {
    let fieldMatch = false;
    
    education.forEach(edu => {
      const field = edu.field.toLowerCase();
      const jobTitle = job.title.toLowerCase();
      
      // Check for relevant fields
      if (field.includes('computer') || field.includes('software') || field.includes('information')) {
        fieldMatch = true;
      }
      
      if (field.includes('engineering') && jobTitle.includes('developer')) {
        fieldMatch = true;
      }
      
      if (field.includes('data') && jobTitle.includes('data')) {
        fieldMatch = true;
      }
    });
    
    return fieldMatch;
  }

  calculateInstitutionBonus(education) {
    let bonus = 0;
    
    education.forEach(edu => {
      const institution = edu.institution.toLowerCase();
      
      // Top-tier institutions
      if (institution.includes('mit') || institution.includes('stanford') || 
          institution.includes('harvard') || institution.includes('berkeley') ||
          institution.includes('carnegie') || institution.includes('caltech')) {
        bonus += 1;
      }
    });
    
    return Math.min(bonus, 2);
  }

  isNearbyLocation(location1, location2) {
    // Simple proximity check - can be enhanced with actual geolocation
    const cities = ['new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 
                   'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville'];
    
    return cities.some(city => location1.includes(city) && location2.includes(city));
  }

  parseSalaryRange(salaryString) {
    try {
      // Extract numbers from salary string
      const numbers = salaryString.match(/\$?\d+(?:,\d+)*(?:\.\d+)?/g);
      if (numbers && numbers.length >= 2) {
        return {
          min: parseInt(numbers[0].replace(/[$,]/g, '')),
          max: parseInt(numbers[1].replace(/[$,]/g, ''))
        };
      } else if (numbers && numbers.length === 1) {
        const value = parseInt(numbers[0].replace(/[$,]/g, ''));
        return {
          min: value * 0.8,
          max: value * 1.2
        };
      }
    } catch (error) {
      console.error('Error parsing salary range:', error);
    }
    
    return { min: 0, max: 999999 };
  }

  isTechCompany(companyName) {
    const techKeywords = ['tech', 'software', 'systems', 'digital', 'solutions', 'innovations', 
                        'labs', 'studio', 'interactive', 'media', 'networks', 'computing'];
    
    const companyLower = companyName.toLowerCase();
    return techKeywords.some(keyword => companyLower.includes(keyword));
  }

  isIndustryMatch(industry, companyName) {
    const industryLower = industry.toLowerCase();
    const companyLower = companyName.toLowerCase();
    
    return companyLower.includes(industryLower) || industryLower.includes(companyLower);
  }
}

module.exports = RecommendationEngine;
