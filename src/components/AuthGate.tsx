'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface AuthGateProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallbackMessage?: string;
}

export default function AuthGate({ children, requireAuth = false, fallbackMessage }: AuthGateProps) {
  const { user, loading, authState, sendOtp, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If auth is not required, just render children
  if (!requireAuth) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (authState === 'authenticated' && user) {
    return <>{children}</>;
  }

  const handleSendOtp = async () => {
    if (!email) return;
    setSubmitting(true);
    setError('');
    const result = await sendOtp(email);
    if (!result.success) setError(result.error || 'Failed');
    setSubmitting(false);
  };

  const handleLogin = async () => {
    if (!otp) return;
    setSubmitting(true);
    setError('');
    const result = await login(email, otp);
    if (!result.success) setError(result.error || 'Failed');
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#c9a84c] to-[#a68832] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[#0a0e1a] text-3xl">lock</span>
            </div>
            <h2 className="text-2xl font-serif italic font-bold text-white mb-2">Authentication Required</h2>
            <p className="text-sm text-white/60">
              {fallbackMessage || 'Sign in with your DUAL account to access this page.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {authState === 'unauthenticated' || authState === 'checking' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  placeholder="your@email.com"
                  className="w-full bg-white/[0.05] border border-white/[0.1] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#c9a84c] transition-colors"
                />
              </div>
              <button
                onClick={handleSendOtp}
                disabled={!email || submitting}
                className="w-full py-3 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg hover:shadow-lg hover:shadow-[#c9a84c]/20 transition-all disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send Verification Code'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-white/60 text-center">
                Code sent to <span className="text-[#c9a84c] font-medium">{email}</span>
              </p>
              <div>
                <label className="block text-sm text-white/70 mb-2">Verification Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full bg-white/[0.05] border border-white/[0.1] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#c9a84c] transition-colors text-center text-2xl tracking-[0.5em] font-mono"
                />
              </div>
              <button
                onClick={handleLogin}
                disabled={!otp || submitting}
                className="w-full py-3 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg hover:shadow-lg hover:shadow-[#c9a84c]/20 transition-all disabled:opacity-50"
              >
                {submitting ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button
                onClick={() => {
                  setOtp('');
                  setError('');
                }}
                className="w-full text-white/50 text-sm hover:text-[#c9a84c] transition-colors"
              >
                Resend code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
