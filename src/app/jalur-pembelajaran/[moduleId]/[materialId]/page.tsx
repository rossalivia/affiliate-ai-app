'use client';

import React, { use, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { useCurriculum } from '@/context/CurriculumContext';
import { ResourceType } from '@/types/curriculum';
import { useProgress } from '@/context/ProgressContext';
import { useAuth } from '@/context/AuthContext';
import { 
  getYouTubeVideoId, 
  getGoogleDriveEmbedUrl, 
  getGoogleDocsEmbedUrl 
} from '@/utils/mediaEmbed';
import { 
  ArrowLeft, 
  ExternalLink, 
  PlayCircle, 
  FileText, 
  HardDrive, 
  Sparkles, 
  BookOpen, 
  CheckCircle2,
  Check,
  Layers,
  Info
} from 'lucide-react';

interface MaterialDetailPageProps {
  params: Promise<{
    moduleId: string;
    materialId: string;
  }>;
}

// Resource Type label & icon helper
function getResourceConfig(type: ResourceType) {
  switch (type) {
    case 'youtube':
      return {
        label: 'YouTube',
        icon: <PlayCircle size={15} className="text-[#06152E]" />,
      };
    case 'youtube-short':
      return {
        label: 'YouTube Shorts',
        icon: <PlayCircle size={15} className="text-[#06152E]" />,
      };
    case 'google-drive':
      return {
        label: 'Google Drive',
        icon: <HardDrive size={15} className="text-[#06152E]" />,
      };
    case 'google-docs':
      return {
        label: 'Google Docs',
        icon: <FileText size={15} className="text-[#06152E]" />,
      };
    case 'gemini':
      return {
        label: 'Gemini',
        icon: <Sparkles size={15} className="text-[#1F7AFF]" />,
      };
    default:
      return {
        label: 'Materi',
        icon: <BookOpen size={15} className="text-[#06152E]" />,
      };
  }
}

function getExternalButtonLabel(type: ResourceType): string {
  switch (type) {
    case 'youtube':
      return 'Buka di YouTube';
    case 'youtube-short':
      return 'Buka di YouTube Shorts';
    case 'google-drive':
      return 'Buka di Google Drive';
    case 'google-docs':
      return 'Buka di Google Docs';
    case 'gemini':
      return 'Buka di Gemini';
    default:
      return 'Buka Sumber Asli';
  }
}

export default function MaterialDetailPage({ params }: MaterialDetailPageProps) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { moduleId, materialId } = use(params);
  const { isCompleted, markComplete, toggleComplete, isLoaded } = useProgress();
  const { getModuleById } = useCurriculum();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const moduleData = getModuleById(moduleId);

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
          <p className="text-sm font-medium text-[#5A6A85]">Memuat materi pembelajaran...</p>
        </div>
      </div>
    );
  }

  // 1. Module Not Found handling
  if (!moduleData) {
    return (
      <div className="min-h-screen flex bg-[#F8F8F6] text-[#06152E]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-24 md:pb-12">
          <Header title="Materi Pembelajaran" />
          <main className="flex-1 py-12">
            <Container size="lg">
              <Card padding="lg" className="text-center py-16 max-w-xl mx-auto space-y-4">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Layers size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#06152E]">
                    Modul tidak ditemukan.
                  </h1>
                  <p className="text-sm text-[#5A6A85] mt-1.5 leading-relaxed">
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

  // 2. Material lookup
  const material = moduleData.materials.find((m) => m.id === materialId);

  // 3. Material Not Found handling
  if (!material) {
    return (
      <div className="min-h-screen flex bg-[#F8F8F6] text-[#06152E]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-24 md:pb-12">
          <Header title={`Modul ${String(moduleData.order).padStart(2, '0')}`} />
          <main className="flex-1 py-12">
            <Container size="lg">
              <Card padding="lg" className="text-center py-16 max-w-xl mx-auto space-y-4">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#06152E]">
                    Materi tidak ditemukan.
                  </h1>
                  <p className="text-sm text-[#5A6A85] mt-1.5 leading-relaxed">
                    Materi pembelajaran yang Anda cari tidak tersedia.
                  </p>
                </div>
                <div className="pt-2">
                  <Link href={`/jalur-pembelajaran/${moduleData.id}`}>
                    <Button variant="primary">
                      <ArrowLeft size={16} />
                      <span>Kembali ke Modul</span>
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

  const completed = isLoaded && isCompleted(material.id);
  const materialOrderFormatted = String(material.order).padStart(2, '0');
  const resourceConfig = getResourceConfig(material.resourceType);

  // Auto-complete callback for YouTube / Shorts player completion event
  const handleVideoEnded = () => {
    if (!isCompleted(material.id)) {
      markComplete(material.id);
      setFeedbackMessage('✓ Materi selesai ditonton.');
      setTimeout(() => {
        setFeedbackMessage(null);
      }, 4000);
    }
  };

  // Manual completion toggle
  const handleToggleComplete = () => {
    toggleComplete(material.id);
    if (!completed) {
      setFeedbackMessage('Materi berhasil ditandai selesai.');
      setTimeout(() => {
        setFeedbackMessage(null);
      }, 3500);
    } else {
      setFeedbackMessage(null);
    }
  };

  // Helper for embed targets
  const youtubeVideoId = useMemo(() => {
    if (material.resourceType === 'youtube' || material.resourceType === 'youtube-short') {
      return getYouTubeVideoId(material.url);
    }
    return null;
  }, [material.resourceType, material.url]);

  const driveEmbedUrl = useMemo(() => {
    if (material.resourceType === 'google-drive') {
      return getGoogleDriveEmbedUrl(material.url);
    }
    return null;
  }, [material.resourceType, material.url]);

  const docsEmbedUrl = useMemo(() => {
    if (material.resourceType === 'google-docs') {
      return getGoogleDocsEmbedUrl(material.url);
    }
    return null;
  }, [material.resourceType, material.url]);

  return (
    <div className="min-h-screen flex bg-[#F8F8F6] text-[#06152E]">
      {/* App Shell: Desktop Sidebar */}
      <Sidebar />

      {/* App Shell: Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-24 md:pb-12">
        {/* App Shell: Header */}
        <Header title={`Materi ${materialOrderFormatted}`} />

        {/* Page Content */}
        <main className="flex-1 py-8 sm:py-10">
          <Container size="lg">
            {/* 1. Breadcrumb & Back Navigation */}
            <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#5A6A85]">
              <Link
                href="/jalur-pembelajaran"
                className="font-medium hover:text-[#1F7AFF] transition-colors"
              >
                Jalur Pembelajaran
              </Link>
              <span>/</span>
              <Link
                href={`/jalur-pembelajaran/${moduleData.id}`}
                className="font-medium hover:text-[#1F7AFF] transition-colors"
              >
                {moduleData.title}
              </Link>
              <span>/</span>
              <span className="text-[#06152E] font-semibold truncate max-w-xs sm:max-w-md">
                Materi {materialOrderFormatted}
              </span>
            </nav>

            {/* 2. Material Header Section */}
            <div className="mb-6 max-w-4xl">
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <span className="text-xs font-bold text-[#1F7AFF] font-mono tracking-wider bg-[#1F7AFF]/10 px-2.5 py-1 rounded">
                  MATERI {materialOrderFormatted}
                </span>
                <span className="text-xs text-[#5A6A85]">•</span>
                <Badge variant="outline" size="sm" className="gap-1.5 bg-white text-xs py-1">
                  {resourceConfig.icon}
                  <span>{resourceConfig.label}</span>
                </Badge>
                {completed ? (
                  <Badge variant="subtle" size="sm" className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-xs py-1">
                    <Check size={13} className="mr-1 inline-block" />
                    Selesai
                  </Badge>
                ) : (
                  <Badge variant="subtle" size="sm" className="text-[#5A6A85] bg-[#F0F0EC] text-xs py-1">
                    Belum Dimulai
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#06152E] leading-snug">
                {material.title}
              </h1>
            </div>

            {/* Feedback notification if triggered */}
            {feedbackMessage && (
              <div className="mb-6 max-w-4xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm sm:text-base px-4 py-3 rounded-xl flex items-center gap-3 transition-all shadow-xs animate-in fade-in">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <span className="font-semibold">{feedbackMessage}</span>
              </div>
            )}

            {/* 3. Main Learning Resource Area (Embedded or Fallback) */}
            <div className="space-y-6 max-w-4xl mb-8">
              {/* YouTube Video Embed */}
              {material.resourceType === 'youtube' && (
                <div className="space-y-3">
                  {youtubeVideoId ? (
                    <YouTubePlayer
                      videoId={youtubeVideoId}
                      title={material.title}
                      isShort={false}
                      originalUrl={material.url}
                      onEnded={handleVideoEnded}
                    />
                  ) : (
                    <div className="p-8 bg-[#F8F8F6] border-2 border-dashed border-[#E6E6E1] rounded-2xl text-center space-y-2">
                      <p className="text-base font-bold text-[#06152E]">
                        Materi tidak dapat ditampilkan langsung di halaman.
                      </p>
                      <p className="text-sm text-[#5A6A85]">
                        Silakan buka video langsung melalui tombol YouTube di bawah.
                      </p>
                    </div>
                  )}
                  <p className="text-xs sm:text-sm text-[#5A6A85] flex items-center gap-1.5 pt-1">
                    <Info size={15} className="text-[#1F7AFF] shrink-0" />
                    <span>Video akan otomatis ditandai <strong>Selesai</strong> setelah Anda menonton hingga akhir.</span>
                  </p>
                </div>
              )}

              {/* YouTube Shorts Embed */}
              {material.resourceType === 'youtube-short' && (
                <div className="space-y-3">
                  {youtubeVideoId ? (
                    <YouTubePlayer
                      videoId={youtubeVideoId}
                      title={material.title}
                      isShort={true}
                      originalUrl={material.url}
                      onEnded={handleVideoEnded}
                    />
                  ) : (
                    <div className="p-8 bg-[#F8F8F6] border-2 border-dashed border-[#E6E6E1] rounded-2xl text-center space-y-2">
                      <p className="text-base font-bold text-[#06152E]">
                        Materi tidak dapat ditampilkan langsung di halaman.
                      </p>
                      <p className="text-sm text-[#5A6A85]">
                        Silakan buka video Shorts langsung melalui tombol di bawah.
                      </p>
                    </div>
                  )}
                  <p className="text-xs sm:text-sm text-[#5A6A85] text-center flex items-center justify-center gap-1.5 pt-1">
                    <Info size={15} className="text-[#1F7AFF] shrink-0" />
                    <span>Video Shorts akan otomatis ditandai <strong>Selesai</strong> setelah video selesai diputar.</span>
                  </p>
                </div>
              )}

              {/* Google Drive Embed Preview with Fallback */}
              {material.resourceType === 'google-drive' && (
                <div className="space-y-4">
                  {driveEmbedUrl ? (
                    <div className="w-full rounded-2xl overflow-hidden border border-[#E6E6E1] bg-white shadow-xs">
                      <iframe
                        src={driveEmbedUrl}
                        title={`Dokumen Google Drive: ${material.title}`}
                        className="w-full h-[520px] sm:h-[620px] border-0"
                        allow="autoplay"
                      />
                    </div>
                  ) : (
                    <Card padding="lg" className="space-y-3 bg-white border border-[#E6E6E1]">
                      <div className="flex items-center gap-2.5 text-[#06152E]">
                        <HardDrive size={22} className="text-[#1F7AFF]" />
                        <h3 className="text-base font-bold">Materi tersedia di Google Drive.</h3>
                      </div>
                      <p className="text-sm text-[#5A6A85] leading-relaxed">
                        Dokumen atau file materi ini tersimpan di Google Drive. Anda dapat membuka dan mempelajarinya langsung melalui tautan di bawah.
                      </p>
                    </Card>
                  )}
                </div>
              )}

              {/* Google Docs Embed Preview with Fallback */}
              {material.resourceType === 'google-docs' && (
                <div className="space-y-4">
                  {docsEmbedUrl ? (
                    <div className="w-full rounded-2xl overflow-hidden border border-[#E6E6E1] bg-white shadow-xs">
                      <iframe
                        src={docsEmbedUrl}
                        title={`Dokumen Google Docs: ${material.title}`}
                        className="w-full h-[520px] sm:h-[620px] border-0"
                      />
                    </div>
                  ) : (
                    <Card padding="lg" className="space-y-3 bg-white border border-[#E6E6E1]">
                      <div className="flex items-center gap-2.5 text-[#06152E]">
                        <FileText size={22} className="text-[#1F7AFF]" />
                        <h3 className="text-base font-bold">Materi tersedia di Google Docs.</h3>
                      </div>
                      <p className="text-sm text-[#5A6A85] leading-relaxed">
                        Panduan dan dokumen materi ini disiapkan di Google Docs. Silakan buka tautan di bawah untuk membaca seluruh panduan.
                      </p>
                    </Card>
                  )}
                </div>
              )}

              {/* Gemini Fallback Card */}
              {material.resourceType === 'gemini' && (
                <Card padding="lg" className="space-y-4 bg-white border border-[#E6E6E1]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1F7AFF]/10 text-[#1F7AFF] flex items-center justify-center shrink-0">
                      <Sparkles size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#06152E]">
                        Prompt & Instruksi Gemini AI
                      </h3>
                      <p className="text-xs text-[#5A6A85]">
                        Materi tersedia melalui Gemini
                      </p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-[#5A6A85] leading-relaxed">
                    Materi ini berisi template prompt AI dan instruksi kerja langsung di Google Gemini. Silakan klik tombol di bawah untuk membuka sesi Gemini dan menjalankan prompt tersebut.
                  </p>
                </Card>
              )}

              {/* 4. Action Bar: External Link & Manual Mark Complete */}
              <div className="p-4 sm:p-5 bg-white border border-[#E6E6E1] rounded-2xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
                {/* External link button */}
                <a
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center font-bold transition-colors rounded-xl text-sm sm:text-base px-5 py-3 min-h-[48px] gap-2 bg-[#1F7AFF] text-white hover:bg-[#1664D6] shadow-xs cursor-pointer text-center"
                >
                  <span>{getExternalButtonLabel(material.resourceType)}</span>
                  <ExternalLink size={16} />
                </a>

                {/* Mark Complete Action Button (Manual Fallback / Status) */}
                <button
                  type="button"
                  onClick={handleToggleComplete}
                  className={`inline-flex items-center justify-center font-bold transition-all duration-150 rounded-xl text-sm sm:text-base px-5 py-3 min-h-[48px] gap-2 cursor-pointer text-center ${
                    completed
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                      : 'border-2 border-[#E6E6E1] bg-white text-[#06152E] hover:bg-[#F4F4F0] hover:border-[#D1D1C7]'
                  }`}
                >
                  <CheckCircle2 size={18} className={completed ? 'text-white' : 'text-[#5A6A85]'} />
                  <span>{completed ? '✓ Selesai' : 'Tandai Selesai'}</span>
                </button>
              </div>

              {/* 5. Previous & Next Navigation */}
              {(() => {
                const currentIndex = moduleData.materials.findIndex((m) => m.id === material.id);
                const prevMaterial = currentIndex > 0 ? moduleData.materials[currentIndex - 1] : null;
                const nextMaterial = currentIndex < moduleData.materials.length - 1 ? moduleData.materials[currentIndex + 1] : null;

                return (
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {prevMaterial ? (
                      <Link
                        href={`/jalur-pembelajaran/${moduleData.id}/${prevMaterial.id}`}
                        className="flex-1"
                      >
                        <Button variant="outline" size="md" className="w-full justify-start font-semibold text-xs sm:text-sm">
                          <ArrowLeft size={16} />
                          <span className="truncate">Sebelumnya: {prevMaterial.title}</span>
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/jalur-pembelajaran/${moduleData.id}`} className="flex-1">
                        <Button variant="outline" size="md" className="w-full justify-start text-xs sm:text-sm text-[#5A6A85]">
                          <ArrowLeft size={16} />
                          <span>Kembali ke Modul</span>
                        </Button>
                      </Link>
                    )}

                    {nextMaterial ? (
                      <Link
                        href={`/jalur-pembelajaran/${moduleData.id}/${nextMaterial.id}`}
                        className="flex-1"
                      >
                        <Button variant="secondary" size="md" className="w-full justify-end font-semibold text-xs sm:text-sm">
                          <span className="truncate">Berikutnya: {nextMaterial.title}</span>
                          <ArrowLeft size={16} className="rotate-180" />
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/jalur-pembelajaran/${moduleData.id}`} className="flex-1">
                        <Button variant="secondary" size="md" className="w-full justify-end font-semibold text-xs sm:text-sm">
                          <span>Selesai Modul Ini</span>
                          <Check size={16} />
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })()}
            </div>
          </Container>
        </main>

        {/* App Shell: Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
