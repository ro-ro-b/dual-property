'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  name?: string;
  title?: string;
  type?: string;
  data?: any;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        const items = Array.isArray(data.results) ? data.results :
                      Array.isArray(data.results?.data) ? data.results.data :
                      Array.isArray(data.results?.objects) ? data.results.objects : [];
        setResults(items.slice(0, 8));
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelect = (id: string) => {
    setOpen(false);
    setQuery('');
    router.push(`/property/${id}`);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1.5 focus-within:border-[#c9a84c]/50 transition-colors">
        <span className="material-symbols-outlined text-white/40 text-lg">search</span>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search properties..."
          className="bg-transparent text-white text-sm placeholder-white/40 focus:outline-none w-40 lg:w-56"
        />
        {searching && (
          <div className="w-4 h-4 border border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute right-0 top-11 w-80 max-h-80 overflow-y-auto bg-[#111827] border border-white/[0.1] rounded-xl shadow-2xl z-50">
          <div className="p-3 border-b border-white/[0.06]">
            <p className="text-xs text-white/50">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelect(r.id)}
                className="w-full p-3 hover:bg-white/[0.05] transition-colors text-left flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-[#c9a84c] text-lg">domain</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{r.name || r.title || r.id}</p>
                  {r.type && <p className="text-xs text-white/40">{r.type}</p>}
                </div>
                <span className="material-symbols-outlined text-white/30 text-sm">chevron_right</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {open && query && results.length === 0 && !searching && (
        <div className="absolute right-0 top-11 w-80 bg-[#111827] border border-white/[0.1] rounded-xl shadow-2xl z-50 p-6 text-center">
          <span className="material-symbols-outlined text-2xl text-white/20 mb-2 block">search_off</span>
          <p className="text-white/50 text-sm">No properties found for &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
