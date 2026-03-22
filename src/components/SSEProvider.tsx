'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

interface SSEEvent {
  id: string;
  event: string;
  data: any;
  timestamp: string;
}

interface SSEContextType {
  connected: boolean;
  events: SSEEvent[];
  latestEvent: SSEEvent | null;
}

const SSEContext = createContext<SSEContextType>({ connected: false, events: [], latestEvent: null });

export function useSSE() {
  return useContext(SSEContext);
}

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<SSEEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const es = new EventSource('/api/sse');
      eventSourceRef.current = es;

      es.addEventListener('connected', (e) => {
        setConnected(true);
      });

      es.addEventListener('action', (e) => {
        try {
          const data = JSON.parse(e.data);
          const evt: SSEEvent = {
            id: data.id || Date.now().toString(),
            event: 'action',
            data,
            timestamp: new Date().toISOString(),
          };
          setLatestEvent(evt);
          setEvents((prev) => [evt, ...prev].slice(0, 50));
        } catch {}
      });

      es.addEventListener('mint', (e) => {
        try {
          const data = JSON.parse(e.data);
          const evt: SSEEvent = {
            id: data.id || Date.now().toString(),
            event: 'mint',
            data,
            timestamp: new Date().toISOString(),
          };
          setLatestEvent(evt);
          setEvents((prev) => [evt, ...prev].slice(0, 50));
        } catch {}
      });

      es.addEventListener('transfer', (e) => {
        try {
          const data = JSON.parse(e.data);
          const evt: SSEEvent = {
            id: data.id || Date.now().toString(),
            event: 'transfer',
            data,
            timestamp: new Date().toISOString(),
          };
          setLatestEvent(evt);
          setEvents((prev) => [evt, ...prev].slice(0, 50));
        } catch {}
      });

      es.onerror = () => {
        setConnected(false);
        es.close();
        eventSourceRef.current = null;
        // Reconnect after 5s
        reconnectTimerRef.current = setTimeout(connect, 5000);
      };
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [connect]);

  return (
    <SSEContext.Provider value={{ connected, events, latestEvent }}>
      {children}
    </SSEContext.Provider>
  );
}
