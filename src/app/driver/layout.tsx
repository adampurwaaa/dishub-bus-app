'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Bus, LogOut, User as UserIcon, Calendar, Activity, ChevronRight } from 'lucide-react';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'DRIVER')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold">Memverifikasi Sesi Supir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between max-w-md mx-auto shadow-2xl border-x border-slate-200">
      {/* Mobile Top App Bar */}
      <header className="bg-blue-900 text-white px-4 py-3.5 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-700/80 border border-blue-500 flex items-center justify-center font-bold text-white shadow">
              <Bus className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                Dishub Driver App
              </div>
              <div className="text-sm font-extrabold leading-none truncate max-w-[190px]">
                {user.full_name}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="text-right">
              <span className="text-[11px] font-mono bg-blue-800/80 px-2 py-0.5 rounded text-blue-200 border border-blue-700">
                {user.nip_or_id}
              </span>
            </div>
            <button
              onClick={logout}
              title="Keluar"
              className="p-2 rounded-xl bg-blue-800/60 hover:bg-red-600/80 text-blue-200 hover:text-white transition active:scale-95"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="flex-1 p-4 pb-20">{children}</main>

      {/* Bottom Sticky Mobile Navigation */}
      <nav className="fixed bottom-0 max-w-md w-full bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around z-30 shadow-lg">
        <button
          onClick={() => router.push('/driver')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            pathname === '/driver'
              ? 'text-blue-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[11px] mt-1 font-medium">Status Shift</span>
        </button>

        <button
          onClick={() => router.push('/driver/trip')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            pathname.startsWith('/driver/trip')
              ? 'text-blue-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bus className="w-5 h-5" />
          <span className="text-[11px] mt-1 font-medium">Input Rit</span>
        </button>

        <button
          onClick={() => router.push('/driver/shift/end')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            pathname.startsWith('/driver/shift/end')
              ? 'text-blue-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[11px] mt-1 font-medium">Setoran</span>
        </button>
      </nav>
    </div>
  );
}
