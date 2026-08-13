'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserPublic } from '@nextround/shared';
import { apiClient } from '@/lib/apiClient';

interface AuthContextType {
  user: UserPublic | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string; user?: UserPublic }>;
  register: (email: string, pass: string, role: 'hr' | 'candidate', orgName?: string) => Promise<{ success: boolean; error?: string; user?: UserPublic }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchCurrentUser(): Promise<UserPublic | null> {
  try {
    const { user } = await apiClient.get<{ user: UserPublic }>('/auth/me');
    return user ?? null;
  } catch {
    // token invalid or API unreachable — caller clears auth state
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    fetchCurrentUser().then((currentUser) => {
      if (!mounted) return;
      setUser(currentUser);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await apiClient.post<{ user: UserPublic }>('/auth/login', {
        email,
        password,
      });

      if (data?.user) {
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, error: 'Login failed' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Login failed' };
    }
  };

  const register = async (
    email: string,
    password: string,
    role: 'hr' | 'candidate',
    orgName?: string
  ) => {
    try {
      const data = await apiClient.post<{ user: UserPublic }>('/auth/register', {
        email,
        password,
        role,
        orgName,
      });

      if (data?.user) {
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
    setUser(null);
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/login';
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
