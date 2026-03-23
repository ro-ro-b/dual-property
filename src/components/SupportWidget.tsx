'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { DualInline } from '@/app/(main)/DualLogo';

export default function SupportWidget() {
  const { authState } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject || 'Support Request', message }),
      });
      if (res.ok) {
        setSent(true);
        setMessage('');
        setSubject('');
        setTimeout(() => { setSent(false); setOpen(false); }, 2000);
      }
    } catch {} finally {
      setSending(false);
    }
  };

  if (authState !== 'authenticated') return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-[#c9a84c] to-[#a68832] rounded-full shadow-lg shadow-[#c9a84c]/30 flex items-center justify-center hover:scale-110 transition-transform"
      >
        <span className="material-symbols-outlined text-[#0a0e1a] text-2xl">
          {open ? 'close' : 'support_agent'}
        </span>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-[#111827] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-[#c9a84c]/20 to-[#a68832]/20 border-b border-white/[0.06]">
            <h3 className="text-white font-semibold"><DualInline className="text-current" /> Support</h3>
            <p className="text-white/50 text-xs mt-1">How can we help?</p>
          </div>

          {sent ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-[#10b981] text-4xl mb-2 block">check_circle</span>
              <p className="text-white font-semibold">Message sent!</p>
              <p className="text-white/50 text-sm mt-1">We&apos;ll get back to you shortly.</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full bg-white/[0.05] border border-white/[0.1] text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[#c9a84c]"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue..."
                rows={4}
                className="w-full bg-white/[0.05] border border-white/[0.1] text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[#c9a84c] resize-none"
              />
              <button
                onClick={handleSend}
                disabled={sending || !message.trim()}
                className="w-full py-2 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg text-sm disabled:opacity-50 hover:shadow-lg transition-all"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
