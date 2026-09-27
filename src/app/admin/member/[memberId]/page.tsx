'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { curriculum } from '@/data/curriculum';
import { useAuth, getInitials } from '@/context/AuthContext';
import { fetchMemberProgress } from '@/lib/firebase/firestore';
import {
  ShieldAlert,
  ArrowLeft,
  Check,
  Clock,
  User,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  BarChart2,
} from 'lucide-react';

interface MemberDetailPageProps {
  params: Promise<{
    memberId: string;
  }>;
}

export default function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { memberId } = use(params);
  const router = useRouter();
  const { user, isLoading, getMemberById, refreshAdminData } = useAuth();

  // Protection: redirect to /login if no session
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  // Load latest Firestore members on mount
  useEffect(() => {
    if (user?.role === 'admin') {
      refreshAdminData();
    }
  }, [user, refreshAdminData]);

  const member = getMemberById(memberId);
  const [memberProgressCount, setMemberProgressCount] = useState<number | null>(null);

  // Read progress specifically from Firestore progress/{memberId}
  useEffect(() => {
    let isCancelled = false;
    if (memberId) {
      fetchMemberProgress(memberId).then((data) => {
        if (!isCancelled && data && Array.isArray(data.completedMaterials)) {
          setMemberProgressCount(data.completedMaterials.length);
        }
      });
    }
    return () => {
      isCancelled = true;
    };
  }, [memberId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] text-[#06152E]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#1F7AFF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#5A6A85]">Memuat detail member...</p>
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

  // Member not found state
  if (!member) {
    return (
      <div className="min-h-screen flex bg-[#F8F8F6] text-[#06152E]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-24 md:pb-12">
          <Header title="Detail Member" />
          <main className="flex-1 py-12">
            <Container size="md">
              <Card padding="lg" className="bg-white border border-[#E6E6E1] text-center space-y-4 py-12">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <User size={24} />
                </div>
                <h2 className="text-xl font-bold text-[#06152E]">
                  Member tidak ditemukan.
                </h2>
                <p className="text-sm text-[#5A6A85] max-w-sm mx-auto">
                  Data member dengan ID ini tidak terdaftar di sistem atau telah dipindahkan.
                </p>
                <div className="pt-2">
                  <Link href="/admin/member">
                    <Button variant="outline" size="md" className="gap-2 font-bold">
                      <ArrowLeft size={16} />
                      <span>Kembali ke Daftar Member</span>
                    </Button>
                  </Link>
                </div>
              </Card>
            </Container>
          </main>
        </div>
      </div>
    );
  }

  const totalMaterials = curriculum.modules.flatMap((m) => m.materials).length || 51;
  const completed = memberProgressCount !== null ? memberProgressCount : (member.completedMaterialsCount || 0);
  const percent = Math.min(100, Math.round((completed / totalMaterials) * 100));
  const isActive =
    member.membershipStatus === 'Member Aktif' || member.membershipStatus === 'active';
  const initials = getInitials(member.name);

  return (
    <div className="min-h-screen flex bg-[#F8F8F6] text-[#06152E]">
      {/* App Shell: Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-24 md:pb-12">
        {/* App Shell: Header */}
        <Header title="Detail Member" />

        {/* Page Content */}
        <main className="flex-1 py-8 sm:py-10">
          <Container size="lg">
            <div className="w-full max-w-3xl mx-auto space-y-6 sm:space-y-8">
              {/* 1. Breadcrumb Navigation */}
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[#5A6A85]">
                <Link
                  href="/admin"
                  className="hover:text-[#1F7AFF] transition-colors"
                >
                  Dashboard Admin
                </Link>
                <span>/</span>
                <Link
                  href="/admin/member"
                  className="hover:text-[#1F7AFF] transition-colors"
                >
                  Member
                </Link>
                <span>/</span>
                <span className="font-semibold text-[#06152E] truncate max-w-[200px]">
                  {member.name}
                </span>
              </nav>

              {/* 2. Top Header Profile Card */}
              <Card padding="lg" className="bg-white border border-[#E6E6E1] shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#06152E] text-white flex items-center justify-center font-extrabold text-2xl shrink-0 shadow-sm border-2 border-white select-none">
                      {initials}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06152E] tracking-tight">
                          {member.name}
                        </h1>
                        <Badge
                          variant="subtle"
                          size="sm"
                          className="bg-[#1F7AFF]/10 text-[#1F7AFF] border border-[#1F7AFF]/20 font-bold px-2.5 py-0.5 text-xs"
                        >
                          MEMBER
                        </Badge>
                      </div>
                      <p className="text-sm sm:text-base text-[#5A6A85] flex items-center gap-2">
                        <GraduationCap size={16} className="text-[#1F7AFF] shrink-0" />
                        <span>{member.className || 'Kelas Affiliate AI'} — {member.cohort || 'Raya Digital'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="self-start sm:self-center">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check size={14} className="stroke-[3]" />
                        <span>Member Aktif</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock size={14} />
                        <span>Belum Aktif</span>
                      </span>
                    )}
                  </div>
                </div>
              </Card>

              {/* 3. Progress Belajar Member */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart2 size={20} className="text-[#1F7AFF]" />
                  <h2 className="text-lg sm:text-xl font-bold text-[#06152E]">
                    Progress Belajar
                  </h2>
                </div>

                <Card padding="lg" className="bg-white border border-[#E6E6E1] shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <p className="text-base sm:text-lg font-bold text-[#06152E]">
                      {completed} dari {totalMaterials} materi selesai
                    </p>
                    <span className="text-xl font-extrabold text-[#1F7AFF]">
                      {percent}%
                    </span>
                  </div>

                  <ProgressBar value={percent} className="w-full" />

                  <p className="text-xs sm:text-sm text-[#5A6A85]">
                    {percent === 100
                      ? '✓ Member telah menyelesaikan seluruh materi pembelajaran.'
                      : percent > 0
                      ? 'Member sedang aktif mempelajari modul materi.'
                      : 'Member belum memulai materi pembelajaran.'}
                  </p>
                </Card>
              </section>

              {/* 4. Informasi Akun Lengkap */}
              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#06152E]">
                  Informasi Lengkap
                </h2>

                <Card padding="lg" className="bg-white border border-[#E6E6E1] shadow-xs divide-y divide-[#E6E6E1]/70">
                  {/* Nama */}
                  <div className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-[#5A6A85]">
                      Nama Lengkap
                    </span>
                    <span className="text-base sm:text-lg font-bold text-[#06152E]">
                      {member.name}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-[#5A6A85]">
                      Email
                    </span>
                    <span className="text-base sm:text-lg font-bold text-[#06152E] font-mono sm:font-sans">
                      {member.email}
                    </span>
                  </div>

                  {/* WhatsApp */}
                  <div className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-[#5A6A85]">
                      Nomor WhatsApp
                    </span>
                    <span className="text-base sm:text-lg font-bold text-[#06152E] font-mono sm:font-sans">
                      {member.phone || '-'}
                    </span>
                  </div>

                  {/* Kelas */}
                  <div className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-[#5A6A85]">
                      Kelas
                    </span>
                    <span className="text-base sm:text-lg font-bold text-[#06152E]">
                      {member.className || 'Kelas Affiliate AI'} — {member.cohort || 'Raya Digital'}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-[#5A6A85]">
                      Status Keanggotaan
                    </span>
                    <span className="text-base font-bold text-emerald-700">
                      {isActive ? '✓ Member Aktif' : 'Belum Aktif'}
                    </span>
                  </div>

                  {/* Tanggal Bergabung */}
                  <div className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-[#5A6A85]">
                      Tanggal Bergabung
                    </span>
                    <span className="text-base font-bold text-[#06152E]">
                      {member.joinedAt || '-'}
                    </span>
                  </div>
                </Card>
              </section>

              {/* 5. Back Navigation Button */}
              <div className="pt-2">
                <Link href="/admin/member">
                  <Button
                    variant="outline"
                    size="md"
                    className="gap-2 font-bold text-sm sm:text-base min-h-[44px]"
                  >
                    <ArrowLeft size={16} />
                    <span>Kembali ke Daftar Member</span>
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </main>
      </div>
    </div>
  );
}
