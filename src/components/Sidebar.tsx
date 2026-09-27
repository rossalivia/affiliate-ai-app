'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Home, 
  Compass, 
  BookOpen, 
  BarChart2, 
  User, 
  LogOut,
  Shield,
  LayoutDashboard,
  Users,
  KeyRound
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
}

interface NavSection {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const memberNavigationSections: NavSection[] = [
    {
      group: 'PEMBELAJARAN',
      items: [
        { label: 'Beranda', icon: <Home size={20} />, href: '/' },
        { label: 'Jalur Pembelajaran', icon: <Compass size={20} />, href: '/jalur-pembelajaran' },
        { label: 'Pustaka Materi', icon: <BookOpen size={20} />, href: '/pustaka-materi' },
      ],
    },
    {
      group: 'PERSONAL',
      items: [
        { label: 'Progres Belajar', icon: <BarChart2 size={20} />, href: '/progres-belajar' },
        { label: 'Profil', icon: <User size={20} />, href: '/profil' },
      ],
    },
    {
      group: 'AKUN',
      items: [
        { label: 'Keluar', icon: <LogOut size={20} /> },
      ],
    },
  ];

  const adminNavigationSections: NavSection[] = [
    {
      group: 'ADMINISTRASI',
      items: [
        { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/admin' },
        { label: 'Kelola Materi', icon: <BookOpen size={20} />, href: '/admin/materi' },
        { label: 'Member', icon: <Users size={20} />, href: '/admin/member' },
        { label: 'Access Code', icon: <KeyRound size={20} />, href: '/admin/access-code' },
      ],
    },
    {
      group: 'AKUN',
      items: [
        { label: 'Keluar', icon: <LogOut size={20} /> },
      ],
    },
  ];

  const navigationSections = isAdmin ? adminNavigationSections : memberNavigationSections;

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-[#E6E6E1] select-none shrink-0 sticky top-0 h-screen">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#E6E6E1]/60">
        <span className="text-xs font-extrabold tracking-widest text-[#1F7AFF] uppercase block">
          RAYA DIGITAL
        </span>
        <h2 className="text-base font-bold text-[#06152E] mt-1 tracking-tight">
          Kelas Affiliate AI
        </h2>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 py-6 px-3.5 space-y-6 overflow-y-auto">
        {navigationSections.map((section) => (
          <div key={section.group} className="space-y-2">
            <div className="px-3 text-xs font-bold tracking-wider text-[#5A6A85] uppercase">
              {section.group}
            </div>
            <nav className="space-y-1">
              {section.items.map((item) => {
                const isActive = item.href 
                  ? (item.href === '/' || item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href))
                  : false;

                const content = (
                  <>
                    <span className={isActive ? 'text-[#1F7AFF]' : 'text-[#5A6A85] group-hover:text-[#06152E]'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </>
                );

                const baseClasses = `w-full flex items-center gap-3.5 px-3.5 py-2.5 min-h-[44px] text-[15px] rounded-xl transition-colors cursor-pointer text-left group select-none ${
                  isActive
                    ? 'bg-[#1F7AFF]/10 text-[#1F7AFF] font-bold shadow-xs'
                    : 'font-medium text-[#06152E] hover:bg-[#F8F8F6] hover:text-[#0B1F45]'
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
                    onClick={item.label === 'Keluar' ? logout : undefined}
                    className={baseClasses}
                    title={item.label === 'Keluar' ? 'Keluar dari akun member' : undefined}
                    aria-label={item.label === 'Keluar' ? 'Keluar dari akun' : item.label}
                  >
                    {content}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
};
