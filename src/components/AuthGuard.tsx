'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRole?: UserRole;
  loadingMessage?: string;
}

/**
 * Reusable AuthGuard component for protecting member or admin routes.
 * Ensures that users without valid Firebase Authentication are redirected to /login.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  allowedRole,
  loadingMessage = 'Memeriksa hak akses...',
}) => {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.push('/login');
      } else if (allowedRole && user.role !== allowedRole) {
        if (user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRole, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] text-[#06152E]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#1F7AFF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#5A6A85]">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  if (allowedRole && user.role !== allowedRole) {
    return null;
  }

  return <>{children}</>;
};
