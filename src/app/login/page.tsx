'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import {
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to appropriate destination
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
    }
  }, [isLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg('Email dan password wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(cleanEmail, password);

      if (result.success) {
        setPassword('');
        if (result.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/');
        }
      } else {
        setPassword('');
        setErrorMsg(result.error || 'Email atau password tidak sesuai.');
        setIsSubmitting(false);
      }
    } catch {
      setPassword('');
      setErrorMsg('Terjadi kesalahan saat memproses login.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#06152E] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="w-full max-w-[480px] mx-auto text-center mb-6">
        <span className="text-xs font-extrabold tracking-widest text-[#1F7AFF] uppercase block">
          RAYA DIGITAL
        </span>
        <h2 className="text-lg font-bold text-[#06152E] tracking-tight mt-0.5">
          Kelas Affiliate AI
        </h2>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-[480px] mx-auto my-auto">
        <Card padding="lg" className="bg-white border border-[#E6E6E1] shadow-xs space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-[#1F7AFF]/10 text-[#1F7AFF] flex items-center justify-center mx-auto sm:mx-0">
              <LogIn size={24} />
            </div>
            <h1 className="text-2xl font-extrabold text-[#06152E] tracking-tight pt-1">
              Masuk ke Kelas
            </h1>
            <p className="text-sm sm:text-base text-[#5A6A85] leading-relaxed">
              Masuk menggunakan akun member yang sudah Anda daftarkan.
            </p>
          </div>

          {/* Form Login */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Global Error Banner */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* Field: Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="loginEmailInput"
                className="block text-sm font-bold text-[#06152E]"
              >
                Email
              </label>
              <div className="relative">
                <input
                  id="loginEmailInput"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="nama@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-[#E6E6E1] bg-white text-base transition-colors focus:outline-none focus:border-[#1F7AFF] focus:ring-2 focus:ring-[#1F7AFF]/20"
                  autoFocus
                />
              </div>
            </div>

            {/* Field: Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="loginPasswordInput"
                className="block text-sm font-bold text-[#06152E]"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="loginPasswordInput"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Masukkan password Anda"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-[#E6E6E1] bg-white text-base transition-colors focus:outline-none focus:border-[#1F7AFF] focus:ring-2 focus:ring-[#1F7AFF]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6A85] hover:text-[#06152E] p-1.5 rounded-lg transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                className="w-full justify-center min-h-[48px] font-bold text-base gap-2 shadow-xs cursor-pointer"
              >
                <span>Masuk</span>
                <ArrowRight size={18} />
              </Button>
            </div>
          </form>

          {/* Helper Links */}
          <div className="pt-2 border-t border-[#E6E6E1]/70 space-y-2 text-center">
            <p className="text-sm text-[#5A6A85]">
              Belum punya akun?{' '}
              <Link
                href="/aktivasi"
                className="font-bold text-[#1F7AFF] hover:underline"
              >
                Aktivasi Member
              </Link>
            </p>
            <p className="text-xs text-[#5A6A85]">
              Belum memiliki kode akses?{' '}
              <span className="font-semibold text-[#06152E]">Hubungi Admin kelas.</span>
            </p>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="w-full max-w-[480px] mx-auto text-center mt-6">
        <p className="text-xs text-[#5A6A85]">
          © 2026 Raya Digital · Kelas Affiliate AI
        </p>
      </div>
    </div>
  );
}
