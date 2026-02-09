'use client';

import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<'recruiter' | 'candidate' | null>(null);

  const handleRoleSelect = (role: 'recruiter' | 'candidate') => {
    setSelectedRole(role);
  };

  const handleGetStarted = () => {
    if (!selectedRole) {
      toast.error('Please select a role to continue');
      return;
    }
    
    // Redirect to login with role parameter
    window.location.href = `/auth/login?role=${selectedRole}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A9.001 9.001 0 0112 21a9.001 9.001 0 01-9-9.255A9.001 9.001 0 013 12a9.001 9.001 0 019-9 9.001 9.001 0 019 9.255z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gradient">AI Recruitment System</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="#features" className="nav-link">Features</Link>
              <Link href="#how-it-works" className="nav-link">How It Works</Link>
              <Link href="/auth/login" className="nav-link">Login</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="text-gradient">AI-Powered</span> Recruitment
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform your hiring process with intelligent candidate ranking, 
              personalized feedback, and data-driven decisions.
            </p>
            
            {/* Role Selection */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">I am a...</h2>
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <button
                  onClick={() => handleRoleSelect('recruiter')}
                  className={`p-8 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    selectedRole === 'recruiter'
                      ? 'border-primary-500 bg-primary-50 shadow-glow'
                      : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-medium'
                  }`}
                >
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A9.001 9.001 0 0112 21a9.001 9.001 0 01-9-9.255A9.001 9.001 0 013 12a9.001 9.001 0 019-9 9.001 9.001 0 019 9.255z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Recruiter</h3>
                  <p className="text-gray-600">Post jobs and find the best candidates with AI-powered ranking</p>
                </button>

                <button
                  onClick={() => handleRoleSelect('candidate')}
                  className={`p-8 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    selectedRole === 'candidate'
                      ? 'border-secondary-500 bg-secondary-50 shadow-glow-secondary'
                      : 'border-gray-200 bg-white hover:border-secondary-300 hover:shadow-medium'
                  }`}
                >
                  <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Candidate</h3>
                  <p className="text-gray-600">Apply for jobs and receive personalized AI feedback</p>
                </button>
              </div>
            </div>

            <button
              onClick={handleGetStarted}
              className="btn-primary text-lg px-8 py-4 animate-float"
            >
              Get Started Now
            </button>

            <div className="mt-6 text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in here
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to streamline your recruitment process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Ranking</h3>
              <p className="text-gray-600">
                Advanced algorithms analyze skills, education, and experience to rank candidates objectively
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Feedback</h3>
              <p className="text-gray-600">
                Candidates receive personalized feedback to improve their skills and job applications
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Processing</h3>
              <p className="text-gray-600">
                Get instant rankings and feedback as applications are submitted and processed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, efficient, and intelligent recruitment process
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Post Job</h3>
              <p className="text-gray-600 text-sm">Recruiters create detailed job postings with requirements</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Apply</h3>
              <p className="text-gray-600 text-sm">Candidates submit structured resumes with skills and experience</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Analysis</h3>
              <p className="text-gray-600 text-sm">Our AI analyzes and ranks candidates based on multiple factors</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Hire Smart</h3>
              <p className="text-gray-600 text-sm">Make data-driven decisions with AI insights and feedback</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A9.001 9.001 0 0112 21a9.001 9.001 0 01-9-9.255A9.001 9.001 0 013 12a9.001 9.001 0 019-9 9.001 9.001 0 019 9.255z" />
                </svg>
              </div>
              <span className="text-xl font-bold">AI Recruitment System</span>
            </div>
            <p className="text-gray-400">
              © 2024 AI Recruitment System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
