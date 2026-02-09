'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { applicationsAPI } from '@/lib/api';

export default function CandidateProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This would fetch candidate details
    // For now, we'll show a coming soon message
    setLoading(false);
  }, [id]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <span className="text-6xl mb-4 block">👤</span>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Candidate Profile</h3>
          <p className="text-gray-600 mb-6">
            Detailed candidate profile view coming soon!
          </p>
          <button
            onClick={() => router.back()}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </Layout>
  );
}
