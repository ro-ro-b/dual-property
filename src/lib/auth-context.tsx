'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthUser {
  email: string;
  authenticated: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  authState: 'checking' | 'unauthenticated' | 'otp_sent' | 'authenticated';
  sendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthContextType['authState']>('checking');
  const [pendingEmail, setPendingEmail] = useState('');

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      if (data.authenticated) {
        setUser({ email: data.email || pendingEmail || '', authenticated: true });
        setAuthState('authenticated');
      } else {
        setUser(null);
        setAuthState('unauthenticated');
      }
    } catch {
      setUser(null);
      setAuthState('unauthenticated');
    } finally {
      setLoading(false);
    }
  }, [pendingEmail]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const sendOtp = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setPendingEmail(email);
        setAuthState('otp_sent');
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to send OTP' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const login = async (email: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser({ email, authenticated: true });
        setAuthState('authenticated');
        return { success: true };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    setUser(null);
    setAuthState('unauthenticated');
    setPendingEmail('');
  };

  return (
    <AuthContext.Provider value={{ user, loading, authState, sendOtp, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
