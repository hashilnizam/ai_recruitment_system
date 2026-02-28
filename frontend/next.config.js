/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
  async rewrites() {
    return [
      {
        source: '/api/recruiter/resumes/download/:id',
        destination: 'http://localhost:5000/api/recruiter/resumes/download/:id',
      },
    ]
  },
}

module.exports = nextConfig
