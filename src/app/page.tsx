'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'DRIVER') {
        router.push('/driver');
      } else if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-white font-bold text-lg">Memuat Sistem Dishub Bus...</h2>
        <p className="text-slate-400 text-sm mt-1">Mengalihkan ke halaman sesuai peran pengguna</p>
      </div>
    </div>
  );
}
