'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { dataStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginDriver: (idSupir: string, pin: string) => { success: boolean; error?: string };
  loginAdmin: (nip: string, pin: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginDriver: () => ({ success: false }),
  loginAdmin: () => ({ success: false }),
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load persisted user session on mount
    const current = dataStore.getCurrentUser();
    setUser(current);
    setLoading(false);
  }, []);

  const loginDriver = (idSupir: string, pin: string) => {
    const res = dataStore.loginDriver(idSupir, pin);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const loginAdmin = (nip: string, pin: string) => {
    const res = dataStore.loginAdmin(nip, pin);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const logout = () => {
    dataStore.logout();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginDriver, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
