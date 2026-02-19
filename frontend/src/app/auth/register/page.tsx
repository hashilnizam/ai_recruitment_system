'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'candidate',
    companyName: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') || 'candidate';

  useEffect(() => {
    setFormData(prev => ({ ...prev, role: defaultRole }));
  }, [defaultRole]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Enhanced validation
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast.error('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (!formData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (formData.role === 'recruiter' && !formData.companyName) {
      toast.error('Company name is required for recruiters');
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        ...(formData.role === 'recruiter' && { companyName: formData.companyName }),
        ...(formData.phone && { phone: formData.phone })
      };

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/auth/login');
        }, 1500);
      } else {
        // Handle specific error messages
        if (data.message?.includes('already exists')) {
          toast.error('An account with this email already exists. Please try logging in.');
        } else if (data.message?.includes('network')) {
          toast.error('Network error. Please check your connection and try again.');
        } else {
          toast.error(data.message || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join the AI Recruitment platform</p>
        </div>

        {/* Registration Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'candidate' })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.role === 'candidate'
                      ? 'border-secondary-500 bg-secondary-50'
                      : 'border-gray-200 hover:border-secondary-300'
                  }`}
                >
                  <div className="text-sm font-medium">Candidate</div>
                  <div className="text-xs text-gray-500">Looking for jobs</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'recruiter' })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.role === 'recruiter'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="text-sm font-medium">Recruiter</div>
                  <div className="text-xs text-gray-500">Hiring talent</div>
                </button>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Company Name (for recruiters) */}
            {formData.role === 'recruiter' && (
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="TechCorp Inc"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            {/* Phone (optional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Password Fields */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-lg"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl border border-primary-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">✨ Why Join Us?</h3>
          <div className="space-y-2 text-sm text-gray-700">
            {formData.role === 'candidate' ? (
              <>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>AI-powered job matching</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Personalized feedback on applications</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Track application status in real-time</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Intelligent candidate ranking</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Reduce screening time by 80%</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Data-driven hiring decisions</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
