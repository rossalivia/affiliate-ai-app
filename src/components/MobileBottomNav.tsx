'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Home, Compass, BookOpen, BarChart2, User, LayoutDashboard, Users, KeyRound } from 'lucide-react';

interface MobileNavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
}

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const memberNavItems: MobileNavItem[] = [
    { label: 'Beranda', icon: <Home size={22} />, href: '/' },
    { label: 'Belajar', icon: <Compass size={22} />, href: '/jalur-pembelajaran' },
    { label: 'Materi', icon: <BookOpen size={22} />, href: '/pustaka-materi' },
    { label: 'Profil', icon: <User size={22} />, href: '/profil' },
  ];

  const adminNavItems: MobileNavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={22} />, href: '/admin' },
    { label: 'Member', icon: <Users size={22} />, href: '/admin/member' },
    { label: 'Kode Akses', icon: <KeyRound size={22} />, href: '/admin/access-code' },
  ];

  const navItems = isAdmin ? adminNavItems : memberNavItems;

  return (
    <nav 
      aria-label="Navigasi Utama Mobile" 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E6E6E1] px-2 py-1 flex items-center justify-around safe-area-bottom shadow-[0_-2px_12px_rgba(0,0,0,0.04)]"
    >
      {navItems.map((item) => {
        const isActive = item.href
          ? (item.href === '/' || item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href))
          : false;

        const content = (
          <>
            <span className={`transition-colors ${isActive ? 'text-[#1F7AFF]' : 'text-[#5A6A85]'}`}>
              {item.icon}
            </span>
            <span className={`mt-1 text-[11px] sm:text-xs tracking-tight transition-colors ${
              isActive ? 'font-bold text-[#1F7AFF]' : 'font-medium text-[#5A6A85]'
            }`}>
              {item.label}
            </span>
          </>
        );

        const baseClasses = `flex flex-col items-center justify-center flex-1 min-h-[54px] py-1.5 px-2 rounded-xl transition-colors cursor-pointer text-center select-none ${
          isActive
            ? 'bg-[#1F7AFF]/10 text-[#1F7AFF]'
            : 'hover:bg-[#F8F8F6] text-[#5A6A85] hover:text-[#06152E]'
        } focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1F7AFF]`;

        if (item.href) {
          return (
            <Link key={item.label} href={item.href} className={baseClasses}>
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.label}
            type="button"
            className={baseClasses}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
};
