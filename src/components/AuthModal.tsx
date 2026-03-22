'use client';

import { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

export default function AuthModal({ isOpen, onClose, onAuthenticated }: AuthModalProps) {
  const [step, setStep] = useState<'email' | 'otp' | 'loading'>('email');
  const [email, setEmail] = useState('icbuswell@gmail.com');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    setError(null);
    setStep('loading');
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStep('otp');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send OTP');
        setStep('email');
      }
    } catch {
      setError('Network error');
      setStep('email');
    }
  };

  const handleLogin = async () => {
    setError(null);
    setStep('loading');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      if (res.ok) {
        setOtp('');
        setStep('email');
        onAuthenticated();
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid OTP');
        setStep('otp');
      }
    } catch {
      setError('Network error');
      setStep('otp');
    }
  };

  const handleClose = () => {
    setStep('email');
    setOtp('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-gold-dim/20 rounded-2xl max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-serif italic text-white">Authentication Required</h3>
          <button onClick={handleClose} className="p-1 -mr-1 text-white/30 hover:text-white">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <p className="text-sm text-white/40 mb-5">
          A one-time passcode is required to authorise on-chain actions.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center py-8">
            <div className="w-12 h-12 rounded-full border-2 border-gold-dim/30 border-t-gold-dim animate-spin mb-4" />
            <p className="text-white/40 text-sm">Please wait...</p>
          </div>
        )}

        {step === 'email' && (
          <>
            <div className="mb-4">
              <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-gold-dim/30"
              />
            </div>
            <button
              onClick={handleSendOtp}
              disabled={!email}
              className="w-full py-3 bg-gradient-to-r from-gold-dim to-[#b8860b] text-white font-bold rounded-lg active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
            >
              Send OTP
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="text-xs text-white/30 mb-3">
              Enter the code sent to <span className="text-gold-dim">{email}</span>
            </p>
            <div className="mb-4">
              <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-1.5">One-Time Passcode</label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="Enter code..."
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm font-mono text-white tracking-widest placeholder:text-white/15 focus:outline-none focus:border-gold-dim/30 text-center text-lg"
                onKeyDown={e => { if (e.key === 'Enter' && otp) handleLogin(); }}
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={!otp}
              className="w-full py-3 bg-gradient-to-r from-gold-dim to-[#b8860b] text-white font-bold rounded-lg active:scale-[0.98] transition-all disabled:opacity-50 text-sm mb-3"
            >
              Verify & Continue
            </button>
            <button
              onClick={() => { setStep('email'); setOtp(''); setError(null); }}
              className="w-full py-2 text-white/30 text-xs hover:text-white/50 transition"
            >
              Resend code
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Utility: check auth status, returns true if authenticated
export async function checkAuth(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/status');
    const data = await res.json();
    return data.authenticated === true;
  } catch {
    return false;
  }
}
