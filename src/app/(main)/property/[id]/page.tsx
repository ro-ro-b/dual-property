'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { DualInline } from '../../DualLogo';

interface Property {
  id: string;
  name: string;
  location: string;
  type: string;
  totalValue: number;
  tokenPrice: number;
  yieldPercent: number;
  fundedPercent: number;
  sqft: number;
  imageGradient: string;
  imageUrl?: string;
  videoUrl?: string;
  yearBuilt?: number;
  units?: number;
  description?: string;
  features?: string[];
  rentalIncome?: number;
  expenses?: number;
  capRate?: number;
  projectedReturn?: number;
  contractAddress?: string;
  integrityHash?: string;
  ownerAddress?: string;
  blockscoutUrl?: string;
  tokenCount?: number;
  metadata?: Record<string, any>;
}

interface ProvenanceEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  actor?: string;
  txHash?: string;
  status: string;
  data?: Record<string, any>;
}

interface ActivityEntry {
  id: string;
  event: string;
  hash?: string;
  amount?: string;
  timestamp: string;
  objectId?: string;
  status: string;
}

const GRADIENTS = [
  'from-amber-900 via-orange-800 to-red-900',
  'from-blue-900 via-cyan-800 to-teal-900',
  'from-slate-800 via-gray-700 to-zinc-800',
  'from-yellow-900 via-amber-800 to-orange-900',
  'from-indigo-900 via-blue-800 to-purple-900',
  'from-pink-900 via-rose-800 to-red-900',
  'from-emerald-900 via-green-800 to-teal-900',
  'from-purple-900 via-indigo-800 to-blue-900',
];

function hashToGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function timeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function eventIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'mint': return 'token';
    case 'transfer': return 'swap_horiz';
    case 'burn': return 'local_fire_department';
    case 'custom': return 'build';
    case 'yield_distribution': return 'payments';
    case 'list_tokens': return 'storefront';
    case 'buy_tokens': return 'shopping_cart';
    default: return 'receipt_long';
  }
}

function eventColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'mint': return 'text-[#10b981]';
    case 'transfer': return 'text-[#3b82f6]';
    case 'burn': return 'text-red-400';
    case 'buy_tokens': return 'text-[#c9a84c]';
    case 'yield_distribution': return 'text-[#10b981]';
    default: return 'text-white/70';
  }
}

