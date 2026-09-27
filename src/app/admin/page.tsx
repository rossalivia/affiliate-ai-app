'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCurriculum } from '@/context/CurriculumContext';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldAlert,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  KeyRound,
  BookOpen,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoading, getAllMembers, getAllAccessCodes, refreshAdminData } = useAuth();
  const { totalMaterials, modules } = useCurriculum();

  // Protection: redirect to /login if no active session
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  // Load latest Firestore data on mount
  useEffect(() => {
    if (user?.role === 'admin') {
      refreshAdminData();
    }
  }, [user, refreshAdminData]);

  const members = useMemo(() => {
    return getAllMembers();
  }, [getAllMembers]);

  const accessCodes = useMemo(() => {
    return getAllAccessCodes();
  }, [getAllAccessCodes]);

  const activeCodes = accessCodes.filter((c) => c.status === 'active').length;
  const usedCodes = accessCodes.filter((c) => c.status === 'used').length;

  // Summary statistics calculated from real member data
  const totalMembers = members.length;
  const activeMembers = members.filter(
    (m) => m.membershipStatus === 'Member Aktif' || m.membershipStatus === 'active'
  ).length;
  const inactiveMembers = totalMembers - activeMembers;

  const avgProgress = useMemo(() => {
    if (totalMembers === 0 || totalMaterials === 0) return 0;
    const totalCompleted = members.reduce(
      (sum, m) => sum + (m.completedMaterialsCount || 0),
      0
    );
    return Math.round((totalCompleted / (totalMembers * totalMaterials)) * 100);
  }, [members, totalMembers, totalMaterials]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] text-[#06152E]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#1F7AFF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#5A6A85]">Memeriksa hak akses...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Member trying to access Admin Area: Access Denied
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] p-4 text-[#06152E]">
        <Card padding="lg" className="w-full max-w-md bg-white border border-[#E6E6E1] text-center space-y-5 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert size={28} />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#06152E] tracking-tight">
              Akses Ditolak
            </h1>
            <p className="text-base text-[#5A6A85]">
              Anda tidak memiliki akses ke halaman ini.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/" className="inline-block w-full">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center min-h-[44px] font-bold text-sm sm:text-base gap-2"
              >
                <ArrowLeft size={16} />
                <span>Kembali ke Beranda</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8F8F6] text-[#06152E]">
      {/* App Shell: Desktop Sidebar (renders Admin navigation) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-24 md:pb-12">
        {/* App Shell: Header */}
        <Header title="Dashboard Admin" />

        {/* Page Content */}
        <main className="flex-1 py-8 sm:py-10">
          <Container size="lg">
            <div className="space-y-8">
              {/* Header Title & Subtitle */}
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#06152E] tracking-tight">
                  Dashboard Admin
                </h1>
                <p className="mt-1.5 text-base sm:text-lg text-[#5A6A85]">
                  Kelola member dan pantau aktivitas pembelajaran.
                </p>
              </div>

              {/* 1. Summary Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* Card 1: Total Member */}
                <Card padding="md" className="bg-white border border-[#E6E6E1] shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-[#5A6A85]">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Member</span>
                    <div className="w-8 h-8 rounded-lg bg-[#1F7AFF]/10 text-[#1F7AFF] flex items-center justify-center">
                      <Users size={18} />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-[#06152E]">
                    {totalMembers}
                  </div>
                  <p className="text-xs text-[#5A6A85]">
                    Member terdaftar di sistem
                  </p>
                </Card>

                {/* Card 2: Member Aktif */}
                <Card padding="md" className="bg-white border border-[#E6E6E1] shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-[#5A6A85]">
                    <span className="text-xs font-bold uppercase tracking-wider">Member Aktif</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <UserCheck size={18} />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-700">
                    {activeMembers}
                  </div>
                  <p className="text-xs text-[#5A6A85]">
                    Memiliki akses aktif ke kelas
                  </p>
                </Card>

                {/* Card 3: Member Belum Aktif */}
                <Card padding="md" className="bg-white border border-[#E6E6E1] shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-[#5A6A85]">
                    <span className="text-xs font-bold uppercase tracking-wider">Member Belum Aktif</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <UserX size={18} />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-[#06152E]">
                    {inactiveMembers}
                  </div>
                  <p className="text-xs text-[#5A6A85]">
                    Menunggu aktivasi akses
                  </p>
                </Card>

                {/* Card 4: Rata-rata Progres */}
                <Card padding="md" className="bg-white border border-[#E6E6E1] shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-[#5A6A85]">
                    <span className="text-xs font-bold uppercase tracking-wider">Rata-rata Progres</span>
                    <div className="w-8 h-8 rounded-lg bg-[#06152E]/10 text-[#06152E] flex items-center justify-center">
                      <TrendingUp size={18} />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-[#1F7AFF]">
                    {avgProgress}%
                  </div>
                  <p className="text-xs text-[#5A6A85]">
                    Dari kurikulum {totalMaterials} materi
                  </p>
                </Card>
              </div>

              {/* 2. Quick Action Area */}
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#06152E] tracking-tight">
                  Akses Cepat
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link href="/admin/materi" className="block group">
                    <Card padding="lg" className="bg-white border border-[#E6E6E1] hover:border-[#1F7AFF] transition-all shadow-xs group-hover:shadow-sm h-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-[#1F7AFF] group-hover:text-white transition-colors">
                            <BookOpen size={22} />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-[#06152E] group-hover:text-[#1F7AFF] transition-colors">
                              Kelola Materi
                            </h3>
                            <p className="text-xs sm:text-sm text-[#5A6A85] mt-0.5">
                              {modules.length} modul • {totalMaterials} materi terdaftar
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-[#5A6A85] group-hover:text-[#1F7AFF] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                      </div>
                    </Card>
                  </Link>

                  <Link href="/admin/member" className="block group">
                    <Card padding="lg" className="bg-white border border-[#E6E6E1] hover:border-[#1F7AFF] transition-all shadow-xs group-hover:shadow-sm h-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#1F7AFF]/10 text-[#1F7AFF] flex items-center justify-center group-hover:bg-[#1F7AFF] group-hover:text-white transition-colors">
                            <Users size={22} />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-[#06152E] group-hover:text-[#1F7AFF] transition-colors">
                              Kelola Member
                            </h3>
                            <p className="text-xs sm:text-sm text-[#5A6A85] mt-0.5">
                              Lihat daftar member terdaftar, status akun, dan progres belajar
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-[#5A6A85] group-hover:text-[#1F7AFF] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                      </div>
                    </Card>
                  </Link>

                  <Link href="/admin/access-code" className="block group">
                    <Card padding="lg" className="bg-white border border-[#E6E6E1] hover:border-[#1F7AFF] transition-all shadow-xs group-hover:shadow-sm h-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-[#1F7AFF] group-hover:text-white transition-colors">
                            <KeyRound size={22} />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-[#06152E] group-hover:text-[#1F7AFF] transition-colors">
                              Kelola Access Code
                            </h3>
                            <p className="text-xs sm:text-sm text-[#5A6A85] mt-0.5">
                              {activeCodes} kode aktif • {usedCodes} terpakai
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-[#5A6A85] group-hover:text-[#1F7AFF] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                      </div>
                    </Card>
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </main>
      </div>
    </div>
  );
}
