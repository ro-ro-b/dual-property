'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

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
}

const mockProperties: Record<string, Property> = {
  'elysian-tower': {
    id: 'elysian-tower',
    name: 'The Elysian Tower',
    location: '432 Park Avenue, Manhattan, New York',
    type: 'Residential',
    totalValue: 247500000,
    tokenPrice: 125.45,
    yieldPercent: 6.8,
    fundedPercent: 94,
    sqft: 425000,
    imageGradient: 'from-amber-900 via-orange-800 to-red-900',
    yearBuilt: 2015,
    units: 428,
    description:
      'A stunning residential tower in the heart of Manhattan offering unparalleled luxury and investment returns. Premium finishes, world-class amenities, and exceptional location.',
    features: [
      'Rooftop infinity pool',
      'Private cinema',
      'Concierge service',
      'Underground parking',
      'Smart home integration',
      'Floor-to-ceiling windows',
    ],
    rentalIncome: 18500000,
    expenses: 4200000,
    capRate: 5.8,
    projectedReturn: 12.4,
  },
  'harbour-view': {
    id: 'harbour-view',
    name: 'Harbour View Residences',
    location: '26 Martin Place, Sydney, Australia',
    type: 'Residential',
    totalValue: 189300000,
    tokenPrice: 98.32,
    yieldPercent: 7.4,
    fundedPercent: 88,
    sqft: 312000,
    imageGradient: 'from-blue-900 via-cyan-800 to-teal-900',
    yearBuilt: 2018,
    units: 284,
    description:
      'Iconic Sydney harbour-view complex combining modern architecture with premium amenities. Strong rental demand and capital appreciation.',
    features: [
      'Harbour views',
      'Infinity pool complex',
      'Yoga studios',
      'Wine cellar',
      'Business center',
      'Waterfront terrace',
    ],
    rentalIncome: 14100000,
    expenses: 3100000,
    capRate: 5.9,
    projectedReturn: 11.8,
  },
  'boulevard-commerce': {
    id: 'boulevard-commerce',
    name: 'Boulevard Commerce Hub',
    location: '100 Bishopsgate, London, UK',
    type: 'Commercial',
    totalValue: 156800000,
    tokenPrice: 87.6,
    yieldPercent: 8.1,
    fundedPercent: 96,
    sqft: 280000,
    imageGradient: 'from-slate-800 via-gray-700 to-zinc-800',
    yearBuilt: 2020,
    units: 15,
    description:
      "Premium commercial office space in London's financial district. Multi-tenant portfolio with strong tenant quality and long lease terms.",
    features: [
      'Grade A office space',
      'Trading floors',
      'Conference facilities',
      'Fiber connectivity',
      'Terraces & gardens',
      '24/7 security',
    ],
    rentalIncome: 12800000,
    expenses: 2400000,
    capRate: 6.6,
    projectedReturn: 13.2,
  },
  'emirates-tower': {
    id: 'emirates-tower',
    name: 'Emirates Crown Tower',
    location: 'Downtown Dubai, United Arab Emirates',
    type: 'Mixed-Use',
    totalValue: 328750000,
    tokenPrice: 156.2,
    yieldPercent: 7.9,
    fundedPercent: 92,
    sqft: 580000,
    imageGradient: 'from-yellow-900 via-amber-800 to-orange-900',
    yearBuilt: 2019,
    units: 612,
    description:
      'Ultra-luxury mixed-use development with residential, commercial, and hospitality components. Prime Dubai location with exceptional investment dynamics.',
    features: [
      'Penthouses & villas',
      'High-end retail',
      '5-star hotel',
      'Spa facilities',
      'Fine dining',
      'Smart building systems',
    ],
    rentalIncome: 25900000,
    expenses: 5200000,
    capRate: 6.3,
    projectedReturn: 12.1,
  },
  'marina-prestige': {
    id: 'marina-prestige',
    name: 'Marina Prestige Hotel',
    location: 'Marina Bay, Singapore',
    type: 'Hospitality',
    totalValue: 142500000,
    tokenPrice: 71.25,
    yieldPercent: 8.5,
    fundedPercent: 87,
    sqft: 198000,
    imageGradient: 'from-indigo-900 via-blue-800 to-purple-900',
    yearBuilt: 2017,
    units: 385,
    description:
      "Premium 5-star hotel in Singapore's most prestigious waterfront location. Strong occupancy rates and premium pricing power.",
    features: [
      'Luxury rooms & suites',
      'Rooftop restaurant',
      'Olympic pool',
      'Wellness center',
      'Convention halls',
      'Waterfront lounge',
    ],
    rentalIncome: 12100000,
    expenses: 2800000,
    capRate: 6.4,
    projectedReturn: 13.5,
  },
  'ocean-residences': {
    id: 'ocean-residences',
    name: 'Ocean Residences Miami',
    location: 'South Beach, Miami, Florida',
    type: 'Residential',
    totalValue: 195600000,
    tokenPrice: 104.8,
    yieldPercent: 7.2,
    fundedPercent: 91,
    sqft: 356000,
    imageGradient: 'from-pink-900 via-rose-800 to-red-900',
    yearBuilt: 2016,
    units: 312,
    description:
      "Luxury beachfront residential complex in Miami's most sought-after location. High appreciation potential with strong rental yields.",
    features: [
      'Beach access',
      'Infinity pools',
      'Beach club',
      'Tennis courts',
      'Spa services',
      'Ocean views',
    ],
    rentalIncome: 14000000,
    expenses: 3300000,
    capRate: 5.4,
    projectedReturn: 11.2,
  },
  'fintech-plaza': {
    id: 'fintech-plaza',
    name: 'FinTech Plaza',
    location: 'one-north, Singapore',
    type: 'Commercial',
    totalValue: 178900000,
    tokenPrice: 95.45,
    yieldPercent: 7.6,
    fundedPercent: 89,
    sqft: 320000,
    imageGradient: 'from-emerald-900 via-green-800 to-teal-900',
    yearBuilt: 2021,
    units: 18,
    description:
      "State-of-the-art innovation hub for fintech and tech companies. Exceptional location in Singapore's tech corridor with high-quality tenants.",
    features: [
      'Co-working spaces',
      'Innovation labs',
      'High-speed internet',
      'Meeting rooms',
      'Cafes & lounge',
      'Security & access',
    ],
    rentalIncome: 13600000,
    expenses: 2900000,
    capRate: 5.9,
    projectedReturn: 12.3,
  },
  'manhattan-luxury': {
    id: 'manhattan-luxury',
    name: 'Manhattan Luxury Suites',
    location: 'Midtown Manhattan, New York',
    type: 'Hospitality',
    totalValue: 212400000,
    tokenPrice: 119.2,
    yieldPercent: 8.2,
    fundedPercent: 85,
    sqft: 234000,
    imageGradient: 'from-purple-900 via-indigo-800 to-blue-900',
    yearBuilt: 2014,
    units: 324,
    description:
      'Premium luxury hotel collection in the heart of Manhattan. Premium rates and strong operational performance.',
    features: [
      'Suites only',
      'Michelin restaurant',
      'Full spa',
      'Private cinema',
      'Board rooms',
      'Concierge',
    ],
    rentalIncome: 17400000,
    expenses: 3800000,
    capRate: 6.4,
    projectedReturn: 13.8,
  },
};

