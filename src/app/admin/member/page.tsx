'use client';

import React, { useEffect, useMemo } from 'react';
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
import {
  ShieldAlert,
  Users,
  Check,
  Clock,
  ArrowRight,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';

export default function AdminMemberListPage() {
  const router = useRouter();
  const { user, isLoading, getAllMembers, refreshAdminData } = useAuth();

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

  const members = useMemo(() => {
    return getAllMembers();
  }, [getAllMembers]);

  const totalMaterials = useMemo(() => {
    return curriculum.modules.flatMap((m) => m.materials).length || 51;
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] text-[#06152E]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#1F7AFF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#5A6A85]">Memuat data member...</p>
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
        <Header title="Member" />

        {/* Page Content */}
        <main className="flex-1 py-8 sm:py-10">
          <Container size="lg">
            <div className="space-y-6 sm:space-y-8">
              {/* Header Title & Subtitle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#06152E] tracking-tight">
                    Member
                  </h1>
                  <p className="mt-1 text-base text-[#5A6A85]">
                    Daftar member yang terdaftar di Kelas Affiliate AI.
                  </p>
                </div>

                <Badge variant="subtle" size="md" className="font-bold self-start sm:self-auto bg-white border border-[#E6E6E1]">
                  {members.length} Member Terdaftar
                </Badge>
              </div>

              {/* Empty State */}
              {members.length === 0 ? (
                <Card padding="lg" className="bg-white border border-[#E6E6E1] text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F8F8F6] text-[#5A6A85] flex items-center justify-center mx-auto">
                    <Users size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-[#06152E]">
                    Belum ada member
                  </h3>
                  <p className="text-sm text-[#5A6A85] max-w-sm mx-auto">
                    Member yang melakukan aktivasi dan registrasi akan muncul di sini.
                  </p>
                </Card>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block bg-white border border-[#E6E6E1] rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#F8F8F6] border-b border-[#E6E6E1] text-xs font-bold text-[#5A6A85] uppercase tracking-wider">
                          <tr>
                            <th className="py-3.5 px-5">Nama</th>
                            <th className="py-3.5 px-4">Email</th>
                            <th className="py-3.5 px-4">Nomor WhatsApp</th>
                            <th className="py-3.5 px-4">Kelas</th>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-4">Progres</th>
                            <th className="py-3.5 px-4">Bergabung</th>
                            <th className="py-3.5 px-5 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6E6E1]/70">
                          {members.map((member) => {
                            const completed = member.completedMaterialsCount || 0;
                            const percent = Math.round((completed / totalMaterials) * 100);
                            const isActive =
                              member.membershipStatus === 'Member Aktif' ||
                              member.membershipStatus === 'active';
                            const initials = getInitials(member.name);

                            return (
                              <tr
                                key={member.id}
                                className="hover:bg-[#F8F8F6]/60 transition-colors"
                              >
                                {/* Column: Nama */}
                                <td className="py-4 px-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#06152E] text-white flex items-center justify-center font-bold text-xs shrink-0 select-none">
                                      {initials}
                                    </div>
                                    <span className="font-bold text-[#06152E] text-base">
                                      {member.name}
                                    </span>
                                  </div>
                                </td>

                                {/* Column: Email */}
                                <td className="py-4 px-4 font-mono text-xs text-[#5A6A85]">
                                  {member.email}
                                </td>

                                {/* Column: WhatsApp */}
                                <td className="py-4 px-4 font-mono text-xs text-[#06152E]">
                                  {member.phone || '-'}
                                </td>

                                {/* Column: Kelas */}
                                <td className="py-4 px-4 text-xs font-medium text-[#5A6A85]">
                                  {member.className || 'Kelas Affiliate AI'}
                                </td>

                                {/* Column: Status */}
                                <td className="py-4 px-4">
                                  {isActive ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <Check size={12} className="stroke-[3]" />
                                      <span>Member Aktif</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      <Clock size={12} />
                                      <span>Belum Aktif</span>
                                    </span>
                                  )}
                                </td>

                                {/* Column: Progres */}
                                <td className="py-4 px-4 min-w-[140px]">
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-[#5A6A85]">{completed}/{totalMaterials} materi</span>
                                      <span className="font-bold text-[#1F7AFF]">{percent}%</span>
                                    </div>
                                    <ProgressBar value={percent} />
                                  </div>
                                </td>

                                {/* Column: Bergabung */}
                                <td className="py-4 px-4 text-xs text-[#5A6A85] whitespace-nowrap">
                                  {member.joinedAt || '-'}
                                </td>

                                {/* Column: Aksi */}
                                <td className="py-4 px-5 text-right">
                                  <Link href={`/admin/member/${member.id}`}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="font-bold text-xs gap-1.5 hover:border-[#1F7AFF] hover:text-[#1F7AFF]"
                                    >
                                      <span>Lihat Detail</span>
                                      <ArrowRight size={13} />
                                    </Button>
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile & Tablet Card List View */}
                  <div className="lg:hidden space-y-4">
                    {members.map((member) => {
                      const completed = member.completedMaterialsCount || 0;
                      const percent = Math.round((completed / totalMaterials) * 100);
                      const isActive =
                        member.membershipStatus === 'Member Aktif' ||
                        member.membershipStatus === 'active';
                      const initials = getInitials(member.name);

                      return (
                        <Card
                          key={member.id}
                          padding="md"
                          className="bg-white border border-[#E6E6E1] shadow-xs space-y-4"
                        >
                          {/* Top Row: Avatar, Name & Status */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-[#06152E] text-white flex items-center justify-center font-bold text-sm shrink-0 select-none">
                                {initials}
                              </div>
                              <div>
                                <h3 className="font-bold text-base text-[#06152E]">
                                  {member.name}
                                </h3>
                                <p className="text-xs text-[#1F7AFF] font-medium mt-0.5">
                                  {member.className || 'Kelas Affiliate AI'}
                                </p>
                                <p className="text-xs text-[#5A6A85] flex items-center gap-1 mt-0.5">
                                  <Calendar size={13} />
                                  <span>Bergabung: {member.joinedAt || '-'}</span>
                                </p>
                              </div>
                            </div>

                            <div>
                              {isActive ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check size={12} className="stroke-[3]" />
                                  <span>Aktif</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock size={12} />
                                  <span>Belum Aktif</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Contact Info */}
                          <div className="bg-[#F8F8F6] rounded-xl p-3 text-xs space-y-1.5 font-mono">
                            <div className="flex items-center gap-2 text-[#5A6A85]">
                              <Mail size={13} className="shrink-0" />
                              <span className="truncate">{member.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#06152E]">
                              <Phone size={13} className="shrink-0" />
                              <span>{member.phone || '-'}</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#5A6A85] font-medium">Progres Belajar</span>
                              <span className="font-bold text-[#1F7AFF]">
                                {completed}/{totalMaterials} materi ({percent}%)
                              </span>
                            </div>
                            <ProgressBar value={percent} />
                          </div>

                          {/* Action Button */}
                          <div className="pt-1">
                            <Link href={`/admin/member/${member.id}`} className="block">
                              <Button
                                variant="outline"
                                size="md"
                                className="w-full justify-center min-h-[44px] font-bold text-sm gap-2"
                              >
                                <span>Lihat Detail Member</span>
                                <ArrowRight size={16} />
                              </Button>
                            </Link>
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
    </div>
  );
}
