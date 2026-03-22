'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Holding {
  id: string;
  name: string;
  location: string;
  sharesOwned: number;
  totalShares: number;
  currentValue: number;
  purchaseValue: number;
  monthlyYield: number;
  imageGradient: string;
}

const mockHoldings: Holding[] = [
  {
    id: 'elysian-tower',
    name: 'The Elysian Tower',
    location: 'Manhattan, New York',
    sharesOwned: 8450,
    totalShares: 2000000,
    currentValue: 1058900,
    purchaseValue: 945000,
    monthlyYield: 4850,
    imageGradient: 'from-amber-900 via-orange-800 to-red-900',
  },
  {
    id: 'harbour-view',
    name: 'Harbour View Residences',
    location: 'Sydney, Australia',
    sharesOwned: 5200,
    totalShares: 1920000,
    currentValue: 511264,
    purchaseValue: 475200,
    monthlyYield: 3125,
    imageGradient: 'from-blue-900 via-cyan-800 to-teal-900',
  },
  {
    id: 'boulevard-commerce',
    name: 'Boulevard Commerce Hub',
    location: 'London, UK',
    sharesOwned: 6800,
    totalShares: 1789000,
    currentValue: 595680,
    purchaseValue: 548000,
    monthlyYield: 4012,
    imageGradient: 'from-slate-800 via-gray-700 to-zinc-800',
  },
  {
    id: 'emirates-tower',
    name: 'Emirates Crown Tower',
    location: 'Dubai, UAE',
    sharesOwned: 4200,
    totalShares: 2100000,
    currentValue: 656400,
    purchaseValue: 589200,
    monthlyYield: 4312,
    imageGradient: 'from-yellow-900 via-amber-800 to-orange-900',
  },
  {
    id: 'ocean-residences',
    name: 'Ocean Residences Miami',
    location: 'Miami, Florida',
    sharesOwned: 5900,
    totalShares: 1867000,
    currentValue: 618520,
    purchaseValue: 569600,
    monthlyYield: 3705,
    imageGradient: 'from-pink-900 via-rose-800 to-red-900',
  },
];

