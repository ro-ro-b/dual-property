'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

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

export default function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [investmentAmount, setInvestmentAmount] = useState(0);
  const [investStep, setInvestStep] = useState<'amount' | 'confirm' | 'processing' | 'done'>('amount');
  const [investLoading, setInvestLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [activeChapter, setActiveChapter] = useState(0);

  // Refs for scroll targets
  const chapterOneRef = useRef<HTMLDivElement>(null);
  const chapterTwoRef = useRef<HTMLDivElement>(null);
  const chapterThreeRef = useRef<HTMLDivElement>(null);
  const chapters = [
    { name: 'Chapter I', ref: chapterOneRef },
    { name: 'Chapter II', ref: chapterTwoRef },
    { name: 'Chapter III', ref: chapterThreeRef },
  ];

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

  // Handle chapter scroll
  const handleChapterClick = (index: number) => {
    setActiveChapter(index);
    const ref = chapters[index].ref;
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInvest = async () => {
    if (!property) return;
    setInvestLoading(true);
    try {
      const tokens = property.tokenPrice > 0 ? Math.floor(investmentAmount / property.tokenPrice) : 0;
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
        setInvestStep('done');
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
  const totalTokens = property.tokenCount || 0;
  const gradient = property.imageGradient || hashToGradient(params.id);

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* HERO SECTION */}
      <div className="relative h-screen w-full overflow-hidden">
        {/* Background Image/Video */}
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
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
        )}

        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/50 to-transparent" />

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-20">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </Link>
        </div>

        {/* Chapter Navigation Sidebar */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 pl-8">
          <div className="flex flex-col gap-12">
            {chapters.map((ch, idx) => (
              <button
                key={idx}
                onClick={() => handleChapterClick(idx)}
                className={`text-xs uppercase tracking-wider font-serif italic transition-all ${
                  activeChapter === idx
                    ? 'text-[#c9a84c] text-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {ch.name}
              </button>
            ))}
          </div>
        </div>

        {/* Centered Headline */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4">
          <h1 className="text-6xl md:text-7xl font-serif italic font-bold text-white text-center mb-4 max-w-4xl leading-tight">
            INSTITUTIONAL REAL ESTATE.
          </h1>
          <h2 className="text-5xl md:text-6xl font-serif italic font-bold text-[#c9a84c] text-center mb-8 max-w-4xl leading-tight">
            FRACTIONAL ACCESS.
          </h2>
          <p className="text-lg md:text-xl font-serif italic text-white/80">
            A Digital Prospectus.
          </p>
        </div>
      </div>

      {/* CHAPTER I: THE PROPERTY VISION */}
      <div ref={chapterOneRef} className="relative bg-[#0a0e1a] py-20 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-serif italic font-bold text-white relative inline-block">
              CHAPTER I: THE PROPERTY VISION
              <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#c9a84c]" />
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            {/* Left: Image */}
            <div className="lg:col-span-1">
              <div className="aspect-square rounded-2xl overflow-hidden border border-white/[0.06]">
                {property.imageUrl ? (
                  <img
                    src={property.imageUrl}
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
                )}
              </div>
            </div>

            {/* Right: Description */}
            <div className="lg:col-span-2">
              <h3 className="text-2xl font-serif italic font-bold text-white mb-4">
                {property.name}
              </h3>
              <p className="text-white/70 leading-relaxed mb-6 text-lg">
                {property.description}
              </p>
              {property.features && property.features.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  {property.features.slice(0, 4).map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#c9a84c] flex-shrink-0 mt-1">
                        check_circle
                      </span>
                      <span className="text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CHAPTER II & III: Financial and Tokenization (Side by side) */}
      <div className="bg-[#0a0e1a] py-20 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* CHAPTER II: FINANCIAL PERFORMANCE */}
            <div ref={chapterTwoRef}>
              <h2 className="text-2xl md:text-3xl font-serif italic font-bold text-white relative inline-block mb-8">
                CHAPTER II: FINANCIAL PERFORMANCE
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#c9a84c]" />
              </h2>

              <div className="bg-[#111827]/60 border border-white/[0.06] rounded-2xl p-8 space-y-8">
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/50 mb-2">Token Price</p>
                  <p className="text-4xl font-serif italic font-bold text-[#c9a84c]">
                    ${property.tokenPrice.toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-white/50 mb-2">Annual Yield</p>
                  <p className="text-4xl font-serif italic font-bold text-[#10b981]">
                    {property.yieldPercent.toFixed(1)}%
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-white/50 mb-2">Total Valuation</p>
                  <p className="text-3xl font-serif italic font-bold text-white">
                    ${property.totalValue >= 1000000
                      ? `${(property.totalValue / 1000000).toFixed(1)}M`
                      : property.totalValue.toLocaleString()}
                  </p>
                </div>

                {property.rentalIncome && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/50 mb-2">Annual Rental Income</p>
                    <p className="text-xl font-semibold text-white">
                      ${(property.rentalIncome / 1000000).toFixed(1)}M
                    </p>
                  </div>
                )}

                {property.capRate && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/50 mb-2">Cap Rate</p>
                    <p className="text-xl font-semibold text-white">
                      {property.capRate.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CHAPTER III: TOKENIZATION DETAILS */}
            <div ref={chapterThreeRef}>
              <h2 className="text-2xl md:text-3xl font-serif italic font-bold text-white relative inline-block mb-8">
                CHAPTER III: TOKENIZATION DETAILS
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#c9a84c]" />
              </h2>

              <div className="bg-[#111827]/60 border border-white/[0.06] rounded-2xl p-8 space-y-8 relative overflow-hidden">
                {/* Tech grid background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <defs>
                      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />
                  </svg>
                </div>

                <div className="relative z-10">
                  <p className="text-xs uppercase tracking-wider text-white/50 mb-2">Network</p>
                  <p className="text-2xl font-serif italic font-bold text-white">
                    DUAL Network
                  </p>
                </div>

                {property.contractAddress && (
                  <div className="relative z-10">
                    <p className="text-xs uppercase tracking-wider text-white/50 mb-2">Smart Contract</p>
                    <div className="flex items-center gap-3">
                      <code className="text-sm font-mono text-[#c9a84c] break-all">
                        {property.contractAddress.slice(0, 10)}...{property.contractAddress.slice(-8)}
                      </code>
                      {property.blockscoutUrl && (
                        <a
                          href={property.blockscoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#c9a84c] hover:text-[#d4b861] transition-colors flex-shrink-0"
                        >
                          <span className="material-symbols-outlined text-lg">open_in_new</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="relative z-10">
                  <p className="text-xs uppercase tracking-wider text-white/50 mb-2">Total Tokens</p>
                  <p className="text-2xl font-serif italic font-bold text-[#c9a84c]">
                    {totalTokens.toLocaleString()}
                  </p>
                </div>

                {property.fundedPercent > 0 && (
                  <div className="relative z-10">
                    <p className="text-xs uppercase tracking-wider text-white/50 mb-2">Funded</p>
                    <p className="text-2xl font-serif italic font-bold text-[#10b981]">
                      {property.fundedPercent}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM BAR - Buy Tokens */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0e1a]/95 backdrop-blur-sm border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-8 flex-1">
              <span className="text-white/60 whitespace-nowrap">Buy Tokens:</span>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-wider text-white/50 mb-1">Current Price</p>
                  <p className="text-lg font-semibold text-white">
                    ${property.tokenPrice.toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs uppercase tracking-wider text-white/50 mb-1">Available Tokens</p>
                  <p className="text-lg font-semibold text-white">
                    {totalTokens.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap md:flex-nowrap justify-center md:justify-end w-full md:w-auto">
              <div className="flex items-center border border-white/[0.06] rounded-lg overflow-hidden">
                <button
                  onClick={() => setInvestmentAmount(Math.max(0, investmentAmount - property.tokenPrice))}
                  className="px-3 py-2 text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(parseFloat(e.target.value) || 0)}
                  className="w-20 px-3 py-2 bg-transparent text-white text-center border-l border-r border-white/[0.06] focus:outline-none"
                />
                <button
                  onClick={() => setInvestmentAmount(investmentAmount + property.tokenPrice)}
                  className="px-3 py-2 text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>

              <button
                onClick={handleInvest}
                disabled={investLoading || investmentAmount <= 0}
                className="px-6 py-2 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg hover:from-[#d4b861] hover:to-[#b8954a] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {investLoading ? 'PROCESSING...' : 'BUY TOKENS'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add padding at the bottom to accommodate fixed bar */}
      <div className="h-24" />

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-serif italic font-bold text-white mb-6">
              Transfer Tokens
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-white/70 mb-2">Recipient Email</label>
                <input
                  type="email"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.06] rounded-lg text-white focus:outline-none focus:border-[#c9a84c]"
                  placeholder="investor@example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Amount</label>
                <div className="text-lg font-semibold text-white">
                  ${investmentAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 px-4 py-2 border border-white/[0.06] text-white rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={transferLoading || !transferEmail}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg hover:from-[#d4b861] hover:to-[#b8954a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {transferLoading ? 'Processing...' : 'Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
