'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TokenHolder {
  address: string;
  sharesOwned: number;
  percentOwnership: number;
  payoutAmount: number;
}

interface Property {
  id: string;
  name: string;
  type: string;
}

interface Distribution {
  id: string;
  date: string;
  property: string;
  totalAmount: number;
  holdersCount: number;
  txHash: string;
}

const mockProperties: Property[] = [
  { id: 'elysian-tower', name: 'The Elysian Tower', type: 'Residential' },
  { id: 'harbour-view', name: 'Harbour View Residences', type: 'Residential' },
  { id: 'boulevard-commerce', name: 'Boulevard Commerce Hub', type: 'Commercial' },
  { id: 'emirates-tower', name: 'Emirates Crown Tower', type: 'Mixed-Use' },
  { id: 'ocean-residences', name: 'Ocean Residences Miami', type: 'Residential' },
];

const generateMockHolders = (): TokenHolder[] => [
  {
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f42cCA',
    sharesOwned: 8450,
    percentOwnership: 0.42,
    payoutAmount: 3200,
  },
  {
    address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    sharesOwned: 6200,
    percentOwnership: 0.31,
    payoutAmount: 2340,
  },
  {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    sharesOwned: 4100,
    percentOwnership: 0.205,
    payoutAmount: 1550,
  },
  {
    address: '0x70997970C51812e339D9B73b0245ad59E9edd4FA',
    sharesOwned: 3200,
    percentOwnership: 0.16,
    payoutAmount: 1215,
  },
  {
    address: '0x3C44CdDdB6a900c6671B362144b7bEcE02A66a73',
    sharesOwned: 2100,
    percentOwnership: 0.105,
    payoutAmount: 797,
  },
];

const mockDistributionHistory: Distribution[] = [
  {
    id: 'dist_001',
    date: '2026-02-15',
    property: 'The Elysian Tower',
    totalAmount: 45000,
    holdersCount: 5,
    txHash: '0xabc123def456789ghi012jkl345mno',
  },
  {
    id: 'dist_002',
    date: '2026-01-15',
    property: 'Boulevard Commerce Hub',
    totalAmount: 38500,
    holdersCount: 6,
    txHash: '0xdef789ghi012jkl345mno678pqr901',
  },
  {
    id: 'dist_003',
    date: '2025-12-15',
    property: 'Emirates Crown Tower',
    totalAmount: 52300,
    holdersCount: 7,
    txHash: '0xghi345mno678pqr901stu234vwx567',
  },
];

