'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function NotificationBell() {
  const { authState } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authState !== 'authenticated') return;

    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => {
        const msgs = Array.isArray(data.messages) ? data.messages :
                     Array.isArray(data.messages?.data) ? data.messages.data : [];
        setNotifications(msgs.slice(0, 20));
        setUnreadCount(msgs.filter((n: Notification) => !n.read).length);
      })
      .catch(() => {});
  }, [authState]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto bg-[#111827] border border-white/[0.1] rounded-xl shadow-2xl z-50">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
          </div>
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <span className="material-symbols-outlined text-2xl text-white/20 mb-2 block">notifications_none</span>
              <p className="text-white/50 text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {notifications.map((n) => (
                <div key={n.id} className={`p-4 hover:bg-white/[0.03] transition-colors ${!n.read ? 'border-l-2 border-[#c9a84c]' : ''}`}>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#c9a84c] text-lg mt-0.5">
                      {n.type === 'mint' ? 'token' : n.type === 'transfer' ? 'swap_horiz' : 'info'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{n.title || n.type}</p>
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
