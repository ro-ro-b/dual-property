'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthGate from '@/components/AuthGate';
import { DualInline } from '../DualLogo';

interface Property {
  id: string;
  name: string;
  type: string;
  totalTokens: number;
  tokenPrice: number;
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

function DistributeContent() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [distributionAmount, setDistributionAmount] = useState<string>('50000');
  const [distributionPeriod, setDistributionPeriod] = useState<string>('monthly');
  const [loading, setLoading] = useState(true);
  const [isDistributing, setIsDistributing] = useState(false);
  const [distributionStage, setDistributionStage] = useState<
    'idle' | 'calculating' | 'executing' | 'recording' | 'complete'
  >('idle');
  const [executionProgress, setExecutionProgress] = useState(0);

  useEffect(() => {
    // Fetch real properties
    fetch('/api/properties')
      .then((r) => r.json())
      .then((data) => {
        const props = data.properties || [];
        const mapped: Property[] = props.map((p: any) => {
          const inv = p.investment || {};
          return {
            id: p.id,
            name: p.name || 'Untitled Property',
            type: p.propertyType || 'residential',
            totalTokens: inv.totalTokens || 0,
            tokenPrice: inv.tokenPricePerShare || 0,
          };
        });
        setProperties(mapped);
        if (mapped.length > 0) setSelectedProperty(mapped[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch action logs for distribution history
    fetch('/api/properties/activity')
      .then((r) => r.json())
      .then((data) => setActionLogs(data.activity || []))
      .catch(() => {});
  }, []);

  const selectedProp = properties.find((p) => p.id === selectedProperty);
  const totalDistribution = parseFloat(distributionAmount) || 0;
  const payoutPerToken = selectedProp && selectedProp.totalTokens > 0
    ? totalDistribution / selectedProp.totalTokens
    : 0;

  const handleExecuteDistribution = async () => {
    if (!selectedProperty) return;
    setIsDistributing(true);
    setDistributionStage('calculating');
    setExecutionProgress(0);

    try {
      // Stage 1: Calculating
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setDistributionStage('executing');

      // Stage 2: Executing (simulate progress)
      for (let i = 0; i <= 100; i += 20) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setExecutionProgress(i);
      }
      setExecutionProgress(100);

      // Stage 3: Recording
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
    setExecutionProgress(0);
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
      {/* Hero */}
      <div className="relative overflow-hidden pt-12 pb-20">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(201, 168, 76, 0.1) 0%, transparent 60%)` }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/portfolio" className="text-[#c9a84c] hover:text-white transition-colors flex items-center gap-1 text-sm">
              <span className="material-symbols-outlined text-sm">arrow_back</span>Back
            </Link>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif italic font-bold text-white mb-4">
            Yield<br />
            <span className="bg-gradient-to-r from-[#c9a84c] to-[#a68832] bg-clip-text text-transparent">Distribution Center</span>
          </h1>
          <p className="text-lg text-white/60 max-w-lg">Execute batch yield distribution to all property token holders on the <DualInline className="text-current" /> Network.</p>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {properties.length === 0 ? (
          <div className="text-center py-16 bg-[#111827]/40 rounded-2xl border border-white/[0.06]">
            <span className="material-symbols-outlined text-[#c9a84c] text-5xl mb-4 block">payments</span>
            <h3 className="text-xl font-serif italic font-bold text-white mb-2">No Properties to Distribute</h3>
            <p className="text-white/60 mb-6">Tokenize a property first before distributing yield.</p>
            <Link href="/admin" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg">
              <span className="material-symbols-outlined">add</span>Tokenize Property
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Config Panel */}
            <div className="lg:col-span-2">
              <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-8 space-y-8">
                <div>
                  <label className="block text-sm font-medium text-white/70 uppercase tracking-wider mb-4">Select Property</label>
                  <select value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)} disabled={isDistributing}
                    className="w-full bg-white/[0.05] border border-white/[0.1] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#c9a84c] disabled:opacity-50 transition-colors">
                    {properties.map((prop) => (
                      <option key={prop.id} value={prop.id}>{prop.name} ({prop.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 uppercase tracking-wider mb-4">Total Distribution Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-white text-lg">$</span>
                    <input type="number" value={distributionAmount} onChange={(e) => setDistributionAmount(e.target.value)} disabled={isDistributing} placeholder="50000"
                      className="w-full bg-white/[0.05] border border-white/[0.1] text-white pl-8 pr-4 py-3 rounded-lg focus:outline-none focus:border-[#c9a84c] disabled:opacity-50 transition-colors" />
                  </div>
                  <p className="text-xs text-white/50 mt-2">Per-token payout: ${payoutPerToken.toFixed(4)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 uppercase tracking-wider mb-4">Distribution Period</label>
                  <select value={distributionPeriod} onChange={(e) => setDistributionPeriod(e.target.value)} disabled={isDistributing}
                    className="w-full bg-white/[0.05] border border-white/[0.1] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#c9a84c] disabled:opacity-50 transition-colors">
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semi-annual">Semi-Annual</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>

                {/* Property Summary */}
                {selectedProp && (
                  <div className="bg-white/[0.02] rounded-lg p-6 border border-white/[0.06]">
                    <h3 className="text-lg font-serif italic font-bold text-white mb-4">Distribution Summary</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-white/70">Property:</span><span className="text-white font-medium">{selectedProp.name}</span></div>
                      <div className="flex justify-between"><span className="text-white/70">Total Tokens:</span><span className="text-white">{selectedProp.totalTokens.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-white/70">Per-Token Payout:</span><span className="text-[#c9a84c]">${payoutPerToken.toFixed(4)}</span></div>
                      <div className="flex justify-between border-t border-white/[0.06] pt-3"><span className="text-white font-semibold">Total Distribution:</span><span className="text-[#c9a84c] font-bold text-lg">${totalDistribution.toLocaleString()}</span></div>
                    </div>
                  </div>
                )}

                <button onClick={handleExecuteDistribution} disabled={isDistributing || !distributionAmount || !selectedProperty}
                  className="w-full py-4 bg-gradient-to-r from-[#c9a84c] to-[#a68832] text-[#0a0e1a] font-semibold rounded-lg hover:shadow-lg hover:shadow-[#c9a84c]/20 transition-all disabled:opacity-50 text-lg uppercase tracking-wider">
                  {isDistributing ? `Processing... (${distributionStage})` : 'Execute Batch Distribution'}
                </button>
              </div>
            </div>

            {/* Distribution Pipeline */}
            <div className="lg:col-span-1">
              <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-8 sticky top-24">
                <h3 className="text-lg font-serif italic font-bold text-white mb-6">Distribution Pipeline</h3>
                <div className="space-y-6">
                  {[
                    { id: 'calculating', label: 'Calculating Payouts' },
                    { id: 'executing', label: 'Executing Transfers' },
                    { id: 'recording', label: 'Recording on Blockchain' },
                  ].map((stage, idx) => {
                    const stages = ['calculating', 'executing', 'recording', 'complete'];
                    const currentIdx = stages.indexOf(distributionStage);
                    const stageIdx = stages.indexOf(stage.id);
                    const isDone = currentIdx > stageIdx;
                    const isActive = distributionStage === stage.id;
                    const isPending = currentIdx < stageIdx;

                    return (
                      <div key={stage.id} className="space-y-2">
                        <div className="flex items-center gap-3">
                          {isActive ? (
                            <div className="w-6 h-6 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
                          ) : isDone ? (
                            <span className="text-green-500 text-lg">✓</span>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-white/[0.1]" />
                          )}
                          <span className={`text-sm font-medium ${isActive ? 'text-[#c9a84c]' : isDone ? 'text-green-500' : 'text-white/50'}`}>{stage.label}</span>
                        </div>
                        {stage.id === 'executing' && isActive && (
                          <div className="ml-9 flex items-center gap-2">
                            <div className="text-xs text-white/60">{executionProgress}%</div>
                            <div className="flex-1 h-1 bg-white/[0.1] rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-[#c9a84c] to-[#a68832] transition-all duration-300" style={{ width: `${executionProgress}%` }} />
                            </div>
                          </div>
                        )}
                        {isDone && idx < 2 && <div className="ml-3 h-4 border-l-2 border-green-500" />}
                      </div>
                    );
                  })}

                  {distributionStage === 'complete' && (
                    <div className="pt-6 border-t border-white/[0.06] space-y-4">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <p className="text-sm text-green-400 font-medium mb-3">Distribution Complete!</p>
                        <div className="space-y-2 text-xs text-white/70">
                          <div className="flex justify-between"><span>Total Distributed:</span><span className="text-green-400">${totalDistribution.toLocaleString()}</span></div>
                          <div className="flex justify-between"><span>Property:</span><span className="text-green-400">{selectedProp?.name}</span></div>
                          <div className="flex justify-between"><span>Period:</span><span className="text-green-400 capitalize">{distributionPeriod}</span></div>
                        </div>
                      </div>
                      <button onClick={resetDistribution} className="w-full py-2 bg-white/[0.05] border border-white/[0.1] text-white text-sm rounded-lg hover:border-[#c9a84c]/30 transition-colors">New Distribution</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Log History */}
        {actionLogs.length > 0 && (
          <div className="mt-12">
            <div className="bg-[#111827]/80 rounded-2xl border border-white/[0.06] shadow-2xl p-8">
              <h3 className="text-2xl font-serif italic font-bold text-white mb-8">Recent Activity</h3>
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
                    {actionLogs.slice(0, 10).map((log, idx) => (
                      <tr key={idx} className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6 text-white">{new Date(log.timestamp).toLocaleDateString()}</td>
                        <td className="py-4 px-6 text-white/70">{log.event}</td>
                        <td className="py-4 px-6 text-right font-semibold text-[#c9a84c]">{log.amount}</td>
                        <td className="py-4 px-6"><span className="px-2 py-0.5 bg-[#10b981]/20 text-[#10b981] text-xs font-semibold rounded-full">{log.status}</span></td>
                        <td className="py-4 px-6 text-white/60 font-mono text-xs">
                          <a href={`https://32f.blockv.io/tx/${log.hash}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#c9a84c] transition-colors">
                            {log.hash?.slice(0, 12)}...
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DistributePage() {
  return (
    <AuthGate requireAuth={true} fallbackMessage="Sign in to access the Yield Distribution Center.">
      <DistributeContent />
    </AuthGate>
  );
}
