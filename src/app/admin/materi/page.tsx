'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useCurriculum } from '@/context/CurriculumContext';
import { ResourceType, Material, Module } from '@/types/curriculum';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Video,
  FileText,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Save,
  ShieldAlert,
} from 'lucide-react';

export default function AdminMateriPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    curriculum,
    modules,
    totalMaterials,
    isLoading: isCurriculumLoading,
    isSaving,
    createModule,
    updateModule,
    deleteModule,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    resetToDefault,
  } = useCurriculum();

  // Authentication check: Admin only
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [isAuthLoading, user, router]);

  // UI state for accordion
  const [openModuleIds, setOpenModuleIds] = useState<Record<string, boolean>>({});

  // Initialize all modules as expanded by default
  useEffect(() => {
    if (modules.length > 0 && Object.keys(openModuleIds).length === 0) {
      const initialMap: Record<string, boolean> = {};
      modules.forEach((m) => {
        initialMap[m.id] = true;
      });
      setOpenModuleIds(initialMap);
    }
  }, [modules, openModuleIds]);

  const toggleModuleAccordion = (modId: string) => {
    setOpenModuleIds((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  // Modals state
  // 1. Module Modal (Create or Edit)
  const [moduleModalState, setModuleModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    moduleId?: string;
    title: string;
  }>({
    isOpen: false,
    mode: 'create',
    title: '',
  });

  // 2. Material Modal (Create or Edit)
  const [materialModalState, setMaterialModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    moduleId: string;
    materialId?: string;
    title: string;
    resourceType: ResourceType;
    url: string;
  }>({
    isOpen: false,
    mode: 'create',
    moduleId: '',
    title: '',
    resourceType: 'youtube',
    url: '',
  });

  // 3. Delete Confirmation Modal
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: 'module' | 'material' | 'reset';
    moduleId?: string;
    materialId?: string;
    itemTitle: string;
  }>({
    isOpen: false,
    type: 'module',
    itemTitle: '',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Statistics
  const totalVideos = useMemo(() => {
    return modules
      .flatMap((m) => m.materials)
      .filter((mat) => mat.resourceType === 'youtube' || mat.resourceType === 'youtube-short')
      .length;
  }, [modules]);

  // Handlers for Module CRUD
  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleModalState.title.trim()) return;

    if (moduleModalState.mode === 'create') {
      const created = await createModule(moduleModalState.title);
      setOpenModuleIds((prev) => ({ ...prev, [created.id]: true }));
      showToast(`Modul "${created.title}" berhasil ditambahkan.`);
    } else if (moduleModalState.moduleId) {
      await updateModule(moduleModalState.moduleId, moduleModalState.title);
      showToast('Nama modul berhasil diperbarui.');
    }

    setModuleModalState({ isOpen: false, mode: 'create', title: '' });
  };

  // Handlers for Material CRUD
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const { mode, moduleId, materialId, title, resourceType, url } = materialModalState;
    if (!title.trim() || !url.trim() || !moduleId) return;

    if (mode === 'create') {
      await createMaterial(moduleId, {
        title: title.trim(),
        resourceType,
        url: url.trim(),
      });
      showToast(`Materi "${title.trim()}" berhasil ditambahkan.`);
    } else if (materialId) {
      await updateMaterial(moduleId, materialId, {
        title: title.trim(),
        resourceType,
        url: url.trim(),
      });
      showToast(`Materi "${title.trim()}" berhasil diperbarui.`);
    }

    setMaterialModalState({
      isOpen: false,
      mode: 'create',
      moduleId: '',
      title: '',
      resourceType: 'youtube',
      url: '',
    });
  };

  // Handler for Delete Confirmation
  const handleConfirmDelete = async () => {
    const { type, moduleId, materialId } = deleteConfirmState;

    if (type === 'module' && moduleId) {
      await deleteModule(moduleId);
      showToast('Modul berhasil dihapus.');
    } else if (type === 'material' && moduleId && materialId) {
      await deleteMaterial(moduleId, materialId);
      showToast('Materi berhasil dihapus.');
    } else if (type === 'reset') {
      await resetToDefault();
      showToast('Seluruh kurikulum berhasil dikembalikan ke format default.');
    }

    setDeleteConfirmState({ isOpen: false, type: 'module', itemTitle: '' });
  };

  if (isAuthLoading || isCurriculumLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] text-[#06152E]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#1F7AFF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#5A6A85]">Memuat data materi kurikulum...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] p-4 text-[#06152E]">
        <Card padding="lg" className="w-full max-w-md bg-white border border-[#E6E6E1] text-center space-y-5 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert size={28} />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-extrabold text-[#06152E]">Akses Terbatas</h1>
            <p className="text-sm text-[#5A6A85]">Halaman ini hanya dapat diakses oleh Admin.</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="w-full min-h-[44px]">Kembali ke Beranda</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#06152E]">
      <div className="flex">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
          <Header />

          <main className="flex-1">
            <Container className="py-6 sm:py-8 space-y-6">
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-2 text-sm text-[#5A6A85]">
                <Link
                  href="/admin"
                  className="hover:text-[#06152E] flex items-center gap-1.5 font-medium transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>Admin Dashboard</span>
                </Link>
                <span>/</span>
                <span className="font-bold text-[#06152E]">Kelola Materi</span>
              </div>

              {/* Toast Feedback */}
              {toastMessage && (
                <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#06152E] text-white px-4 py-3 rounded-xl shadow-lg border border-white/10 animate-in fade-in slide-in-from-top-2">
                  <Check size={18} className="text-emerald-400 stroke-[2.5]" />
                  <span className="text-sm font-semibold">{toastMessage}</span>
                </div>
              )}

              {/* Header Title & Top Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06152E] tracking-tight">
                    Kelola Materi & Kurikulum
                  </h1>
                  <p className="text-sm text-[#5A6A85] mt-1">
                    Tambah modul baru, edit judul materi, atau ubah link video YouTube yang tampil di area belajar member.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() =>
                      setDeleteConfirmState({
                        isOpen: true,
                        type: 'reset',
                        itemTitle: 'Seluruh kurikulum akan dikembalikan ke data awal bawaan.',
                      })
                    }
                    className="font-bold text-xs sm:text-sm min-h-[44px] gap-1.5 cursor-pointer text-[#5A6A85] hover:text-rose-600 hover:border-rose-200"
                  >
                    <RotateCcw size={16} />
                    <span>Reset Default</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={() =>
                      setModuleModalState({
                        isOpen: true,
                        mode: 'create',
                        title: '',
                      })
                    }
                    className="font-bold text-xs sm:text-sm min-h-[44px] gap-2 shadow-xs cursor-pointer"
                  >
                    <Plus size={18} />
                    <span>Tambah Modul</span>
                  </Button>
                </div>
              </div>

              {/* Summary Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card padding="md" className="bg-white border border-[#E6E6E1] shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[#5A6A85]">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Modul</span>
                    <div className="w-8 h-8 rounded-lg bg-[#06152E]/10 text-[#06152E] flex items-center justify-center">
                      <BookOpen size={18} />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-[#06152E]">{modules.length}</div>
                  <p className="text-xs text-[#5A6A85]">Modul pembelajaran yang aktif</p>
                </Card>

                <Card padding="md" className="bg-white border border-[#E6E6E1] shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[#5A6A85]">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Materi</span>
                    <div className="w-8 h-8 rounded-lg bg-[#1F7AFF]/10 text-[#1F7AFF] flex items-center justify-center">
                      <FileText size={18} />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-[#1F7AFF]">{totalMaterials}</div>
                  <p className="text-xs text-[#5A6A85]">Pelajaran video & artikel terdaftar</p>
                </Card>

                <Card padding="md" className="bg-white border border-[#E6E6E1] shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[#5A6A85]">
                    <span className="text-xs font-bold uppercase tracking-wider">Materi Video</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Video size={18} />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-700">{totalVideos}</div>
                  <p className="text-xs text-[#5A6A85]">Konten video YouTube & Shorts</p>
                </Card>
              </div>

              {/* Modules List */}
              <div className="space-y-4">
                {modules.map((mod, modIdx) => {
                  const isOpen = openModuleIds[mod.id] !== false;

                  return (
                    <Card
                      key={mod.id}
                      padding="none"
                      className="bg-white border border-[#E6E6E1] rounded-2xl overflow-hidden shadow-xs transition-all"
                    >
                      {/* Module Header Bar */}
                      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-[#FCFCFA] border-b border-[#E6E6E1]/70">
                        <div
                          onClick={() => toggleModuleAccordion(mod.id)}
                          className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
                        >
                          <button
                            type="button"
                            className="w-8 h-8 rounded-lg bg-white border border-[#E6E6E1] text-[#5A6A85] flex items-center justify-center hover:bg-[#F8F8F6] shrink-0"
                          >
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1F7AFF] bg-[#1F7AFF]/10 px-2 py-0.5 rounded-md">
                                Modul {String(modIdx + 1).padStart(2, '0')}
                              </span>
                              <span className="text-xs text-[#5A6A85] font-medium">
                                • {mod.materials.length} Materi
                              </span>
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-[#06152E] truncate mt-0.5">
                              {mod.title}
                            </h2>
                          </div>
                        </div>

                        {/* Module Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              setMaterialModalState({
                                isOpen: true,
                                mode: 'create',
                                moduleId: mod.id,
                                title: '',
                                resourceType: 'youtube',
                                url: '',
                              })
                            }
                            className="font-bold text-xs h-9 px-3 gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Plus size={14} />
                            <span className="hidden sm:inline">Tambah Materi</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setModuleModalState({
                                isOpen: true,
                                mode: 'edit',
                                moduleId: mod.id,
                                title: mod.title,
                              })
                            }
                            className="h-9 w-9 p-0 text-[#5A6A85] hover:text-[#06152E] hover:border-[#06152E] cursor-pointer"
                            title="Edit Judul Modul"
                          >
                            <Edit2 size={15} />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setDeleteConfirmState({
                                isOpen: true,
                                type: 'module',
                                moduleId: mod.id,
                                itemTitle: `Modul "${mod.title}" beserta seluruh materi di dalamnya`,
                              })
                            }
                            className="h-9 w-9 p-0 text-[#5A6A85] hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 cursor-pointer"
                            title="Hapus Modul"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>

                      {/* Module Materials Table */}
                      {isOpen && (
                        <div className="p-0">
                          {mod.materials.length === 0 ? (
                            <div className="py-8 text-center text-sm text-[#5A6A85]">
                              Belum ada materi di modul ini.{' '}
                              <button
                                onClick={() =>
                                  setMaterialModalState({
                                    isOpen: true,
                                    mode: 'create',
                                    moduleId: mod.id,
                                    title: '',
                                    resourceType: 'youtube',
                                    url: '',
                                  })
                                }
                                className="text-[#1F7AFF] font-bold hover:underline"
                              >
                                Klik untuk menambahkan materi pertama.
                              </button>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-sm">
                                <thead className="bg-[#F8F8F6]/80 border-b border-[#E6E6E1]/70 text-[11px] font-bold text-[#5A6A85] uppercase tracking-wider">
                                  <tr>
                                    <th className="py-2.5 px-4 w-12 text-center">#</th>
                                    <th className="py-2.5 px-4">Judul Materi</th>
                                    <th className="py-2.5 px-4 w-36">Jenis Konten</th>
                                    <th className="py-2.5 px-4">Tautan (URL)</th>
                                    <th className="py-2.5 px-4 text-right w-28">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E6E6E1]/60">
                                  {mod.materials.map((mat, matIdx) => (
                                    <tr
                                      key={mat.id}
                                      className="hover:bg-[#F8F8F6]/50 transition-colors"
                                    >
                                      <td className="py-3 px-4 text-center font-bold text-xs text-[#5A6A85]">
                                        {matIdx + 1}
                                      </td>
                                      <td className="py-3 px-4 font-bold text-[#06152E]">
                                        {mat.title}
                                      </td>
                                      <td className="py-3 px-4">
                                        <span
                                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                            mat.resourceType === 'youtube'
                                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                                              : mat.resourceType === 'youtube-short'
                                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                                              : mat.resourceType === 'gemini'
                                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                                              : 'bg-blue-50 text-blue-700 border-blue-200'
                                          }`}
                                        >
                                          <Video size={12} />
                                          <span>{mat.resourceType.toUpperCase()}</span>
                                        </span>
                                      </td>
                                      <td className="py-3 px-4 font-mono text-xs text-[#5A6A85] max-w-[200px] sm:max-w-xs truncate">
                                        <a
                                          href={mat.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[#1F7AFF] hover:underline inline-flex items-center gap-1"
                                        >
                                          <span className="truncate">{mat.url}</span>
                                          <ExternalLink size={12} className="shrink-0" />
                                        </a>
                                      </td>
                                      <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setMaterialModalState({
                                                isOpen: true,
                                                mode: 'edit',
                                                moduleId: mod.id,
                                                materialId: mat.id,
                                                title: mat.title,
                                                resourceType: mat.resourceType,
                                                url: mat.url,
                                              })
                                            }
                                            className="w-8 h-8 rounded-lg text-[#5A6A85] hover:text-[#1F7AFF] hover:bg-blue-50 flex items-center justify-center transition-colors cursor-pointer"
                                            title="Edit Materi"
                                          >
                                            <Edit2 size={14} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setDeleteConfirmState({
                                                isOpen: true,
                                                type: 'material',
                                                moduleId: mod.id,
                                                materialId: mat.id,
                                                itemTitle: `Materi "${mat.title}"`,
                                              })
                                            }
                                            className="w-8 h-8 rounded-lg text-[#5A6A85] hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                                            title="Hapus Materi"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </Container>
          </main>
        </div>
      </div>

      {/* ================= MODAL: MODUL (TAMBAH / EDIT) ================= */}
      {moduleModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06152E]/60 backdrop-blur-xs p-4 animate-in fade-in">
          <Card padding="lg" className="w-full max-w-md bg-white border border-[#E6E6E1] shadow-xl space-y-5 rounded-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E6E1]">
              <h3 className="text-lg font-extrabold text-[#06152E]">
                {moduleModalState.mode === 'create' ? 'Tambah Modul Baru' : 'Edit Nama Modul'}
              </h3>
              <button
                type="button"
                onClick={() => setModuleModalState({ isOpen: false, mode: 'create', title: '' })}
                className="w-8 h-8 rounded-lg text-[#5A6A85] hover:text-[#06152E] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#06152E] uppercase tracking-wider">
                  Judul Modul
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: STRATEGI FYP TIKTOK 2026"
                  value={moduleModalState.title}
                  onChange={(e) =>
                    setModuleModalState((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-white border border-[#E6E6E1] rounded-xl text-sm font-medium text-[#06152E] focus:outline-none focus:ring-2 focus:ring-[#1F7AFF]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setModuleModalState({ isOpen: false, mode: 'create', title: '' })}
                  className="w-1/2 min-h-[44px]"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSaving}
                  className="w-1/2 min-h-[44px] font-bold"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Simpan Modul'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ================= MODAL: MATERI (TAMBAH / EDIT) ================= */}
      {materialModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06152E]/60 backdrop-blur-xs p-4 animate-in fade-in">
          <Card padding="lg" className="w-full max-w-lg bg-white border border-[#E6E6E1] shadow-xl space-y-5 rounded-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E6E1]">
              <h3 className="text-lg font-extrabold text-[#06152E]">
                {materialModalState.mode === 'create' ? 'Tambah Materi Pembelajaran' : 'Edit Materi'}
              </h3>
              <button
                type="button"
                onClick={() =>
                  setMaterialModalState({
                    isOpen: false,
                    mode: 'create',
                    moduleId: '',
                    title: '',
                    resourceType: 'youtube',
                    url: '',
                  })
                }
                className="w-8 h-8 rounded-lg text-[#5A6A85] hover:text-[#06152E] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#06152E] uppercase tracking-wider">
                  Judul Materi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Cara Riset Produk Laris di TikTok"
                  value={materialModalState.title}
                  onChange={(e) =>
                    setMaterialModalState((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-white border border-[#E6E6E1] rounded-xl text-sm font-medium text-[#06152E] focus:outline-none focus:ring-2 focus:ring-[#1F7AFF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#06152E] uppercase tracking-wider">
                  Jenis Konten
                </label>
                <select
                  value={materialModalState.resourceType}
                  onChange={(e) =>
                    setMaterialModalState((prev) => ({
                      ...prev,
                      resourceType: e.target.value as ResourceType,
                    }))
                  }
                  className="w-full px-4 py-2.5 bg-white border border-[#E6E6E1] rounded-xl text-sm font-semibold text-[#06152E] focus:outline-none focus:ring-2 focus:ring-[#1F7AFF]"
                >
                  <option value="youtube">YouTube Video (Reguler)</option>
                  <option value="youtube-short">YouTube Shorts</option>
                  <option value="gemini">Google Gemini / AI Prompt</option>
                  <option value="google-drive">Google Drive</option>
                  <option value="google-docs">Google Docs</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#06152E] uppercase tracking-wider">
                  Tautan URL Video / Dokumen
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://youtu.be/... atau https://www.youtube.com/watch?v=..."
                  value={materialModalState.url}
                  onChange={(e) =>
                    setMaterialModalState((prev) => ({ ...prev, url: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-white border border-[#E6E6E1] rounded-xl text-sm font-mono text-[#06152E] focus:outline-none focus:ring-2 focus:ring-[#1F7AFF]"
                />
                <p className="text-[11px] text-[#5A6A85]">
                  Mendukung format link YouTube reguler, link pendek (youtu.be), atau Shorts.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() =>
                    setMaterialModalState({
                      isOpen: false,
                      mode: 'create',
                      moduleId: '',
                      title: '',
                      resourceType: 'youtube',
                      url: '',
                    })
                  }
                  className="w-1/2 min-h-[44px]"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSaving}
                  className="w-1/2 min-h-[44px] font-bold"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Simpan Materi'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ================= MODAL: KONFIRMASI HAPUS ================= */}
      {deleteConfirmState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06152E]/60 backdrop-blur-xs p-4 animate-in fade-in">
          <Card padding="lg" className="w-full max-w-md bg-white border border-[#E6E6E1] shadow-xl space-y-4 rounded-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-[#06152E]">Konfirmasi Penghapusan</h3>
              <p className="text-xs sm:text-sm text-[#5A6A85]">
                Apakah Anda yakin ingin menghapus {deleteConfirmState.itemTitle}? Tindakan ini akan langsung berdampak pada halaman member.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setDeleteConfirmState({ isOpen: false, type: 'module', itemTitle: '' })}
                className="w-1/2 min-h-[44px]"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleConfirmDelete}
                className="w-1/2 min-h-[44px] font-bold bg-rose-600 hover:bg-rose-700 text-white border-rose-600"
              >
                Ya, Hapus
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
