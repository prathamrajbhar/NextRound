'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserPublic } from '@nextround/shared';
import { api } from '@/lib/api';

interface AuthContextType {
  user: UserPublic | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string; user?: UserPublic }>;
  register: (email: string, pass: string, role: 'hr' | 'candidate', orgName?: string) => Promise<{ success: boolean; error?: string; user?: UserPublic }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await api.get<{ user: UserPublic }>('/auth/me');
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      try {
        const res = await api.get<{ user: UserPublic }>('/auth/me');
        if (mounted) {
          if (res.success && res.data?.user) {
            setUser(res.data.user);
          } else {
            setUser(null);
          }
        }
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ user: UserPublic; accessToken?: string }>('/auth/login', {
      email,
      password,
    });

    if (res.success && res.data?.user) {
      setUser(res.data.user);
      if (res.data.accessToken && typeof window !== 'undefined') {
        localStorage.setItem('token', res.data.accessToken);
      }
      return { success: true, user: res.data.user };
    }

    const errorMsg = typeof res.error === 'string' ? res.error : res.error?.message || 'Login failed';
    return { success: false, error: errorMsg };
  };

  const register = async (
    email: string,
    password: string,
    role: 'hr' | 'candidate',
    orgName?: string
  ) => {
    const res = await api.post<{ user: UserPublic; accessToken?: string }>('/auth/register', {
      email,
      password,
      role,
      orgName,
    });

    if (res.success && res.data?.user) {
      setUser(res.data.user);
      if (res.data.accessToken && typeof window !== 'undefined') {
        localStorage.setItem('token', res.data.accessToken);
      }
      return { success: true, user: res.data.user };
    }

    const errorMsg = typeof res.error === 'string' ? res.error : res.error?.message || 'Registration failed';
    return { success: false, error: errorMsg };
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
