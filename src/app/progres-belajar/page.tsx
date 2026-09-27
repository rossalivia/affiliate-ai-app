'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import {
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  PlayCircle,
  X
} from 'lucide-react';

export default function ProgresBelajarPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    completedMaterialIds,
    getOverallProgress,
    getModuleProgress,
    resetProgress,
    isLoaded,
  } = useProgress();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
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

  // Find all completed materials directly from curriculum
  const completedMaterialsList = useMemo(() => {
    const list: {
      id: string;
      title: string;
      order: number;
      moduleId: string;
      moduleTitle: string;
      moduleOrder: number;
    }[] = [];

    curriculum.modules.forEach((mod) => {
      mod.materials.forEach((mat) => {
        if (completedMaterialIds.includes(mat.id)) {
          list.push({
            id: mat.id,
            title: mat.title,
            order: mat.order,
            moduleId: mod.id,
            moduleTitle: mod.title,
            moduleOrder: mod.order,
          });
        }
      });
    });

    return list;
  }, [completedMaterialIds]);

  const handleConfirmReset = () => {
    resetProgress();
    setShowResetConfirm(false);
    setTimeout(() => {
      setResetFeedback(null);
    }, 3500);
  };

  if (isAuthLoading || !user || user.role === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] text-[#06152E]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#1F7AFF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#5A6A85]">Memuat progres belajar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8F8F6] text-[#06152E]">
      {/* App Shell: Desktop Sidebar */}
      <Sidebar />

      {/* App Shell: Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-24 md:pb-12">
        {/* App Shell: Header */}
        <Header title="Progres Belajar" />

        {/* Page Content */}
        <main className="flex-1 py-8 sm:py-10">
          <Container size="lg">
            {/* Feedback notification if triggered */}
            {resetFeedback && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm sm:text-base px-4 py-3 rounded-xl flex items-center gap-3 transition-all shadow-xs">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span className="font-medium">{resetFeedback}</span>
              </div>
            )}

            {/* 1. Header Halaman */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-bold tracking-widest text-[#1F7AFF] uppercase block mb-1">
                  PROGRES BELAJAR
                </span>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#06152E]">
                  Progres Belajar
                </h1>
                <p className="text-base sm:text-lg text-[#5A6A85] mt-1 max-w-2xl leading-relaxed">
                  Pantau perkembangan pembelajaran Anda.
                </p>
              </div>

              {/* Reset Progress Action */}
              <div className="self-start sm:self-center">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setShowResetConfirm(true)}
                  className="font-semibold text-xs sm:text-sm text-[#5A6A85] hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/50 transition-colors"
                >
                  <RotateCcw size={15} />
                  <span>Reset Progres</span>
                </Button>
              </div>
            </div>

            {/* Confirmation Modal */}
            {showResetConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-[#E6E6E1]">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <AlertTriangle size={22} />
                      </div>
                      <h2 className="text-lg font-bold text-[#06152E]">
                        Konfirmasi Reset
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="text-[#5A6A85] hover:text-[#06152E] p-1.5 rounded-lg cursor-pointer transition-colors"
                      aria-label="Tutup konfirmasi"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-2 text-sm sm:text-base text-[#5A6A85] leading-relaxed">
                    <p className="font-semibold text-[#06152E]">
                      Apakah Anda yakin ingin menghapus seluruh progres belajar?
                    </p>
                    <p className="text-xs sm:text-sm">
                      Semua materi yang sudah ditandai selesai akan kembali menjadi Belum Dimulai. Tindakan ini tidak dapat dibatalkan.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E6E1]/70">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => setShowResetConfirm(false)}
                    >
                      Batal
                    </Button>
                    <button
                      type="button"
                      onClick={handleConfirmReset}
                      className="inline-flex items-center justify-center gap-2 font-bold transition-colors cursor-pointer rounded-lg text-sm px-5 h-11 bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                    >
                      <RotateCcw size={16} />
                      <span>Reset Progres</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Progress Keseluruhan Card */}
            <section className="mb-10">
              <Card padding="lg" className="border-l-4 border-l-[#1F7AFF]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div>
                    <span className="text-[11px] font-bold tracking-wider text-[#5A6A85] uppercase block">
                      PROGRES KESELURUHAN
                    </span>
                    <div className="flex items-baseline gap-3 mt-1.5">
                      {isLoaded ? (
                        <>
                          <span className="text-3xl sm:text-4xl font-extrabold text-[#06152E]">
                            {overall.percentage}%
                          </span>
                          <span className="text-sm sm:text-base text-[#5A6A85]">
                            {overall.completed} dari {overall.total} materi selesai
                          </span>
                        </>
                      ) : (
                        <span className="text-base font-medium text-[#5A6A85] animate-pulse">
                          Memuat progres...
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="self-start sm:self-center">
                    <Badge
                      variant={overall.percentage === 100 ? 'subtle' : overall.percentage > 0 ? 'accent' : 'subtle'}
                      size="md"
                      className={overall.percentage === 100 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : ''}
                    >
                      {overall.percentage === 100
                        ? 'Semua Materi Selesai'
                        : overall.percentage > 0
                        ? 'Sedang Berjalan'
                        : 'Belum Dimulai'}
                    </Badge>
                  </div>
                </div>

                <ProgressBar value={isLoaded ? overall.percentage : 0} />

                {/* Sub-Stat Grid: Materi Selesai & Materi Tersisa */}
                <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-[#E6E6E1]/70">
                  <div className="bg-[#F8F8F6] p-3 rounded-xl border border-[#E6E6E1]/60">
                    <span className="text-xs font-semibold text-[#5A6A85] block">Materi Selesai</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-emerald-700">
                      {isLoaded ? overall.completed : '-'}
                    </span>
                  </div>
                  <div className="bg-[#F8F8F6] p-3 rounded-xl border border-[#E6E6E1]/60">
                    <span className="text-xs font-semibold text-[#5A6A85] block">Materi Tersisa</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-[#06152E]">
                      {isLoaded ? (overall.total - overall.completed) : '-'}
                    </span>
                  </div>
                </div>
              </Card>
            </section>

            {/* 3. Progress Per Modul (Seluruh 7 Modul) */}
            <section className="mb-10">
              <div className="flex items-center justify-between border-b border-[#E6E6E1] pb-3 mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-[#1F7AFF]" />
                  <h2 className="text-base sm:text-lg font-bold text-[#06152E]">
                    Progres Per Modul
                  </h2>
                </div>
                <span className="text-xs font-medium text-[#5A6A85]">
                  {curriculum.modules.length} Modul
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {curriculum.modules.map((module) => {
                  const progress = getModuleProgress(module.id);
                  const isDone = progress.status === 'Selesai';
                  const isInProgress = progress.status === 'Sedang Dipelajari';
                  const formattedOrder = String(module.order).padStart(2, '0');

                  return (
                    <Card key={module.id} padding="md" className="space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <span className={`text-xs font-mono font-bold w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-700'
                              : isInProgress
                              ? 'bg-[#1F7AFF]/10 text-[#1F7AFF]'
                              : 'bg-[#E6E6E1]/60 text-[#5A6A85]'
                          }`}>
                            {formattedOrder}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-[#06152E] truncate">
                              {module.title}
                            </h3>
                            <p className="text-xs text-[#5A6A85] mt-0.5">
                              {isLoaded ? progress.completed : 0} dari {progress.total} materi selesai
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isDone ? (
                            <Badge variant="subtle" size="sm" className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
                              <CheckCircle2 size={11} className="mr-1 inline-block" />
                              Selesai
                            </Badge>
                          ) : isInProgress ? (
                            <Badge variant="accent" size="sm" className="border border-[#1F7AFF]/20 text-[11px]">
                              <PlayCircle size={11} className="mr-1 inline-block" />
                              Sedang Dipelajari
                            </Badge>
                          ) : (
                            <Badge variant="subtle" size="sm" className="text-[#5A6A85] bg-[#F0F0EC] text-[11px]">
                              Belum Dimulai
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-[#5A6A85]">
                          <span>Progres</span>
                          <span className="font-semibold text-[#06152E]">
                            {isLoaded ? progress.percentage : 0}%
                          </span>
                        </div>
                        <ProgressBar value={isLoaded ? progress.percentage : 0} />
                      </div>

                      <div className="pt-3 border-t border-[#E6E6E1]/60 flex items-center justify-between">
                        <span className="text-xs font-medium text-[#5A6A85]">
                          Status: <strong className="text-[#06152E] font-semibold">{progress.status}</strong>
                        </span>
                        <Link href={`/jalur-pembelajaran/${module.id}`}>
                          <Button variant="outline" size="sm" className="font-semibold text-xs sm:text-sm gap-1.5">
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

            {/* 4. Daftar Materi Selesai */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E6E6E1] pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                  <h2 className="text-lg sm:text-xl font-bold text-[#06152E]">
                    Materi Selesai
                  </h2>
                </div>
                <span className="text-xs sm:text-sm font-medium text-[#5A6A85]">
                  {isLoaded ? completedMaterialsList.length : 0} dari {overall.total} materi
                </span>
              </div>

              {completedMaterialsList.length === 0 ? (
                <Card padding="lg" className="text-center py-12 max-w-lg mx-auto space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#EAEAE5] flex items-center justify-center mx-auto text-[#5A6A85]">
                    <BookOpen size={26} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#06152E]">
                      Belum ada materi yang selesai.
                    </h3>
                    <p className="text-sm text-[#5A6A85] mt-1.5 max-w-sm mx-auto leading-relaxed">
                      Mulai belajar dengan membuka salah satu materi pada Jalur Pembelajaran.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link href="/jalur-pembelajaran">
                      <Button variant="primary" size="md" className="font-semibold">
                        <span>Lihat Jalur Pembelajaran</span>
                        <ArrowRight size={16} />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ) : (
                <div className="space-y-3">
                  {completedMaterialsList.map((item) => {
                    const materialOrderFormatted = String(item.order).padStart(2, '0');
                    const moduleOrderFormatted = String(item.moduleOrder).padStart(2, '0');

                    return (
                      <Link
                        key={item.id}
                        href={`/jalur-pembelajaran/${item.moduleId}/${item.id}`}
                        className="block group"
                      >
                        <Card
                          padding="md"
                          className="transition-all duration-150 hover:border-[#1F7AFF]/40 hover:shadow-xs cursor-pointer"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 py-1">
                            <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                              <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                                <CheckCircle2 size={16} />
                              </span>
                              <div className="min-w-0 flex-1 space-y-1">
                                <h4 className="text-sm sm:text-base font-bold text-[#06152E] group-hover:text-[#1F7AFF] transition-colors truncate">
                                  {item.title}
                                </h4>
                                <p className="text-xs sm:text-sm text-[#5A6A85] truncate">
                                  Modul {moduleOrderFormatted}: {item.moduleTitle} • Materi {materialOrderFormatted}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E6E6E1]/50">
                              <Badge variant="subtle" size="sm" className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Selesai
                              </Badge>

                              <Button variant="outline" size="sm" className="font-semibold text-xs sm:text-sm gap-1.5">
                                <span>Buka Materi</span>
                                <ArrowRight size={14} />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </Container>
        </main>

        {/* App Shell: Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