export default function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [provenance, setProvenance] = useState<ProvenanceEvent[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [provenanceLoading, setProvenanceLoading] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState(0);
  const [countedValue, setCountedValue] = useState(0);
  const [investLoading, setInvestLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [faces, setFaces] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [investStep, setInvestStep] = useState<'amount' | 'confirm' | 'processing' | 'done'>('amount');
  const [deposits, setDeposits] = useState<any[]>([]);

  // Fetch property data from API
  useEffect(() => {
    setLoading(true);
    fetch(`/api/properties/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.property) {
          const p = data.property;
          const prop: Property = {
            id: p.id || params.id,
            name: p.name || p.title || 'Untitled Property',
            location: p.location || p.metadata?.location || 'Location not specified',
            type: p.type || p.metadata?.type || 'Property',
            totalValue: p.totalValue || p.metadata?.totalValue || 0,
            tokenPrice: p.tokenPrice || p.metadata?.tokenPrice || 0,
            yieldPercent: p.yieldPercent || p.metadata?.yieldPercent || 0,
            fundedPercent: p.fundedPercent || p.metadata?.fundedPercent || 0,
            sqft: p.sqft || p.metadata?.sqft || 0,
            imageGradient: p.imageGradient || hashToGradient(params.id),
            imageUrl: p.imageUrl || p.metadata?.imageUrl || '',
            videoUrl: p.videoUrl || p.metadata?.videoUrl || '',
            yearBuilt: p.yearBuilt || p.metadata?.yearBuilt,
            units: p.units || p.metadata?.units,
            description: p.description || p.metadata?.description || 'A tokenized real estate property on the DUAL network.',
            features: p.features || p.metadata?.features || [],
            rentalIncome: p.rentalIncome || p.metadata?.rentalIncome,
            expenses: p.expenses || p.metadata?.expenses,
            capRate: p.capRate || p.metadata?.capRate,
            projectedReturn: p.projectedReturn || p.metadata?.projectedReturn,
            contractAddress: p.contractAddress,
            integrityHash: p.integrityHash,
            ownerAddress: p.ownerAddress,
            blockscoutUrl: p.blockscoutUrl,
            tokenCount: p.tokenCount || p.metadata?.tokenCount,
            metadata: p.metadata,
          };
          setProperty(prop);
          setInvestmentAmount(prop.tokenPrice || 100);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  // Fetch provenance when on-chain or provenance tab is active
  useEffect(() => {
    if (activeTab === 'provenance' || activeTab === 'on-chain') {
      setProvenanceLoading(true);
      Promise.all([
        fetch(`/api/properties/${params.id}/provenance`).then(r => r.json()).catch(() => ({ provenance: [] })),
        fetch('/api/properties/activity').then(r => r.json()).catch(() => ({ activities: [] })),
      ]).then(([provData, actData]) => {
        setProvenance(provData.provenance || []);
        // Filter activity to this property
        const allActivity: ActivityEntry[] = actData.activities || [];
        const propertyActivity = allActivity.filter(
          (a: ActivityEntry) => a.objectId === params.id || !a.objectId
        );
        setActivity(propertyActivity.slice(0, 20));
      }).finally(() => setProvenanceLoading(false));
    }
  }, [activeTab, params.id]);

  // Fetch documents, faces, and related objects when those tabs are active
  useEffect(() => {
    if (activeTab === 'documents') {
      fetch(`/api/objects/${params.id}/documents`).then(r => r.json())
        .then(data => setDocuments(Array.isArray(data.documents) ? data.documents : []))
        .catch(() => setDocuments([]));
    }
    if (activeTab === 'media') {
      fetch(`/api/objects/${params.id}/faces`).then(r => r.json())
        .then(data => {
          const f = Array.isArray(data.faces) ? data.faces : Array.isArray(data.faces?.data) ? data.faces.data : [];
          setFaces(f);
        })
        .catch(() => setFaces([]));
    }
    if (activeTab === 'related') {
      Promise.all([
        fetch(`/api/objects/${params.id}/children`).then(r => r.json()).catch(() => ({ children: [] })),
        fetch(`/api/objects/${params.id}/parents`).then(r => r.json()).catch(() => ({ parents: [] })),
      ]).then(([childData, parentData]) => {
        setChildren(Array.isArray(childData.children) ? childData.children : Array.isArray(childData.children?.data) ? childData.children.data : []);
        setParents(Array.isArray(parentData.parents) ? parentData.parents : Array.isArray(parentData.parents?.data) ? parentData.parents.data : []);
      });
    }
  }, [activeTab, params.id]);

  // Fetch deposits for payment tracking
  useEffect(() => {
    fetch('/api/payments/deposits').then(r => r.json())
      .then(data => setDeposits(Array.isArray(data.deposits) ? data.deposits : []))
      .catch(() => {});
  }, []);

  // Counter animation
  useEffect(() => {
    if (countedValue < investmentAmount) {
      const timer = setTimeout(() => {
        setCountedValue(
          Math.min(countedValue + investmentAmount / 20, investmentAmount)
        );
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [countedValue, investmentAmount]);

  const handleInvest = async () => {
    if (!property) return;
    setInvestLoading(true);
    try {
      const response = await fetch(`/api/properties/${params.id}/buy-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: `listing_${params.id}`,
          buyerEmail: 'investor@example.com',
          tokenCount: tokens,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Investment successful! Transaction: ${data.transactionHash || data.purchaseId}`);
      } else {
        alert('Investment failed: ' + data.error);
      }
    } catch {
      alert('Error processing investment');
    } finally {
      setInvestLoading(false);
    }
  };

  const handleTransfer = async () => {
    setTransferLoading(true);
    try {
      const response = await fetch(`/api/properties/${params.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: transferEmail,
          amount: investmentAmount,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Transfer initiated! Transaction: ${data.transactionHash}`);
        setShowTransferModal(false);
        setTransferEmail('');
      } else {
        alert('Transfer failed: ' + data.error);
      }
    } catch {
      alert('Error processing transfer');
    } finally {
      setTransferLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading property details...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!property) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-serif italic text-white mb-4">
            Property not found
          </h1>
          <p className="text-white/60 mb-6">This property may not exist on the DUAL network yet.</p>
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg"
          >
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  const tokens = property.tokenPrice > 0 ? Math.floor(investmentAmount / property.tokenPrice) : 0;
  const monthlyYield = property.yieldPercent > 0 ? (investmentAmount * property.yieldPercent) / 100 / 12 : 0;
  const totalTokens = property.tokenCount || 0;
  const gradient = property.imageGradient || hashToGradient(params.id);

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Hero Section */}
      <div className={`h-96 ${property.imageUrl ? '' : `bg-gradient-to-br ${gradient}`} relative overflow-hidden`}>
        {property.videoUrl ? (
          <video
            src={property.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : property.imageUrl ? (
          <img src={property.imageUrl} alt={property.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] to-transparent" />
        <div className="absolute top-4 left-6 z-10">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-24 z-10 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Property Header */}
            <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-8 mb-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-4xl font-serif italic font-bold text-white mb-2">
                    {property.name}
                  </h1>
                  <p className="text-lg text-white/60 flex items-center gap-2">
                    <span className="material-symbols-outlined">location_on</span>
                    {property.location}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-4 py-2 bg-[#10b981]/20 border border-[#10b981]/50 text-[#10b981] font-semibold rounded-xl">
                    {property.type}
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/[0.06]">
                {property.yearBuilt && (
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Year Built</p>
                    <p className="text-xl font-serif italic font-bold text-white">
                      {property.yearBuilt}
                    </p>
                  </div>
                )}
                {property.sqft > 0 && (
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Total Sqft</p>
                    <p className="text-xl font-serif italic font-bold text-white">
                      {property.sqft >= 1000 ? `${(property.sqft / 1000).toFixed(0)}K` : property.sqft.toLocaleString()}
                    </p>
                  </div>
                )}
                {property.units && (
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Units</p>
                    <p className="text-xl font-serif italic font-bold text-white">
                      {property.units}
                    </p>
                  </div>
                )}
                {totalTokens > 0 && (
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Total Tokens</p>
                    <p className="text-xl font-serif italic font-bold text-[#c9a84c]">
                      {totalTokens.toLocaleString()}
                    </p>
                  </div>
                )}
                {property.fundedPercent > 0 && (
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Funded</p>
                    <p className="text-xl font-serif italic font-bold text-[#10b981]">
                      {property.fundedPercent}%
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex border-b border-white/[0.06] overflow-x-auto">
                {['overview', 'financials', 'documents', 'media', 'related', 'on-chain', 'provenance'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab
                        ? 'text-[#c9a84c] border-b-2 border-[#c9a84c] -mb-px'
                        : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    {tab === 'on-chain' ? 'On-Chain' : tab === 'related' ? 'Related' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-8">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-serif italic font-bold text-white mb-3">
                        About This Property
                      </h3>
                      <p className="text-white/70 leading-relaxed">
                        {property.description}
                      </p>
                    </div>

                    {property.features && property.features.length > 0 && (
                      <div>
                        <h3 className="text-lg font-serif italic font-bold text-white mb-4">
                          Key Features
                        </h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {property.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-white/70">
                              <span className="material-symbols-outlined text-[#c9a84c] text-lg">
                                check_circle
                              </span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Show metadata keys as extra info */}
                    {property.metadata && Object.keys(property.metadata).length > 0 && (
                      <div>
                        <h3 className="text-lg font-serif italic font-bold text-white mb-4">
                          Property Metadata
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(property.metadata)
                            .filter(([k]) => !['description', 'features', 'location', 'type', 'totalValue', 'tokenPrice', 'yieldPercent', 'fundedPercent', 'sqft', 'yearBuilt', 'units', 'rentalIncome', 'expenses', 'capRate', 'projectedReturn', 'tokenCount'].includes(k))
                            .slice(0, 12)
                            .map(([key, value]) => (
                              <div key={key} className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                                <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
                                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                                </p>
                                <p className="text-sm font-semibold text-white truncate">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* FINANCIALS TAB */}
                {activeTab === 'financials' && (
                  <div className="space-y-6">
                    {(property.rentalIncome || property.expenses || property.capRate || property.projectedReturn) ? (
                      <table className="w-full text-sm">
                        <tbody>
                          {property.rentalIncome && (
                            <tr className="border-b border-white/[0.06]">
                              <td className="py-4 text-white/70">Annual Rental Income</td>
                              <td className="py-4 text-right font-semibold text-white">
                                ${(property.rentalIncome / 1000000).toFixed(1)}M
                              </td>
                            </tr>
                          )}
                          {property.expenses && (
                            <tr className="border-b border-white/[0.06]">
                              <td className="py-4 text-white/70">Annual Expenses</td>
                              <td className="py-4 text-right font-semibold text-white">
                                ${(property.expenses / 1000000).toFixed(1)}M
                              </td>
                            </tr>
                          )}
                          {property.rentalIncome && property.expenses && (
                            <tr className="border-b border-white/[0.06]">
                              <td className="py-4 text-white/70">Net Operating Income</td>
                              <td className="py-4 text-right font-semibold text-[#10b981]">
                                ${((property.rentalIncome - property.expenses) / 1000000).toFixed(1)}M
                              </td>
                            </tr>
                          )}
                          {property.capRate && (
                            <tr className="border-b border-white/[0.06]">
                              <td className="py-4 text-white/70">Cap Rate</td>
                              <td className="py-4 text-right font-semibold text-white">
                                {property.capRate.toFixed(1)}%
                              </td>
                            </tr>
                          )}
                          {property.projectedReturn && (
                            <tr className="border-b border-white/[0.06] last:border-0">
                              <td className="py-4 text-white/70">Projected Annual Return</td>
                              <td className="py-4 text-right font-semibold text-white">
                                {property.projectedReturn.toFixed(1)}%
                              </td>
                            </tr>
                          )}
                          {property.yieldPercent > 0 && (
                            <tr className="border-b border-white/[0.06] last:border-0">
                              <td className="py-4 text-white/70">Token Yield</td>
                              <td className="py-4 text-right font-semibold text-[#10b981]">
                                {property.yieldPercent}%
                              </td>
                            </tr>
                          )}
                          {property.totalValue > 0 && (
                            <tr className="last:border-0">
                              <td className="py-4 text-white/70">Total Valuation</td>
                              <td className="py-4 text-right font-semibold text-white">
                                ${property.totalValue >= 1000000
                                  ? `${(property.totalValue / 1000000).toFixed(1)}M`
                                  : property.totalValue.toLocaleString()}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-12">
                        <span className="material-symbols-outlined text-4xl text-white/20 mb-4 block">
                          analytics
                        </span>
                        <p className="text-white/50">
                          Financial data will appear here once the property has trading activity.
                        </p>
                        {property.totalValue > 0 && (
                          <p className="text-white/70 mt-4 text-lg font-semibold">
                            Total Value: ${property.totalValue >= 1000000
                              ? `${(property.totalValue / 1000000).toFixed(1)}M`
                              : property.totalValue.toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ON-CHAIN TAB */}
                {activeTab === 'on-chain' && (
                  <div className="space-y-4">
                    {property.contractAddress && (
                      <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                        <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                          Contract Address
                        </p>
                        <p className="font-mono text-sm text-white break-all">
                          {property.contractAddress}
                        </p>
                      </div>
                    )}
                    {property.integrityHash && (
                      <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                        <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                          Integrity Hash
                        </p>
                        <p className="font-mono text-sm text-white break-all">
                          {property.integrityHash}
                        </p>
                      </div>
                    )}
                    {property.ownerAddress && (
                      <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                        <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                          Owner Address
                        </p>
                        <p className="font-mono text-sm text-white break-all">
                          {property.ownerAddress}
                        </p>
                      </div>
                    )}

                    <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                      <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                        Object ID
                      </p>
                      <p className="font-mono text-sm text-white break-all">
                        {params.id}
                      </p>
                    </div>

                    {totalTokens > 0 && (
                      <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                        <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                          Token Supply
                        </p>
                        <p className="text-lg font-semibold text-white">
                          {totalTokens.toLocaleString()}
                        </p>
                      </div>
                    )}

                    {property.blockscoutUrl && (
                      <a
                        href={property.blockscoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-4 bg-[#c9a84c]/10 border border-[#c9a84c]/30 rounded-lg text-[#c9a84c] hover:bg-[#c9a84c]/20 transition-colors"
                      >
                        <span className="material-symbols-outlined">open_in_new</span>
                        View on Blockscout Explorer
                      </a>
                    )}

                    {/* On-Chain Activity from real data */}
                    <div className="pt-4 border-t border-white/[0.06]">
                      <h4 className="text-lg font-serif italic font-bold text-white mb-4">
                        On-Chain Activity
                      </h4>
                      {provenanceLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : activity.length > 0 ? (
                        <div className="space-y-3">
                          {activity.slice(0, 10).map((act) => (
                            <div
                              key={act.id}
                              className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]"
                            >
                              <div className="flex items-center gap-3">
                                <span className={`material-symbols-outlined ${eventColor(act.event)}`}>
                                  {eventIcon(act.event)}
                                </span>
                                <div>
                                  <p className="text-sm font-semibold text-white">
                                    {act.event.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                  </p>
                                  {act.hash && (
                                    <p className="text-xs text-white/50 font-mono">
                                      {act.hash.slice(0, 10)}...{act.hash.slice(-6)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                {act.amount && (
                                  <p className="text-sm font-semibold text-[#c9a84c]">
                                    {act.amount}
                                  </p>
                                )}
                                <p className="text-xs text-white/50">{timeAgo(act.timestamp)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <span className="material-symbols-outlined text-3xl text-white/20 mb-2 block">
                            history
                          </span>
                          <p className="text-white/50 text-sm">
                            No on-chain activity recorded yet for this property.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* PROVENANCE TAB */}
                {activeTab === 'provenance' && (
                  <div>
                    <h3 className="text-lg font-serif italic font-bold text-white mb-6">
                      Provenance Timeline
                    </h3>
                    {provenanceLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : provenance.length > 0 ? (
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-6 top-0 bottom-0 w-px bg-white/[0.1]" />

                        <div className="space-y-6">
                          {provenance.map((event, i) => (
                            <div key={event.id || i} className="relative flex gap-4 pl-2">
                              {/* Timeline dot */}
                              <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center ${
                                event.status === 'completed' || event.status === 'success'
                                  ? 'border-[#10b981] bg-[#10b981]/20'
                                  : event.status === 'failed'
                                  ? 'border-red-400 bg-red-400/20'
                                  : 'border-[#c9a84c] bg-[#c9a84c]/20'
                              }`}>
                                <span className={`material-symbols-outlined text-sm ${
                                  event.status === 'completed' || event.status === 'success'
                                    ? 'text-[#10b981]'
                                    : event.status === 'failed'
                                    ? 'text-red-400'
                                    : 'text-[#c9a84c]'
                                }`}>
                                  {eventIcon(event.type)}
                                </span>
                              </div>

                              {/* Event content */}
                              <div className="flex-grow bg-white/[0.03] rounded-lg border border-white/[0.06] p-4 hover:border-[#c9a84c]/20 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-semibold text-white">
                                      {event.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                    </p>
                                    <p className="text-sm text-white/60 mt-1">
                                      {event.description}
                                    </p>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    event.status === 'completed' || event.status === 'success'
                                      ? 'bg-[#10b981]/20 text-[#10b981]'
                                      : event.status === 'failed'
                                      ? 'bg-red-400/20 text-red-400'
                                      : 'bg-[#c9a84c]/20 text-[#c9a84c]'
                                  }`}>
                                    {event.status}
                                  </span>
                                </div>

                                <div className="flex items-center gap-4 mt-3 text-xs text-white/50">
                                  <span>{timeAgo(event.timestamp)}</span>
                                  {event.actor && (
                                    <span className="font-mono">
                                      by {event.actor.slice(0, 8)}...
                                    </span>
                                  )}
                                  {event.txHash && (
                                    <span className="font-mono">
                                      tx: {event.txHash.slice(0, 10)}...
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <span className="material-symbols-outlined text-4xl text-white/20 mb-4 block">
                          timeline
                        </span>
                        <p className="text-white/50 mb-2">
                          No provenance events recorded yet.
                        </p>
                        <p className="text-white/40 text-sm">
                          Provenance events track the full lifecycle of this property on-chain — minting, transfers, yield distributions, and more.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* DOCUMENTS TAB */}
                {activeTab === 'documents' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-serif italic font-bold text-white">Property Documents</h3>
                    </div>
                    {documents.length > 0 ? (
                      <div className="space-y-3">
                        {documents.map((doc: any, i: number) => (
                          <div key={doc.id || i} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-lg border border-white/[0.06] hover:border-[#c9a84c]/20 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-[#c9a84c]">description</span>
                              <div>
                                <p className="text-sm text-white font-medium">{doc.name || doc.filename || `Document ${i + 1}`}</p>
                                <p className="text-xs text-white/40">{doc.type || doc.mimeType || 'Document'} {doc.size ? `• ${(doc.size / 1024).toFixed(0)} KB` : ''}</p>
                              </div>
                            </div>
                            {doc.url && (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-[#c9a84c] hover:text-[#e0c060]">
                                <span className="material-symbols-outlined">download</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <span className="material-symbols-outlined text-4xl text-white/20 mb-4 block">folder_open</span>
                        <p className="text-white/50 mb-2">No documents uploaded yet.</p>
                        <p className="text-white/40 text-sm">Property documents like deeds, appraisals, and inspection reports will appear here.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* MEDIA TAB */}
                {activeTab === 'media' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-serif italic font-bold text-white mb-4">Token Media / Faces</h3>
                    {faces.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {faces.map((face: any, i: number) => (
                          <div key={face.id || i} className="bg-white/[0.03] rounded-lg border border-white/[0.06] overflow-hidden hover:border-[#c9a84c]/20 transition-colors">
                            {face.imageUrl || face.url ? (
                              <img src={face.imageUrl || face.url} alt={face.name || `Face ${i + 1}`} className="w-full h-32 object-cover" />
                            ) : (
                              <div className="w-full h-32 bg-gradient-to-br from-[#c9a84c]/20 to-transparent flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl text-[#c9a84c]/40">image</span>
                              </div>
                            )}
                            <div className="p-3">
                              <p className="text-sm text-white font-medium truncate">{face.name || `Face ${i + 1}`}</p>
                              {face.description && <p className="text-xs text-white/40 mt-1 truncate">{face.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <span className="material-symbols-outlined text-4xl text-white/20 mb-4 block">image</span>
                        <p className="text-white/50 mb-2">No media assets yet.</p>
                        <p className="text-white/40 text-sm">Token faces and media like photos, renders, and visual assets will appear here.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* RELATED TAB */}
                {activeTab === 'related' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-serif italic font-bold text-white mb-4">Related Objects</h3>

                    {/* Children */}
                    <div>
                      <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Child Objects</h4>
                      {children.length > 0 ? (
                        <div className="space-y-2">
                          {children.map((child: any, i: number) => (
                            <a key={child.id || i} href={`/property/${child.id}`} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/[0.06] hover:border-[#c9a84c]/20 transition-colors">
                              <span className="material-symbols-outlined text-[#c9a84c]">account_tree</span>
                              <div>
                                <p className="text-sm text-white">{child.name || child.id}</p>
                                {child.type && <p className="text-xs text-white/40">{child.type}</p>}
                              </div>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/40 text-sm py-4">No child objects found.</p>
                      )}
                    </div>

                    {/* Parents */}
                    <div>
                      <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Parent Objects</h4>
                      {parents.length > 0 ? (
                        <div className="space-y-2">
                          {parents.map((parent: any, i: number) => (
                            <a key={parent.id || i} href={`/property/${parent.id}`} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/[0.06] hover:border-[#c9a84c]/20 transition-colors">
                              <span className="material-symbols-outlined text-[#c9a84c]">family_restroom</span>
                              <div>
                                <p className="text-sm text-white">{parent.name || parent.id}</p>
                                {parent.type && <p className="text-xs text-white/40">{parent.type}</p>}
                              </div>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/40 text-sm py-4">No parent objects found.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tokenization Structure */}
            <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-8 mt-8">
              <h3 className="text-lg font-serif italic font-bold text-white mb-4">
                Tokenization Structure
              </h3>
              <p className="text-white/70 mb-6">
                {totalTokens > 0
                  ? `This property is tokenized into ${totalTokens.toLocaleString()} tokens on the DUAL Network, allowing fractional ownership. Each token represents an equal claim on property income and appreciation.`
                  : <>This property is tokenized on the <DualInline className="text-current" /> Network, allowing fractional ownership. Tokens can be traded on the <DualInline className="text-current" /> platform or secondary markets.</>}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Network', value: 'DUAL Network' },
                  { label: 'Object ID', value: params.id.slice(0, 12) + '...' },
                  ...(totalTokens > 0 ? [{ label: 'Token Supply', value: totalTokens.toLocaleString() }] : []),
                  ...(property.tokenPrice > 0 ? [{ label: 'Token Price', value: `$${property.tokenPrice.toFixed(2)}` }] : []),
                  ...(property.contractAddress ? [{ label: 'Contract', value: property.contractAddress.slice(0, 10) + '...' }] : []),
                  ...(property.blockscoutUrl ? [{ label: 'Explorer', value: 'View on Blockscout' }] : []),
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]"
                  >
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
                      {item.label}
                    </p>
                    <p className="font-semibold text-white text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Investment Panel - Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-8 space-y-6">
              {/* Property Value */}
              {property.totalValue > 0 && (
                <div className="pb-6 border-b border-white/[0.06]">
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                    Total Property Value
                  </p>
                  <p className="text-3xl font-serif italic font-bold text-white">
                    ${property.totalValue >= 1000000
                      ? `${(property.totalValue / 1000000).toFixed(1)}M`
                      : property.totalValue.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Token Price */}
              {property.tokenPrice > 0 && (
                <div className="pb-6 border-b border-white/[0.06]">
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                    Token Price
                  </p>
                  <p className="text-2xl font-semibold text-white">
                    ${property.tokenPrice.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Key Metrics */}
              <div className="space-y-3 pb-6 border-b border-white/[0.06]">
                {property.tokenPrice > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/70">Minimum Investment</span>
                    <span className="font-semibold text-white">
                      ${property.tokenPrice.toFixed(2)}
                    </span>
                  </div>
                )}
                {property.yieldPercent > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/70">Annual Yield</span>
                    <span className="font-semibold text-[#10b981]">
                      {property.yieldPercent}%
                    </span>
                  </div>
                )}
              </div>

              {/* Funding Progress */}
              {property.fundedPercent > 0 && (
                <div className="pb-6 border-b border-white/[0.06]">
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-3">
                    Funding Progress
                  </p>
                  <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-[#c9a84c] to-[#a68832]"
                      style={{ width: `${Math.min(property.fundedPercent, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/60">
                    {property.fundedPercent}% funded
                  </p>
                </div>
              )}

              {/* Investment Amount Input */}
              {property.tokenPrice > 0 && (
                <div className="pb-6 border-b border-white/[0.06]">
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-3">
                    Investment Amount
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setInvestmentAmount(
                          Math.max(property.tokenPrice, investmentAmount - 1000)
                        )
                      }
                      className="p-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined">remove</span>
                    </button>
                    <div className="flex-grow">
                      <input
                        type="number"
                        value={Math.round(countedValue * 100) / 100}
                        onChange={(e) =>
                          setInvestmentAmount(parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-white/[0.05] border border-white/[0.1] text-white px-4 py-2 rounded-lg text-center focus:outline-none focus:border-[#c9a84c]"
                      />
                    </div>
                    <button
                      onClick={() =>
                        setInvestmentAmount(investmentAmount + 1000)
                      }
                      className="p-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                  <p className="text-xs text-white/60 mt-2">
                    = {tokens.toLocaleString()} tokens
                  </p>
                </div>
              )}

              {/* Summary */}
              {property.yieldPercent > 0 && investmentAmount > 0 && (
                <div className="space-y-2 pb-6 border-b border-white/[0.06]">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Monthly Yield</span>
                    <span className="font-semibold text-[#10b981]">
                      ${monthlyYield.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Annual Yield</span>
                    <span className="font-semibold text-white">
                      ${(monthlyYield * 12).toFixed(0)}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons — Multi-step invest flow */}
              <div className="space-y-3">
                {investStep === 'amount' && (
                  <>
                    <button
                      onClick={() => investmentAmount > 0 && setInvestStep('confirm')}
                      disabled={investmentAmount <= 0}
                      className="w-full py-4 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg hover:shadow-lg hover:shadow-[#c9a84c]/30 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                    >
                      Continue to Invest
                    </button>
                    <button
                      onClick={() => setShowTransferModal(true)}
                      className="w-full py-4 bg-white/[0.05] border border-white/[0.1] text-white font-semibold rounded-lg hover:border-[#c9a84c]/30 transition-colors"
                    >
                      Transfer Tokens
                    </button>
                  </>
                )}
                {investStep === 'confirm' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#c9a84c]/10 border border-[#c9a84c]/30 rounded-lg">
                      <p className="text-xs text-[#c9a84c] uppercase tracking-wider mb-2">Confirm Investment</p>
                      <p className="text-white font-semibold text-lg">${investmentAmount.toLocaleString()}</p>
                      <p className="text-white/60 text-sm mt-1">{tokens.toLocaleString()} tokens @ ${property.tokenPrice?.toFixed(2)}/token</p>
                      {monthlyYield > 0 && <p className="text-[#10b981] text-sm mt-2">Est. monthly yield: ${monthlyYield.toFixed(0)}</p>}
                    </div>
                    <button
                      onClick={async () => {
                        setInvestStep('processing');
                        await handleInvest();
                        setInvestStep('done');
                        setTimeout(() => setInvestStep('amount'), 5000);
                      }}
                      disabled={investLoading}
                      className="w-full py-4 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                    >
                      {investLoading ? 'Processing...' : 'Confirm & Invest'}
                    </button>
                    <button
                      onClick={() => setInvestStep('amount')}
                      className="w-full py-2 text-white/50 hover:text-white text-sm transition-colors"
                    >
                      Go Back
                    </button>
                  </div>
                )}
                {investStep === 'processing' && (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-white/70 text-sm">Processing your investment...</p>
                  </div>
                )}
                {investStep === 'done' && (
                  <div className="text-center py-4">
                    <span className="material-symbols-outlined text-3xl text-[#10b981] mb-2 block">check_circle</span>
                    <p className="text-[#10b981] font-semibold">Investment Submitted!</p>
                    <p className="text-white/50 text-sm mt-1">Check your portfolio for details.</p>
                  </div>
                )}
                {deposits.length > 0 && investStep === 'amount' && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Recent Deposits</p>
                    {deposits.slice(0, 3).map((dep: any, i: number) => (
                      <div key={dep.id || i} className="flex justify-between text-xs py-1">
                        <span className="text-white/60">{dep.amount ? `$${dep.amount}` : dep.status || 'Deposit'}</span>
                        <span className="text-white/40">{dep.createdAt ? new Date(dep.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Powered By Badge */}
              <div className="text-center pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-white/50 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  Powered by <DualInline className="text-current" /> Network
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827]/95 border border-white/[0.06] rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-serif italic font-bold text-white mb-6">
              Transfer Tokens
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full bg-white/[0.05] border border-white/[0.1] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-[#c9a84c]"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Amount ({tokens.toLocaleString()} tokens)
                </label>
                <p className="text-white font-semibold">
                  ${investmentAmount.toFixed(2)}
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-2 bg-white/[0.05] border border-white/[0.1] text-white rounded-lg hover:border-white/[0.2] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={transferLoading || !transferEmail}
                  className="flex-1 py-2 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {transferLoading ? 'Transferring...' : 'Transfer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
