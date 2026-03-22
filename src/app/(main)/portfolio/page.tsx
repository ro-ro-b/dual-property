'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import AuthGate from '@/components/AuthGate';
import { useAuth } from '@/lib/auth-context';

interface Holding {
  id: string;
  name: string;
  location: string;
  type: string;
  tokenPrice: number;
  totalValue: number;
  totalTokens: number;
  tokensSold: number;
  annualYield: number;
  imageGradient: string;
  blockchainTxHash?: string;
}

interface ChainActivity {
  id: string;
  event: string;
  hash: string;
  amount: string;
  timestamp: string;
  objectId: string;
  status: string;
}

const GRADIENTS = [
  'from-[#c9a84c]/40 via-[#a68832]/30 to-[#0a0e1a]',
  'from-amber-900/60 via-orange-800/40 to-[#0a0e1a]',
  'from-blue-900/60 via-cyan-800/40 to-[#0a0e1a]',
  'from-emerald-900/60 via-green-800/40 to-[#0a0e1a]',
  'from-purple-900/60 via-indigo-800/40 to-[#0a0e1a]',
];

function PortfolioContent() {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState<string | null>(null);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [chainActivity, setChainActivity] = useState<ChainActivity[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [deposits, setDeposits] = useState<any[]>([]);

  useEffect(() => {
    // Fetch real properties as holdings
    fetch('/api/properties')
      .then((r) => r.json())
      .then((data) => {
        const props = data.properties || [];
        const mapped: Holding[] = props.map((p: any, idx: number) => {
          // Support both nested propertyData format and flat format from direct gateway mapping
          const pd = p.propertyData || {};
          const inv = p.investment || {};
          const loc = p.location || {};
          return {
            id: p.id,
            name: pd.name || p.name || 'Property Token',
            location: (pd.city || loc.city) ? `${pd.city || loc.city}, ${pd.country || loc.country || ''}` : 'DUAL Network',
            type: pd.propertyType || p.propertyType || 'residential',
            tokenPrice: pd.tokenPrice || inv.tokenPricePerShare || 0,
            totalValue: pd.totalValue || inv.totalPropertyValue || 0,
            totalTokens: pd.totalTokens || inv.totalTokens || 0,
            tokensSold: pd.tokensSold || 0,
            annualYield: pd.annualYield || inv.annualYield || 0,
            imageGradient: GRADIENTS[idx % GRADIENTS.length],
            blockchainTxHash: p.blockchainTxHash,
          };
        });
        setHoldings(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch chain activity
    fetch('/api/properties/activity')
      .then((r) => r.json())
      .then((data) => {
        setChainActivity(data.activity || []);
      })
      .catch(() => {});

    // Fetch wallet info via WalletsModule
    fetch('/api/wallet/me')
      .then((r) => r.json())
      .then((data) => { if (data.wallet) setWallet(data.wallet); })
      .catch(() => {});

    // Fetch deposits via PaymentsModule
    fetch('/api/payments/deposits')
      .then((r) => r.json())
      .then((data) => {
        const deps = Array.isArray(data.deposits) ? data.deposits :
                     Array.isArray(data.deposits?.data) ? data.deposits.data : [];
        setDeposits(deps);
      })
      .catch(() => {});
  }, []);

  const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
  const totalTokens = holdings.reduce((sum, h) => sum + h.totalTokens, 0);
  const avgYield = holdings.length > 0 ? holdings.reduce((sum, h) => sum + h.annualYield, 0) / holdings.length : 0;

  const handleClaimYield = async (propertyId: string) => {
    console.log('[ClaimYield] clicked for', propertyId);
    setClaimingId(propertyId);
    try {
      const response = await fetch(`/api/properties/${propertyId}/claim-yield`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setClaimSuccess(propertyId);
        const amt = data.yieldAmount ? `$${data.yieldAmount.toLocaleString()}` : '';
        const name = data.propertyName || 'Property';
        setToastMessage(`Yield claimed for ${name}${amt ? ': ' + amt : ''} (${data.period})`);
        setTimeout(() => { setClaimSuccess(null); setToastMessage(null); }, 6000);
      } else {
        setToastMessage('Claim failed: ' + (data.error || 'Unknown error'));
        setTimeout(() => setToastMessage(null), 5000);
      }
    } catch {
      setToastMessage('Error claiming yield');
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setClaimingId(null);
    }
  };

  const handleTransfer = async (propertyId: string) => {
    if (!transferEmail) { setToastMessage('Please enter an email address'); setTimeout(() => setToastMessage(null), 3000); return; }
    setTransferring(true);
    try {
      const response = await fetch(`/api/properties/${propertyId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: transferEmail }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setToastMessage(`Transfer initiated to ${data.transferredTo}`);
        setShowTransferModal(null);
        setTransferEmail('');
      } else {
        setToastMessage('Transfer failed: ' + data.error);
      }
    } catch {
      setToastMessage('Error processing transfer');
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[9999] max-w-md" style={{ animation: 'fadeInToast 0.3s ease-out' }}>
          <style>{`@keyframes fadeInToast { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div className={`px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-sm ${
            toastMessage.includes('failed') || toastMessage.includes('Error')
              ? 'bg-red-900/90 border-red-500/50 text-red-100'
              : 'bg-[#0a0e1a]/95 border-[#10b981]/50 text-white'
          }`}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-lg text-[#10b981]">
                {toastMessage.includes('failed') || toastMessage.includes('Error') ? 'error' : 'check_circle'}
              </span>
              <span className="text-sm font-medium">{toastMessage}</span>
              <button onClick={() => setToastMessage(null)} className="ml-2 text-white/50 hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Hero */}
      <div className="relative overflow-hidden pt-12 pb-20">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(201, 168, 76, 0.1) 0%, transparent 60%)` }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl md:text-6xl font-serif italic font-bold text-white mb-4">
            Your<br />
            <span className="bg-gradient-to-r from-[#c9a84c] to-[#a68832] bg-clip-text text-transparent">Portfolio</span>
          </h1>
          <p className="text-lg text-white/60 max-w-lg">
            Track your investments and yield earnings across all DUAL properties.
            {user?.email && <span className="block text-sm text-[#c9a84c] mt-2">Signed in as {user.email}</span>}
          </p>
        </div>
      </div>

      {/* Wallet Card */}
      {wallet && (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="bg-gradient-to-r from-[#c9a84c]/10 to-[#a68832]/10 border border-[#c9a84c]/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#c9a84c]/20 rounded-xl">
                <span className="material-symbols-outlined text-[#c9a84c] text-2xl">account_balance_wallet</span>
              </div>
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wider">DUAL Wallet</p>
                <p className="text-white font-mono text-sm mt-1">{wallet.address || wallet.id || 'Connected'}</p>
                {wallet.balance !== undefined && (
                  <p className="text-[#c9a84c] font-semibold mt-1">Balance: {typeof wallet.balance === 'object' ? JSON.stringify(wallet.balance) : wallet.balance}</p>
                )}
              </div>
            </div>
            {deposits.length > 0 && (
              <div className="text-right">
                <p className="text-xs text-white/50 uppercase tracking-wider">Deposits</p>
                <p className="text-white font-semibold">{deposits.length} transaction{deposits.length !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Portfolio Summary */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Portfolio Value', value: totalValue > 0 ? `$${(totalValue / 1000000).toFixed(1)}M` : '$0', subtext: 'On-chain value', icon: 'wallet', color: 'from-[#c9a84c] to-[#a68832]' },
            { label: 'Total Tokens', value: totalTokens.toLocaleString(), subtext: 'Across all properties', icon: 'token', color: 'from-[#10b981] to-[#059669]' },
            { label: 'Properties Held', value: `${holdings.length}`, subtext: 'Active investments', icon: 'domain', color: 'from-blue-500 to-cyan-500' },
            { label: 'Avg Annual Yield', value: avgYield > 0 ? `${avgYield.toFixed(1)}%` : '-', subtext: 'Projected return', icon: 'paid', color: 'from-purple-500 to-pink-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-6 hover:border-[#c9a84c]/20 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl opacity-10 group-hover:opacity-20 transition-opacity`}>
                  <span className={`material-symbols-outlined text-2xl bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>{stat.icon}</span>
                </div>
              </div>
              <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">{stat.label}</p>
              <p className="text-3xl font-serif italic font-bold text-white mb-1">{stat.value}</p>
              <p className="text-xs text-white/50">{stat.subtext}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Holdings Grid */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <h2 className="text-3xl font-serif italic font-bold text-white mb-8">Your Holdings</h2>

        {holdings.length === 0 ? (
          <div className="text-center py-16 bg-[#111827]/40 rounded-2xl border border-white/[0.06]">
            <span className="material-symbols-outlined text-[#c9a84c] text-5xl mb-4 block">account_balance</span>
            <h3 className="text-xl font-serif italic font-bold text-white mb-2">No Holdings Yet</h3>
            <p className="text-white/60 mb-6">Browse available properties and start investing.</p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg">
              <span className="material-symbols-outlined">search</span>
              Browse Properties
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {holdings.map((holding) => (
              <div key={holding.id} className="group h-full">
                <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden hover:border-[#c9a84c]/30 transition-all duration-500 h-full flex flex-col">
                  <div className={`h-32 bg-gradient-to-br ${holding.imageGradient} relative overflow-hidden`}>
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <span className="px-3 py-1 bg-[#c9a84c]/90 text-[#0a0e1a] text-xs font-black rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0a0e1a] animate-pulse" />
                        ON-CHAIN
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="mb-4">
                      <Link href={`/property/${holding.id}`}>
                        <h3 className="text-lg font-serif italic font-bold text-white mb-1 hover:text-[#c9a84c] transition-colors">{holding.name}</h3>
                      </Link>
                      <p className="text-sm text-white/60 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {holding.location}
                      </p>
                      {holding.blockchainTxHash && (
                        <p className="text-xs text-[#c9a84c] font-mono mt-1 truncate">{holding.blockchainTxHash.slice(0, 20)}...</p>
                      )}
                    </div>
                    <div className="py-4 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/70">Total Value</span>
                        <span className="font-semibold text-white">{holding.totalValue > 0 ? `$${(holding.totalValue / 1000000).toFixed(1)}M` : 'On-Chain'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/70">Token Price</span>
                        <span className="font-semibold text-white">{holding.tokenPrice > 0 ? `$${holding.tokenPrice.toFixed(2)}` : '-'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/70">Annual Yield</span>
                        <span className="font-semibold text-[#10b981]">{holding.annualYield > 0 ? `${holding.annualYield}%` : '-'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/70">Total Tokens</span>
                        <span className="font-semibold text-white">{holding.totalTokens.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.06]">
                      <button
                        onClick={() => handleClaimYield(holding.id)}
                        disabled={claimingId === holding.id}
                        className="py-2 px-4 bg-[#10b981]/20 border border-[#10b981]/50 text-[#10b981] text-sm font-semibold rounded-lg hover:bg-[#10b981]/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {claimSuccess === holding.id ? (
                          <><span className="material-symbols-outlined text-sm">check_circle</span>Claimed!</>
                        ) : claimingId === holding.id ? (
                          <><span className="material-symbols-outlined text-sm animate-spin">hourglass_empty</span>Claiming...</>
                        ) : (
                          <><span className="material-symbols-outlined text-sm">check_circle</span>Claim Yield</>
                        )}
                      </button>
                      <button
                        onClick={() => setShowTransferModal(holding.id)}
                        className="py-2 px-4 bg-white/[0.05] border border-white/[0.1] text-white text-sm font-semibold rounded-lg hover:border-[#c9a84c]/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">send</span>
                        Transfer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chain Activity */}
      {chainActivity.length > 0 && (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-8">
            <h3 className="text-2xl font-serif italic font-bold text-white mb-8">Recent On-Chain Activity</h3>
            <div className="space-y-3">
              {chainActivity.slice(0, 10).map((activity, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-lg border border-white/[0.06] hover:border-[#c9a84c]/30 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-white">{activity.event}</p>
                    <p className="text-xs text-white/50 font-mono">{activity.hash?.slice(0, 16)}...</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#c9a84c]">{activity.amount}</p>
                    <p className="text-xs text-white/50">{new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <a href="https://32f.blockv.io" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 mt-6 p-3 bg-[#c9a84c]/10 border border-[#c9a84c]/30 rounded-lg text-[#c9a84c] hover:bg-[#c9a84c]/20 transition-colors">
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
              <h3 className="text-2xl font-serif italic font-bold text-white mb-2">Yield Distribution Schedule</h3>
              <p className="text-white/70">Your monthly yield is automatically calculated and distributed on the first business day of each month.</p>
            </div>
            <div className="flex items-center gap-3 text-[#c9a84c]">
              <span className="material-symbols-outlined text-3xl">calendar_month</span>
              <div>
                <p className="text-sm font-semibold">Monthly Distribution</p>
                <p className="text-xs opacity-70">1st of each month</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827]/95 border border-white/[0.06] rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-serif italic font-bold text-white mb-6">Transfer Tokens</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Recipient Email</label>
                <input
                  type="email"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full bg-white/[0.05] border border-white/[0.1] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-[#c9a84c]"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => { setShowTransferModal(null); setTransferEmail(''); }}
                  className="flex-1 py-2 bg-white/[0.05] border border-white/[0.1] text-white rounded-lg hover:border-white/[0.2] transition-colors">Cancel</button>
                <button onClick={() => handleTransfer(showTransferModal)}
                  disabled={transferring || !transferEmail}
                  className="flex-1 py-2 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50">
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

export default function PortfolioPage() {
  return (
    <AuthGate requireAuth={false}>
      <PortfolioContent />
    </AuthGate>
  );
}
