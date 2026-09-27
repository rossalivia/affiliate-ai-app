'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { curriculum } from '@/data/curriculum';
import { useProgress } from '@/context/ProgressContext';
import { useAuth, getInitials } from '@/context/AuthContext';
import {
  Check,
  GraduationCap,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

export default function ProfilPage() {
  const router = useRouter();
  const { member, isLoading } = useAuth();
  const { getOverallProgress, isLoaded } = useProgress();
  const overall = getOverallProgress();
  const totalCurriculumMaterials = curriculum.modules.flatMap((m) => m.materials).length;

  // Simple frontend protection: redirect to /login if no active session, or /admin if admin
  useEffect(() => {
    if (!isLoading) {
      if (!member) {
        router.push('/login');
      } else if (member.role === 'admin') {
        router.push('/admin');
      }
    }
  }, [isLoading, member, router]);

  if (isLoading || !member || member.role === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] text-[#06152E]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#1F7AFF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#5A6A85]">Memuat profil...</p>
        </div>
      </div>
    );
  }

  const completedCount = isLoaded ? overall.completed : 0;
  const totalCount = isLoaded ? overall.total : totalCurriculumMaterials;
  const progressPercent = isLoaded ? overall.percentage : 0;
  const initials = getInitials(member.name);

  return (
    <div className="min-h-screen flex bg-[#F8F8F6] text-[#06152E]">
      {/* App Shell: Desktop Sidebar */}
      <Sidebar />

      {/* App Shell: Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-24 md:pb-12">
        {/* App Shell: Header with synchronized dynamic title */}
        <Header title="Profil Saya" />

        {/* Page Content */}
        <main className="flex-1 py-8 sm:py-10">
          <Container size="lg">
            <div className="w-full max-w-3xl mx-auto space-y-8 sm:space-y-10">
              {/* ========================================================= */}
              {/* 1. JUDUL & SUBHEADING HALAMAN                             */}
              {/* ========================================================= */}
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#06152E] tracking-tight">
                  Profil Saya
                </h1>
                <p className="mt-2 text-base sm:text-lg text-[#5A6A85] leading-relaxed">
                  Kelola informasi akun dan lihat status keanggotaan Anda.
                </p>
              </div>

              {/* ========================================================= */}
              {/* 2. PROFILE HEADER CARD (MENONJOL)                         */}
              {/* ========================================================= */}
              <Card padding="lg" className="bg-white border border-[#E6E6E1] shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
                  {/* Avatar Circle Placeholder dengan Inisial Otomatis */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#06152E] text-white flex items-center justify-center font-extrabold text-2xl sm:text-3xl shrink-0 shadow-sm border-2 border-white select-none">
                    {initials}
                  </div>

                  {/* Profile Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#06152E] tracking-tight">
                        {member.name}
                      </h2>
                      <Badge
                        variant="subtle"
                        size="sm"
                        className="bg-[#1F7AFF]/10 text-[#1F7AFF] border border-[#1F7AFF]/20 font-bold px-2.5 py-0.5 text-xs tracking-wide"
                      >
                        {member.role}
                      </Badge>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check size={12} className="stroke-[3]" />
                        <span>{member.membershipStatus}</span>
                      </span>
                    </div>

                    <p className="text-base text-[#5A6A85] font-medium flex items-center gap-2">
                      <GraduationCap size={18} className="text-[#1F7AFF] shrink-0" />
                      <span>{member.className} · {member.cohort}</span>
                    </p>
                  </div>
                </div>
              </Card>

              {/* ========================================================= */}
              {/* 3. KELAS YANG DIIKUTI                                     */}
              {/* ========================================================= */}
              <section className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-[#1F7AFF]" />
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#06152E] tracking-tight">
                    Kelas yang Diikuti
                  </h2>
                </div>

                <Card padding="lg" className="bg-white border border-[#E6E6E1] shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E6E6E1]/70">
                    <div>
                      <h3 className="text-xl font-bold text-[#06152E]">
                        {member.className}
                      </h3>
                      <p className="text-base text-[#5A6A85] font-medium mt-0.5">
                        {member.cohort}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="self-start sm:self-center">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check size={15} className="stroke-[3]" />
                        <span>✓ {member.membershipStatus}</span>
                      </span>
                    </div>
                  </div>

                  {/* Joined Date */}
                  <div className="flex items-center gap-2 text-base text-[#5A6A85]">
                    <Calendar size={18} className="text-[#5A6A85] shrink-0" />
                    <span>Bergabung sejak <strong className="text-[#06152E] font-semibold">{member.joinedAt}</strong></span>
                  </div>
                </Card>
              </section>

              {/* ========================================================= */}
              {/* 4. PROGRESS BELAJAR                                       */}
              {/* ========================================================= */}
              <section className="space-y-3 sm:space-y-4">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#06152E] tracking-tight">
                  Progress Belajar
                </h2>

                <Card padding="lg" className="bg-white border border-[#E6E6E1] shadow-xs space-y-4">
                  {/* Summary Text & Percentage */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    {isLoaded ? (
                      <>
                        <p className="text-base sm:text-lg font-bold text-[#06152E]">
                          {completedCount} dari {totalCount} materi selesai
                        </p>
                        <span className="text-xl font-extrabold text-[#1F7AFF]">
                          {progressPercent}%
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-[#5A6A85] animate-pulse">
                        Memuat progres...
                      </span>
                    )}
                  </div>

                  {/* Progress Bar (reusable) */}
                  <ProgressBar value={progressPercent} className="w-full" />

                  {/* Link ke halaman Progres Belajar */}
                  <div className="pt-2">
                    <Link href="/progres-belajar" className="inline-block">
                      <Button
                        variant="outline"
                        size="md"
                        className="gap-2 font-bold text-base min-h-[44px] px-5 text-[#06152E] hover:border-[#1F7AFF] hover:text-[#1F7AFF]"
                      >
                        <span>Lihat Progres Belajar →</span>
                      </Button>
                    </Link>
                  </div>
                </Card>
              </section>

              {/* ========================================================= */}
              {/* 5. INFORMASI AKUN (READ ONLY DARI SESSION)                */}
              {/* ========================================================= */}
              <section className="space-y-3 sm:space-y-4">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#06152E] tracking-tight">
                  Informasi Akun
                </h2>

                <Card padding="lg" className="bg-white border border-[#E6E6E1] shadow-xs divide-y divide-[#E6E6E1]/70">
                  {/* Row: Nama */}
                  <div className="py-4 first:pt-0 last:pb-0 space-y-1">
                    <span className="text-sm font-semibold text-[#5A6A85] block">
                      Nama
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-[#06152E] block">
                      {member.name}
                    </span>
                  </div>

                  {/* Row: Email */}
                  <div className="py-4 first:pt-0 last:pb-0 space-y-1">
                    <span className="text-sm font-semibold text-[#5A6A85] block">
                      Email
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-[#06152E] block font-mono sm:font-sans">
                      {member.email}
                    </span>
                  </div>

                  {/* Row: WhatsApp */}
                  <div className="py-4 first:pt-0 last:pb-0 space-y-1">
                    <span className="text-sm font-semibold text-[#5A6A85] block">
                      WhatsApp
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-[#06152E] block font-mono sm:font-sans">
                      {member.phone}
                    </span>
                  </div>
                </Card>
              </section>
            </div>
          </Container>
        </main>

        {/* App Shell: Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
