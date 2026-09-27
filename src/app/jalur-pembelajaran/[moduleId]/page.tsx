'use client';

import React, { use, useEffect } from 'react';
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
import { ResourceType } from '@/types/curriculum';
import { useProgress } from '@/context/ProgressContext';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, 
  BookOpen, 
  Layers, 
  PlayCircle, 
  FileText, 
  HardDrive, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  ChevronRight 
} from 'lucide-react';

interface ModuleDetailPageProps {
  params: Promise<{
    moduleId: string;
  }>;
}

// Resource Type label & icon helper
function getResourceBadge(type: ResourceType) {
  switch (type) {
    case 'youtube':
      return {
        label: 'YouTube',
        icon: <PlayCircle size={13} className="text-[#06152E]" />,
      };
    case 'youtube-short':
      return {
        label: 'YouTube Shorts',
        icon: <PlayCircle size={13} className="text-[#06152E]" />,
      };
    case 'google-drive':
      return {
        label: 'Google Drive',
        icon: <HardDrive size={13} className="text-[#06152E]" />,
      };
    case 'google-docs':
      return {
        label: 'Google Docs',
        icon: <FileText size={13} className="text-[#06152E]" />,
      };
    case 'gemini':
      return {
        label: 'Gemini',
        icon: <Sparkles size={13} className="text-[#1F7AFF]" />,
      };
    default:
      return {
        label: 'Materi',
        icon: <BookOpen size={13} className="text-[#06152E]" />,
      };
  }
}

