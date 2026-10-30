'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Bus, ShieldCheck, UserCheck, Delete, ArrowRight, Lock, KeyRound, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginDriver, loginAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'DRIVER' | 'ADMIN'>('DRIVER');

  // Driver form states
  const [driverId, setDriverId] = useState('D-101');
  const [driverPin, setDriverPin] = useState('');
  const [driverError, setDriverError] = useState('');

  // Admin form states
  const [adminNip, setAdminNip] = useState('ADMIN01');
  const [adminPass, setAdminPass] = useState('admin123');
  const [adminError, setAdminError] = useState('');

  // Keypad click handler for Driver
  const handleKeypadPress = (digit: string) => {
    setDriverError('');
    if (driverPin.length < 6) {
      setDriverPin((prev) => prev + digit);
    }
  };

  const handleKeypadDelete = () => {
    setDriverError('');
    setDriverPin((prev) => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setDriverError('');
    setDriverPin('');
  };

  const handleDriverSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDriverError('');

    if (!driverId.trim()) {
      setDriverError('ID Supir harus diisi.');
      return;
    }
    if (driverPin.length < 4) {
      setDriverError('PIN harus minimal 4 - 6 angka.');
      return;
    }

    const res = loginDriver(driverId, driverPin);
    if (res.success) {
      router.push('/driver');
    } else {
      setDriverError(res.error || 'Autentikasi supir gagal.');
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    if (!adminNip.trim()) {
      setAdminError('NIP Admin harus diisi.');
      return;
    }
    if (!adminPass) {
      setAdminError('Password Admin harus diisi.');
      return;
    }

    const res = loginAdmin(adminNip, adminPass);
    if (res.success) {
      router.push('/admin/dashboard');
    } else {
      setAdminError(res.error || 'NIP atau Password salah.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between text-white selection:bg-emerald-500 selection:text-white">
      {/* Top Banner Government Branding */}
      <div className="w-full bg-slate-950/80 border-b border-slate-800 backdrop-blur-md px-4 py-3 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-900/50">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Kementerian Perhubungan RI
              </div>
              <h1 className="text-sm md:text-base font-extrabold text-white leading-tight">
                Dinas Perhubungan - Sistem Rekap Setoran Bus
              </h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mr-1.5" />
            Portal Resmi Operasional
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col justify-center">
        {/* Role Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-800/90 rounded-2xl border border-slate-700/80 mb-6 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('DRIVER')}
            className={`py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${
              activeTab === 'DRIVER'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-700/30 ring-1 ring-blue-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Portal Supir Bus
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ADMIN')}
            className={`py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${
              activeTab === 'ADMIN'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/30 ring-1 ring-emerald-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            Admin Dishub
          </button>
        </div>

        {/* Tab 1: DRIVER LOGIN (Touch-friendly & Oversized Numeric Keypad) */}
        {activeTab === 'DRIVER' && (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 md:p-6 shadow-2xl backdrop-blur-xl">
            <div className="text-center mb-5">
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
                Akses Pengemudi / Supir
              </span>
              <h2 className="text-xl font-black text-white">Masuk Shift Operasional</h2>
              <p className="text-xs text-slate-400 mt-1">
                Masukkan ID Supir dan 4-6 digit PIN pengemudi
              </p>
            </div>

            {driverError && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{driverError}</span>
              </div>
            )}

            {/* Quick Demo Fill Buttons */}
            <div className="mb-4 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Pilih Akun Demo Supir:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDriverId('D-101');
                    setDriverPin('123456');
                    setDriverError('');
                  }}
                  className="flex-1 text-xs bg-slate-800 hover:bg-blue-600/30 text-blue-300 py-1.5 px-2 rounded-lg border border-blue-500/30 font-medium transition"
                >
                  D-101 (Supriyadi)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDriverId('D-102');
                    setDriverPin('234567');
                    setDriverError('');
                  }}
                  className="flex-1 text-xs bg-slate-800 hover:bg-blue-600/30 text-blue-300 py-1.5 px-2 rounded-lg border border-blue-500/30 font-medium transition"
                >
                  D-102 (Ahmad)
                </button>
              </div>
            </div>

            {/* ID Supir Field */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ID Supir Resmi
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value.toUpperCase())}
                  placeholder="Contoh: D-101"
                  className="w-full bg-slate-900/90 border border-slate-600/80 rounded-xl px-4 py-3 text-white text-base font-bold tracking-wider placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* PIN Display Field */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  PIN Keamanan (4-6 Angka)
                </label>
                <span className="text-xs text-blue-400 font-mono">
                  {driverPin.length}/6 Digit
                </span>
              </div>
              <div className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 flex items-center justify-center min-h-[56px] space-x-3">
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const hasValue = idx < driverPin.length;
                  return (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                        hasValue
                          ? 'bg-blue-400 scale-125 shadow-md shadow-blue-500/50 ring-2 ring-blue-300'
                          : 'bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Touch-Friendly Oversized Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="h-14 rounded-2xl bg-slate-700/80 hover:bg-slate-600 active:bg-blue-600 text-2xl font-black text-white shadow-md active:scale-95 transition-all flex items-center justify-center border border-slate-600/50"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleKeypadClear}
                className="h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-red-900/50 text-xs font-bold text-slate-400 hover:text-white uppercase transition-all flex items-center justify-center border border-slate-700/70"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-14 rounded-2xl bg-slate-700/80 hover:bg-slate-600 active:bg-blue-600 text-2xl font-black text-white shadow-md active:scale-95 transition-all flex items-center justify-center border border-slate-600/50"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadDelete}
                className="h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 active:scale-95 transition-all flex items-center justify-center border border-slate-700/70"
              >
                <Delete className="w-6 h-6" />
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => handleDriverSubmit()}
              disabled={driverPin.length < 4}
              className={`w-full min-h-[52px] rounded-2xl font-black text-base flex items-center justify-center transition-all shadow-xl ${
                driverPin.length >= 4
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-700/40 cursor-pointer active:scale-[0.98]'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <span>Masuk Aplikasi Supir</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        )}

        {/* Tab 2: ADMIN DISHUB LOGIN */}
        {activeTab === 'ADMIN' && (
          <form
            onSubmit={handleAdminSubmit}
            className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 md:p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                Akses Pengelola Dishub
              </span>
              <h2 className="text-xl font-black text-white">Portal Admin Pengawasan</h2>
              <p className="text-xs text-slate-400 mt-1">
                Rekonsiliasi pendapatan harian, audit armada & verifikasi setoran
              </p>
            </div>

            {adminError && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                NIP Pegawai Dishub
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={adminNip}
                  onChange={(e) => setAdminNip(e.target.value)}
                  placeholder="ADMIN01"
                  required
                  className="w-full bg-slate-900/90 border border-slate-600/80 rounded-xl pl-10 pr-4 py-3 text-white text-sm font-semibold placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password Administrator
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-900/90 border border-slate-600/80 rounded-xl pl-10 pr-4 py-3 text-white text-sm font-semibold placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[50px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-700/30 flex items-center justify-center transition-all active:scale-[0.98]"
            >
              <span>Masuk Dashboard Admin</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>

            <div className="mt-4 pt-4 border-t border-slate-700/60 text-center">
              <span className="text-xs text-slate-400">
                Kredensial Default:{' '}
                <code className="text-emerald-400 font-mono bg-slate-900 px-2 py-0.5 rounded">
                  ADMIN01 / admin123
                </code>
              </span>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-xs text-slate-500 border-t border-slate-800/80">
        Hak Cipta © 2026 Dinas Perhubungan & Transportasi Publik. Terintegrasi Supabase PostgreSQL.
      </footer>
    </div>
  );
}
