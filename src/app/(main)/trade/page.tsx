'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Listing {
  id: string;
  propertyId: string;
  propertyName: string;
  tokenCount: number;
  pricePerToken: number;
  totalValue: number;
  sellerRating: number;
  premium: number;
  originalTokenPrice: number;
}

interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

interface TradeHistory {
  id: string;
  timestamp: string;
  tokenCount: number;
  pricePerToken: number;
  totalValue: number;
  buyer: string;
  seller: string;
}

const mockProperties = [
  { id: 'elysian-tower', name: 'The Elysian Tower', type: 'Residential' },
  { id: 'harbour-view', name: 'Harbour View Residences', type: 'Residential' },
  { id: 'boulevard-commerce', name: 'Boulevard Commerce Hub', type: 'Commercial' },
  { id: 'emirates-tower', name: 'Emirates Crown Tower', type: 'Mixed-Use' },
  { id: 'marina-prestige', name: 'Marina Prestige Hotel', type: 'Hospitality' },
];

const mockListings: Listing[] = [
  {
    id: 'list_001',
    propertyId: 'elysian-tower',
    propertyName: 'The Elysian Tower',
    tokenCount: 500,
    pricePerToken: 128.5,
    totalValue: 64250,
    sellerRating: 4.9,
    premium: 2.4,
    originalTokenPrice: 125.45,
  },
  {
    id: 'list_002',
    propertyId: 'harbour-view',
    propertyName: 'Harbour View Residences',
    tokenCount: 320,
    pricePerToken: 96.8,
    totalValue: 30976,
    sellerRating: 4.7,
    premium: -1.5,
    originalTokenPrice: 98.32,
  },
  {
    id: 'list_003',
    propertyId: 'boulevard-commerce',
    propertyName: 'Boulevard Commerce Hub',
    tokenCount: 750,
    pricePerToken: 89.2,
    totalValue: 66900,
    sellerRating: 4.8,
    premium: 1.8,
    originalTokenPrice: 87.6,
  },
  {
    id: 'list_004',
    propertyId: 'emirates-tower',
    propertyName: 'Emirates Crown Tower',
    tokenCount: 200,
    pricePerToken: 159.5,
    totalValue: 31900,
    sellerRating: 5.0,
    premium: 2.1,
    originalTokenPrice: 156.2,
  },
  {
    id: 'list_005',
    propertyId: 'marina-prestige',
    propertyName: 'Marina Prestige Hotel',
    tokenCount: 450,
    pricePerToken: 73.8,
    totalValue: 33210,
    sellerRating: 4.6,
    premium: 3.5,
    originalTokenPrice: 71.25,
  },
  {
    id: 'list_006',
    propertyId: 'boulevard-commerce',
    propertyName: 'Boulevard Commerce Hub',
    tokenCount: 600,
    pricePerToken: 87.9,
    totalValue: 52740,
    sellerRating: 4.5,
    premium: 0.3,
    originalTokenPrice: 87.6,
  },
];

const mockTradeHistory: TradeHistory[] = [
  {
    id: 'trade_001',
    timestamp: '2026-03-21T14:30:00Z',
    tokenCount: 250,
    pricePerToken: 127.5,
    totalValue: 31875,
    buyer: '0x742d35...cCA',
    seller: '0x8ba1f1...a72',
  },
  {
    id: 'trade_002',
    timestamp: '2026-03-21T13:15:00Z',
    tokenCount: 400,
    pricePerToken: 95.2,
    totalValue: 38080,
    buyer: '0xf39Fd6...266',
    seller: '0x70997...FA',
  },
  {
    id: 'trade_003',
    timestamp: '2026-03-21T12:45:00Z',
    tokenCount: 150,
    pricePerToken: 159.0,
    totalValue: 23850,
    buyer: '0x3C44Cd...e73',
    seller: '0x90F79...5Bf',
  },
];