export default function DistributePage() {
  const [selectedProperty, setSelectedProperty] = useState<string>(mockProperties[0].id);
  const [distributionAmount, setDistributionAmount] = useState<string>('50000');
  const [distributionPeriod, setDistributionPeriod] = useState<string>('monthly');
  const [holders, setHolders] = useState<TokenHolder[]>(generateMockHolders());
  const [isDistributing, setIsDistributing] = useState(false);
  const [distributionStage, setDistributionStage] = useState<
    'idle' | 'calculating' | 'executing' | 'recording' | 'complete'
  >('idle');
  const [completedHolders, setCompletedHolders] = useState<number>(0);

  // Recalculate payouts when amount changes
  useEffect(() => {
    const amount = parseFloat(distributionAmount) || 0;
    const totalShares = holders.reduce((sum, h) => sum + h.sharesOwned, 0);
    const payoutPerShare = totalShares > 0 ? amount / totalShares : 0;

    setHolders((prev) =>
      prev.map((h) => ({
        ...h,
        percentOwnership: (h.sharesOwned / totalShares) * 100,
        payoutAmount: h.sharesOwned * payoutPerShare,
      }))
    );
  }, [distributionAmount]);

  const selectedProp = mockProperties.find((p) => p.id === selectedProperty);
  const totalDistribution = parseFloat(distributionAmount) || 0;
  const totalShares = holders.reduce((sum, h) => sum + h.sharesOwned, 0);
  const payoutPerToken = totalShares > 0 ? totalDistribution / totalShares : 0;

  const handleExecuteDistribution = async () => {
    setIsDistributing(true);
    setDistributionStage('calculating');
    setCompletedHolders(0);

    try {
      // Stage 1: Calculating payouts
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setDistributionStage('executing');

      // Stage 2: Simulating per-holder execution
      for (let i = 0; i < holders.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setCompletedHolders(i + 1);
      }

      // Stage 3: Recording on blockchain
      setDistributionStage('recording');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Call the API
      const response = await fetch('/api/properties/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedProperty,
          amount: totalDistribution,
          period: distributionPeriod,
          holders: holders.map((h) => ({
            address: h.address,
            shares: h.sharesOwned,
            payout: h.payoutAmount,
          })),
        }),
      });

      if (response.ok) {
        setDistributionStage('complete');
      } else {
        throw new Error('Distribution failed');
      }
    } catch (error) {
      alert('Error executing distribution: ' + (error as Error).message);
      setDistributionStage('idle');
    } finally {
      setIsDistributing(false);
    }
  };

  const resetDistribution = () => {
    setDistributionStage('idle');
    setCompletedHolders(0);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-12 pb-20">
        <div className="absolute inset-0 opacity-40">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(201, 168, 76, 0.1) 0%, transparent 60%)`,
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/property/portfolio"
              className="text-[#c9a84c] hover:text-white transition-colors flex items-center gap-1 text-sm"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back
            </Link>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif italic font-bold text-white mb-4">
            Yield
            <br />
            <span className="bg-gradient-to-r from-[#c9a84c] to-[#a68832] bg-clip-text text-transparent">
              Distribution Center
            </span>
          </h1>
          <p className="text-lg text-white/60 max-w-lg">
            Execute batch dividend distribution to all property token holders.
          </p>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2">
            <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-8 space-y-8">
              {/* Property Selector */}
              <div>
                <label className="block text-sm font-medium text-white/70 uppercase tracking-wider mb-4">
                  Select Property
                </label>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  disabled={isDistributing}
                  className="w-full bg-white/[0.05] border border-white/[0.1] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#c9a84c] disabled:opacity-50 transition-colors"
                >
                  {mockProperties.map((prop) => (
                    <option key={prop.id} value={prop.id}>
                      {prop.name} ({prop.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Distribution Amount */}
              <div>
                <label className="block text-sm font-medium text-white/70 uppercase tracking-wider mb-4">
                  Total Distribution Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-white text-lg">$</span>
                  <input
                    type="number"
                    value={distributionAmount}
                    onChange={(e) => setDistributionAmount(e.target.value)}
                    disabled={isDistributing}
                    placeholder="50000"
                    className="w-full bg-white/[0.05] border border-white/[0.1] text-white pl-8 pr-4 py-3 rounded-lg focus:outline-none focus:border-[#c9a84c] disabled:opacity-50 transition-colors"
                  />
                </div>
                <p className="text-xs text-white/50 mt-2">
                  Per-token payout: ${payoutPerToken.toFixed(4)}
                </p>
              </div>

              {/* Distribution Period */}
              <div>
                <label className="block text-sm font-medium text-white/70 uppercase tracking-wider mb-4">
                  Distribution Period
                </label>
                <select
                  value={distributionPeriod}
                  onChange={(e) => setDistributionPeriod(e.target.value)}
                  disabled={isDistributing}
                  className="w-full bg-white/[0.05] border border-white/[0.1] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#c9a84c] disabled:opacity-50 transition-colors"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="semi-annual">Semi-Annual</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              {/* Token Holders Table */}
              <div>
                <h3 className="text-lg font-serif italic font-bold text-white mb-4">
                  Token Holders
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left py-3 px-4 text-white/50 font-medium">
                          Address
                        </th>
                        <th className="text-right py-3 px-4 text-white/50 font-medium">
                          Shares
                        </th>
                        <th className="text-right py-3 px-4 text-white/50 font-medium">
                          Ownership %
                        </th>
                        <th className="text-right py-3 px-4 text-white/50 font-medium">
                          Payout
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {holders.map((holder, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-4 px-4 text-white/70 font-mono text-xs">
                            {holder.address.slice(0, 10)}...{holder.address.slice(-8)}
                          </td>
                          <td className="py-4 px-4 text-right text-white">
                            {holder.sharesOwned.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-right text-white">
                            {holder.percentOwnership.toFixed(2)}%
                          </td>
                          <td className="py-4 px-4 text-right font-semibold text-[#c9a84c]">
                            ${holder.payoutAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t border-[#c9a84c]/20 bg-[#c9a84c]/5">
                        <td colSpan={4} className="py-4 px-4">
                          <div className="flex justify-between text-white font-semibold">
                            <span>Total Payout:</span>
                            <span>${totalDistribution.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Execute Button */}
              <button
                onClick={handleExecuteDistribution}
                disabled={isDistributing || distributionAmount === ''}
                className="w-full py-4 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg hover:shadow-lg hover:shadow-[#c9a84c]/20 transition-all disabled:opacity-50 text-lg uppercase tracking-wider"
              >
                {isDistributing ? `Processing... (${distributionStage})` : 'Execute Batch Distribution'}
              </button>
            </div>
          </div>

          {/* Distribution Pipeline */}
          <div className="lg:col-span-1">
            <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-8 sticky top-24">
              <h3 className="text-lg font-serif italic font-bold text-white mb-6">
                Distribution Pipeline
              </h3>

              <div className="space-y-6">
                {/* Stage 1: Calculating */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {distributionStage === 'calculating' ? (
                      <div className="w-6 h-6 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
                    ) : distributionStage === 'idle' ? (
                      <div className="w-6 h-6 rounded-full border-2 border-white/[0.1]" />
                    ) : (
                      <span className="text-green-500 text-lg">✓</span>
                    )}
                    <span
                      className={`text-sm font-medium ${
                        distributionStage === 'calculating'
                          ? 'text-[#c9a84c]'
                          : distributionStage === 'idle'
                          ? 'text-white/50'
                          : 'text-green-500'
                      }`}
                    >
                      Calculating Payouts
                    </span>
                  </div>
                  {['executing', 'recording', 'complete'].includes(distributionStage) && (
                    <div className="ml-9 h-6 w-1 bg-gradient-to-b from-green-500 to-transparent" />
                  )}
                </div>

                {/* Stage 2: Executing */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {distributionStage === 'executing' ? (
                      <div className="w-6 h-6 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
                    ) : ['recording', 'complete'].includes(distributionStage) ? (
                      <span className="text-green-500 text-lg">✓</span>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-white/[0.1]" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        distributionStage === 'executing'
                          ? 'text-[#c9a84c]'
                          : ['recording', 'complete'].includes(distributionStage)
                          ? 'text-green-500'
                          : 'text-white/50'
                      }`}
                    >
                      Executing Transfers
                    </span>
                  </div>
                  {distributionStage === 'executing' && (
                    <div className="ml-9 flex items-center gap-2">
                      <div className="text-xs text-white/60">
                        {completedHolders} / {holders.length} holders
                      </div>
                      <div className="flex-1 h-1 bg-white/[0.1] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#c9a84c] to-[#a68832] transition-all duration-300"
                          style={{ width: `${(completedHolders / holders.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {['recording', 'complete'].includes(distributionStage) && (
                    <div className="ml-9 h-6 w-1 bg-gradient-to-b from-green-500 to-transparent" />
                  )}
                </div>

                {/* Stage 3: Recording */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {distributionStage === 'recording' ? (
                      <div className="w-6 h-6 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
                    ) : distributionStage === 'complete' ? (
                      <span className="text-green-500 text-lg">✓</span>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-white/[0.1]" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        distributionStage === 'recording'
                          ? 'text-[#c9a84c]'
                          : distributionStage === 'complete'
                          ? 'text-green-500'
                          : 'text-white/50'
                      }`}
                    >
                      Recording on Blockscout
                    </span>
                  </div>
                </div>

                {/* Completion Summary */}
                {distributionStage === 'complete' && (
                  <div className="pt-6 border-t border-white/[0.06] space-y-4">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <p className="text-sm text-green-400 font-medium mb-3">
                        Distribution Complete!
                      </p>
                      <div className="space-y-2 text-xs text-white/70">
                        <div className="flex justify-between">
                          <span>Total Distributed:</span>
                          <span className="text-green-400">
                            ${totalDistribution.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Holders Paid:</span>
                          <span className="text-green-400">{holders.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Period:</span>
                          <span className="text-green-400 capitalize">{distributionPeriod}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={resetDistribution}
                      className="w-full py-2 bg-white/[0.05] border border-white/[0.1] text-white text-sm rounded-lg hover:border-[#c9a84c]/30 transition-colors"
                    >
                      New Distribution
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          {[
            {
              label: 'Total Distributed',
              value: '$1,247,500',
              icon: 'trending_up',
            },
            {
              label: 'Average Yield',
              value: '7.2%',
              icon: 'show_chart',
            },
            {
              label: 'Distribution Frequency',
              value: 'Monthly',
              icon: 'calendar_month',
            },
            {
              label: 'Active Distributions',
              value: '3',
              icon: 'payment',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-6 hover:border-[#c9a84c]/20 transition-all duration-300 group"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-[#c9a84c]/20 to-[#a68832]/20 rounded-xl group-hover:from-[#c9a84c]/30 group-hover:to-[#a68832]/30 transition-colors">
                  <span className="material-symbols-outlined text-[#c9a84c] text-lg">
                    {stat.icon}
                  </span>
                </div>
              </div>
              <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                {stat.label}
              </p>
              <p className="text-2xl font-serif italic font-bold text-white">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Distribution History */}
        <div className="mt-12">
          <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-8">
            <h3 className="text-2xl font-serif italic font-bold text-white mb-8">
              Distribution History
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-4 px-6 text-white/50 font-medium">Date</th>
                    <th className="text-left py-4 px-6 text-white/50 font-medium">Property</th>
                    <th className="text-right py-4 px-6 text-white/50 font-medium">
                      Total Amount
                    </th>
                    <th className="text-right py-4 px-6 text-white/50 font-medium">
                      Holders
                    </th>
                    <th className="text-left py-4 px-6 text-white/50 font-medium">Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {mockDistributionHistory.map((dist, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 px-6 text-white">
                        {new Date(dist.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-white/70">{dist.property}</td>
                      <td className="py-4 px-6 text-right font-semibold text-[#c9a84c]">
                        ${dist.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right text-white">{dist.holdersCount}</td>
                      <td className="py-4 px-6 text-white/60 font-mono text-xs">
                        <a
                          href={`https://32f.blockv.io/tx/${dist.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#c9a84c] transition-colors flex items-center gap-1 group"
                        >
                          {dist.txHash.slice(0, 12)}...
                          <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            open_in_new
                          </span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