export default function ModuleDetailPage({ params }: ModuleDetailPageProps) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { moduleId } = use(params);
  const { getModuleById } = useCurriculum();
  const moduleData = getModuleById(moduleId);
  const { getModuleProgress, isCompleted, isLoaded } = useProgress();

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
          <p className="text-sm font-medium text-[#5A6A85]">Memuat modul pembelajaran...</p>
        </div>
      </div>
    );
  }

  // Module Not Found State
  if (!moduleData) {
    return (
      <div className="min-h-screen flex bg-[#F8F8F6] text-[#06152E]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-10">
          <Header title="Jalur Pembelajaran" />
          <main className="flex-1 py-12">
            <Container size="lg">
              <Card padding="lg" className="text-center py-16 max-w-xl mx-auto space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#EAEAE5] flex items-center justify-center mx-auto text-[#5A6A85]">
                  <Layers size={22} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#06152E]">
                    Modul tidak ditemukan.
                  </h1>
                  <p className="text-sm text-[#5A6A85] mt-1.5">
                    Modul pembelajaran yang Anda cari tidak tersedia.
                  </p>
                </div>
                <div className="pt-2">
                  <Link href="/jalur-pembelajaran">
                    <Button variant="primary">
                      <ArrowLeft size={16} />
                      <span>Kembali ke Jalur Pembelajaran</span>
                    </Button>
                  </Link>
                </div>
              </Card>
            </Container>
          </main>
          <MobileBottomNav />
        </div>
      </div>
    );
  }

  const formattedOrder = String(moduleData.order).padStart(2, '0');
  const modProgress = getModuleProgress(moduleData.id);

  return (
    <div className="min-h-screen flex bg-[#F8F8F6] text-[#06152E]">
      {/* App Shell: Desktop Sidebar */}
      <Sidebar />

      {/* App Shell: Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-10">
        {/* App Shell: Header */}
        <Header title={`Modul ${formattedOrder}`} />

        {/* Page Content */}
        <main className="flex-1 py-8 sm:py-10">
          <Container size="lg">
            {/* 1. Back Navigation / Breadcrumb */}
            <div className="mb-6">
              <Link
                href="/jalur-pembelajaran"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#5A6A85] hover:text-[#1F7AFF] transition-colors"
              >
                <ArrowLeft size={15} />
                <span>Kembali ke Jalur Pembelajaran</span>
              </Link>
            </div>

            {/* 2. Module Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-[#1F7AFF] font-mono tracking-wider bg-[#1F7AFF]/10 px-2 py-0.5 rounded">
                  MODUL {formattedOrder}
                </span>
                <span className="text-xs text-[#5A6A85]">•</span>
                <span className="text-xs font-medium text-[#5A6A85]">
                  {modProgress.total} materi pembelajaran
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#06152E]">
                {moduleData.title}
              </h1>
            </div>

            {/* 3. Ringkasan Progres Modul */}
            <section className="mb-8">
              <Card padding="md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <span className="text-[11px] font-bold tracking-wider text-[#5A6A85] uppercase block">
                      PROGRES MODUL
                    </span>
                    <div className="flex items-baseline gap-2.5 mt-1">
                      {isLoaded ? (
                        <>
                          <span className="text-2xl sm:text-3xl font-bold text-[#06152E]">
                            {modProgress.percentage}%
                          </span>
                          <span className="text-xs sm:text-sm text-[#5A6A85]">
                            {modProgress.completed} dari {modProgress.total} materi selesai
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
                    {modProgress.status === 'Selesai' && (
                      <Badge variant="subtle" size="sm" className="text-[#059669] bg-[#10B981]/10">
                        <Check size={12} className="mr-1 inline-block" />
                        Selesai
                      </Badge>
                    )}
                    {modProgress.status === 'Sedang Dipelajari' && (
                      <Badge variant="subtle" size="sm" className="text-[#1F7AFF] bg-[#1F7AFF]/10">
                        Sedang Dipelajari
                      </Badge>
                    )}
                    {modProgress.status === 'Belum Dimulai' && (
                      <Badge variant="subtle" size="sm" className="text-[#5A6A85] bg-[#F0F0EC]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#5A6A85] mr-1.5 inline-block" />
                        Belum Dimulai
                      </Badge>
                    )}
                  </div>
                </div>

                <ProgressBar value={modProgress.percentage} />
              </Card>
            </section>

            {/* 4. Daftar Materi dalam Modul */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E6E6E1] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen size={17} className="text-[#1F7AFF]" />
                  <h2 className="text-base sm:text-lg font-bold text-[#06152E]">
                    Materi dalam Modul
                  </h2>
                </div>
                <span className="text-xs font-medium text-[#5A6A85]">
                  {modProgress.total} Materi
                </span>
              </div>

              {/* Material Items List */}
              <div className="space-y-2.5">
                {moduleData.materials.map((material) => {
                  const materialOrderFormatted = String(material.order).padStart(2, '0');
                  const resourceBadge = getResourceBadge(material.resourceType);
                  const isDone = isCompleted(material.id);

                  return (
                    <Link
                      key={material.id}
                      href={`/jalur-pembelajaran/${moduleData.id}/${material.id}`}
                      className="block group"
                    >
                      <Card
                        padding="sm"
                        className={`transition-all duration-150 cursor-pointer ${
                          isDone
                            ? 'border-[#10B981]/30 bg-[#10B981]/[0.02] hover:border-[#10B981]/50'
                            : 'hover:border-[#1F7AFF]/30 hover:bg-white/80'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 py-1">
                          {/* Left: Number & Title */}
                          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                            <span
                              className={`text-xs font-mono font-bold w-7 h-7 rounded flex items-center justify-center shrink-0 border ${
                                isDone
                                  ? 'bg-[#10B981]/15 text-[#059669] border-[#10B981]/30'
                                  : 'bg-[#F8F8F6] text-[#5A6A85] border-[#E6E6E1]/60'
                              }`}
                            >
                              {isDone ? <Check size={13} className="text-[#059669]" /> : materialOrderFormatted}
                            </span>

                            <div className="min-w-0 flex-1">
                              <h3
                                className={`text-xs sm:text-sm font-semibold transition-colors leading-snug ${
                                  isDone
                                    ? 'text-[#06152E] group-hover:text-[#059669]'
                                    : 'text-[#06152E] group-hover:text-[#1F7AFF]'
                                }`}
                              >
                                {material.title}
                              </h3>
                            </div>
                          </div>

                          {/* Right: Resource Type, Status & Action Button */}
                          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E6E6E1]/50">
                            <Badge variant="outline" size="sm" className="gap-1.5 bg-[#F8F8F6]">
                              {resourceBadge.icon}
                              <span>{resourceBadge.label}</span>
                            </Badge>

                            {isDone ? (
                              <Badge variant="subtle" size="sm" className="text-emerald-700 bg-emerald-50 border border-emerald-200">
                                <Check size={12} className="mr-1 inline-block" />
                                Selesai
                              </Badge>
                            ) : (
                              <Badge variant="subtle" size="sm" className="text-[#5A6A85] bg-[#F0F0EC]">
                                Belum Dimulai
                              </Badge>
                            )}

                            <Button variant="outline" size="sm" className="font-semibold text-xs sm:text-sm gap-1.5">
                              <span>Buka Materi</span>
                              <ChevronRight size={14} />
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
