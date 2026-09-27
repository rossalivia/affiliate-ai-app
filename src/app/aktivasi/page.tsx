'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  User,
  Phone,
  ShieldCheck,
  Check,
  Loader2,
} from 'lucide-react';

export default function AktivasiMemberPage() {
  const { registerMember, validateAccessCode } = useAuth();

  // Step flow: 'code' -> 'form' -> 'success'
  const [step, setStep] = useState<'code' | 'form' | 'success'>('code');

  // Step 1: Access code state
  const [accessCode, setAccessCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifiedCode, setVerifiedCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);

  // Step 2: Member registration form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form field errors
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // 1. Handle Code Validation via centralized AuthContext
  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidatingCode(true);
    setCodeError(null);

    try {
      const result = await validateAccessCode(accessCode);

      if (result.valid && result.codeRecord) {
        setVerifiedCode(result.codeRecord.code);
        setCodeError(null);
        setStep('form');
      } else {
        setCodeError(
          result.error ||
            'Kode akses tidak valid. Silakan periksa kembali atau hubungi Admin.'
        );
      }
    } catch {
      setCodeError('Gagal memvalidasi kode akses. Silakan coba lagi.');
    } finally {
      setIsValidatingCode(false);
    }
  };

  // 2. Handle Form Submission
  const handleRegisterAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    // Validate Nama Lengkap
    if (!name.trim()) {
      newErrors.name = 'Nama lengkap wajib diisi.';
    }

    // Validate Email
    if (!email.trim()) {
      newErrors.email = 'Email wajib diisi.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Masukkan alamat email yang valid.';
      }
    }

    // Validate WhatsApp
    if (!phone.trim()) {
      newErrors.phone = 'Nomor WhatsApp wajib diisi.';
    } else {
      const numericPhone = phone.replace(/[^0-9]/g, '');
      if (numericPhone.length < 9) {
        newErrors.phone = 'Nomor WhatsApp tidak valid.';
      }
    }

    // Validate Password
    if (!password) {
      newErrors.password = 'Password wajib diisi.';
    } else if (password.length < 8) {
      newErrors.password = 'Password minimal 8 karakter.';
    }

    // Validate Konfirmasi Password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password wajib diisi.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password tidak sesuai.';
    }

    setErrors(newErrors);

    // If no errors, register member via Firebase Auth and consume access code
    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      setSubmitError(null);
      const res = await registerMember({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        accessCodeUsed: verifiedCode,
      });

      // Securely clear passwords from state immediately
      setPassword('');
      setConfirmPassword('');
      setIsSubmitting(false);

      if (res.success) {
        setStep('success');
      } else {
        setSubmitError(res.error || 'Terjadi kesalahan saat pendaftaran.');
      }
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

      {/* Main Flow Container */}
      <div className="w-full max-w-[480px] mx-auto my-auto">
        {/* ========================================================= */}
        {/* STEP 1: INPUT KODE AKSES                                  */}
        {/* ========================================================= */}
        {step === 'code' && (
          <Card padding="lg" className="bg-white border border-[#E6E6E1] shadow-xs space-y-6">
            <div className="space-y-2 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-[#1F7AFF]/10 text-[#1F7AFF] flex items-center justify-center mx-auto sm:mx-0">
                <KeyRound size={24} />
              </div>
              <h1 className="text-2xl font-extrabold text-[#06152E] tracking-tight pt-1">
                Aktivasi Member
              </h1>
              <p className="text-sm sm:text-base text-[#5A6A85] leading-relaxed">
                Sudah mendapatkan kode akses dari Admin? Masukkan kode akses untuk mengaktifkan akun Kelas Affiliate AI Anda.
              </p>
            </div>

            <form onSubmit={handleValidateCode} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label
                  htmlFor="accessCodeInput"
                  className="block text-sm font-bold text-[#06152E]"
                >
                  Kode Akses
                </label>
                <div className="relative">
                  <input
                    id="accessCodeInput"
                    type="text"
                    value={accessCode}
                    onChange={(e) => {
                      setAccessCode(e.target.value);
                      if (codeError) setCodeError(null);
                    }}
                    placeholder="Contoh: RAYA-XXXX-2026"
                    className={`w-full px-4 py-3 rounded-xl border text-base tracking-wide font-mono transition-colors focus:outline-hidden ${
                      codeError
                        ? 'border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-[#E6E6E1] bg-white focus:border-[#1F7AFF] focus:ring-2 focus:ring-[#1F7AFF]/20'
                    }`}
                    aria-invalid={!!codeError}
                    aria-describedby={codeError ? 'codeErrorMsg' : undefined}
                    autoFocus
                  />
                </div>

                {codeError && (
                  <div id="codeErrorMsg" className="flex items-start gap-2 pt-1 text-sm text-red-600">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{codeError}</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isValidatingCode}
                className="w-full justify-center min-h-[48px] font-bold text-base gap-2 shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isValidatingCode ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Memeriksa Kode...</span>
                  </>
                ) : (
                  <>
                    <span>Lanjutkan</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </form>

            <div className="pt-2 border-t border-[#E6E6E1]/70 text-center">
              <p className="text-xs sm:text-sm text-[#5A6A85]">
                Belum memiliki kode akses? <span className="font-semibold text-[#06152E]">Hubungi Admin kelas.</span>
              </p>
            </div>
          </Card>
        )}

        {/* ========================================================= */}
        {/* STEP 2: FORM BUAT AKUN                                    */}
        {/* ========================================================= */}
        {step === 'form' && (
          <Card padding="lg" className="bg-white border border-[#E6E6E1] shadow-xs space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setStep('code');
                    setErrors({});
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A6A85] hover:text-[#06152E] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Ganti Kode</span>
                </button>

                <Badge
                  variant="subtle"
                  size="sm"
                  className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold gap-1 text-xs"
                >
                  <Check size={12} className="stroke-[3]" />
                  <span>Kode Diterima</span>
                </Badge>
              </div>

              <h1 className="text-2xl font-extrabold text-[#06152E] tracking-tight">
                Buat Akun Member
              </h1>
              <p className="text-sm text-[#5A6A85]">
                Kode akses berhasil diterima. Lengkapi data di bawah untuk mengaktifkan akun Anda.
              </p>
            </div>

            <form onSubmit={handleRegisterAccount} className="space-y-4" noValidate>
              {submitError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">Pendaftaran Gagal</p>
                    <p className="text-xs sm:text-sm text-red-600">{submitError}</p>
                  </div>
                </div>
              )}
              {/* Field: Nama Lengkap */}
              <div className="space-y-1.5">
                <label
                  htmlFor="fullNameInput"
                  className="block text-sm font-bold text-[#06152E]"
                >
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="fullNameInput"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Contoh: Budi Santoso"
                    className={`w-full px-4 py-3 rounded-xl border text-base transition-colors focus:outline-hidden ${
                      errors.name
                        ? 'border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-[#E6E6E1] bg-white focus:border-[#1F7AFF] focus:ring-2 focus:ring-[#1F7AFF]/20'
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1.5 pt-0.5">
                    <AlertCircle size={14} />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Field: Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="emailInput"
                  className="block text-sm font-bold text-[#06152E]"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="emailInput"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="nama@email.com"
                    className={`w-full px-4 py-3 rounded-xl border text-base transition-colors focus:outline-hidden ${
                      errors.email
                        ? 'border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-[#E6E6E1] bg-white focus:border-[#1F7AFF] focus:ring-2 focus:ring-[#1F7AFF]/20'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1.5 pt-0.5">
                    <AlertCircle size={14} />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Field: Nomor WhatsApp */}
              <div className="space-y-1.5">
                <label
                  htmlFor="phoneInput"
                  className="block text-sm font-bold text-[#06152E]"
                >
                  Nomor WhatsApp <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="phoneInput"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    placeholder="08xxxxxxxxxx"
                    className={`w-full px-4 py-3 rounded-xl border text-base transition-colors focus:outline-hidden ${
                      errors.phone
                        ? 'border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-[#E6E6E1] bg-white focus:border-[#1F7AFF] focus:ring-2 focus:ring-[#1F7AFF]/20'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1.5 pt-0.5">
                    <AlertCircle size={14} />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>

              {/* Field: Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="passwordInput"
                  className="block text-sm font-bold text-[#06152E]"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="passwordInput"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="Minimal 8 karakter"
                    className={`w-full px-4 py-3 pr-11 rounded-xl border text-base transition-colors focus:outline-hidden ${
                      errors.password
                        ? 'border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-[#E6E6E1] bg-white focus:border-[#1F7AFF] focus:ring-2 focus:ring-[#1F7AFF]/20'
                    }`}
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
                {errors.password && (
                  <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1.5 pt-0.5">
                    <AlertCircle size={14} />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Field: Konfirmasi Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPasswordInput"
                  className="block text-sm font-bold text-[#06152E]"
                >
                  Konfirmasi Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPasswordInput"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    placeholder="Ulangi password"
                    className={`w-full px-4 py-3 pr-11 rounded-xl border text-base transition-colors focus:outline-hidden ${
                      errors.confirmPassword
                        ? 'border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-[#E6E6E1] bg-white focus:border-[#1F7AFF] focus:ring-2 focus:ring-[#1F7AFF]/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6A85] hover:text-[#06152E] p-1.5 rounded-lg transition-colors cursor-pointer"
                    aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1.5 pt-0.5">
                    <AlertCircle size={14} />
                    <span>{errors.confirmPassword}</span>
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full justify-center min-h-[48px] font-bold text-base gap-2 shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Mendaftarkan Akun...</span>
                    </>
                  ) : (
                    <>
                      <span>Buat Akun</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ========================================================= */}
        {/* STEP 3: SUCCESS STATE                                     */}
        {/* ========================================================= */}
        {step === 'success' && (
          <Card padding="lg" className="bg-white border border-[#E6E6E1] shadow-xs text-center space-y-6">
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-4 border-emerald-100/60 shadow-xs">
                <CheckCircle2 size={36} />
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06152E] tracking-tight">
                ✓ Akun Berhasil Dibuat
              </h1>

              <div className="space-y-1">
                <p className="text-base font-bold text-[#06152E]">
                  Selamat datang di Kelas Affiliate AI.
                </p>
                <p className="text-sm text-[#5A6A85] max-w-sm mx-auto">
                  Akun Member Anda berhasil disiapkan. Akses materi dan jalur pembelajaran sudah dapat Anda mulai.
                </p>
              </div>
            </div>

            {/* Account Summary Preview */}
            <div className="bg-[#F8F8F6] border border-[#E6E6E1] rounded-xl p-4 text-left space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6E6E1]/70">
                <span className="text-xs font-semibold text-[#5A6A85] uppercase tracking-wider">
                  Status Membership
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check size={12} className="stroke-[3]" />
                  <span>Member Aktif</span>
                </span>
              </div>

              <div className="space-y-1 text-sm">
                <p className="text-[#5A6A85]">
                  Nama: <strong className="text-[#06152E] font-bold">{name}</strong>
                </p>
                <p className="text-[#5A6A85]">
                  Email: <strong className="text-[#06152E] font-bold">{email}</strong>
                </p>
                <p className="text-[#5A6A85]">
                  Kelas: <strong className="text-[#06152E] font-bold">Kelas Affiliate AI — Raya Digital</strong>
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <Link href="/login" className="block">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-center min-h-[48px] font-bold text-base gap-2 shadow-xs cursor-pointer"
                >
                  <span>Masuk ke Kelas</span>
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>

      {/* Footer Note */}
      <div className="w-full max-w-[480px] mx-auto text-center mt-6">
        <p className="text-xs text-[#5A6A85]">
          © 2026 Raya Digital · Kelas Affiliate AI
        </p>
      </div>
    </div>
  );
}
