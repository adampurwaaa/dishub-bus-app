'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { 
  LayoutDashboard, 
  Database, 
  FileCheck, 
  LogOut, 
  Bus, 
  ShieldCheck, 
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold">Memverifikasi Hak Akses Administrator Dishub...</p>
        </div>
      </div>
    );
  }

  const navLinks = [
    {
      label: 'Dashboard Overview',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Rekonsiliasi & Verifikasi',
      href: '/admin/reconcile',
      icon: FileCheck,
    },
    {
      label: 'Master Data (Supir & Bus)',
      href: '/admin/master-data',
      icon: Database,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-white shrink-0">
        {/* Brand */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-blue-400">
              Kemenhub RI / Dishub
            </div>
            <div className="text-sm font-extrabold text-white">Portal Pengawasan</div>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-4 bg-slate-800/80 rounded-2xl border border-slate-700/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{user.full_name}</div>
              <div className="text-[10px] text-slate-400 font-mono">NIP: {user.nip_or_id}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1.5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer with Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-red-600/80 text-slate-300 hover:text-white transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun Admin</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <Bus className="w-6 h-6 text-blue-400" />
          <span className="font-extrabold text-sm">Dishub Admin Portal</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-800 text-slate-300"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-2 z-30">
          <div className="text-xs text-slate-400 mb-2">
            Login sebagai: <strong className="text-white">{user.full_name}</strong> ({user.nip_or_id})
          </div>
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="w-full mt-2 flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-bold bg-red-900/40 text-red-300 hover:bg-red-800"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      )}

      {/* Main Admin Content Body */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
