'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success('Login successful!');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A9.001 9.001 0 0112 21a9.001 9.001 0 01-9-9.255A9.001 9.001 0 013 12a9.001 9.001 0 019-9 9.001 9.001 0 019 9.255z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your AI Recruitment account</p>
        </div>

        {/* Login Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-lg"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Quick Test Accounts */}
        <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">🔑 Quick Test Accounts</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Recruiter:</span>
              <button
                onClick={() => setFormData({ email: 'recruiter1@techcorp.com', password: 'Password123!' })}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                recruiter1@techcorp.com
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Candidate:</span>
              <button
                onClick={() => setFormData({ email: 'candidate1@email.com', password: 'Password123!' })}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                candidate1@email.com
              </button>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-3">Click to auto-fill credentials</p>
        </div>
      </div>
    </div>
  );
}
