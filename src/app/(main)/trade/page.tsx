'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DualInline } from '../DualLogo';

interface PropertyListing {
  id: string;
  name: string;
  type: string;
  tokenPrice: number;
  totalValue: number;
  totalTokens: number;
  tokensSold: number;
  annualYield: number;
  location: string;
}

interface ActionLog {
  id: string;
  event: string;
  hash: string;
  amount: string;
  timestamp: string;
  objectId: string;
  status: string;
}

export default function TradePage() {
  const [selectedType, setSelectedType] = useState<string>('All');
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [tokenCount, setTokenCount] = useState<number>(1);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseStage, setPurchaseStage] = useState<'idle' | 'settling' | 'confirming' | 'complete'>('idle');

  useEffect(() => {
    // Fetch real properties
    fetch('/api/properties')
      .then((r) => r.json())
      .then((data) => {
        const props = data.properties || [];
        const mapped: PropertyListing[] = props.map((p: any) => {
          const loc = p.location || {};
          const inv = p.investment || {};
          const rawType = p.propertyType || 'residential';
          return {
            id: p.id,
            name: p.name || 'Untitled Property',
            type: rawType === 'mixed-use' ? 'Mixed-Use' :
              rawType.charAt(0).toUpperCase() + rawType.slice(1),
            tokenPrice: inv.tokenPricePerShare || 0,
            totalValue: inv.totalPropertyValue || 0,
            totalTokens: inv.totalTokens || 0,
            tokensSold: 0,
            annualYield: inv.annualYield || 0,
            location: loc.city ? `${loc.city}, ${loc.country || ''}`.replace(/, $/, '') : 'DUAL Network',
          };
        });
        setProperties(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch real action logs
    fetch('/api/properties/activity')
      .then((r) => r.json())
      .then((data) => {
        setActionLogs(data.activity || []);
      })
      .catch(() => {});
  }, []);

  const filteredProperties = selectedType === 'All'
    ? properties
    : properties.filter((p) => p.type === selectedType);

  const totalVolume = properties.reduce((sum, p) => sum + p.totalValue, 0);
  const avgYield = properties.length > 0 ? properties.reduce((sum, p) => sum + p.annualYield, 0) / properties.length : 0;

  const handlePurchase = async (propertyId: string) => {
    if (!buyerEmail) { alert('Please enter your email'); return; }
    setPurchasing(true);
    setPurchaseStage('settling');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setPurchaseStage('confirming');

      const response = await fetch(`/api/properties/${propertyId}/buy-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: `listing_${propertyId}`,
          buyerEmail,
          tokenCount,
        }),
      });

      if (response.ok) {
        setPurchaseStage('complete');
      } else {
        throw new Error('Purchase failed');
      }
    } catch (error) {
      alert('Error processing purchase: ' + (error as Error).message);
      setPurchaseStage('idle');
    } finally {
      setPurchasing(false);
    }
  };

  const resetPurchase = () => {
    setShowPurchaseModal(null);
    setBuyerEmail('');
    setTokenCount(1);
    setPurchaseStage('idle');
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Hero */}
      <div className="relative overflow-hidden pt-12 pb-20">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(201, 168, 76, 0.1) 0%, transparent 60%)` }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="text-[#c9a84c] hover:text-white transition-colors flex items-center gap-1 text-sm">
              <span className="material-symbols-outlined text-sm">arrow_back</span>Back
            </Link>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif italic font-bold text-white mb-4">
            Token<br />
            <span className="bg-gradient-to-r from-[#c9a84c] to-[#a68832] bg-clip-text text-transparent">Exchange</span>
          </h1>
          <p className="text-lg text-white/60 max-w-lg">Buy and trade fractional property tokens on the <DualInline className="text-current" /> Network.</p>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Market Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Total Value Locked', value: totalVolume > 0 ? `$${(totalVolume / 1000000).toFixed(1)}M` : '$0', icon: 'trending_up' },
            { label: 'Active Properties', value: properties.length.toString(), icon: 'list_alt' },
            { label: 'Avg Annual Yield', value: avgYield > 0 ? `${avgYield.toFixed(1)}%` : '-', icon: 'show_chart' },
            { label: 'Recent Actions', value: actionLogs.length.toString(), icon: 'swap_horiz' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-6 hover:border-[#c9a84c]/20 transition-all duration-300">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-[#c9a84c]/20 to-[#a68832]/20 rounded-xl">
                  <span className="material-symbols-outlined text-[#c9a84c] text-lg">{stat.icon}</span>
                </div>
              </div>
              <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">{stat.label}</p>
              <p className="text-2xl font-serif italic font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="sticky top-20 z-40 bg-[#0a0e1a]/95 backdrop-blur-2xl border-b border-white/[0.06] py-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-12">
          <div className="flex gap-2 flex-wrap">
            {['All', 'Residential', 'Commercial', 'Mixed-Use', 'Hospitality'].map((type) => (
              <button key={type} onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  selectedType === type ? 'bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a]' : 'bg-white/[0.05] text-white/70 hover:text-white border border-white/[0.1]'
                }`}>
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Properties / Listings */}
        <div className="mb-16">
          <h2 className="text-3xl font-serif italic font-bold text-white mb-8">Available Properties</h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] p-6 animate-pulse">
                  <div className="h-6 w-3/4 rounded bg-white/[0.05] mb-4" />
                  <div className="h-4 w-1/2 rounded bg-white/[0.05] mb-8" />
                  <div className="h-10 rounded bg-white/[0.05]" />
                </div>
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-16 bg-[#111827]/40 rounded-2xl border border-white/[0.06]">
              <span className="material-symbols-outlined text-[#c9a84c] text-5xl mb-4 block">storefront</span>
              <h3 className="text-xl font-serif italic font-bold text-white mb-2">No Properties Available</h3>
              <p className="text-white/60">No tokenized properties are available for trading yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((prop) => {
                const available = prop.totalTokens - prop.tokensSold;
                return (
                  <div key={prop.id} className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-6 hover:border-[#c9a84c]/30 transition-all duration-300 group flex flex-col">
                    <div className="mb-6">
                      <h3 className="text-lg font-serif italic font-bold text-white mb-2">{prop.name}</h3>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-white/50">{prop.location}</p>
                        <span className="px-2 py-0.5 bg-[#10b981]/20 text-[#10b981] text-xs font-semibold rounded-full">{prop.type}</span>
                      </div>
                    </div>
                    <div className="space-y-3 mb-6 border-y border-white/[0.06] py-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70 text-sm">Token Price</span>
                        <span className="font-semibold text-white">{prop.tokenPrice > 0 ? `$${prop.tokenPrice.toFixed(2)}` : '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70 text-sm">Annual Yield</span>
                        <span className="font-semibold text-[#10b981]">{prop.annualYield > 0 ? `${prop.annualYield}%` : '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70 text-sm">Tokens Available</span>
                        <span className="text-white text-sm">{available > 0 ? available.toLocaleString() : 'All'}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
                        <span className="text-white/70 text-sm font-medium">Total Value</span>
                        <span className="text-lg font-serif italic font-bold text-[#c9a84c]">
                          {prop.totalValue > 0 ? `$${(prop.totalValue / 1000000).toFixed(1)}M` : '-'}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setShowPurchaseModal(prop.id)}
                      className="w-full py-3 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg hover:shadow-lg hover:shadow-[#c9a84c]/20 transition-all mt-auto">
                      Buy Tokens
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Action Logs */}
        <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-8">
          <h3 className="text-2xl font-serif italic font-bold text-white mb-8">Recent On-Chain Actions</h3>
          {actionLogs.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-white/30 text-4xl mb-3 block">receipt_long</span>
              <p className="text-white/50">No action logs recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-4 px-6 text-white/50 font-medium">Time</th>
                    <th className="text-left py-4 px-6 text-white/50 font-medium">Action</th>
                    <th className="text-right py-4 px-6 text-white/50 font-medium">Amount</th>
                    <th className="text-left py-4 px-6 text-white/50 font-medium">Status</th>
                    <th className="text-left py-4 px-6 text-white/50 font-medium">Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {actionLogs.slice(0, 15).map((log, idx) => (
                    <tr key={idx} className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 text-white/70">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-4 px-6 text-white font-medium">{log.event}</td>
                      <td className="py-4 px-6 text-right font-semibold text-[#c9a84c]">{log.amount}</td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-0.5 bg-[#10b981]/20 text-[#10b981] text-xs font-semibold rounded-full">{log.status}</span>
                      </td>
                      <td className="py-4 px-6 text-white/60 font-mono text-xs">{log.hash?.slice(0, 12)}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827]/95 border border-white/[0.06] rounded-2xl p-8 max-w-md w-full">
            {purchaseStage === 'complete' ? (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <span className="text-3xl text-green-400">✓</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-serif italic font-bold text-white mb-2">Purchase Successful!</h3>
                  <p className="text-sm text-white/70">Your tokens have been recorded on the DUAL Network.</p>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/50">Transaction:</span>
                    <a href="https://32f.blockv.io" target="_blank" rel="noopener noreferrer" className="text-[#c9a84c] hover:text-white transition-colors flex items-center gap-1">
                      View on Blockscout<span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  </div>
                </div>
                <button onClick={resetPurchase} className="w-full py-3 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg hover:shadow-lg transition-all">Close</button>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-2xl font-serif italic font-bold text-white">Purchase Tokens</h3>
                {purchaseStage === 'idle' ? (
                  <>
                    {properties.filter((p) => p.id === showPurchaseModal).map((prop) => (
                      <div key={prop.id}>
                        <div className="bg-white/[0.02] rounded-lg p-4 mb-4">
                          <p className="text-white font-medium mb-2">{prop.name}</p>
                          <p className="text-xs text-white/50">{prop.location}</p>
                        </div>
                        <div>
                          <label className="block text-sm text-white/70 mb-2">Your Email</label>
                          <input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="your@email.com"
                            className="w-full bg-white/[0.05] border border-white/[0.1] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-[#c9a84c] mb-4" />
                        </div>
                        <div>
                          <label className="block text-sm text-white/70 mb-2">Number of Tokens</label>
                          <input type="number" value={tokenCount} onChange={(e) => setTokenCount(parseInt(e.target.value) || 1)} min={1}
                            className="w-full bg-white/[0.05] border border-white/[0.1] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-[#c9a84c] mb-4" />
                        </div>
                        {prop.tokenPrice > 0 && (
                          <div className="bg-white/[0.02] rounded-lg p-4 space-y-2 text-sm mb-4">
                            <div className="flex justify-between text-white/70"><span>Price/Token:</span><span>${prop.tokenPrice.toFixed(2)}</span></div>
                            <div className="flex justify-between text-white font-semibold border-t border-white/[0.06] pt-2">
                              <span>Total:</span><span>${(prop.tokenPrice * tokenCount).toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-3">
                      <button onClick={resetPurchase} className="flex-1 py-2 bg-white/[0.05] border border-white/[0.1] text-white rounded-lg hover:border-white/[0.2] transition-colors">Cancel</button>
                      <button onClick={() => handlePurchase(showPurchaseModal)} disabled={purchasing || !buyerEmail}
                        className="flex-1 py-2 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50">
                        Settle On-Chain
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        {purchaseStage === 'settling' ? (
                          <div className="w-5 h-5 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
                        ) : (<span className="text-green-500 text-lg">✓</span>)}
                        <span className={`text-sm font-medium ${purchaseStage === 'settling' ? 'text-[#c9a84c]' : 'text-green-500'}`}>Settling Transaction</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {purchaseStage === 'confirming' ? (
                          <div className="w-5 h-5 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
                        ) : purchaseStage === 'settling' ? (
                          <div className="w-5 h-5 rounded-full border-2 border-white/[0.1]" />
                        ) : (<span className="text-green-500 text-lg">✓</span>)}
                        <span className={`text-sm font-medium ${purchaseStage === 'confirming' ? 'text-[#c9a84c]' : purchaseStage === 'settling' ? 'text-white/50' : 'text-green-500'}`}>Confirming on DUAL Network</span>
                      </div>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-4 text-center">
                      <p className="text-xs text-white/50">Settlement in progress...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
