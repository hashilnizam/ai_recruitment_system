'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Enhanced email validation
      if (!email) {
        toast.error('Email address is required');
        setLoading(false);
        return;
      }

      if (!email.includes('@') || !email.includes('.')) {
        toast.error('Please enter a valid email address');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Password reset link sent! Please check your email.');
        setSubmitted(true);
      } else {
        // Handle specific error cases
        if (data.message?.includes('not found')) {
          toast.error('No account found with that email address.');
        } else if (data.message?.includes('network')) {
          toast.error('Network error. Please check your connection.');
        } else {
          toast.error(data.message || 'Failed to send reset link');
        }
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      // Handle network errors specifically
      if (error.message?.includes('Failed to fetch')) {
        toast.error('Unable to connect to server. Please check your internet connection.');
      } else if (error.message?.includes('Network error')) {
        toast.error('Network error. Please try again later.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h1>
          <p className="text-gray-600">Enter your email to receive password reset instructions</p>
        </div>

        {!submitted ? (
          <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a12 12 0 011.78 0L21 8M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2h14a2 2 0 002-2v-5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-green-700 mb-2">Check Your Email</h2>
              <p className="text-gray-600 mb-6">
                We've sent password reset instructions to:<br />
                <span className="font-medium text-gray-900">{email}</span>
              </p>
              <p className="text-sm text-gray-500">
                Please check your inbox and follow the instructions in the email.
              </p>
            </div>

            <div className="text-center">
              <Link 
                href="/auth/login" 
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-8 border border-gray-200">
            <div className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email address"
                  disabled={loading}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </div>

            {/* Back to Login */}
            <div className="text-center mt-6">
              <Link 
                href="/auth/login" 
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
