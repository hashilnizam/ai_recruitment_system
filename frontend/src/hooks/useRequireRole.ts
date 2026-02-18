import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for role-based access control
 * @param requiredRole - The role required to access the resource
 * @param redirectTo - Optional redirect path if user doesn't have required role
 */
export const useRequireRole = (requiredRole: string, redirectTo?: string) => {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      console.log('🔒 No user found, redirecting to login');
      router.push('/auth/login');
      return;
    }

    if (user.role !== requiredRole) {
      console.log(`🚫 Access denied. User role: ${user.role}, Required: ${requiredRole}`);
      router.push(redirectTo || '/auth/login');
      return;
    }

    console.log(`✅ Access granted. User role: ${user.role}, Required: ${requiredRole}`);
  }, [user, requiredRole, redirectTo]);

  return user?.role === requiredRole;
};
