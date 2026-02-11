const { SkillDatabase } = require('../data/skillDatabase');
const pdfParse = require('pdf-parse');

class EnhancedResumeParser {
  constructor() {
    this.skillDB = new SkillDatabase();
    this.commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'if', 'then', 'else', 'when', 'while', 'because', 'since', 'until', 'as', 'though', 'although', 'after', 'before', 'during', 'under', 'above', 'between', 'among', 'through', 'against', 'without', 'upon', 'from', 'up', 'down', 'out', 'off', 'over', 'again', 'further', 'then', 'once', 'here', 'there', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
    ]);
  }

  async parseResume(resumeBuffer, filename) {
    try {
      console.log('🔄 Starting enhanced resume parsing...');
      
      // Extract text from PDF
      let text;
      if (filename.endsWith('.pdf')) {
        const pdfData = await pdfParse(resumeBuffer);
        text = pdfData.text;
      } else {
        // Handle other file types (DOC, DOCX) - for now, convert to text
        text = resumeBuffer.toString('utf8');
      }
      
      console.log('📄 Text extracted, length:', text.length);
      
      // Parse different sections
      const parsedData = {
        personalInfo: this.extractPersonalInfo(text),
        skills: this.extractSkills(text),
        education: this.extractEducation(text),
        experience: this.extractExperience(text),
        projects: this.extractProjects(text),
        certifications: this.extractCertifications(text),
        languages: this.extractLanguages(text),
        summary: this.extractSummary(text),
        metadata: {
          filename,
          extractedAt: new Date().toISOString(),
          wordCount: text.split(/\s+/).length,
          confidence: 0
        }
      };
      
      // Calculate confidence score
      parsedData.metadata.confidence = this.calculateConfidence(parsedData);
      
      console.log('✅ Resume parsing completed with confidence:', parsedData.metadata.confidence);
      
      return parsedData;
    } catch (error) {
      console.error('❌ Error parsing resume:', error);
      throw new Error(`Resume parsing failed: ${error.message}`);
    }
  }

  extractPersonalInfo(text) {
    const personalInfo = {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: ''
    };

    // Extract email
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
    if (emailMatch) personalInfo.email = emailMatch[0];

    // Extract phone
    const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g);
    if (phoneMatch) personalInfo.phone = phoneMatch[0];

    // Extract LinkedIn
    const linkedinMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9-]+/g);
    if (linkedinMatch) personalInfo.linkedin = 'https://' + linkedinMatch[0];

    // Extract GitHub
    const githubMatch = text.match(/github\.com\/[a-zA-Z0-9-]+/g);
    if (githubMatch) personalInfo.github = 'https://' + githubMatch[0];

    // Extract name (usually at the beginning)
    const lines = text.split('\n');
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      if (line.length > 0 && line.length < 50 && !line.includes('@') && !line.includes('http')) {
        personalInfo.name = line;
        break;
      }
    }

    return personalInfo;
  }

  extractSkills(text) {
    const skills = {
      technical: [],
      soft: [],
      tools: [],
      languages: []
    };

    // Tokenize text
    const tokens = this.tokenizeText(text);
    
    // Find skills using sliding window approach
    for (let i = 0; i < tokens.length; i++) {
      // Check single word
      const skill = this.skillDB.findSkill(tokens[i]);
      if (skill) {
        this.addSkillToCategory(skills, skill);
        continue;
      }

      // Check two-word combinations
      if (i < tokens.length - 1) {
        const twoWordSkill = this.skillDB.findSkill(`${tokens[i]} ${tokens[i + 1]}`);
        if (twoWordSkill) {
          this.addSkillToCategory(skills, twoWordSkill);
          i++; // Skip next token as it's part of this skill
          continue;
        }
      }

      // Check three-word combinations
      if (i < tokens.length - 2) {
        const threeWordSkill = this.skillDB.findSkill(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
        if (threeWordSkill) {
          this.addSkillToCategory(skills, threeWordSkill);
          i += 2; // Skip next two tokens
          continue;
        }
      }
    }

    // Extract programming languages specifically
    const programmingLanguages = ['python', 'javascript', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'php', 'swift', 'kotlin', 'typescript'];
    programmingLanguages.forEach(lang => {
      if (text.toLowerCase().includes(lang)) {
        const skill = this.skillDB.findSkill(lang);
        if (skill && !skills.technical.find(s => s.name === skill.name)) {
          this.addSkillToCategory(skills, skill);
        }
      }
    });

    // Remove duplicates and sort by confidence
    skills.technical = this.deduplicateSkills(skills.technical);
    skills.soft = this.deduplicateSkills(skills.soft);
    skills.tools = this.deduplicateSkills(skills.tools);
    skills.languages = this.deduplicateSkills(skills.languages);

    return skills;
  }

  addSkillToCategory(skills, skill) {
    const skillObj = {
      name: skill.name,
      category: skill.category,
      level: skill.level,
      confidence: this.calculateSkillConfidence(skill),
      type: skill.type
    };

    if (skill.type === 'soft') {
      skills.soft.push(skillObj);
    } else {
      skills.technical.push(skillObj);
    }
  }

  calculateSkillConfidence(skill) {
    // Base confidence on skill specificity and category
    let confidence = 0.5;
    
    if (skill.category === 'programming') confidence += 0.2;
    if (skill.category === 'database') confidence += 0.15;
    if (skill.category === 'cloud') confidence += 0.15;
    if (skill.category === 'ai') confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }

  deduplicateSkills(skills) {
    const seen = new Set();
    return skills
      .filter(skill => {
        if (seen.has(skill.name)) return false;
        seen.add(skill.name);
        return true;
      })
      .sort((a, b) => b.confidence - a.confidence);
  }

  extractEducation(text) {
    const education = [];
    
    // Education patterns
    const educationPatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(University|College|Institute|Academy)/gi,
      /(Bachelor|Master|PhD|MBA|Associate|Diploma|Certificate)\s+(?:of|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /(\d{4})\s*[-–]\s*(\d{4}|\s*Present)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
    ];

    educationPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const educationItem = {
            institution: '',
            degree: '',
            field: '',
            startDate: '',
            endDate: '',
            gpa: '',
            achievements: []
          };

          // Parse the match to extract details
          if (match.includes('University') || match.includes('College')) {
            educationItem.institution = match;
          } else if (match.includes('Bachelor') || match.includes('Master') || match.includes('PhD')) {
            educationItem.degree = match;
          }

          education.push(educationItem);
        });
      }
    });

    return education;
  }

  extractExperience(text) {
    const experience = [];
    
    // Look for experience sections
    const experienceSection = this.extractSection(text, ['experience', 'work', 'employment', 'career']);
    
    if (experienceSection) {
      // Extract individual experiences
      const experiences = experienceSection.split(/\n\n+/);
      
      experiences.forEach(exp => {
        const experienceItem = {
          company: '',
          position: '',
          startDate: '',
          endDate: '',
          location: '',
          description: '',
          achievements: [],
          technologies: []
        };

        // Extract company and position
        const lines = exp.split('\n');
        if (lines.length > 0) {
          // First line is usually position
          experienceItem.position = lines[0].trim();
          
          // Second line might be company and dates
          if (lines.length > 1) {
            const companyLine = lines[1];
            const companyMatch = companyLine.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
            if (companyMatch) experienceItem.company = companyMatch[1];
            
            // Extract dates
            const dateMatch = companyLine.match(/(\d{4})\s*[-–]\s*(\d{4}|\s*Present)/);
            if (dateMatch) {
              experienceItem.startDate = dateMatch[1];
              experienceItem.endDate = dateMatch[2].replace('Present', 'Current');
            }
          }
          
          // Rest is description
          if (lines.length > 2) {
            experienceItem.description = lines.slice(2).join(' ').trim();
            
            // Extract achievements (bullet points)
            const achievements = experienceItem.description.match(/[•·\-]\s*([^•·\-\n]+)/g);
            if (achievements) {
              experienceItem.achievements = achievements.map(a => a.replace(/^[•·\-]\s*/, '').trim());
            }
          }
        }

        if (experienceItem.position || experienceItem.company) {
          experience.push(experienceItem);
        }
      });
    }

    return experience;
  }

  extractProjects(text) {
    const projects = [];
    
    // Look for project sections
    const projectSection = this.extractSection(text, ['projects', 'portfolio', 'work']);
    
    if (projectSection) {
      const projectItems = projectSection.split(/\n\n+/);
      
      projectItems.forEach(project => {
        const projectItem = {
          name: '',
          description: '',
          technologies: [],
          duration: '',
          role: '',
          url: ''
        };

        const lines = project.split('\n');
        if (lines.length > 0) {
          projectItem.name = lines[0].trim();
          
          if (lines.length > 1) {
            projectItem.description = lines.slice(1).join(' ').trim();
            
            // Extract technologies
            const techMatches = projectItem.description.match(/\b(React|Node\.js|Python|Java|JavaScript|TypeScript|MongoDB|MySQL|AWS|Docker|GitHub|Git|HTML|CSS|Angular|Vue|Flask|Django|Spring|\.NET|PHP|Ruby|Go|Rust|Swift|Kotlin|Flutter|React Native|Android|iOS|Firebase|PostgreSQL|Redis|Kubernetes|Terraform|Jenkins|CI\/CD|REST API|GraphQL|Microservices|Machine Learning|Deep Learning|TensorFlow|PyTorch|Scikit-learn|Pandas|NumPy|R|Tableau|Power BI|Figma|Sketch|Adobe|Photoshop|Illustrator|UI|UX)\b/g);
            if (techMatches) {
              projectItem.technologies = [...new Set(techMatches)];
            }
          }
        }

        if (projectItem.name) {
          projects.push(projectItem);
        }
      });
    }

    return projects;
  }

  extractCertifications(text) {
    const certifications = [];
    
    // Look for certification patterns
    const certPatterns = [
      /(Certified|Certificate|Certification)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /(AWS|Google|Microsoft|Oracle|Cisco|CompTIA|PMP|Scrum|Agile|ISTQB)\s+(Certified|Professional|Associate|Specialist|Expert)/gi
    ];

    certPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          certifications.push({
            name: match,
            issuer: '',
            date: '',
            expiryDate: ''
          });
        });
      }
    });

    return certifications;
  }

  extractLanguages(text) {
    const languages = [];
    
    // Common programming and human languages
    const languagePatterns = [
      /\b(English|Spanish|French|German|Chinese|Mandarin|Japanese|Korean|Portuguese|Italian|Russian|Arabic|Hindi|Bengali|Urdu|Indonesian|Dutch|Turkish|Vietnamese|Thai|Polish|Persian|Swedish|Greek|Czech|Romanian|Hungarian|Danish|Finnish|Norwegian|Hebrew|Ukrainian|Filipino|Malay|Telugu|Tamil|Marathi|Gujarati|Kannada|Odia|Punjabi|Burmese|Sinhala|Khmer|Lao|Tibetan|Mongolian|Nepali|Sinhalese|Tajik|Turkmen|Uzbek|Kazakh|Kyrgyz|Tajik|Armenian|Azerbaijani|Georgian|Lithuanian|Latvian|Estonian|Slovak|Slovenian|Croatian|Serbian|Bulgarian|Belarusian|Macedonian|Albanian|Montenegrin|Bosnian|Icelandic|Maltese|Irish|Scottish|Welsh|Breton|Cornish|Manx|Gaelic|Basque|Catalan|Galician|Occitan|Corsican|Sardinian|Friulian|Ladin|Romansh|Sami|Sorbian|Kashubian|Walon|Limburgish|Luxembourgish|Walloon|Picard|Champenois|Lorrain|Franco-Provençal|Norman|Gallo|Poitevin|Saintongeais|Anglo-Norman|Jerriais|Guernésiais|Sercquiais|Auregnais|Jèrriais)\b/gi,
      /\b(Fluent|Proficient|Native|Intermediate|Basic|Advanced)\s+(in\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
    ];

    languagePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const proficiency = match.match(/(Fluent|Proficient|Native|Intermediate|Basic|Advanced)/i);
          const language = match.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
          
          if (language && !languages.find(l => l.name === language[1])) {
            languages.push({
              name: language[1],
              proficiency: proficiency ? proficiency[1].toLowerCase() : 'intermediate'
            });
          }
        });
      }
    });

    return languages;
  }

  extractSummary(text) {
    const summarySection = this.extractSection(text, ['summary', 'objective', 'profile', 'about', 'overview']);
    
    if (summarySection) {
      return summarySection.trim().substring(0, 500); // Limit to 500 characters
    }
    
    return '';
  }

  extractSection(text, sectionKeywords) {
    const lines = text.split('\n');
    let sectionStart = -1;
    let sectionEnd = -1;
    
    // Find section start
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (sectionKeywords.some(keyword => line.includes(keyword.toLowerCase()))) {
        sectionStart = i;
        break;
      }
    }
    
    if (sectionStart === -1) return null;
    
    // Find section end (next major section)
    for (let i = sectionStart + 1; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (this.isMajorSection(line)) {
        sectionEnd = i;
        break;
      }
    }
    
    if (sectionEnd === -1) sectionEnd = lines.length;
    
    return lines.slice(sectionStart + 1, sectionEnd).join('\n');
  }

  isMajorSection(line) {
    const majorSections = [
      'experience', 'education', 'skills', 'projects', 'certifications',
      'languages', 'summary', 'objective', 'profile', 'about', 'contact',
      'employment', 'work', 'career', 'training', 'awards', 'publications',
      'interests', 'hobbies', 'references', 'technical', 'professional'
    ];
    
    return majorSections.some(section => line.includes(section));
  }

  tokenizeText(text) {
    // Remove special characters and split into tokens
    const cleaned = text.toLowerCase().replace(/[^\w\s\-]/g, ' ');
    const tokens = cleaned.split(/\s+/).filter(token => 
      token.length > 1 && !this.commonWords.has(token)
    );
    
    return tokens;
  }

  calculateConfidence(parsedData) {
    let confidence = 0;
    let factors = 0;
    
    // Personal info confidence
    if (parsedData.personalInfo.email) confidence += 0.2;
    if (parsedData.personalInfo.name) confidence += 0.1;
    if (parsedData.personalInfo.phone) confidence += 0.1;
    factors += 3;
    
    // Skills confidence
    if (parsedData.skills.technical.length > 0) confidence += 0.2;
    if (parsedData.skills.soft.length > 0) confidence += 0.1;
    factors += 2;
    
    // Experience confidence
    if (parsedData.experience.length > 0) confidence += 0.2;
    factors += 1;
    
    // Education confidence
    if (parsedData.education.length > 0) confidence += 0.1;
    factors += 1;
    
    return factors > 0 ? confidence / factors : 0;
  }
}

module.exports = EnhancedResumeParser;