export default function TradePage() {
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedProperty, setSelectedProperty] = useState<string>('elysian-tower');
  const [showPurchaseModal, setShowPurchaseModal] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseStage, setPurchaseStage] = useState<
    'idle' | 'settling' | 'confirming' | 'complete'
  >('idle');

  const filteredListings =
    selectedType === 'All'
      ? mockListings
      : mockListings.filter(
          (l) =>
            mockProperties.find((p) => p.id === l.propertyId)?.type ===
            selectedType
        );

  const currentProperty = mockProperties.find((p) => p.id === selectedProperty);
  const propertyListings = filteredListings.filter(
    (l) => l.propertyId === selectedProperty
  );

  const marketStats = {
    totalVolume: 1245000,
    activeListings: filteredListings.length,
    avgPremium:
      filteredListings.reduce((sum, l) => sum + l.premium, 0) /
      filteredListings.length,
    trades24h: 12,
  };

  const generateOrderBook = (): {
    buyOrders: OrderBookEntry[];
    sellOrders: OrderBookEntry[];
  } => {
    const basePrice = 125;
    const buyOrders: OrderBookEntry[] = [
      { price: 124.5, quantity: 150, total: 18675 },
      { price: 123.8, quantity: 200, total: 24760 },
      { price: 123.0, quantity: 100, total: 12300 },
    ];
    const sellOrders: OrderBookEntry[] = [
      { price: 126.5, quantity: 180, total: 22770 },
      { price: 127.2, quantity: 220, total: 27984 },
      { price: 128.0, quantity: 160, total: 20480 },
    ];
    return { buyOrders, sellOrders };
  };

  const orderBook = generateOrderBook();

  const handlePurchase = async (listingId: string) => {
    if (!buyerEmail) {
      alert('Please enter your email');
      return;
    }

    setPurchasing(true);
    setPurchaseStage('settling');

    try {
      // Stage 1: Settling
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setPurchaseStage('confirming');

      // Stage 2: Confirming
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Get listing details
      const listing = mockListings.find((l) => l.id === listingId);
      if (!listing) throw new Error('Listing not found');

      // Call API
      const response = await fetch(
        `/api/properties/${listing.propertyId}/buy-tokens`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId,
            buyerEmail,
            tokenCount: listing.tokenCount,
          }),
        }
      );

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
    setPurchaseStage('idle');
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
              href="/property"
              className="text-[#c9a84c] hover:text-white transition-colors flex items-center gap-1 text-sm"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back
            </Link>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif italic font-bold text-white mb-4">
            Token
            <br />
            <span className="bg-gradient-to-r from-[#c9a84c] to-[#a68832] bg-clip-text text-transparent">
              Exchange
            </span>
          </h1>
          <p className="text-lg text-white/60 max-w-lg">
            Secondary market for buying and selling fractional property tokens.
          </p>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Market Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            {
              label: 'Total Volume',
              value: `$${(marketStats.totalVolume / 1000).toFixed(0)}K`,
              icon: 'trending_up',
            },
            {
              label: 'Active Listings',
              value: marketStats.activeListings.toString(),
              icon: 'list_alt',
            },
            {
              label: 'Avg Premium',
              value: `${marketStats.avgPremium.toFixed(2)}%`,
              icon: 'show_chart',
            },
            {
              label: '24h Trades',
              value: marketStats.trades24h.toString(),
              icon: 'swap_horiz',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-6 hover:border-[#c9a84c]/20 transition-all duration-300"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-[#c9a84c]/20 to-[#a68832]/20 rounded-xl">
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

        {/* Property Filters */}
        <div className="sticky top-20 z-40 bg-[#0a0e1a]/95 backdrop-blur-2xl border-b border-white/[0.06] py-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-12">
          <div className="flex gap-2 flex-wrap">
            {['All', 'Residential', 'Commercial', 'Mixed-Use', 'Hospitality'].map(
              (type) => (
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
              )
            )}
          </div>
        </div>

        {/* Listings Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-serif italic font-bold text-white mb-8">
            Active Listings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-6 hover:border-[#c9a84c]/30 transition-all duration-300 group flex flex-col"
              >
                {/* Header */}
                <div className="mb-6">
                  <h3 className="text-lg font-serif italic font-bold text-white mb-2">
                    {listing.propertyName}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white/50">
                      {listing.tokenCount.toLocaleString()} tokens available
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-[#c9a84c]">
                        star
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {listing.sellerRating}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-3 mb-6 border-y border-white/[0.06] py-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Price per Token</span>
                    <span className="font-semibold text-white">
                      ${listing.pricePerToken.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Original Price</span>
                    <span className="text-xs text-white/50">
                      ${listing.originalTokenPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Premium/Discount</span>
                    <span
                      className={`font-semibold text-sm ${
                        listing.premium >= 0
                          ? 'text-[#c9a84c]'
                          : 'text-red-400'
                      }`}
                    >
                      {listing.premium >= 0 ? '+' : ''}{listing.premium.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
                    <span className="text-white/70 text-sm font-medium">Total Value</span>
                    <span className="text-lg font-serif italic font-bold text-[#c9a84c]">
                      ${listing.totalValue.toLocaleString('en-US', {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                </div>

                {/* Buy Button */}
                <button
                  onClick={() => setShowPurchaseModal(listing.id)}
                  className="w-full py-3 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg hover:shadow-lg hover:shadow-[#c9a84c]/20 transition-all mt-auto"
                >
                  Buy Tokens
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Order Book for Selected Property */}
        {currentProperty && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Buy Orders */}
            <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-8">
              <h3 className="text-lg font-serif italic font-bold text-[#10b981] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined">trending_down</span>
                Buy Orders
              </h3>
              <div className="space-y-2">
                {orderBook.buyOrders.map((order, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-[#10b981]/10 rounded-lg border border-[#10b981]/20"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#10b981]">
                        ${order.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-white/50">
                        {order.quantity.toLocaleString()} tokens
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      ${order.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sell Orders */}
            <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-8">
              <h3 className="text-lg font-serif italic font-bold text-[#c9a84c] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined">trending_up</span>
                Sell Orders
              </h3>
              <div className="space-y-2">
                {orderBook.sellOrders.map((order, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-[#c9a84c]/10 rounded-lg border border-[#c9a84c]/20"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#c9a84c]">
                        ${order.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-white/50">
                        {order.quantity.toLocaleString()} tokens
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      ${order.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Trades */}
        <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-8">
          <h3 className="text-2xl font-serif italic font-bold text-white mb-8">
            Recent Trades
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-4 px-6 text-white/50 font-medium">
                    Time
                  </th>
                  <th className="text-left py-4 px-6 text-white/50 font-medium">
                    Tokens
                  </th>
                  <th className="text-right py-4 px-6 text-white/50 font-medium">
                    Price/Token
                  </th>
                  <th className="text-right py-4 px-6 text-white/50 font-medium">
                    Total Value
                  </th>
                  <th className="text-left py-4 px-6 text-white/50 font-medium">
                    From
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockTradeHistory.map((trade, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 px-6 text-white/70">
                      {new Date(trade.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-4 px-6 text-white font-medium">
                      {trade.tokenCount.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right text-white">
                      ${trade.pricePerToken.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-[#c9a84c]">
                      ${trade.totalValue.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-white/60 font-mono text-xs">
                      {trade.seller.slice(0, 8)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827]/95 border border-white/[0.06] rounded-2xl p-8 max-w-md w-full">
            {purchaseStage === 'complete' ? (
              // Success State
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <span className="text-3xl text-green-400">✓</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-serif italic font-bold text-white mb-2">
                    Purchase Successful!
                  </h3>
                  <p className="text-sm text-white/70">
                    Your tokens have been transferred to your wallet.
                  </p>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/50">Transaction:</span>
                    <a
                      href="https://32f.blockv.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#c9a84c] hover:text-white transition-colors flex items-center gap-1"
                    >
                      View on Blockscout
                      <span className="material-symbols-outlined text-xs">
                        open_in_new
                      </span>
                    </a>
                  </div>
                </div>
                <button
                  onClick={resetPurchase}
                  className="w-full py-3 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Close
                </button>
              </div>
            ) : (
              // Purchase Form
              <div className="space-y-6">
                <h3 className="text-2xl font-serif italic font-bold text-white">
                  Purchase Tokens
                </h3>

                {purchaseStage === 'idle' ? (
                  <>
                    <div>
                      <label className="block text-sm text-white/70 mb-2">
                        Your Email
                      </label>
                      <input
                        type="email"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full bg-white/[0.05] border border-white/[0.1] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-[#c9a84c]"
                      />
                    </div>

                    <div className="bg-white/[0.02] rounded-lg p-4 space-y-2 text-sm">
                      {mockListings
                        .filter((l) => l.id === showPurchaseModal)
                        .map((listing) => (
                          <div key={listing.id}>
                            <p className="text-white font-medium mb-3">
                              {listing.propertyName}
                            </p>
                            <div className="flex justify-between text-white/70 mb-2">
                              <span>Tokens:</span>
                              <span>{listing.tokenCount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-white/70 mb-3 pb-3 border-b border-white/[0.06]">
                              <span>Price per Token:</span>
                              <span>${listing.pricePerToken.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-white font-semibold">
                              <span>Total:</span>
                              <span>${listing.totalValue.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => resetPurchase()}
                        className="flex-1 py-2 bg-white/[0.05] border border-white/[0.1] text-white rounded-lg hover:border-white/[0.2] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handlePurchase(showPurchaseModal)}
                        disabled={purchasing || !buyerEmail}
                        className="flex-1 py-2 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        Settle On-Chain
                      </button>
                    </div>
                  </>
                ) : (
                  // Settlement Animation
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {/* Stage 1: Settling */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          {purchaseStage === 'settling' ? (
                            <div className="w-5 h-5 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
                          ) : (
                            <span className="text-green-500 text-lg">✓</span>
                          )}
                          <span
                            className={`text-sm font-medium ${
                              purchaseStage === 'settling'
                                ? 'text-[#c9a84c]'
                                : 'text-green-500'
                            }`}
                          >
                            Settling Transaction
                          </span>
                        </div>
                      </div>

                      {/* Stage 2: Confirming */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          {purchaseStage === 'confirming' ? (
                            <div className="w-5 h-5 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
                          ) : purchaseStage === 'settling' ? (
                            <div className="w-5 h-5 rounded-full border-2 border-white/[0.1]" />
                          ) : (
                            <span className="text-green-500 text-lg">✓</span>
                          )}
                          <span
                            className={`text-sm font-medium ${
                              purchaseStage === 'confirming'
                                ? 'text-[#c9a84c]'
                                : purchaseStage === 'settling'
                                ? 'text-white/50'
                                : 'text-green-500'
                            }`}
                          >
                            Confirming on Chain
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/[0.02] rounded-lg p-4 text-center">
                      <p className="text-xs text-white/50">
                        Settlement in progress...
                      </p>
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
