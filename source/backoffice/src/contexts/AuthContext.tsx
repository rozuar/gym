'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      api.setToken(token);
      api.getMe()
        .then((data) => {
          if (data.role !== 'admin') {
            throw new Error('Not admin');
          }
          setUser(data);
        })
        .catch(() => {
          localStorage.removeItem('adminToken');
          router.push('/login');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [router]);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    if (response.user.role !== 'admin') {
      throw new Error('Acceso denegado. Solo administradores.');
    }
    localStorage.setItem('adminToken', response.access_token);
    if (response.refresh_token) {
      localStorage.setItem('refreshToken', response.refresh_token);
    }
    api.setToken(response.access_token);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('refreshToken');
    api.setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
