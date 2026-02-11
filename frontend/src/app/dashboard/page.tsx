'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Smart redirection based on user role
    if (user.role === 'recruiter') {
      console.log('👔 Redirecting recruiter to analytics dashboard...');
      router.push('/dashboard/recruiter');
    } else if (user.role === 'candidate') {
      console.log('👤 Redirecting candidate to candidate dashboard...');
      router.push('/dashboard/candidate');
    } else {
      console.log('❌ Unknown role, redirecting to home...');
      router.push('/');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" text="Redirecting to your dashboard..." />
        <p className="mt-4 text-gray-600">
          Taking you to your personalized dashboard...
        </p>
      </div>
    </div>
  );
}
