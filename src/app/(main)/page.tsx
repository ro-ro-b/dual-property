'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { useSSE } from '@/components/SSEProvider';

interface Property {
  id: string;
  name: string;
  location: string;
  type: 'Residential' | 'Commercial' | 'Mixed-Use' | 'Hospitality';
  totalValue: number;
  tokenPrice: number;
  yieldPercent: number;
  fundedPercent: number;
  sqft: number;
  imageGradient: string;
  isLive: boolean;
  blockchainTxHash?: string;
  explorerUrl?: string;
  createdAt?: string;
}

const GRADIENTS = [
  'from-[#c9a84c]/40 via-[#a68832]/30 to-[#0a0e1a]',
  'from-amber-900/60 via-orange-800/40 to-[#0a0e1a]',
  'from-blue-900/60 via-cyan-800/40 to-[#0a0e1a]',
  'from-emerald-900/60 via-green-800/40 to-[#0a0e1a]',
  'from-purple-900/60 via-indigo-800/40 to-[#0a0e1a]',
  'from-pink-900/60 via-rose-800/40 to-[#0a0e1a]',
];

export default function PropertiesPage() {
  const [selectedType, setSelectedType] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [publicStats, setPublicStats] = useState<any>(null);
  const { connected, latestEvent } = useSSE();

  const fetchProperties = () => {
    fetch('/api/properties')
      .then((r) => r.json())
      .then((data) => {
        const props = data.properties || [];
        const mapped: Property[] = props.map((p: any, idx: number) => {
          const propType =
            p.propertyData?.propertyType === 'mixed-use'
              ? 'Mixed-Use'
              : p.propertyData?.propertyType
                ? p.propertyData.propertyType.charAt(0).toUpperCase() + p.propertyData.propertyType.slice(1)
                : 'Residential';
          return {
            id: p.id,
            name: p.propertyData?.name || 'Property Token',
            location: p.propertyData?.city ? `${p.propertyData.city}, ${p.propertyData.country}` : 'DUAL Network',
            type: propType as any,
            totalValue: p.propertyData?.totalValue || 0,
            tokenPrice: p.propertyData?.tokenPrice || 0,
            yieldPercent: p.propertyData?.annualYield || 0,
            fundedPercent: p.propertyData?.totalTokens
              ? Math.round((p.propertyData.tokensSold / p.propertyData.totalTokens) * 100)
              : 0,
            sqft: p.propertyData?.totalSqft || 0,
            imageGradient: GRADIENTS[idx % GRADIENTS.length],
            isLive: true,
            blockchainTxHash: p.blockchainTxHash,
            explorerUrl: p.blockchainTxHash
              ? `https://32f.blockv.io/token/0x41Cf00E593c5623B00F812bC70Ee1A737C5aFF06`
              : undefined,
            createdAt: p.createdAt,
          };
        });
        setProperties(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProperties();
    // Fetch public network stats via IndexerModule
    fetch('/api/public/stats')
      .then(r => r.json())
      .then(data => { if (data.stats) setPublicStats(data.stats); })
      .catch(() => {});
  }, []);

  // Refresh when new mint events arrive via SSE
  useEffect(() => {
    if (latestEvent?.event === 'mint') {
      fetchProperties();
    }
  }, [latestEvent]);

  const filteredProperties = useMemo(() => {
    let filtered = properties;
    if (selectedType !== 'All') {
      filtered = filtered.filter((p) => p.type === selectedType);
    }
    if (sortBy === 'yield') {
      filtered = [...filtered].sort((a, b) => b.yieldPercent - a.yieldPercent);
    } else if (sortBy === 'funded') {
      filtered = [...filtered].sort((a, b) => b.fundedPercent - a.fundedPercent);
    } else if (sortBy === 'value') {
      filtered = [...filtered].sort((a, b) => b.totalValue - a.totalValue);
    }
    return filtered;
  }, [selectedType, sortBy, properties]);

  const totalPortfolioValue = properties.reduce((sum, p) => sum + p.totalValue, 0);
  const averageYield = properties.length > 0 ? properties.reduce((sum, p) => sum + p.yieldPercent, 0) / properties.length : 0;

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .shimmer { background: linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(201,168,76,0.06) 50%, rgba(255,255,255,0.02) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
      `}</style>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-12 pb-20">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(201, 168, 76, 0.1) 0%, transparent 60%)` }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-serif italic font-bold text-white mb-6">
            Institutional Real Estate.
            <br />
            <span className="bg-gradient-to-r from-[#c9a84c] to-[#a68832] bg-clip-text text-transparent">
              Fractional Access.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
            Tokenized property investment on the DUAL Network. Access premium real estate with institutional-grade returns.
          </p>
        </div>
      </div>

      {/* Live Chain Banner */}
      {properties.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex items-center gap-4 p-4 rounded-xl border border-[#c9a84c]/30 bg-[#c9a84c]/5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#c9a84c] animate-pulse" />
              <span className="text-[#c9a84c] font-bold text-lg">{properties.length}</span>
            </div>
            <span className="text-white/70">
              propert{properties.length !== 1 ? 'ies' : 'y'} tokenized on{' '}
              <span className="text-[#c9a84c] font-semibold">DUAL Network</span>
            </span>
            {connected && (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Live
              </span>
            )}
            <a
              href="https://32f.blockv.io/token/0x41Cf00E593c5623B00F812bC70Ee1A737C5aFF06"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-sm text-[#c9a84c] hover:text-white transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              View on Explorer
            </a>
          </div>
        </div>
      )}

      {/* Stats Banner */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Portfolio Value', value: totalPortfolioValue > 0 ? `$${(totalPortfolioValue / 1000000).toFixed(1)}M` : '$0', icon: 'trending_up' },
            { label: 'Properties Listed', value: `${properties.length}`, icon: 'domain' },
            { label: 'Average Yield', value: averageYield > 0 ? `${averageYield.toFixed(1)}%` : '-', icon: 'show_chart' },
            { label: 'Network Objects', value: publicStats?.totalObjects?.toLocaleString() || `${properties.length}`, icon: 'token' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-6 hover:border-[#c9a84c]/20 transition-all duration-300 group">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-gradient-to-br from-[#c9a84c]/20 to-[#a68832]/20 rounded-xl group-hover:from-[#c9a84c]/30 group-hover:to-[#a68832]/30 transition-colors">
                  <span className="material-symbols-outlined text-[#c9a84c] text-xl">{stat.icon}</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-white/50 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-serif italic font-bold text-white mt-1">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Section */}
      <div className="sticky top-20 z-40 bg-[#0a0e1a]/95 backdrop-blur-2xl border-b border-white/[0.06] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex gap-2 flex-wrap">
              {['All', 'Residential', 'Commercial', 'Mixed-Use', 'Hospitality'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    selectedType === type
                      ? 'bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a]'
                      : 'bg-white/[0.05] text-white/70 hover:text-white border border-white/[0.1]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/50">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white/[0.05] border border-white/[0.1] text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-[#c9a84c] transition-colors"
              >
                <option value="recommended">Recommended</option>
                <option value="yield">Highest Yield</option>
                <option value="funded">Most Funded</option>
                <option value="value">Highest Value</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="h-48 shimmer" />
                <div className="p-6 space-y-4">
                  <div className="h-6 w-3/4 rounded shimmer" />
                  <div className="h-4 w-1/2 rounded shimmer" />
                  <div className="h-4 w-2/3 rounded shimmer" />
                  <div className="h-10 rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-[#c9a84c]/20 to-[#a68832]/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <span className="material-symbols-outlined text-[#c9a84c] text-5xl">domain_add</span>
            </div>
            <h2 className="text-3xl font-serif italic font-bold text-white mb-4">
              {properties.length === 0 ? 'No Properties Tokenized Yet' : 'No Matching Properties'}
            </h2>
            <p className="text-white/60 max-w-md mx-auto mb-8">
              {properties.length === 0
                ? 'Be the first to tokenize a property on the DUAL Network. Head to the Admin panel to mint your first property token.'
                : 'Try adjusting your filters to see more properties.'}
            </p>
            {properties.length === 0 && (
              <Link href="/admin" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg hover:shadow-lg hover:shadow-[#c9a84c]/20 transition-all">
                <span className="material-symbols-outlined">add</span>
                Tokenize Property
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Link key={property.id} href={`/property/${property.id}`}>
                <div className="group cursor-pointer h-full">
                  <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden hover:border-[#c9a84c]/30 transition-all duration-500 h-full flex flex-col transform hover:scale-105">
                    <div className={`h-48 bg-gradient-to-br ${property.imageGradient} relative overflow-hidden`}>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20" />
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-[#10b981]/80 backdrop-blur text-white text-xs font-semibold rounded-full">{property.type}</span>
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-[#c9a84c]/90 text-[#0a0e1a] text-xs font-black rounded-full flex items-center gap-1 shadow-[0_0_15px_rgba(201,168,76,0.5)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0a0e1a] animate-pulse" />
                          LIVE ON-CHAIN
                        </span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="mb-4">
                        <h3 className="text-lg font-serif italic font-bold text-white mb-2">{property.name}</h3>
                        <p className="text-sm text-white/60 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {property.location}
                        </p>
                        {property.blockchainTxHash && (
                          <p className="text-xs text-[#c9a84c] font-mono mt-1 truncate">{property.blockchainTxHash.slice(0, 20)}...</p>
                        )}
                      </div>
                      <div className="space-y-3 mb-6 flex-grow">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-white/50">Total Value</span>
                          <span className="font-semibold text-white">{property.totalValue > 0 ? `$${(property.totalValue / 1000000).toFixed(1)}M` : 'On-Chain'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-white/50">Token Price</span>
                          <span className="font-semibold text-white">{property.tokenPrice > 0 ? `$${property.tokenPrice.toFixed(2)}` : '-'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-white/50">Annual Yield</span>
                          <span className="font-semibold text-[#10b981]">{property.yieldPercent > 0 ? `${property.yieldPercent}%` : '-'}</span>
                        </div>
                      </div>
                      {property.fundedPercent > 0 && (
                        <div className="mb-6">
                          <div className="flex justify-between items-center text-xs mb-2">
                            <span className="text-white/50">Funded</span>
                            <span className="text-white font-medium">{property.fundedPercent}%</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#c9a84c] to-[#a68832] transition-all duration-500" style={{ width: `${property.fundedPercent}%` }} />
                          </div>
                        </div>
                      )}
                      <button className="w-full py-3 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg hover:shadow-lg hover:shadow-[#c9a84c]/20 transition-all duration-300 transform hover:scale-105">
                        View Token
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
