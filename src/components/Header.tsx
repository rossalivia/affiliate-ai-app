'use client';

import React from 'react';
import Link from 'next/link';
import { User, Shield } from 'lucide-react';
import { useAuth, getInitials } from '@/context/AuthContext';

export interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title = 'Beranda' }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const initials = user ? getInitials(user.name) : null;
  const targetHref = isAdmin ? '/admin' : '/profil';
  const displayLabel = isAdmin ? 'Admin' : (user ? user.name : 'Profil');
  const hoverTitle = isAdmin ? 'Area Administrasi' : 'Buka Profil Member';

  return (
    <header className="h-16 bg-white border-b border-[#E6E6E1] px-4 sm:px-6 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Page Title */}
      <h2 className="text-base sm:text-lg font-bold text-[#06152E] truncate">
        {title}
      </h2>

      {/* Right Area Profile/Admin Link */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={targetHref}
          className="flex items-center gap-2.5 px-3.5 py-2 min-h-[44px] rounded-xl border border-[#E6E6E1] text-[#06152E] text-xs sm:text-sm font-semibold bg-[#F8F8F6] hover:bg-[#EAEAE5] hover:border-[#D1D1C7] transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1F7AFF]"
          title={hoverTitle}
          aria-label={hoverTitle}
        >
          {isAdmin ? (
            <div className="w-7 h-7 rounded-full bg-[#1F7AFF] text-white flex items-center justify-center font-bold text-xs select-none shrink-0 shadow-xs">
              AD
            </div>
          ) : initials ? (
            <div className="w-7 h-7 rounded-full bg-[#06152E] text-white flex items-center justify-center font-bold text-xs select-none shrink-0 shadow-xs">
              {initials}
            </div>
          ) : (
            <User size={16} className="text-[#5A6A85]" />
          )}
          <span className="truncate max-w-[120px] sm:max-w-[160px]">
            {displayLabel}
          </span>
        </Link>
      </div>
    </header>
  );
};
