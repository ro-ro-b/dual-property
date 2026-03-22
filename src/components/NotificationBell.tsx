'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';

interface Notification {
  id: string;
  type: string;
  title?: string;
  body?: string;
  content?: string;
  read?: boolean;
  createdAt?: string;
  timestamp?: string;
}

const POLL_INTERVAL = 30000; // 30 seconds

export default function NotificationBell() {
  const { authState } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (authState !== 'authenticated') return;
    try {
      const r = await fetch('/api/notifications');
      const data = await r.json();
      const msgs = Array.isArray(data.messages) ? data.messages :
                   Array.isArray(data.messages?.data) ? data.messages.data : [];
      setNotifications(msgs.slice(0, 20));
      setUnreadCount(msgs.filter((n: Notification) => !n.read && !readIds.has(n.id)).length);
    } catch {}
  }, [authState, readIds]);

  // Initial fetch + polling
  useEffect(() => {
    if (authState !== 'authenticated') return;
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [authState, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markRead = async (id: string) => {
    setReadIds(prev => { const next = new Set(Array.from(prev)); next.add(id); return next; });
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
    } catch {}
  };

  const markAllRead = async () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(prev => { const next = new Set(Array.from(prev)); allIds.forEach(id => next.add(id)); return next; });
    setUnreadCount(0);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch {}
  };

  const isRead = (n: Notification) => n.read || readIds.has(n.id);

  if (authState !== 'authenticated') return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 hover:bg-white/[0.08] rounded-lg transition-colors"
      >
        <span className="material-symbols-outlined text-white/70 hover:text-white text-xl">
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto bg-[#111827] border border-white/[0.1] rounded-xl shadow-2xl z-50">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#c9a84c] hover:text-[#e0c060] transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <span className="material-symbols-outlined text-2xl text-white/20 mb-2 block">notifications_none</span>
              <p className="text-white/50 text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !isRead(n) && markRead(n.id)}
                  className={`p-4 hover:bg-white/[0.03] transition-colors cursor-pointer ${!isRead(n) ? 'border-l-2 border-[#c9a84c] bg-[#c9a84c]/[0.03]' : 'opacity-70'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#c9a84c] text-lg mt-0.5">
                      {n.type === 'mint' ? 'token' : n.type === 'transfer' ? 'swap_horiz' : n.type === 'payment' ? 'payments' : 'info'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-white font-medium truncate">{n.title || n.type}</p>
                        {!isRead(n) && <span className="w-2 h-2 rounded-full bg-[#c9a84c] flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{n.body || n.content || ''}</p>
                      <p className="text-xs text-white/30 mt-1">
                        {n.createdAt || n.timestamp ? new Date(n.createdAt || n.timestamp || '').toLocaleString() : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