export default function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const mockProperty = mockProperties[params.id];
  const [property, setProperty] = useState<Property | null>(mockProperty || null);
  const [apiProperty, setApiProperty] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [investmentAmount, setInvestmentAmount] = useState(
    property?.tokenPrice || 0
  );
  const [countedValue, setCountedValue] = useState(0);
  const [investLoading, setInvestLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');

  useEffect(() => {
    fetch(`/api/properties/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.property) {
          setApiProperty(data.property);
          // Merge API data with mock data
          const merged: Property = {
            ...property!,
            contractAddress: data.property.contractAddress,
            integrityHash: data.property.integrityHash,
            ownerAddress: data.property.ownerAddress,
          };
          setProperty(merged);
        }
      })
      .catch(() => {
        // Use mock property
      });
  }, [params.id]);

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
    setInvestLoading(true);
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: params.id,
          amount: investmentAmount,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Investment successful! Transaction: ${data.transactionHash}`);
      } else {
        alert('Investment failed: ' + data.error);
      }
    } catch (error) {
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
    } catch (error) {
      alert('Error processing transfer');
    } finally {
      setTransferLoading(false);
    }
  };

  if (!property) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-serif italic text-white mb-4">
            Property not found
          </h1>
          <Link
            href="/property"
            className="px-6 py-3 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg"
          >
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  const tokens = Math.floor(investmentAmount / property.tokenPrice);
  const monthlyYield = (investmentAmount * property.yieldPercent) / 100 / 12;

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Hero Section */}
      <div className={`h-96 bg-gradient-to-br ${property.imageGradient} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] to-transparent" />
        <div className="absolute top-4 left-6">
          <Link
            href="/property"
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
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Year Built</p>
                  <p className="text-xl font-serif italic font-bold text-white">
                    {property.yearBuilt}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Total Sqft</p>
                  <p className="text-xl font-serif italic font-bold text-white">
                    {(property.sqft / 1000).toFixed(0)}K
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Units</p>
                  <p className="text-xl font-serif italic font-bold text-white">
                    {property.units}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Funded</p>
                  <p className="text-xl font-serif italic font-bold text-[#10b981]">
                    {property.fundedPercent}%
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex border-b border-white/[0.06] overflow-x-auto">
                {['overview', 'financials', 'documents', 'on-chain'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab
                        ? 'text-[#c9a84c] border-b-2 border-[#c9a84c] -mb-px'
                        : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-8">
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

                    <div>
                      <h3 className="text-lg font-serif italic font-bold text-white mb-4">
                        Key Features
                      </h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {property.features?.map((feature, i) => (
                          <li key={i} className="flex items-center gap-3 text-white/70">
                            <span className="material-symbols-outlined text-[#c9a84c] text-lg">
                              check_circle
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'financials' && (
                  <div className="space-y-6">
                    <table className="w-full text-sm">
                      <tbody className="space-y-4">
                        {[
                          [
                            'Annual Rental Income',
                            `$${(property.rentalIncome! / 1000000).toFixed(1)}M`,
                          ],
                          [
                            'Annual Expenses',
                            `$${(property.expenses! / 1000000).toFixed(1)}M`,
                          ],
                          [
                            'Net Operating Income',
                            `$${((property.rentalIncome! - property.expenses!) / 1000000).toFixed(1)}M`,
                          ],
                          ['Cap Rate', `${property.capRate?.toFixed(1)}%`],
                          [
                            'Projected Annual Return',
                            `${property.projectedReturn?.toFixed(1)}%`,
                          ],
                        ].map(([label, value], i) => (
                          <tr
                            key={i}
                            className="border-b border-white/[0.06] last:border-0"
                          >
                            <td className="py-4 text-white/70">{label}</td>
                            <td className="py-4 text-right font-semibold text-white">
                              {value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="space-y-3">
                    {[
                      { name: 'Title Deed', icon: 'description', hash: 'QmTitleDeed...' },
                      { name: 'Inspection Report', icon: 'assignment_turned_in', hash: 'QmInspection...' },
                      { name: 'Valuation Report', icon: 'assessment', hash: 'QmValuation...' },
                      { name: 'Financial Statements', icon: 'receipt_long', hash: 'QmFinancials...' },
                      { name: 'Legal Documentation', icon: 'gavel', hash: 'QmLegal...' },
                    ].map((doc, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 bg-white/[0.03] rounded-lg border border-white/[0.06] hover:border-[#c9a84c]/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[#c9a84c]">
                            {doc.icon}
                          </span>
                          <div>
                            <span className="font-medium text-white block">
                              {doc.name}
                            </span>
                            <span className="text-xs text-white/50 font-mono">
                              {doc.hash}
                            </span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-white/50">
                          download
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'on-chain' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                      <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                        Contract Address
                      </p>
                      <p className="font-mono text-sm text-white break-all">
                        {property.contractAddress || '0x41Cf00E593c5623B00F812bC70Ee1A737C5aFF06'}
                      </p>
                    </div>
                    <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                      <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                        Integrity Hash
                      </p>
                      <p className="font-mono text-sm text-white break-all">
                        {property.integrityHash || `0x${Math.random().toString(16).slice(2, 66)}`}
                      </p>
                    </div>
                    <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                      <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                        Owner Address
                      </p>
                      <p className="font-mono text-sm text-white break-all">
                        {property.ownerAddress || '0x' + '0'.repeat(40)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                        <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                          Total Supply
                        </p>
                        <p className="text-lg font-semibold text-white">2,000,000</p>
                      </div>
                      <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                        <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                          Token Holders
                        </p>
                        <p className="text-lg font-semibold text-white">1,847</p>
                      </div>
                    </div>
                    <a
                      href="https://32f.blockv.io/token/0x41Cf00E593c5623B00F812bC70Ee1A737C5aFF06"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-4 bg-[#c9a84c]/10 border border-[#c9a84c]/30 rounded-lg text-[#c9a84c] hover:bg-[#c9a84c]/20 transition-colors"
                    >
                      <span className="material-symbols-outlined">open_in_new</span>
                      View on Blockscout Explorer
                    </a>

                    {/* On-Chain Activity */}
                    <div className="pt-4 border-t border-white/[0.06]">
                      <h4 className="text-lg font-serif italic font-bold text-white mb-4">
                        On-Chain Activity
                      </h4>
                      <div className="space-y-3">
                        {[
                          {
                            event: 'Token Transfer',
                            from: '0x1234...5678',
                            to: '0x8765...4321',
                            amount: '5000 tokens',
                            time: '2 hours ago',
                          },
                          {
                            event: 'Yield Distribution',
                            from: 'Contract',
                            to: 'All Holders',
                            amount: '$45,200',
                            time: '1 day ago',
                          },
                          {
                            event: 'Property Mint',
                            from: 'Genesis',
                            to: '0x41Cf...',
                            amount: '2M tokens',
                            time: '30 days ago',
                          },
                        ].map((activity, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]"
                          >
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {activity.event}
                              </p>
                              <p className="text-xs text-white/50">
                                {activity.from} → {activity.to}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-[#c9a84c]">
                                {activity.amount}
                              </p>
                              <p className="text-xs text-white/50">{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
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
                This property is tokenized into 2,000,000 ERC-20 tokens, allowing fractional ownership. Each
                token represents an equal claim on property income and appreciation. Tokens can be traded on
                the DUAL platform or secondary markets.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Token Symbol', value: 'ELYS' },
                  { label: 'Decimals', value: '18' },
                  { label: 'Blockchain', value: 'DUAL Network' },
                  { label: 'Total Supply', value: '2M' },
                  { label: 'Holder Count', value: '1,847' },
                  { label: 'Holders', value: 'View Explorer' },
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
              <div className="pb-6 border-b border-white/[0.06]">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                  Total Property Value
                </p>
                <p className="text-3xl font-serif italic font-bold text-white">
                  ${(property.totalValue / 1000000).toFixed(1)}M
                </p>
              </div>

              {/* Token Price */}
              <div className="pb-6 border-b border-white/[0.06]">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                  Token Price
                </p>
                <p className="text-2xl font-semibold text-white">
                  ${property.tokenPrice.toFixed(2)}
                </p>
              </div>

              {/* Key Metrics */}
              <div className="space-y-3 pb-6 border-b border-white/[0.06]">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Minimum Investment</span>
                  <span className="font-semibold text-white">
                    ${property.tokenPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Annual Yield</span>
                  <span className="font-semibold text-[#10b981]">
                    {property.yieldPercent}%
                  </span>
                </div>
              </div>

              {/* Tokens Remaining */}
              <div className="pb-6 border-b border-white/[0.06]">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-3">
                  Tokens Remaining
                </p>
                <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-[#c9a84c] to-[#a68832]"
                    style={{
                      width: `${100 - property.fundedPercent}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-white/60">
                  {Math.round((2000000 * (100 - property.fundedPercent)) / 100).toLocaleString()} of 2,000,000
                </p>
              </div>

              {/* Investment Amount Input */}
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

              {/* Summary */}
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

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleInvest}
                  disabled={investLoading}
                  className="w-full py-4 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg hover:shadow-lg hover:shadow-[#c9a84c]/30 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                >
                  {investLoading ? 'Processing...' : 'Invest Now'}
                </button>
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="w-full py-4 bg-white/[0.05] border border-white/[0.1] text-white font-semibold rounded-lg hover:border-[#c9a84c]/30 transition-colors"
                >
                  Transfer Tokens
                </button>
              </div>

              {/* Powered By Badge */}
              <div className="text-center pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-white/50 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  Powered by DUAL Network
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rental Yield Distribution */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-8">
          <h3 className="text-2xl font-serif italic font-bold text-white mb-8">
            Rental Yield Distribution
          </h3>

          <div className="grid grid-cols-12 gap-1 items-end h-48">
            {[45, 52, 48, 61, 58, 72, 65, 78, 85, 92, 88, 95].map((height, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className="w-full bg-gradient-to-t from-[#c9a84c] to-[#a68832] rounded-t-lg hover:from-[#d4b85d] hover:to-[#b59845] transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-[#c9a84c]/20"
                  style={{ height: `${height}%` }}
                />
                <p className="text-xs text-white/50 mt-2">M{i + 1}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/[0.06]">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                Average Monthly
              </p>
              <p className="text-2xl font-serif italic font-bold text-white">
                $1.54M
              </p>
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                Peak Month
              </p>
              <p className="text-2xl font-serif italic font-bold text-[#10b981]">
                $1.92M
              </p>
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                Total This Year
              </p>
              <p className="text-2xl font-serif italic font-bold text-white">
                $18.5M
              </p>
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                Distribution Rate
              </p>
              <p className="text-2xl font-serif italic font-bold text-white">
                Monthly
              </p>
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
