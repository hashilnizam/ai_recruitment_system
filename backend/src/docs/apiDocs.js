const swaggerJsdoc = require('swagger-jsdoc');
const swaggerDefinition = {
  info: {
    title: 'AI Recruitment System API',
    version: '1.0.0',
    description: 'RESTful API for AI-powered recruitment platform',
    contact: {
      name: 'API Support',
      email: 'support@airecruitment.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env.API_URL || 'http://localhost:5000',
      description: 'Development server'
    },
    {
      url: 'https://api.airecruitment.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT authentication token'
      }
    },
    schemas: {
      User: {
        type: 'object',
        required: ['id', 'email', 'firstName', 'lastName', 'role'],
        properties: {
          id: {
            type: 'integer',
            description: 'User ID'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          firstName: {
            type: 'string',
            description: 'User first name'
          },
          lastName: {
            type: 'string',
            description: 'User last name'
          },
          role: {
            type: 'string',
            enum: ['recruiter', 'candidate'],
            description: 'User role'
          },
          companyName: {
            type: 'string',
            description: 'Company name (recruiters only)'
          },
          phone: {
            type: 'string',
            description: 'Phone number'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation date'
          }
        }
      },
      Job: {
        type: 'object',
        required: ['id', 'title', 'description', 'recruiterId', 'status'],
        properties: {
          id: {
            type: 'integer',
            description: 'Job ID'
          },
          title: {
            type: 'string',
            description: 'Job title'
          },
          description: {
            type: 'string',
            description: 'Job description'
          },
          recruiterId: {
            type: 'integer',
            description: 'Recruiter ID'
          },
          status: {
            type: 'string',
            enum: ['draft', 'published', 'closed'],
            description: 'Job status'
          },
          location: {
            type: 'string',
            description: 'Job location'
          },
          employmentType: {
            type: 'string',
            enum: ['full-time', 'part-time', 'contract', 'internship'],
            description: 'Employment type'
          },
          salaryRange: {
            type: 'string',
            description: 'Salary range'
          },
          requiredSkills: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Required skills'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Job creation date'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Job last updated date'
          }
        }
      },
      Application: {
        type: 'object',
        required: ['id', 'jobId', 'candidateId', 'status', 'appliedAt'],
        properties: {
          id: {
            type: 'integer',
            description: 'Application ID'
          },
          jobId: {
            type: 'integer',
            description: 'Job ID'
          },
          candidateId: {
            type: 'integer',
            description: 'Candidate ID'
          },
          status: {
            type: 'string',
            enum: ['pending', 'ranked', 'reviewed', 'shortlisted', 'rejected'],
            description: 'Application status'
          },
          appliedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Application date'
          },
          resumeHash: {
            type: 'string',
            description: 'Resume file hash'
          },
          totalScore: {
            type: 'number',
            description: 'AI total score'
          },
          rankPosition: {
            type: 'integer',
            description: 'Rank position'
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

// Swagger documentation middleware
const swaggerDocs = (req, res, next) => {
  swaggerJsdoc(swaggerDefinition)(req, res, next);
};

module.exports = {
  swaggerDocs,
  swaggerDefinition
};