export default function PortfolioPage() {
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  const [liveHoldings, setLiveHoldings] = useState<Holding[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState<string | null>(null);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [chainActivity, setChainActivity] = useState<any[]>([]);

  // Fetch live properties and chain activity
  useEffect(() => {
    fetch('/api/properties')
      .then((r) => r.json())
      .then((data) => {
        // Map API properties to holdings (if user owns them)
        const props = data.properties || [];
        // For demo, just fetch the mock holdings
      })
      .catch(() => {});

    // Fetch chain activity
    fetch('/api/properties/activity')
      .then((r) => r.json())
      .then((data) => {
        setChainActivity(data.activity || []);
      })
      .catch(() => {});
  }, []);

  // Number animation effect
  useEffect(() => {
    const allHoldings = [...liveHoldings, ...mockHoldings];
    const targets = {
      totalInvestment: allHoldings.reduce((sum, h) => sum + h.currentValue, 0),
      totalYield: allHoldings.reduce(
        (sum, h) => sum + (h.currentValue - h.purchaseValue),
        0
      ),
      monthlyIncome: allHoldings.reduce((sum, h) => sum + h.monthlyYield, 0),
    };

    Object.keys(targets).forEach((key) => {
      let current = 0;
      const target = targets[key as keyof typeof targets];
      const increment = target / 30;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setAnimatedValues((prev) => ({
          ...prev,
          [key]: current,
        }));
      }, 30);

      return () => clearInterval(timer);
    });
  }, [liveHoldings]);

  const allHoldings = [...liveHoldings, ...mockHoldings];
  const totalInvestment = allHoldings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalYield = allHoldings.reduce(
    (sum, h) => sum + (h.currentValue - h.purchaseValue),
    0
  );
  const monthlyIncome = allHoldings.reduce((sum, h) => sum + h.monthlyYield, 0);
  const gainPercent =
    (totalYield /
      allHoldings.reduce((sum, h) => sum + h.purchaseValue, 0)) *
    100;

  const handleClaimYield = async (propertyId: string) => {
    setClaimingId(propertyId);
    try {
      const response = await fetch(
        `/api/properties/${propertyId}/claim-yield`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setClaimSuccess(propertyId);
        setTimeout(() => setClaimSuccess(null), 3000);
      }
    } catch (error) {
      alert('Error claiming yield');
    } finally {
      setClaimingId(null);
    }
  };

  const handleTransfer = async (propertyId: string) => {
    if (!transferEmail) {
      alert('Please enter an email address');
      return;
    }

    setTransferring(true);
    try {
      const response = await fetch(`/api/properties/${propertyId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: transferEmail,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(
          `Transfer initiated! Transaction: ${data.transactionHash}`
        );
        setShowTransferModal(null);
        setTransferEmail('');
      } else {
        alert('Transfer failed: ' + data.error);
      }
    } catch (error) {
      alert('Error processing transfer');
    } finally {
      setTransferring(false);
    }
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
          <h1 className="text-5xl md:text-6xl font-serif italic font-bold text-white mb-4">
            Your
            <br />
            <span className="bg-gradient-to-r from-[#c9a84c] to-[#a68832] bg-clip-text text-transparent">
              Portfolio
            </span>
          </h1>
          <p className="text-lg text-white/60 max-w-lg">
            Track your investments and yield earnings across all DUAL properties.
          </p>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: 'Total Investment Value',
              value: `$${(animatedValues.totalInvestment || 0).toLocaleString('en-US', {
                maximumFractionDigits: 0,
              })}`,
              subtext: 'Current market value',
              icon: 'wallet',
              color: 'from-[#c9a84c] to-[#a68832]',
            },
            {
              label: 'Total Unrealized Gain',
              value: `$${(animatedValues.totalYield || 0).toLocaleString('en-US', {
                maximumFractionDigits: 0,
              })}`,
              subtext: `+${gainPercent.toFixed(1)}% return`,
              icon: 'trending_up',
              color: 'from-[#10b981] to-[#059669]',
            },
            {
              label: 'Properties Owned',
              value: `${allHoldings.length}`,
              subtext: 'Active investments',
              icon: 'domain',
              color: 'from-blue-500 to-cyan-500',
            },
            {
              label: 'Monthly Income',
              value: `$${(animatedValues.monthlyIncome || 0).toLocaleString('en-US', {
                maximumFractionDigits: 0,
              })}`,
              subtext: 'Average monthly yield',
              icon: 'paid',
              color: 'from-purple-500 to-pink-500',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-6 hover:border-[#c9a84c]/20 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl opacity-10 group-hover:opacity-20 transition-opacity`}
                >
                  <span
                    className={`material-symbols-outlined text-2xl bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}
                  >
                    {stat.icon}
                  </span>
                </div>
              </div>
              <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                {stat.label}
              </p>
              <p className="text-3xl font-serif italic font-bold text-white mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-white/50">{stat.subtext}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Holdings Grid */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <h2 className="text-3xl font-serif italic font-bold text-white mb-8">
          Your Holdings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allHoldings.map((holding) => {
            const gainLoss = holding.currentValue - holding.purchaseValue;
            const gainPercent = (gainLoss / holding.purchaseValue) * 100;

            return (
              <Link key={holding.id} href={`/property/${holding.id}`}>
                <div className="group cursor-pointer h-full">
                  <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden hover:border-[#c9a84c]/30 transition-all duration-500 h-full flex flex-col transform hover:scale-105">
                    {/* Image Area */}
                    <div
                      className={`h-32 bg-gradient-to-br ${holding.imageGradient} relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20" />
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <div className="px-3 py-1 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] text-xs font-bold rounded-full">
                          {(
                            (holding.sharesOwned / holding.totalShares) *
                            100
                          ).toFixed(2)}
                          %
                        </div>
                      </div>
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                      {/* Name & Location */}
                      <div className="mb-4">
                        <h3 className="text-lg font-serif italic font-bold text-white mb-1">
                          {holding.name}
                        </h3>
                        <p className="text-sm text-white/60 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            location_on
                          </span>
                          {holding.location}
                        </p>
                      </div>

                      {/* Shares */}
                      <div className="pb-4 border-b border-white/[0.06]">
                        <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                          Your Shares
                        </p>
                        <p className="font-mono text-sm text-white">
                          {holding.sharesOwned.toLocaleString()} / {holding.totalShares.toLocaleString()}
                        </p>
                      </div>

                      {/* Values */}
                      <div className="py-4 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-white/70">Current Value</span>
                          <span className="font-semibold text-white">
                            ${holding.currentValue.toLocaleString('en-US', {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-white/70">Gain/Loss</span>
                          <div className="text-right">
                            <p
                              className={`font-semibold ${
                                gainLoss >= 0 ? 'text-[#10b981]' : 'text-red-500'
                              }`}
                            >
                              ${gainLoss.toLocaleString('en-US', {
                                maximumFractionDigits: 0,
                              })}
                            </p>
                            <p
                              className={`text-xs ${
                                gainPercent >= 0
                                  ? 'text-[#10b981]'
                                  : 'text-red-500'
                              }`}
                            >
                              {gainPercent >= 0 ? '+' : ''}
                              {gainPercent.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-white/70">Monthly Yield</span>
                          <span className="font-semibold text-[#10b981]">
                            ${holding.monthlyYield.toLocaleString('en-US', {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.06]">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleClaimYield(holding.id);
                          }}
                          disabled={claimingId === holding.id}
                          className="py-2 px-4 bg-[#10b981]/20 border border-[#10b981]/50 text-[#10b981] text-sm font-semibold rounded-lg hover:bg-[#10b981]/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {claimSuccess === holding.id ? (
                            <>
                              <span className="material-symbols-outlined text-sm">
                                check_circle
                              </span>
                              Claimed!
                            </>
                          ) : claimingId === holding.id ? (
                            <>
                              <span className="material-symbols-outlined text-sm animate-spin">
                                hourglass_empty
                              </span>
                              Claiming...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm">
                                check_circle
                              </span>
                              Claim Yield
                            </>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setShowTransferModal(holding.id);
                          }}
                          className="py-2 px-4 bg-white/[0.05] border border-white/[0.1] text-white text-sm font-semibold rounded-lg hover:border-[#c9a84c]/30 transition-colors flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">
                            send
                          </span>
                          Transfer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Yield History */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-8">
          <h3 className="text-2xl font-serif italic font-bold text-white mb-8">
            Yield History
          </h3>

          {/* Monthly Chart */}
          <div className="mb-8">
            <div className="grid grid-cols-12 gap-1 items-end h-64">
              {[
                12500, 13200, 11800, 14300, 15100, 16400, 17200, 18900, 19800,
                20400, 21200, 20800,
              ].map((amount, i) => (
                <div key={i} className="flex flex-col items-center gap-3 flex-1">
                  <div
                    className="w-full bg-gradient-to-t from-[#c9a84c] to-[#a68832] rounded-t-lg hover:from-[#d4b85d] hover:to-[#b59845] transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-[#c9a84c]/20 group"
                    style={{ height: `${(amount / 21200) * 100}%` }}
                  >
                    <div className="h-full flex items-start justify-center pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-[#0a0e1a] font-semibold">
                        ${(amount / 1000).toFixed(0)}K
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-white/50">M{i + 1}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-white/[0.06]">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                Total Claimed
              </p>
              <p className="text-2xl font-serif italic font-bold text-white">
                $184.2K
              </p>
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                Average Monthly
              </p>
              <p className="text-2xl font-serif italic font-bold text-white">
                $15.4K
              </p>
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                Best Month
              </p>
              <p className="text-2xl font-serif italic font-bold text-[#10b981]">
                $21.2K
              </p>
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                Next Payout
              </p>
              <p className="text-2xl font-serif italic font-bold text-white">
                5 Days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chain Activity */}
      {chainActivity.length > 0 && (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-8">
            <h3 className="text-2xl font-serif italic font-bold text-white mb-8">
              Recent On-Chain Activity
            </h3>
            <div className="space-y-3">
              {chainActivity.slice(0, 5).map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-white/[0.03] rounded-lg border border-white/[0.06] hover:border-[#c9a84c]/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {activity.event}
                    </p>
                    <p className="text-xs text-white/50 font-mono">
                      {activity.hash?.slice(0, 16)}...
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#c9a84c]">
                      {activity.amount}
                    </p>
                    <p className="text-xs text-white/50">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <a
              href="https://32f.blockv.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 mt-6 p-3 bg-[#c9a84c]/10 border border-[#c9a84c]/30 rounded-lg text-[#c9a84c] hover:bg-[#c9a84c]/20 transition-colors"
            >
              <span className="material-symbols-outlined">open_in_new</span>
              View All Transactions on Blockscout
            </a>
          </div>
        </div>
      )}

      {/* Yield Distribution Schedule */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-r from-[#c9a84c]/10 to-[#a68832]/10 border border-[#c9a84c]/20 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-serif italic font-bold text-white mb-2">
                Yield Distribution Schedule
              </h3>
              <p className="text-white/70">
                Your monthly yield is automatically calculated and distributed on
                the first business day of each month. Unclaimed yields can be
                claimed anytime from your dashboard.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[#c9a84c]">
              <span className="material-symbols-outlined text-3xl">
                calendar_month
              </span>
              <div>
                <p className="text-sm font-semibold">Monthly Distribution</p>
                <p className="text-xs opacity-70">1st of each month</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              'Automatic Calculation',
              'Transparent Reporting',
              'Flexible Claiming',
              'Compound Growth',
            ].map((feature, i) => (
              <div
                key={i}
                className="p-4 bg-white/[0.02] rounded-xl border border-[#c9a84c]/10 flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-[#c9a84c]">
                  done
                </span>
                <span className="text-sm text-white/80">{feature}</span>
              </div>
            ))}
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
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowTransferModal(null);
                    setTransferEmail('');
                  }}
                  className="flex-1 py-2 bg-white/[0.05] border border-white/[0.1] text-white rounded-lg hover:border-white/[0.2] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleTransfer(showTransferModal)}
                  disabled={transferring || !transferEmail}
                  className="flex-1 py-2 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {transferring ? 'Transferring...' : 'Transfer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
