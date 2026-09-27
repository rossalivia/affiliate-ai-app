'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCurriculum } from '@/context/CurriculumContext';
import { BookOpen, Layers, CheckCircle2, PlayCircle, ArrowRight, Sparkles, ShieldAlert } from 'lucide-react';
import { useProgress } from '@/context/ProgressContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const { member, isLoading: isAuthLoading } = useAuth();
  const { modules } = useCurriculum();
  const { getOverallProgress, getModuleProgress, completedMaterialIds, isLoaded } = useProgress();
  const overall = getOverallProgress();
  const totalModules = modules.length;

  // Simple frontend protection: redirect to /login if no active session, or /admin if admin
  useEffect(() => {
    if (!isAuthLoading) {
      if (!member) {
        router.push('/login');
      } else if (member.role === 'admin') {
        router.push('/admin');
      }
    }
  }, [isAuthLoading, member, router]);

  // Flatten all materials in sequence to determine current / next material
  const allMaterials = useMemo(() => {
    return modules.flatMap((m) =>
      m.materials.map((mat) => ({
        ...mat,
        moduleId: m.id,
        moduleTitle: m.title,
        moduleOrder: m.order,
      }))
    );
  }, [modules]);

  // Determine continue learning material
  const currentMaterial = useMemo(() => {
    if (allMaterials.length === 0) return null;
    if (completedMaterialIds.length === 0) {
      return allMaterials[0];
    }
    const next = allMaterials.find((m) => !completedMaterialIds.includes(m.id));
    return next || allMaterials[allMaterials.length - 1];
  }, [allMaterials, completedMaterialIds]);

  const hasStarted = isLoaded && completedMaterialIds.length > 0;
  const isAllCompleted = isLoaded && overall.percentage === 100;

  if (isAuthLoading || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] text-[#06152E]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#1F7AFF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#5A6A85]">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const firstName = member.name.trim().split(/\s+/)[0] || 'Member';

  return (
    <div className="min-h-screen flex bg-[#F8F8F6] text-[#06152E]">
      {/* App Shell: Desktop Sidebar */}
      <Sidebar />

      {/* App Shell: Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-24 md:pb-12">
        {/* App Shell: Header */}
        <Header title="Beranda" />

        {/* App Shell: Main Content Area */}
        <main className="flex-1 py-8 sm:py-10">
          <Container size="lg">
            {/* 1. Hero / Welcome Area */}
            <div className="mb-8">
              <span className="text-xs font-bold tracking-widest text-[#1F7AFF] uppercase block mb-1">
                SELAMAT DATANG KEMBALI
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#06152E]">
                Selamat datang, {firstName}
              </h1>
              <p className="text-base sm:text-lg font-semibold text-[#0B1F45] mt-1.5">
                Kelas Affiliate AI — Dashboard Resmi Raya Digital
              </p>
              <p className="text-sm sm:text-base text-[#5A6A85] mt-1 max-w-2xl leading-relaxed">
                Mulai atau lanjutkan perjalanan belajar Anda dan ikuti materi secara bertahap dari pemula hingga mahir.
              </p>
            </div>

            {/* Inactive Membership State Notice */}
            {member.isMembershipActive === false ? (
              <Card padding="lg" className="bg-amber-50/70 border border-amber-200 text-[#06152E] space-y-4 mb-10 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/80">
                    <ShieldAlert size={24} />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-extrabold text-[#06152E] tracking-tight">
                        Akses Kelas Belum Aktif
                      </h2>
                      <Badge variant="subtle" size="sm" className="bg-amber-100 text-amber-800 border-amber-300 font-bold">
                        Belum Aktif
                      </Badge>
                    </div>
                    <p className="text-sm sm:text-base text-[#5A6A85] leading-relaxed">
                      Akun Anda belum memiliki status keanggotaan aktif untuk <strong>Kelas Affiliate AI</strong>. Silakan masukkan Kode Akses aktivasi yang valid atau hubungi Admin untuk mengaktifkan akses materi pembelajaran Anda.
                    </p>
                    <div className="pt-2">
                      <Link href="/aktivasi">
                        <Button variant="primary" size="md" className="gap-2 font-bold min-h-[44px]">
                          <span>Aktivasi Akun Sekarang</span>
                          <ArrowRight size={16} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <>
                {/* 2. Top Summary Section: Progress Card & Continue Learning Card */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
              {/* Progress Belajar Card */}
              <Card padding="lg" className="flex flex-col justify-between border-l-4 border-l-[#1F7AFF]">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-xs font-bold tracking-wider text-[#5A6A85] uppercase">
                      PROGRES BELAJAR
                    </span>
                    <Badge variant="subtle" size="sm" className="font-semibold text-xs">
                      {totalModules} Modul Terdaftar
                    </Badge>
                  </div>

                  <div className="flex items-baseline gap-3 my-2">
                    {isLoaded ? (
                      <>
                        <span className="text-3xl sm:text-4xl font-black text-[#06152E]">
                          {overall.percentage}%
                        </span>
                        <span className="text-sm sm:text-base font-medium text-[#5A6A85]">
                          {overall.completed} dari {overall.total} materi selesai
                        </span>
                      </>
                    ) : (
                      <span className="text-base font-medium text-[#5A6A85] animate-pulse">
                        Memuat progres...
                      </span>
                    )}
                  </div>

                  <div className="my-4">
                    <ProgressBar value={isLoaded ? overall.percentage : 0} />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E6E6E1]/60 flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-[#5A6A85]">
                    {isAllCompleted
                      ? 'Selamat! Semua materi telah selesai.'
                      : hasStarted
                      ? 'Pembelajaran sedang berlangsung.'
                      : 'Belum ada materi yang diselesaikan.'}
                  </span>
                  <Link href="/progres-belajar">
                    <Button variant="ghost" size="sm" className="text-xs sm:text-sm font-semibold text-[#1F7AFF]">
                      <span>Lihat Progres Lengkap</span>
                      <ArrowRight size={14} />
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Continue Learning / Mulai Belajar Card */}
              {currentMaterial && (
                <Card padding="lg" className="flex flex-col justify-between bg-white border border-[#1F7AFF]/30 shadow-xs">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={16} className="text-[#1F7AFF]" />
                        <span className="text-xs font-bold tracking-wider text-[#1F7AFF] uppercase">
                          {hasStarted ? 'LANJUTKAN BELAJAR' : 'MULAI BELAJAR'}
                        </span>
                      </div>
                      <Badge variant="outline" size="sm" className="text-xs">
                        Modul {String(currentMaterial.moduleOrder).padStart(2, '0')}
                      </Badge>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[#06152E] leading-snug line-clamp-2 mt-1">
                      {currentMaterial.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#5A6A85] mt-1.5">
                      Bagian dari: <strong className="text-[#06152E] font-medium">{currentMaterial.moduleTitle}</strong>
                    </p>
                  </div>

                    <div className="pt-4 mt-4 border-t border-[#E6E6E1]/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <span className="text-xs sm:text-sm text-[#5A6A85]">
                      Materi ke-{currentMaterial.order}
                    </span>
                    <Link
                      href={`/jalur-pembelajaran/${currentMaterial.moduleId}/${currentMaterial.id}`}
                      className="w-full sm:w-auto"
                    >
                      <Button variant="primary" size="md" className="w-full sm:w-auto min-h-[44px] font-bold text-sm sm:text-base gap-2">
                        <span>{hasStarted ? 'Lanjutkan Belajar' : 'Mulai Belajar'}</span>
                        <ArrowRight size={16} />
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}
            </div>

            {/* 3. Jalur Pembelajaran di Dashboard */}
            <section className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E6E6E1] pb-3 gap-2">
                <div className="flex items-center gap-2.5">
                  <Layers size={20} className="text-[#1F7AFF]" />
                  <h2 className="text-lg sm:text-xl font-bold text-[#06152E]">
                    Jalur Pembelajaran
                  </h2>
                </div>
                <span className="text-xs sm:text-sm font-medium text-[#5A6A85]">
                  {totalModules} Modul • {overall.total} Materi
                </span>
              </div>

              {/* Data-Driven Modules Grid: 2 cols on tablet, 3 cols on large desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {modules.map((module) => {
                  const moduleOrderFormatted = String(module.order).padStart(2, '0');
                  const modProgress = getModuleProgress(module.id);
                  const isDone = modProgress.status === 'Selesai';
                  const isInProgress = modProgress.status === 'Sedang Dipelajari';

                  return (
                    <Card
                      key={module.id}
                      padding="lg"
                      className="flex flex-col justify-between transition-all duration-150 hover:border-[#1F7AFF]/50 hover:shadow-sm"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <span className={`text-xs font-mono font-bold w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-700'
                              : isInProgress
                              ? 'bg-[#1F7AFF]/10 text-[#1F7AFF]'
                              : 'bg-[#E6E6E1]/60 text-[#5A6A85]'
                          }`}>
                            {moduleOrderFormatted}
                          </span>

                          <div className="shrink-0">
                            {isDone ? (
                              <Badge variant="subtle" size="sm" className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={12} className="mr-1 inline-block" />
                                Selesai
                              </Badge>
                            ) : isInProgress ? (
                              <Badge variant="accent" size="sm" className="border border-[#1F7AFF]/20">
                                <PlayCircle size={12} className="mr-1 inline-block" />
                                Sedang Dipelajari
                              </Badge>
                            ) : (
                              <Badge variant="subtle" size="sm" className="text-[#5A6A85] bg-[#F0F0EC]">
                                Belum Dimulai
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-[#06152E] leading-snug">
                            {module.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-[#5A6A85] mt-1 flex items-center gap-1.5">
                            <BookOpen size={14} className="text-[#5A6A85] shrink-0" />
                            <span>
                              {isLoaded ? `${modProgress.completed} dari ${modProgress.total} materi selesai` : `${module.materials.length} materi`}
                            </span>
                          </p>
                        </div>

                        {/* Progress track */}
                        <div className="pt-1">
                          <ProgressBar value={isLoaded ? modProgress.percentage : 0} />
                        </div>
                      </div>

                      {/* Explicit Action Button */}
                      <div className="mt-5 pt-3 border-t border-[#E6E6E1]/60 flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-[#5A6A85]">
                          {isLoaded ? `${modProgress.percentage}%` : '0%'}
                        </span>
                        <Link href={`/jalur-pembelajaran/${module.id}`}>
                          <Button variant="outline" size="sm" className="font-bold text-xs sm:text-sm min-h-[40px] px-3.5 gap-1.5 hover:border-[#1F7AFF] hover:text-[#1F7AFF]">
                            <span>Buka Modul</span>
                            <ArrowRight size={14} />
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </Container>
        </main>

        {/* App Shell: Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
