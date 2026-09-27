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
import { useCurriculum } from '@/context/CurriculumContext';
import { ResourceType, Material } from '@/types/curriculum';
import { 
  Search, 
  X, 
  RotateCcw, 
  PlayCircle, 
  FileText, 
  HardDrive, 
  Sparkles, 
  BookOpen, 
  Layers,
  ChevronRight,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { useProgress } from '@/context/ProgressContext';
import { useAuth } from '@/context/AuthContext';

interface FlattenedMaterial extends Material {
  moduleId: string;
  moduleTitle: string;
  moduleOrder: number;
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

export default function PustakaMateriPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { modules } = useCurriculum();
  const { isCompleted, isLoaded } = useProgress();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('all');
  const [selectedResourceType, setSelectedResourceType] = useState('all');

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

  // Flatten all materials from all modules
  const allMaterials = useMemo<FlattenedMaterial[]>(() => {
    return modules.flatMap((mod) =>
      mod.materials.map((mat) => ({
        ...mat,
        moduleId: mod.id,
        moduleTitle: mod.title,
        moduleOrder: mod.order,
      }))
    );
  }, [modules]);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return allMaterials.filter((item) => {
      // 1. Filter by Module
      if (selectedModuleId !== 'all' && item.moduleId !== selectedModuleId) {
        return false;
      }

      // 2. Filter by Resource Type
      if (selectedResourceType !== 'all' && item.resourceType !== selectedResourceType) {
        return false;
      }

      // 3. Search by title or module name (case-insensitive)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesModule = item.moduleTitle.toLowerCase().includes(query);
        if (!matchesTitle && !matchesModule) {
          return false;
        }
      }

      return true;
    });
  }, [allMaterials, selectedModuleId, selectedResourceType, searchQuery]);

  const isFilteringActive =
    searchQuery.trim() !== '' ||
    selectedModuleId !== 'all' ||
    selectedResourceType !== 'all';

  const handleResetFilter = () => {
    setSearchQuery('');
    setSelectedModuleId('all');
    setSelectedResourceType('all');
  };

  if (isAuthLoading || !user || user.role === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] text-[#06152E]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#1F7AFF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#5A6A85]">Memuat pustaka materi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8F8F6] text-[#06152E]">
      {/* App Shell: Desktop Sidebar */}
      <Sidebar />

      {/* App Shell: Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-10">
        {/* App Shell: Header */}
        <Header title="Pustaka Materi" />

        {/* Page Content */}
        <main className="flex-1 py-8 sm:py-10">
          <Container size="lg">
            {/* 1. Header Halaman */}
            <div className="mb-8">
              <span className="text-[11px] font-bold tracking-widest text-[#1F7AFF] uppercase block mb-1">
                PUSTAKA MATERI
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#06152E]">
                Pustaka Materi
              </h1>
              <p className="text-sm sm:text-base text-[#5A6A85] mt-1.5 max-w-2xl leading-relaxed">
                Temukan dan buka seluruh materi pembelajaran Kelas Affiliate AI.
              </p>
            </div>

            {/* 2. Search & Filter Controls */}
            <div className="mb-8 p-4 sm:p-5 bg-white border border-[#E6E6E1] rounded-xl shadow-xs space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Search Input with visible label */}
                <div className="md:col-span-6 space-y-1.5">
                  <label htmlFor="pustaka-search" className="block text-xs font-bold text-[#06152E] uppercase tracking-wider">
                    Cari Materi
                  </label>
                  <div className="relative">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6A85] pointer-events-none" />
                    <input
                      id="pustaka-search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari materi..."
                      className="w-full h-11 pl-10 pr-9 bg-[#F8F8F6] border border-[#E6E6E1] rounded-lg text-sm text-[#06152E] placeholder:text-[#5A6A85] focus:outline-none focus:ring-2 focus:ring-[#1F7AFF]/20 focus:border-[#1F7AFF] transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6A85] hover:text-[#06152E] p-1 rounded transition-colors cursor-pointer"
                        aria-label="Hapus kata kunci pencarian"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Modul Dropdown with visible label */}
                <div className="md:col-span-3 space-y-1.5">
                  <label htmlFor="pustaka-module" className="block text-xs font-bold text-[#06152E] uppercase tracking-wider">
                    Modul
                  </label>
                  <select
                    id="pustaka-module"
                    value={selectedModuleId}
                    onChange={(e) => setSelectedModuleId(e.target.value)}
                    className="w-full h-11 px-3 bg-[#F8F8F6] border border-[#E6E6E1] rounded-lg text-sm text-[#06152E] focus:outline-none focus:ring-2 focus:ring-[#1F7AFF]/20 focus:border-[#1F7AFF] transition-colors cursor-pointer"
                  >
                    <option value="all">Semua Modul</option>
                    {modules.map((mod) => (
                      <option key={mod.id} value={mod.id}>
                        Modul {String(mod.order).padStart(2, '0')}: {mod.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Jenis Materi Dropdown with visible label */}
                <div className="md:col-span-3 space-y-1.5">
                  <label htmlFor="pustaka-resource" className="block text-xs font-bold text-[#06152E] uppercase tracking-wider">
                    Jenis Materi
                  </label>
                  <select
                    id="pustaka-resource"
                    value={selectedResourceType}
                    onChange={(e) => setSelectedResourceType(e.target.value)}
                    className="w-full h-11 px-3 bg-[#F8F8F6] border border-[#E6E6E1] rounded-lg text-sm text-[#06152E] focus:outline-none focus:ring-2 focus:ring-[#1F7AFF]/20 focus:border-[#1F7AFF] transition-colors cursor-pointer"
                  >
                    <option value="all">Semua Jenis</option>
                    <option value="youtube">YouTube</option>
                    <option value="youtube-short">YouTube Shorts</option>
                    <option value="google-drive">Google Drive</option>
                    <option value="google-docs">Google Docs</option>
                    <option value="gemini">Gemini</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Result Counter & Reset Button */}
              <div className="flex flex-wrap items-center justify-between border-t border-[#E6E6E1]/70 pt-3 text-xs sm:text-sm text-[#5A6A85] gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#06152E]">
                    {isFilteringActive
                      ? `${filteredMaterials.length} materi ditemukan`
                      : `Total ${allMaterials.length} materi pembelajaran`}
                  </span>
                  {isFilteringActive && (
                    <span className="bg-[#1F7AFF]/10 text-[#1F7AFF] px-2 py-0.5 rounded text-xs font-semibold">
                      Filter aktif
                    </span>
                  )}
                </div>

                {isFilteringActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilter}
                    className="text-xs sm:text-sm text-[#5A6A85] hover:text-[#06152E]"
                  >
                    <RotateCcw size={14} />
                    <span>Reset Filter</span>
                  </Button>
                )}
              </div>
            </div>

            {/* 3. Material List or Empty State */}
            {filteredMaterials.length === 0 ? (
              /* Empty State */
              <Card padding="lg" className="text-center py-16 max-w-xl mx-auto space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#EAEAE5] flex items-center justify-center mx-auto text-[#5A6A85]">
                  <BookOpen size={26} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#06152E]">
                    Materi tidak ditemukan.
                  </h2>
                  <p className="text-sm sm:text-base text-[#5A6A85] mt-1.5 leading-relaxed">
                    Coba ubah kata kunci atau filter modul yang digunakan.
                  </p>
                </div>
                <div className="pt-2">
                  <Button variant="primary" size="md" onClick={handleResetFilter} className="font-semibold">
                    <RotateCcw size={16} />
                    <span>Reset Filter</span>
                  </Button>
                </div>
              </Card>
            ) : (
              /* Materials Grid / List */
              <div className="space-y-3">
                {filteredMaterials.map((material) => {
                  const materialOrderFormatted = String(material.order).padStart(2, '0');
                  const moduleOrderFormatted = String(material.moduleOrder).padStart(2, '0');
                  const resourceBadge = getResourceBadge(material.resourceType);
                  const isDone = isLoaded && isCompleted(material.id);

                  return (
                    <Link
                      key={`${material.moduleId}-${material.id}`}
                      href={`/jalur-pembelajaran/${material.moduleId}/${material.id}`}
                      className="block group"
                    >
                      <Card
                        padding="md"
                        className="transition-all duration-150 hover:border-[#1F7AFF]/40 hover:shadow-xs cursor-pointer"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 py-1">
                          {/* Left: Number, Title, and Module Name */}
                          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                            <span className="text-xs font-mono font-bold text-[#5A6A85] bg-[#F8F8F6] w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-[#E6E6E1]/60">
                              {materialOrderFormatted}
                            </span>

                            <div className="min-w-0 flex-1 space-y-1">
                              <h3 className="text-sm sm:text-base font-bold text-[#06152E] group-hover:text-[#1F7AFF] transition-colors leading-snug">
                                {material.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-[#5A6A85] flex items-center gap-1.5">
                                <Layers size={13} className="text-[#5A6A85] shrink-0" />
                                <span>Modul {moduleOrderFormatted}: {material.moduleTitle}</span>
                              </p>
                            </div>
                          </div>

                          {/* Right: Resource Type, Status & Action Button */}
                          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E6E6E1]/50">
                            <Badge variant="outline" size="sm" className="gap-1.5 bg-[#F8F8F6]">
                              {resourceBadge.icon}
                              <span>{resourceBadge.label}</span>
                            </Badge>

                            {isDone ? (
                              <Badge variant="subtle" size="sm" className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={12} className="mr-1 inline-block" />
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
            )}
          </Container>
        </main>

        {/* App Shell: Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
