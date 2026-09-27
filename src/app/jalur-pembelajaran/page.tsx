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
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { useCurriculum } from '@/context/CurriculumContext';
import { Compass, BookOpen, CheckCircle2, PlayCircle, ArrowRight } from 'lucide-react';
import { useProgress } from '@/context/ProgressContext';
import { useAuth } from '@/context/AuthContext';

export default function JalurPembelajaranPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { getModuleProgress, getOverallProgress, isLoaded } = useProgress();
  const { modules } = useCurriculum();
  const totalModules = modules.length;
  const overall = getOverallProgress();

  // Simple frontend protection: redirect to /login if no active session, or /admin if admin
  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'admin') {
        router.push('/admin');
      }
    }
  }, [isAuthLoading, user, router]);

  if (isAuthLoading || !user || user.role === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] text-[#06152E]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#1F7AFF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#5A6A85]">Memuat jalur pembelajaran...</p>
        </div>
      </div>
    );
  }

  // Empty state handling
  if (totalModules === 0) {
    return (
      <div className="min-h-screen flex bg-[#F8F8F6] text-[#06152E]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-10">
          <Header title="Jalur Pembelajaran" />
          <main className="flex-1 py-12">
            <Container size="lg">
              <Card padding="lg" className="text-center py-12">
                <p className="text-sm font-medium text-[#5A6A85]">
                  Materi pembelajaran belum tersedia.
                </p>
              </Card>
            </Container>
          </main>
          <MobileBottomNav />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8F8F6] text-[#06152E]">
      {/* App Shell: Desktop Sidebar */}
      <Sidebar />

      {/* App Shell: Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-10">
        {/* App Shell: Header */}
        <Header title="Jalur Pembelajaran" />

        {/* Page Content */}
        <main className="flex-1 py-8 sm:py-10">
          <Container size="lg">
            {/* 1. Header Halaman */}
            <div className="mb-8">
              <span className="text-[11px] font-bold tracking-widest text-[#1F7AFF] uppercase block mb-1">
                JALUR PEMBELAJARAN
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#06152E]">
                Belajar Faceless Affiliate AI
              </h1>
              <p className="text-sm sm:text-base text-[#5A6A85] mt-1.5 max-w-2xl leading-relaxed">
                Ikuti materi secara bertahap dari dasar hingga produksi konten AI.
              </p>
            </div>

            {/* 2. Ringkasan Progres Halaman */}
            <section className="mb-10">
              <Card padding="md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <span className="text-[11px] font-bold tracking-wider text-[#5A6A85] uppercase block">
                      PROGRES BELAJAR
                    </span>
                    <div className="flex items-baseline gap-2.5 mt-1">
                      {isLoaded ? (
                        <>
                          <span className="text-2xl sm:text-3xl font-bold text-[#06152E]">
                            {overall.percentage}%
                          </span>
                          <span className="text-xs sm:text-sm text-[#5A6A85]">
                            {overall.completed} dari {overall.total} materi selesai
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-medium text-[#5A6A85] animate-pulse">
                          Memuat progres...
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="self-start sm:self-auto">
                    <Badge variant="subtle" size="sm">
                      {totalModules} Modul Terjadwal
                    </Badge>
                  </div>
                </div>

                {/* Overall Progress Bar */}
                <ProgressBar value={isLoaded ? overall.percentage : 0} />
              </Card>
            </section>

            {/* 3. Daftar Modul Pembelajaran */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E6E6E1] pb-3 mb-6">
                <div className="flex items-center gap-2">
                  <Compass size={18} className="text-[#1F7AFF]" />
                  <h2 className="text-base sm:text-lg font-bold text-[#06152E]">
                    Struktur Perjalanan Belajar
                  </h2>
                </div>
                <span className="text-xs font-medium text-[#5A6A85]">
                  {totalModules} Modul • {overall.total} Materi
                </span>
              </div>

              {/* Learning Path Module Sequence */}
              <div className="space-y-3.5">
                {modules.map((module) => {
                  const formattedOrder = String(module.order).padStart(2, '0');
                  const progress = getModuleProgress(module.id);
                  const isDone = progress.status === 'Selesai';
                  const isInProgress = progress.status === 'Sedang Dipelajari';

                  return (
                    <Link
                      key={module.id}
                      href={`/jalur-pembelajaran/${module.id}`}
                      className="block group"
                    >
                      <Card
                        padding="md"
                        className="transition-all duration-150 hover:border-[#1F7AFF]/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)] cursor-pointer"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          {/* Left: Module Number & Title */}
                          <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                            <span className={`text-sm font-bold font-mono tracking-wider w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isDone
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : isInProgress
                                ? 'bg-[#1F7AFF]/10 text-[#1F7AFF]'
                                : 'bg-[#E6E6E1]/50 text-[#5A6A85]'
                            }`}>
                              {formattedOrder}
                            </span>

                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm sm:text-base font-semibold text-[#06152E] group-hover:text-[#1F7AFF] transition-colors leading-snug">
                                {module.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[#5A6A85]">
                                <span className="flex items-center gap-1">
                                  <BookOpen size={12} />
                                  <span>{isLoaded ? `${progress.completed} dari ${progress.total}` : `0 dari ${progress.total}`} materi selesai</span>
                                </span>
                                <span>•</span>
                                <span>{isLoaded ? progress.percentage : 0}%</span>
                              </div>
                              <div className="w-full max-w-xs mt-2">
                                <ProgressBar value={isLoaded ? progress.percentage : 0} />
                              </div>
                            </div>
                          </div>

                          {/* Right: Status Badge & Action Button */}
                          <div className="flex items-center gap-3 self-start sm:self-center shrink-0 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E6E6E1]/50">
                            <div>
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
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#5A6A85] mr-1.5 inline-block" />
                                  Belum Dimulai
                                </Badge>
                              )}
                            </div>

                            <Button variant="outline" size="sm" className="font-semibold text-xs sm:text-sm gap-1.5">
                              <span>Buka Modul</span>
                              <ArrowRight size={14} />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          </Container>
        </main>

        {/* App Shell: Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
