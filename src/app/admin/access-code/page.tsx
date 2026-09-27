'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth, AccessCode } from '@/context/AuthContext';
import {
  ShieldAlert,
  KeyRound,
  Plus,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ArrowLeft,
  X,
  Sparkles,
  Loader2,
} from 'lucide-react';

export default function AdminAccessCodePage() {
  const router = useRouter();
  const { user, isLoading, getAllAccessCodes, createAccessCode, refreshAdminData } = useAuth();

  // Modal & Generation State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newlyCreatedCode, setNewlyCreatedCode] = useState<AccessCode | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Protection: redirect to /login if no active session
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  // Load latest Firestore access codes on mount
  useEffect(() => {
    if (user?.role === 'admin') {
      refreshAdminData();
    }
  }, [user, refreshAdminData]);

  // Read access codes
  const [refreshKey, setRefreshKey] = useState(0);
  const accessCodes = useMemo(() => {
    return getAllAccessCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAllAccessCodes, refreshKey]);

  // Statistics
  const totalCodes = accessCodes.length;
  const activeCodes = accessCodes.filter((c) => c.status === 'active').length;
  const totalMemberActivations = accessCodes.reduce(
    (sum, c) => sum + (c.usedCount || (c.usedBy ? 1 : 0)),
    0
  );

  // Handle Create Code via Firestore
  const handleCreateCode = async () => {
    setIsCreating(true);
    try {
      const created = await createAccessCode('Kelas Affiliate AI');
      setNewlyCreatedCode(created);
      setRefreshKey((prev) => prev + 1);
    } catch (e) {
      console.warn('Gagal menerbitkan access code:', e);
    } finally {
      setIsCreating(false);
    }
  };

  // Copy to clipboard helper with fallback
  const handleCopyCode = async (code: string, id?: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      if (id) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2500);
      } else {
        setCopyFeedback('Kode berhasil disalin.');
        setTimeout(() => setCopyFeedback(null), 3000);
      }
    } catch (err) {
      // Fallback message without technical error
      if (id) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2500);
      } else {
        setCopyFeedback('Kode disalin ke clipboard.');
        setTimeout(() => setCopyFeedback(null), 3000);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] text-[#06152E]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#1F7AFF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#5A6A85]">Memuat data access code...</p>
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
      {/* App Shell: Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-24 md:pb-12">
        {/* App Shell: Header */}
        <Header title="Access Code" />

        {/* Page Content */}
        <main className="flex-1 py-8 sm:py-10">
          <Container size="lg">
            <div className="space-y-6 sm:space-y-8">
              {/* Header Title, Subtitle & Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#06152E] tracking-tight">
                    Access Code
                  </h1>
                  <p className="mt-1 text-base sm:text-lg text-[#5A6A85]">
                    Kelola kode akses untuk pendaftaran member.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setNewlyCreatedCode(null);
                    setCopyFeedback(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 font-bold min-h-[44px] shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  <Plus size={18} />
                  <span>Buat Access Code</span>
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card padding="md" className="bg-white border border-[#E6E6E1] shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[#5A6A85]">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Kode</span>
                    <div className="w-8 h-8 rounded-lg bg-[#06152E]/10 text-[#06152E] flex items-center justify-center">
                      <KeyRound size={18} />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-[#06152E]">
                    {totalCodes}
                  </div>
                  <p className="text-xs text-[#5A6A85]">
                    Semua kode yang diterbitkan
                  </p>
                </Card>

                <Card padding="md" className="bg-white border border-[#E6E6E1] shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[#5A6A85]">
                    <span className="text-xs font-bold uppercase tracking-wider">Kode Aktif</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 size={18} />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-700">
                    {activeCodes}
                  </div>
                  <p className="text-xs text-[#5A6A85]">
                    Siap diberikan kepada calon member
                  </p>
                </Card>

                <Card padding="md" className="bg-white border border-[#E6E6E1] shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[#5A6A85]">
                    <span className="text-xs font-bold uppercase tracking-wider">Aktivasi Member</span>
                    <div className="w-8 h-8 rounded-lg bg-[#1F7AFF]/10 text-[#1F7AFF] flex items-center justify-center">
                      <Clock size={18} />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-[#1F7AFF]">
                    {totalMemberActivations}
                  </div>
                  <p className="text-xs text-[#5A6A85]">
                    Total member terdaftar menggunakan kode
                  </p>
                </Card>
              </div>

              {/* Daftar Access Code */}
              {accessCodes.length === 0 ? (
                <Card padding="lg" className="bg-white border border-[#E6E6E1] text-center py-12 space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-[#F8F8F6] text-[#5A6A85] flex items-center justify-center mx-auto">
                    <KeyRound size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-[#06152E]">
                    Belum ada Access Code
                  </h3>
                  <p className="text-sm text-[#5A6A85] max-w-sm mx-auto">
                    Tekan tombol "Buat Access Code" untuk menerbitkan kode aktivasi baru bagi calon member.
                  </p>
                </Card>
              ) : (
                <>
                  {/* Desktop Table View (>= 768px) */}
                  <div className="hidden md:block bg-white border border-[#E6E6E1] rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#F8F8F6] border-b border-[#E6E6E1] text-xs font-bold text-[#5A6A85] uppercase tracking-wider">
                          <tr>
                            <th className="py-3.5 px-5">Access Code</th>
                            <th className="py-3.5 px-4">Kelas</th>
                            <th className="py-3.5 px-4">Status & Tipe</th>
                            <th className="py-3.5 px-4">Dibuat</th>
                            <th className="py-3.5 px-4">Penggunaan Member</th>
                            <th className="py-3.5 px-5 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6E6E1]/70">
                          {accessCodes.map((item) => {
                            const isUsed = item.status === 'used';
                            const isExpired = item.status === 'expired';
                            const isCopied = copiedId === item.id;
                            const memberCount = item.usedCount || (item.usedBy ? 1 : 0);

                            return (
                              <tr
                                key={item.id}
                                className="hover:bg-[#F8F8F6]/60 transition-colors"
                              >
                                {/* Column: Code */}
                                <td className="py-4 px-5">
                                  <span className="font-mono text-base font-extrabold text-[#06152E] tracking-wider">
                                    {item.code}
                                  </span>
                                </td>

                                {/* Column: Kelas */}
                                <td className="py-4 px-4 text-[#5A6A85] font-medium">
                                  {item.className}
                                </td>

                                {/* Column: Status & Tipe */}
                                <td className="py-4 px-4">
                                  {item.status === 'active' && (
                                    <div className="space-y-0.5">
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle2 size={13} className="stroke-[2.5]" />
                                        <span>Aktif (Multi-Use)</span>
                                      </span>
                                      <span className="text-[11px] text-[#5A6A85] block font-medium">Bisa banyak member</span>
                                    </div>
                                  )}
                                  {isUsed && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1F7AFF] border border-blue-200">
                                      <Check size={13} className="stroke-[2.5]" />
                                      <span>Selesai</span>
                                    </span>
                                  )}
                                  {isExpired && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
                                      <Clock size={13} />
                                      <span>Kedaluwarsa</span>
                                    </span>
                                  )}
                                </td>

                                {/* Column: Dibuat */}
                                <td className="py-4 px-4 text-xs text-[#5A6A85]">
                                  {item.createdAt}
                                </td>

                                {/* Column: Penggunaan Member */}
                                <td className="py-4 px-4 text-xs">
                                  <div>
                                    <span className="font-bold text-[#06152E] block text-sm">
                                      {memberCount > 0 ? `${memberCount} Member terdaftar` : 'Belum ada pendaftar'}
                                    </span>
                                    {item.usedByName && (
                                      <span className="text-[#5A6A85] text-xs">
                                        Terakhir: {item.usedByName}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Column: Aksi */}
                                <td className="py-4 px-5 text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopyCode(item.code, item.id)}
                                    className={`font-semibold text-xs h-9 px-3 gap-1.5 cursor-pointer ${
                                      isCopied
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                        : 'hover:border-[#1F7AFF] hover:text-[#1F7AFF]'
                                    }`}
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check size={14} className="stroke-[2.5]" />
                                        <span>Tersalin!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={14} />
                                        <span>Salin</span>
                                      </>
                                    )}
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card / List View (< 768px: 360, 390, 430) */}
                  <div className="md:hidden space-y-3">
                    {accessCodes.map((item) => {
                      const isUsed = item.status === 'used';
                      const isExpired = item.status === 'expired';
                      const isCopied = copiedId === item.id;
                      const memberCount = item.usedCount || (item.usedBy ? 1 : 0);

                      return (
                        <Card
                          key={item.id}
                          padding="md"
                          className="bg-white border border-[#E6E6E1] shadow-xs space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-mono text-lg font-extrabold text-[#06152E] tracking-wider block">
                                {item.code}
                              </span>
                              <span className="text-xs text-[#5A6A85] font-medium block mt-0.5">
                                {item.className}
                              </span>
                            </div>

                            {item.status === 'active' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                <CheckCircle2 size={12} className="stroke-[2.5]" />
                                <span>Multi-Use</span>
                              </span>
                            )}
                            {isUsed && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1F7AFF] border border-blue-200 shrink-0">
                                <Check size={12} className="stroke-[2.5]" />
                                <span>Selesai</span>
                              </span>
                            )}
                            {isExpired && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300 shrink-0">
                                <Clock size={12} />
                                <span>Kedaluwarsa</span>
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E6E6E1]/70 text-xs">
                            <div>
                              <span className="text-[#5A6A85] block">Dibuat</span>
                              <span className="font-medium text-[#06152E]">
                                {item.createdAt}
                              </span>
                            </div>

                            <div>
                              <span className="text-[#5A6A85] block">Penggunaan</span>
                              <span className="font-medium text-[#06152E]">
                                {memberCount > 0 ? `${memberCount} Member` : 'Belum digunakan'}
                              </span>
                            </div>
                          </div>

                          <div className="pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyCode(item.code, item.id)}
                              className={`w-full justify-center font-bold text-xs h-10 gap-1.5 cursor-pointer ${
                                isCopied
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'hover:border-[#1F7AFF] hover:text-[#1F7AFF]'
                              }`}
                            >
                              {isCopied ? (
                                <>
                                  <Check size={14} className="stroke-[2.5]" />
                                  <span>Kode Berhasil Disalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  <span>Salin Kode</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </Container>
        </main>
      </div>

      {/* ================================================================= */}
      {/* MODAL: BUAT ACCESS CODE                                           */}
      {/* ================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06152E]/50 backdrop-blur-xs animate-in fade-in duration-150">
          <Card
            padding="lg"
            className="w-full max-w-md bg-white border border-[#E6E6E1] shadow-xl space-y-5 relative"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E6E1]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1F7AFF]/10 text-[#1F7AFF] flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#06152E] tracking-tight">
                    {newlyCreatedCode ? 'Access Code Berhasil Dibuat' : 'Buat Access Code'}
                  </h2>
                  <p className="text-xs text-[#5A6A85]">
                    {newlyCreatedCode ? 'Bagikan kode ini kepada calon member' : 'Terbitkan kode pendaftaran baru'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setNewlyCreatedCode(null);
                  setCopyFeedback(null);
                }}
                className="w-8 h-8 rounded-lg text-[#5A6A85] hover:text-[#06152E] hover:bg-[#F8F8F6] flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            {!newlyCreatedCode ? (
              /* State 1: Form Input */
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#06152E] uppercase tracking-wider">
                    Kelas
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="Kelas Affiliate AI"
                    className="w-full px-4 py-2.5 bg-[#F8F8F6] border border-[#E6E6E1] rounded-xl text-sm font-semibold text-[#06152E] cursor-not-allowed"
                  />
                  <p className="text-xs text-[#5A6A85]">
                    Kode akses secara otomatis terhubung dengan Kelas Affiliate AI.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#06152E] uppercase tracking-wider">
                    Tipe Penggunaan
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="Multi-Use (Unlimited)"
                    className="w-full px-4 py-2.5 bg-[#F8F8F6] border border-[#E6E6E1] rounded-xl text-sm font-semibold text-emerald-700 cursor-not-allowed"
                  />
                  <p className="text-xs text-[#5A6A85]">
                    Kode dapat digunakan berkali-kali tanpa batas oleh semua calon member baru.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={isCreating}
                    onClick={handleCreateCode}
                    className="w-full justify-center font-bold text-base min-h-[46px] gap-2 shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Menerbitkan Kode...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>Buat Kode</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* State 2: Success Created with Copy */
              <div className="space-y-4 text-center">
                <div className="p-5 rounded-2xl bg-[#F8F8F6] border border-[#E6E6E1] space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5A6A85] block">
                    Access Code Baru
                  </span>
                  <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#1F7AFF] tracking-widest select-all">
                    {newlyCreatedCode.code}
                  </div>
                  <span className="text-xs text-[#5A6A85] block">
                    {newlyCreatedCode.className} • Status: Aktif
                  </span>
                </div>

                {copyFeedback && (
                  <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-emerald-700 bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200">
                    <CheckCircle2 size={16} />
                    <span>{copyFeedback}</span>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => handleCopyCode(newlyCreatedCode.code)}
                    className="w-full justify-center font-bold text-base min-h-[46px] gap-2 shadow-xs cursor-pointer"
                  >
                    <Copy size={18} />
                    <span>Salin Kode</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      setIsModalOpen(false);
                      setNewlyCreatedCode(null);
                      setCopyFeedback(null);
                    }}
                    className="w-full justify-center font-semibold text-sm min-h-[40px] text-[#5A6A85] hover:text-[#06152E] cursor-pointer"
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
